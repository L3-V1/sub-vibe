/** Dia do calendário no formato 'AAAA-MM-DD', sem horário nem fuso. */
export type DataISO = string

export type UnidadeCiclo = 'dia' | 'semana' | 'mes' | 'ano'

/** Ciclo de cobrança: a cada `quantidade` unidades. */
export interface Ciclo {
  quantidade: number
  unidade: UnidadeCiclo
}

export interface Vigencia {
  inicio: DataISO
  valorCentavos: number
  ciclo: Ciclo
  /** Data de cancelamento. */
  fim?: DataISO
}

export interface Assinatura {
  id: string
  servico: string
  categoriaId: string
  observacoes?: string
  vigencias: Vigencia[]
}

export interface Categoria {
  id: string
  nome: string
}

/** Derivada das Vigências; nunca é persistida (ADR 0002). */
export interface Cobranca {
  assinaturaId: string
  data: DataISO
  valorCentavos: number
}

export type EstadoAssinatura = 'Ativa' | 'Cancelada'
