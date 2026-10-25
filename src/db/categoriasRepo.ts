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
    throw new ErroValidacao([
      `Já existe uma Categoria chamada "${repetida.nome}".`,
    ])
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

  /** Recusa excluir Categoria em uso: o M3 reatribui as Assinaturas antes. */
  async excluir(id: string): Promise<void> {
    await db.transaction('rw', db.categorias, db.assinaturas, async () => {
      const emUso = await db.assinaturas.where('categoriaId').equals(id).count()
      if (emUso > 0) {
        throw new ErroValidacao([
          `A Categoria está em uso por ${emUso} Assinatura(s); mova-as para outra Categoria antes de excluir.`,
        ])
      }
      await db.categorias.delete(id)
    })
  },
}
