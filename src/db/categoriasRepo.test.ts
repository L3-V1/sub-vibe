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

  it('recusa excluir Categoria em uso', async () => {
    const id = await categoriasRepo.criar('Jogos')
    await db.assinaturas.add({
      id: 'a1',
      servico: 'Game Pass',
      categoriaId: id,
      vigencias: [
        {
          inicio: '2026-01-01',
          valorCentavos: 4990,
          ciclo: { quantidade: 1, unidade: 'mes' },
        },
      ],
    })
    expect(await erroDe(categoriasRepo.excluir(id))).toEqual([
      'A Categoria está em uso por 1 Assinatura(s); mova-as para outra Categoria antes de excluir.',
    ])
    expect(await db.categorias.get(id)).toBeDefined()
  })
})
