import { beforeEach, describe, expect, it } from 'vitest'
import type { Assinatura, Vigencia } from '../domain/tipos'
import { assinaturasRepo } from './assinaturasRepo'
import { db } from './db'
import { ErroValidacao } from './esquemas'

let categoriaId: string

beforeEach(async () => {
  await db.delete()
  await db.open()
  categoriaId = (await db.categorias.toCollection().first())!.id
})

const mensal = (inicio: string, extras: Partial<Vigencia> = {}): Vigencia => ({
  inicio,
  valorCentavos: 3990,
  ciclo: { quantidade: 1, unidade: 'mes' },
  ...extras,
})

const dados = (
  extras: Partial<Omit<Assinatura, 'id'>> = {},
): Omit<Assinatura, 'id'> => ({
  servico: 'Netflix',
  categoriaId,
  vigencias: [mensal('2026-01-10')],
  ...extras,
})

/** Captura a `ErroValidacao` lançada pela promessa. */
async function erroDe(promessa: Promise<unknown>): Promise<string[]> {
  const erro = await promessa.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(erro).toBeInstanceOf(ErroValidacao)
  return (erro as ErroValidacao).erros
}

/** Tenta criar com os dados, confere que nada foi gravado e devolve os erros. */
async function recusa(d: unknown): Promise<string[]> {
  const erros = await erroDe(assinaturasRepo.criar(d as Omit<Assinatura, 'id'>))
  expect(await db.assinaturas.count()).toBe(0)
  return erros
}

describe('assinaturasRepo: gravação e leitura', () => {
  it('ida e volta com várias Vigências, Período gratuito e fim', async () => {
    const original = dados({
      servico: '  Curso X ',
      observacoes: 'cartão final 1234',
      vigencias: [
        mensal('2026-01-01', { valorCentavos: 0, fim: '2026-01-31' }),
        mensal('2026-02-01', {
          ciclo: { quantidade: 1, unidade: 'ano' },
          fim: '2026-05-10',
        }),
        mensal('2026-08-15', { ciclo: { quantidade: 2, unidade: 'semana' } }),
      ],
    })
    const id = await assinaturasRepo.criar(original)
    expect(await assinaturasRepo.obter(id)).toEqual({
      ...original,
      id,
      servico: 'Curso X',
    })
  })

  it('lista em ordem alfabética do Serviço', async () => {
    await assinaturasRepo.criar(dados({ servico: 'Spotify' }))
    await assinaturasRepo.criar(dados({ servico: 'Amazon' }))
    expect((await assinaturasRepo.listar()).map((a) => a.servico)).toEqual([
      'Amazon',
      'Spotify',
    ])
  })

  it('atualiza (ex.: cancelamento) e exclui', async () => {
    const id = await assinaturasRepo.criar(dados())
    const cancelada: Assinatura = {
      ...dados(),
      id,
      vigencias: [mensal('2026-01-10', { fim: '2026-04-01' })],
    }
    await assinaturasRepo.atualizar(cancelada)
    expect(await assinaturasRepo.obter(id)).toEqual(cancelada)

    await assinaturasRepo.excluir(id)
    expect(await assinaturasRepo.obter(id)).toBeUndefined()
  })

  it('descarta campos desconhecidos', async () => {
    const id = await assinaturasRepo.criar({
      ...dados(),
      pago: true,
    } as Omit<Assinatura, 'id'>)
    expect(await assinaturasRepo.obter(id)).not.toHaveProperty('pago')
  })
})

describe('assinaturasRepo: rejeições', () => {
  it('Vigências fora de ordem', async () => {
    expect(
      await recusa(
        dados({ vigencias: [mensal('2026-05-01'), mensal('2026-01-01')] }),
      ),
    ).toEqual([
      'Vigência 2: o início deve ser posterior ao da Vigência anterior.',
    ])
  })

  it('Vigências sobrepostas', async () => {
    expect(
      await recusa(
        dados({
          vigencias: [
            mensal('2026-01-01', { fim: '2026-03-01' }),
            mensal('2026-03-01'),
          ],
        }),
      ),
    ).toEqual([
      'Vigência 2: o início deve ser posterior à Data de cancelamento da Vigência anterior.',
    ])
  })

  it('sem Vigências', async () => {
    expect(await recusa(dados({ vigencias: [] }))).toEqual([
      'A Assinatura precisa de pelo menos uma Vigência.',
    ])
  })

  it.each(['2026-02-30', '31/01/2026', '2026-1-5'])(
    'data inválida: %s',
    async (data) => {
      expect(await recusa(dados({ vigencias: [mensal(data)] }))).toEqual([
        'Vigência 1: o início deve ser uma data real no formato AAAA-MM-DD.',
      ])
    },
  )

  it('Data de cancelamento inválida', async () => {
    expect(
      await recusa(
        dados({
          vigencias: [
            mensal('2026-01-01'),
            mensal('2026-02-01', { fim: '2026-13-01' }),
          ],
        }),
      ),
    ).toEqual([
      'Vigência 2: a Data de cancelamento deve ser uma data real no formato AAAA-MM-DD.',
    ])
  })

  it('Serviço vazio', async () => {
    expect(await recusa(dados({ servico: '  ' }))).toEqual([
      'O Serviço não pode ficar vazio.',
    ])
  })

  it('valor fracionário ou negativo', async () => {
    expect(
      await recusa(
        dados({
          vigencias: [
            mensal('2026-01-01', { valorCentavos: 39.9, fim: '2026-01-31' }),
            mensal('2026-02-01', { valorCentavos: -1 }),
          ],
        }),
      ),
    ).toEqual([
      'Vigência 1: o valor deve ser maior ou igual a zero, em centavos inteiros.',
      'Vigência 2: o valor deve ser maior ou igual a zero, em centavos inteiros.',
    ])
  })

  it('Ciclo de cobrança inválido', async () => {
    expect(
      await recusa({
        ...dados(),
        vigencias: [
          {
            ...mensal('2026-01-01'),
            ciclo: { quantidade: 0, unidade: 'hora' },
          },
        ],
      }),
    ).toEqual([
      'Vigência 1: o Ciclo de cobrança deve ser um número inteiro maior ou igual a 1.',
      'Vigência 1: a unidade do Ciclo de cobrança deve ser dia, semana, mês ou ano.',
    ])
  })

  it('campos ausentes ou do tipo errado', async () => {
    expect(
      await recusa({ servico: 42, observacoes: 1, vigencias: 'nenhuma' }),
    ).toEqual([
      'O Serviço não pode ficar vazio.',
      'Escolha uma Categoria.',
      'As observações devem ser um texto.',
      'As Vigências devem ser uma lista.',
    ])
  })

  it('Categoria inexistente', async () => {
    expect(await recusa(dados({ categoriaId: 'nao-existe' }))).toEqual([
      'A Categoria escolhida não existe.',
    ])
  })

  it('atualizar Assinatura inexistente ou com dados inválidos', async () => {
    expect(
      await erroDe(assinaturasRepo.atualizar({ ...dados(), id: 'nao-existe' })),
    ).toEqual(['Assinatura não encontrada.'])
    expect(await db.assinaturas.count()).toBe(0)

    const id = await assinaturasRepo.criar(dados())
    expect(
      await erroDe(assinaturasRepo.atualizar({ ...dados(), id, servico: '' })),
    ).toEqual(['O Serviço não pode ficar vazio.'])
    expect((await assinaturasRepo.obter(id))?.servico).toBe('Netflix')
  })
})
