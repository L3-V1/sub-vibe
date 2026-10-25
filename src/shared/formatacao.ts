import { format } from 'date-fns'
import type { Ciclo, DataISO } from '../domain/tipos'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const data = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Formata um valor em centavos inteiros como reais: 123456 → "R$ 1.234,56". */
export function formatarMoeda(centavos: number): string {
  return moeda.format(centavos / 100)
}

/** Formata uma data como dd/MM/aaaa: "25/10/2026". */
export function formatarData(valor: Date): string {
  return data.format(valor)
}

/** Formata uma DataISO como dd/MM/aaaa, sem passar por fuso: "2026-01-31" → "31/01/2026". */
export function formatarDataISO(valor: DataISO): string {
  const [ano, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Lê um valor em reais digitado e devolve centavos inteiros: "R$ 1.234,56" → 123456.
 * Aceita "R$", ponto de milhar e até duas casas depois da vírgula; `undefined` se inválido.
 */
export function lerMoeda(texto: string): number | undefined {
  const limpo = texto.replace(/^\s*R\$/, '').trim()
  const partes = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(limpo)
  if (partes === null) return undefined
  const [, reais, centavos = '0'] = partes
  return (
    Number(reais.replaceAll('.', '')) * 100 + Number(centavos.padEnd(2, '0'))
  )
}

const unidades = {
  dia: ['diário', 'dias'],
  semana: ['semanal', 'semanas'],
  mes: ['mensal', 'meses'],
  ano: ['anual', 'anos'],
}

/** "mensal" para 1 mês, "a cada 3 meses" para 3. */
export function formatarCiclo({ quantidade, unidade }: Ciclo): string {
  const [uma, varias] = unidades[unidade]
  return quantidade === 1 ? uma : `a cada ${quantidade} ${varias}`
}

/** A data de hoje no fuso local. */
export function hoje(): DataISO {
  return format(new Date(), 'yyyy-MM-dd')
}
