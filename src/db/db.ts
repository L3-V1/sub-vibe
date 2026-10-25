import Dexie, { type EntityTable } from 'dexie'
import type { Assinatura, Categoria } from '../domain/tipos'

/** Registro único com as preferências do usuário. */
export interface Preferencias {
  id: 'preferencias'
  janelaVencimentosDias: number
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  id: 'preferencias',
  janelaVencimentosDias: 7,
}

export const CATEGORIAS_INICIAIS = [
  'Streaming',
  'Cursos',
  'I.A.',
  'Software',
  'Outros',
]

export const db = new Dexie('sub-vibe') as Dexie & {
  categorias: EntityTable<Categoria, 'id'>
  /** As Vigências ficam embutidas no documento da Assinatura. */
  assinaturas: EntityTable<Assinatura, 'id'>
  preferencias: EntityTable<Preferencias, 'id'>
}

db.version(1).stores({
  categorias: 'id',
  assinaturas: 'id, categoriaId',
  preferencias: 'id',
})

// O Dexie dispara `populate` só quando cria o banco: é a primeira execução.
db.on('populate', (tx) => {
  tx.table('categorias').bulkAdd(
    CATEGORIAS_INICIAIS.map((nome) => ({ id: crypto.randomUUID(), nome })),
  )
})
