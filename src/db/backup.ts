import { z } from 'zod'
import { validarAssinatura } from '../domain/assinatura'
import type { Assinatura, Categoria, DataISO } from '../domain/tipos'
import { assinaturasRepo } from './assinaturasRepo'
import { categoriasRepo } from './categoriasRepo'
import { db, type Preferencias } from './db'
import {
  ErroValidacao,
  esquemaAssinatura,
  esquemaCategoria,
  esquemaPreferencias,
  validar,
} from './esquemas'
import { preferenciasRepo } from './preferenciasRepo'

/** Acompanha o `db.version`: quando o Dexie mudar de versão, muda junto e entra uma migração. */
export const VERSAO_SCHEMA = 1

export interface Backup {
  versaoSchema: typeof VERSAO_SCHEMA
  /** ISO datetime, de `new Date().toISOString()`. */
  exportadoEm: string
  categorias: Categoria[]
  assinaturas: Assinatura[]
  preferencias: Preferencias
}

export function nomeArquivoBackup(hoje: DataISO): string {
  return `sub-vibe-backup-${hoje}.json`
}

export async function gerarBackup(): Promise<Backup> {
  return db.transaction(
    'r',
    db.categorias,
    db.assinaturas,
    db.preferencias,
    async () => ({
      versaoSchema: VERSAO_SCHEMA,
      exportadoEm: new Date().toISOString(),
      categorias: await categoriasRepo.listar(),
      assinaturas: await assinaturasRepo.listar(),
      preferencias: await preferenciasRepo.obter(),
    }),
  )
}

const MSG_NAO_BACKUP = 'O arquivo não é um backup do Sub-vibe.'

// Os itens são validados um a um depois, para as mensagens dizerem qual item falhou.
const esquemaEstrutura = z.object({
  exportadoEm: z.iso.datetime({ error: 'A data da exportação é inválida.' }),
  categorias: z.array(z.unknown(), {
    error: 'O arquivo não traz a lista de Categorias.',
  }),
  assinaturas: z.array(z.unknown(), {
    error: 'O arquivo não traz a lista de Assinaturas.',
  }),
  preferencias: z.unknown(),
})

/** Mesma regra do `categoriasRepo`: ignora maiúsculas e espaços nas pontas. */
const chave = (nome: string) => nome.trim().toLocaleLowerCase('pt-BR')

/**
 * Lê o texto de um arquivo de backup e devolve o backup validado: formato,
 * invariantes do domínio, referências às Categorias e unicidade. Qualquer erro
 * recusa o arquivo inteiro, com todas as mensagens num `ErroValidacao`.
 */
export function lerBackup(texto: string): Backup {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    throw new ErroValidacao(['O arquivo não é um JSON válido.'])
  }
  if (typeof dados !== 'object' || dados === null) {
    throw new ErroValidacao([MSG_NAO_BACKUP])
  }
  const versao = (dados as { versaoSchema?: unknown }).versaoSchema
  if (typeof versao !== 'number') throw new ErroValidacao([MSG_NAO_BACKUP])
  if (versao !== VERSAO_SCHEMA) {
    throw new ErroValidacao([
      `Este backup usa a versão ${versao} do formato, e este app só lê a versão ${VERSAO_SCHEMA}.`,
    ])
  }

  const estrutura = validar(esquemaEstrutura, dados)
  const erros: string[] = []

  /** Valida um item com o esquema; se falhar, guarda as mensagens com o prefixo. */
  function item<T>(esquema: z.ZodType<T>, dado: unknown, prefixo: string) {
    try {
      return validar(esquema, dado)
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e
      erros.push(...e.erros.map((erro) => `${prefixo}${erro}`))
    }
  }

  const categorias = estrutura.categorias.map((dado, i) =>
    item(esquemaCategoria, dado, `Categoria ${i + 1}: `),
  )
  const assinaturas = estrutura.assinaturas.map((dado, i) =>
    item(esquemaAssinatura, dado, `Assinatura ${i + 1}: `),
  )
  const preferencias = item(esquemaPreferencias, estrutura.preferencias, '')

  const posicaoPorId = new Map<string, number>()
  const posicaoPorNome = new Map<string, number>()
  categorias.forEach((c, i) => {
    if (c === undefined) return
    const repetidaId = posicaoPorId.get(c.id)
    const repetidaNome = posicaoPorNome.get(chave(c.nome))
    if (repetidaId !== undefined) {
      erros.push(
        `Categoria ${i + 1}: o identificador repete o da Categoria ${repetidaId}.`,
      )
    } else {
      posicaoPorId.set(c.id, i + 1)
    }
    if (repetidaNome !== undefined) {
      erros.push(
        `Categoria ${i + 1}: o nome "${c.nome}" repete o da Categoria ${repetidaNome}.`,
      )
    } else {
      posicaoPorNome.set(chave(c.nome), i + 1)
    }
  })

  const posicaoPorIdAssinatura = new Map<string, number>()
  assinaturas.forEach((a, i) => {
    if (a === undefined) return
    const prefixo = `Assinatura ${i + 1}: `
    erros.push(...validarAssinatura(a).map((erro) => `${prefixo}${erro}`))
    // Sem conferir a referência se a lista de Categorias tem itens inválidos.
    if (!categorias.includes(undefined) && !posicaoPorId.has(a.categoriaId)) {
      erros.push(`${prefixo}a Categoria não existe no arquivo.`)
    }
    const repetida = posicaoPorIdAssinatura.get(a.id)
    if (repetida !== undefined) {
      erros.push(
        `${prefixo}o identificador repete o da Assinatura ${repetida}.`,
      )
    } else {
      posicaoPorIdAssinatura.set(a.id, i + 1)
    }
  })

  if (erros.length > 0) throw new ErroValidacao(erros)
  return {
    versaoSchema: VERSAO_SCHEMA,
    exportadoEm: estrutura.exportadoEm,
    categorias: categorias as Categoria[],
    assinaturas: assinaturas as Assinatura[],
    preferencias: preferencias!,
  }
}

/** Substitui todos os dados pelos do backup, numa só transação. */
export async function restaurarBackup(backup: Backup): Promise<void> {
  await db.transaction(
    'rw',
    db.categorias,
    db.assinaturas,
    db.preferencias,
    async () => {
      await Promise.all([
        db.categorias.clear(),
        db.assinaturas.clear(),
        db.preferencias.clear(),
      ])
      await db.categorias.bulkAdd(backup.categorias)
      await db.assinaturas.bulkAdd(backup.assinaturas)
      await db.preferencias.put(backup.preferencias)
    },
  )
}
