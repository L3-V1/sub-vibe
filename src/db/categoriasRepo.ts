import type { Categoria } from '../domain/tipos'
import { db } from './db'
import { ErroValidacao, esquemaCategoria, validar } from './esquemas'

const chave = (nome: string) => nome.trim().toLocaleLowerCase('pt-BR')

/** Recusa nome repetido, ignorando maiúsculas e espaços nas pontas. */
async function garantirNomeUnico(categoria: Categoria) {
  const repetida = await db.categorias
    .filter(
      (c) => c.id !== categoria.id && chave(c.nome) === chave(categoria.nome),
    )
    .first()
  if (repetida !== undefined) {
    throw new ErroValidacao(
      [`Já existe uma Categoria chamada "${repetida.nome}".`],
      ['nome'],
    )
  }
}

export const categoriasRepo = {
  /** Em ordem alfabética pt-BR. */
  async listar(): Promise<Categoria[]> {
    const categorias = await db.categorias.toArray()
    return categorias.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  },

  async criar(nome: string): Promise<string> {
    const categoria = validar(esquemaCategoria, {
      id: crypto.randomUUID(),
      nome,
    })
    await db.transaction('rw', db.categorias, async () => {
      await garantirNomeUnico(categoria)
      await db.categorias.add(categoria)
    })
    return categoria.id
  },

  async renomear(id: string, nome: string): Promise<void> {
    const categoria = validar(esquemaCategoria, { id, nome })
    await db.transaction('rw', db.categorias, async () => {
      if ((await db.categorias.get(id)) === undefined) {
        throw new ErroValidacao(['Categoria não encontrada.'])
      }
      await garantirNomeUnico(categoria)
      await db.categorias.put(categoria)
    })
  },

  /**
   * Categoria em uso só é excluída com uma Categoria de destino: as Assinaturas
   * passam para ela e a exclusão acontece na mesma transação.
   */
  async excluir(id: string, destinoId?: string): Promise<void> {
    await db.transaction('rw', db.categorias, db.assinaturas, async () => {
      const emUso = db.assinaturas.where('categoriaId').equals(id)
      const quantidade = await emUso.count()
      if (quantidade > 0) {
        if (destinoId === undefined) {
          throw new ErroValidacao([
            `A Categoria está em uso por ${quantidade} Assinatura(s); mova-as para outra Categoria antes de excluir.`,
          ])
        }
        if (destinoId === id) {
          throw new ErroValidacao(
            ['Escolha uma Categoria de destino diferente da excluída.'],
            ['destino'],
          )
        }
        if ((await db.categorias.get(destinoId)) === undefined) {
          throw new ErroValidacao(
            ['A Categoria de destino não existe.'],
            ['destino'],
          )
        }
        await emUso.modify({ categoriaId: destinoId })
      }
      await db.categorias.delete(id)
    })
  },
}
