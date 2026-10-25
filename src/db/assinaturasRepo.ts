import type { Assinatura } from '../domain/tipos'
import { db } from './db'
import { ErroValidacao, validarParaGravar } from './esquemas'

/** Valida formato e invariantes, confere a Categoria e grava, numa transação. */
async function gravar(dados: Assinatura, modo: 'criar' | 'atualizar') {
  const assinatura = validarParaGravar(dados)
  await db.transaction('rw', db.assinaturas, db.categorias, async () => {
    if (
      modo === 'atualizar' &&
      (await db.assinaturas.get(assinatura.id)) === undefined
    ) {
      throw new ErroValidacao(['Assinatura não encontrada.'])
    }
    if ((await db.categorias.get(assinatura.categoriaId)) === undefined) {
      throw new ErroValidacao(['A Categoria escolhida não existe.'])
    }
    await db.assinaturas.put(assinatura)
  })
}

export const assinaturasRepo = {
  /** Em ordem alfabética pt-BR do Serviço. */
  async listar(): Promise<Assinatura[]> {
    const assinaturas = await db.assinaturas.toArray()
    return assinaturas.sort((a, b) =>
      a.servico.localeCompare(b.servico, 'pt-BR'),
    )
  },

  obter(id: string): Promise<Assinatura | undefined> {
    return db.assinaturas.get(id)
  },

  async criar(dados: Omit<Assinatura, 'id'>): Promise<string> {
    const id = crypto.randomUUID()
    await gravar({ ...dados, id }, 'criar')
    return id
  },

  /** Cancelamento e Reativação chegam aqui como uma nova lista de Vigências. */
  async atualizar(assinatura: Assinatura): Promise<void> {
    await gravar(assinatura, 'atualizar')
  },

  async excluir(id: string): Promise<void> {
    await db.assinaturas.delete(id)
  },
}
