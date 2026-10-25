import { beforeEach, describe, expect, it } from 'vitest'
import { categoriasRepo } from './categoriasRepo'
import { CATEGORIAS_INICIAIS, db } from './db'
import { ErroValidacao } from './esquemas'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const nomes = async () => (await categoriasRepo.listar()).map((c) => c.nome)

/** Captura a `ErroValidacao` lançada pela promessa. */
async function erroDe(promessa: Promise<unknown>): Promise<string[]> {
  const erro = await promessa.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(erro).toBeInstanceOf(ErroValidacao)
  return (erro as ErroValidacao).erros
}

describe('categoriasRepo', () => {
  it('grava as Categorias iniciais na primeira abertura, em ordem alfabética', async () => {
    expect(await nomes()).toEqual(
      [...CATEGORIAS_INICIAIS].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    )
  })

  it('cria uma Categoria, sem os espaços nas pontas', async () => {
    const id = await categoriasRepo.criar('  Jogos ')
    expect(await db.categorias.get(id)).toEqual({ id, nome: 'Jogos' })
  })

  it('recusa nome vazio', async () => {
    expect(await erroDe(categoriasRepo.criar('   '))).toEqual([
      'O nome da Categoria não pode ficar vazio.',
    ])
    expect(await db.categorias.count()).toBe(5)
  })

  it('recusa nome repetido, ignorando maiúsculas e espaços', async () => {
    expect(await erroDe(categoriasRepo.criar(' streaming '))).toEqual([
      'Já existe uma Categoria chamada "Streaming".',
    ])
    expect(await db.categorias.count()).toBe(5)
  })

  it('renomeia, inclusive mudando só as maiúsculas do próprio nome', async () => {
    const id = await categoriasRepo.criar('Jogos')
    await categoriasRepo.renomear(id, 'JOGOS')
    expect((await db.categorias.get(id))?.nome).toBe('JOGOS')
  })

  it('recusa renomear para um nome em uso ou Categoria inexistente', async () => {
    const id = await categoriasRepo.criar('Jogos')
    expect(await erroDe(categoriasRepo.renomear(id, 'Cursos'))).toEqual([
      'Já existe uma Categoria chamada "Cursos".',
    ])
    expect((await db.categorias.get(id))?.nome).toBe('Jogos')
    expect(await erroDe(categoriasRepo.renomear('nao-existe', 'X'))).toEqual([
      'Categoria não encontrada.',
    ])
  })

  it('exclui Categoria sem uso', async () => {
    const id = await categoriasRepo.criar('Jogos')
    await categoriasRepo.excluir(id)
    expect(await db.categorias.get(id)).toBeUndefined()
  })

  describe('excluir Categoria em uso', () => {
    let jogos: string
    let outros: string

    beforeEach(async () => {
      jogos = await categoriasRepo.criar('Jogos')
      outros = (await db.categorias.filter((c) => c.nome === 'Outros').first())!
        .id
      for (const id of ['a1', 'a2']) {
        await db.assinaturas.add({
          id,
          servico: 'Game Pass',
          categoriaId: jogos,
          vigencias: [
            {
              inicio: '2026-01-01',
              valorCentavos: 4990,
              ciclo: { quantidade: 1, unidade: 'mes' },
            },
          ],
        })
      }
    })

    /** Nada mudou: a Categoria existe e as Assinaturas continuam nela. */
    async function nadaMudou() {
      expect(await db.categorias.get(jogos)).toBeDefined()
      expect(
        await db.assinaturas.where('categoriaId').equals(jogos).count(),
      ).toBe(2)
    }

    it('recusa sem Categoria de destino', async () => {
      expect(await erroDe(categoriasRepo.excluir(jogos))).toEqual([
        'A Categoria está em uso por 2 Assinatura(s); mova-as para outra Categoria antes de excluir.',
      ])
      await nadaMudou()
    })

    it('move as Assinaturas para o destino e exclui', async () => {
      await categoriasRepo.excluir(jogos, outros)
      expect(await db.categorias.get(jogos)).toBeUndefined()
      expect(
        (await db.assinaturas.toArray()).map((a) => a.categoriaId),
      ).toEqual([outros, outros])
    })

    it('recusa destino igual à Categoria excluída', async () => {
      expect(await erroDe(categoriasRepo.excluir(jogos, jogos))).toEqual([
        'Escolha uma Categoria de destino diferente da excluída.',
      ])
      await nadaMudou()
    })

    it('recusa destino inexistente', async () => {
      expect(await erroDe(categoriasRepo.excluir(jogos, 'nao-existe'))).toEqual(
        ['A Categoria de destino não existe.'],
      )
      await nadaMudou()
    })
  })
})
