import { db } from '../db/db'
import type { Assinatura, Vigencia } from '../domain/tipos'

export const mensal = (
  inicio: string,
  extras: Partial<Vigencia> = {},
): Vigencia => ({
  inicio,
  valorCentavos: 3990,
  ciclo: { quantidade: 1, unidade: 'mes' },
  ...extras,
})

/** Grava uma Assinatura na Categoria `categoria` (pelo nome) e devolve o id. */
export async function gravarAssinatura(
  servico: string,
  categoria: string,
  ...vigencias: Vigencia[]
): Promise<string> {
  const c = await db.categorias.filter((c) => c.nome === categoria).first()
  const assinatura: Assinatura = {
    id: crypto.randomUUID(),
    servico,
    categoriaId: c!.id,
    vigencias,
  }
  await db.assinaturas.add(assinatura)
  return assinatura.id
}
