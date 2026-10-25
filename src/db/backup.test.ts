import { beforeEach, describe, expect, it } from 'vitest'
import { mensal } from '../test/dados'
import { assinaturasRepo } from './assinaturasRepo'
import {
  gerarBackup,
  lerBackup,
  nomeArquivoBackup,
  restaurarBackup,
  VERSAO_SCHEMA,
  type Backup,
} from './backup'
import { categoriasRepo } from './categoriasRepo'
import { db } from './db'
import { ErroValidacao } from './esquemas'
import { preferenciasRepo } from './preferenciasRepo'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

/** Uma de cada: Categoria renomeada e criada, cancelamento, Reativação etc. */
async function gravarConjuntoRico() {
  const streaming = (await categoriasRepo.listar()).find(
    (c) => c.nome === 'Streaming',
  )!
  await categoriasRepo.renomear(streaming.id, 'Vídeo')
  const jogos = await categoriasRepo.criar('Jogos')
  await assinaturasRepo.criar({
    servico: 'Netflix',
    categoriaId: streaming.id,
    observacoes: 'Conta da família',
    vigencias: [
      mensal('2025-01-31', { fim: '2025-06-10' }),
      mensal('2025-09-01', { valorCentavos: 4490 }),
    ],
  })
  await assinaturasRepo.criar({
    servico: 'Game Pass',
    categoriaId: jogos,
    vigencias: [
      // Período gratuito, seguido de uma Vigência futura.
      mensal('2026-10-01', { valorCentavos: 0, fim: '2026-10-31' }),
      mensal('2026-11-01', {
        valorCentavos: 59990,
        ciclo: { quantidade: 1, unidade: 'ano' },
      }),
    ],
  })
  await preferenciasRepo.atualizar({ janelaVencimentosDias: 30 })
}

async function tabelas() {
  return {
    categorias: await db.categorias.toArray(),
    assinaturas: await db.assinaturas.toArray(),
    preferencias: await db.preferencias.toArray(),
  }
}

const semData = (backup: Backup) => ({ ...backup, exportadoEm: undefined })

const base = {
  versaoSchema: VERSAO_SCHEMA,
  exportadoEm: '2026-10-25T12:00:00.000Z',
  categorias: [{ id: 'c1', nome: 'Streaming' }],
  assinaturas: [
    {
      id: 'a1',
      servico: 'Netflix',
      categoriaId: 'c1',
      vigencias: [mensal('2026-01-01')],
    },
  ],
  preferencias: { id: 'preferencias', janelaVencimentosDias: 7 },
}

const backupValido = (extras: Partial<Record<keyof Backup, unknown>> = {}) => ({
  ...base,
  ...extras,
})

describe('backup', () => {
  it('ida e volta: exportar, limpar e importar devolve o mesmo estado', async () => {
    await gravarConjuntoRico()
    const antes = await tabelas()
    const original = await gerarBackup()
    const texto = JSON.stringify(original, null, 2)

    await db.delete()
    await db.open()
    expect((await tabelas()).categorias.map((c) => c.nome)).toContain(
      'Streaming',
    )

    await restaurarBackup(lerBackup(texto))

    expect(await tabelas()).toEqual(antes)
    expect(semData(await gerarBackup())).toEqual(semData(original))
  })

  it('exporta as preferências padrão quando ainda não há registro', async () => {
    const backup = await gerarBackup()
    expect(backup.versaoSchema).toBe(1)
    expect(backup.preferencias).toEqual({
      id: 'preferencias',
      janelaVencimentosDias: 7,
    })
    expect(backup.categorias).toHaveLength(5)
    expect(backup.assinaturas).toEqual([])
  })

  it('substitui tudo, inclusive as Categorias iniciais', async () => {
    await restaurarBackup(lerBackup(JSON.stringify(backupValido())))
    expect(await tabelas()).toEqual({
      categorias: [{ id: 'c1', nome: 'Streaming' }],
      assinaturas: [base.assinaturas[0]],
      preferencias: [{ id: 'preferencias', janelaVencimentosDias: 7 }],
    })
  })

  it('monta o nome do arquivo com a data', () => {
    expect(nomeArquivoBackup('2026-10-25')).toBe(
      'sub-vibe-backup-2026-10-25.json',
    )
  })

  const assinaturaCom = (extras: object) =>
    backupValido({
      assinaturas: [{ ...base.assinaturas[0], ...extras }],
    })

  it.each([
    [
      'JSON quebrado',
      '{"versaoSchema": 1,',
      ['O arquivo não é um JSON válido.'],
    ],
    [
      'sem versão',
      JSON.stringify({ categorias: [] }),
      ['O arquivo não é um backup do Sub-vibe.'],
    ],
    [
      'um texto JSON',
      JSON.stringify('oi'),
      ['O arquivo não é um backup do Sub-vibe.'],
    ],
    [
      'versão 2',
      JSON.stringify(backupValido({ versaoSchema: 2 })),
      ['Este backup usa a versão 2 do formato, e este app só lê a versão 1.'],
    ],
    [
      'sem a lista de Assinaturas',
      JSON.stringify(backupValido({ assinaturas: undefined })),
      ['O arquivo não traz a lista de Assinaturas.'],
    ],
    [
      'Vigências sobrepostas',
      JSON.stringify(
        assinaturaCom({
          vigencias: [
            mensal('2026-01-01', { fim: '2026-03-01' }),
            mensal('2026-02-01'),
          ],
        }),
      ),
      [
        'Assinatura 1: Vigência 2: o início deve ser posterior à Data de cancelamento da Vigência anterior.',
      ],
    ],
    [
      'categoriaId órfão',
      JSON.stringify(assinaturaCom({ categoriaId: 'nao-existe' })),
      ['Assinatura 1: a Categoria não existe no arquivo.'],
    ],
    [
      'id de Categoria repetido',
      JSON.stringify(
        backupValido({
          categorias: [
            { id: 'c1', nome: 'Streaming' },
            { id: 'c1', nome: 'Cursos' },
          ],
        }),
      ),
      ['Categoria 2: o identificador repete o da Categoria 1.'],
    ],
    [
      'nome de Categoria repetido',
      JSON.stringify(
        backupValido({
          categorias: [
            { id: 'c1', nome: 'Streaming' },
            { id: 'c2', nome: ' streaming ' },
          ],
        }),
      ),
      ['Categoria 2: o nome "streaming" repete o da Categoria 1.'],
    ],
    [
      'id de Assinatura repetido',
      JSON.stringify(
        backupValido({
          assinaturas: [base.assinaturas[0], base.assinaturas[0]],
        }),
      ),
      ['Assinatura 2: o identificador repete o da Assinatura 1.'],
    ],
    [
      'valor negativo',
      JSON.stringify(
        assinaturaCom({
          vigencias: [mensal('2026-01-01', { valorCentavos: -1 })],
        }),
      ),
      [
        'Assinatura 1: Vigência 1: o valor deve ser maior ou igual a zero, em centavos inteiros.',
      ],
    ],
    [
      'Categoria e preferências inválidas',
      JSON.stringify(
        backupValido({
          categorias: [{ id: 'c1', nome: '' }],
          preferencias: { id: 'preferencias', janelaVencimentosDias: 0 },
        }),
      ),
      [
        'Categoria 1: O nome da Categoria não pode ficar vazio.',
        'A janela de vencimentos deve ser um número inteiro de dias, maior ou igual a 1.',
      ],
    ],
  ])('recusa %s sem alterar o banco', async (_, texto, erros) => {
    const antes = await tabelas()
    let erro: unknown
    try {
      await restaurarBackup(lerBackup(texto))
    } catch (e) {
      erro = e
    }
    expect(erro).toEqual(new ErroValidacao(erros))
    expect(await tabelas()).toEqual(antes)
  })
})
