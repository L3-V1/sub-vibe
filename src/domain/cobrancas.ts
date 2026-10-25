import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  parseISO,
} from 'date-fns'
import type { Assinatura, Ciclo, Cobranca, DataISO } from './tipos'

const somar = { dia: addDays, semana: addWeeks, mes: addMonths, ano: addYears }

/**
 * `inicio + k·N`, sempre a partir da âncora: 31/01 + 1 mês = 28/02 (ou 29/02),
 * e 31/01 + 2 meses = 31/03.
 */
function somarCiclos(inicio: DataISO, ciclo: Ciclo, k: number): DataISO {
  return format(
    somar[ciclo.unidade](parseISO(inicio), k * ciclo.quantidade),
    'yyyy-MM-dd',
  )
}

/**
 * Datas das Cobranças da Vigência `i`, em ordem, até o fim efetivo dela (a Data de
 * cancelamento conta; o início da próxima Vigência não). Infinita se a Vigência é aberta.
 */
function* datasDaVigencia(a: Assinatura, i: number): Generator<DataISO> {
  const v = a.vigencias[i]
  const proxima = a.vigencias[i + 1]
  for (let k = 0; ; k++) {
    const data = somarCiclos(v.inicio, v.ciclo, k)
    if (v.fim !== undefined && data > v.fim) return
    if (proxima !== undefined && data >= proxima.inicio) return
    yield data
  }
}

/** Cobranças entre `de` e `ate` (inclusive), em ordem de data. Período gratuito não gera Cobranças. */
export function cobrancasNoIntervalo(
  a: Assinatura,
  de: DataISO,
  ate: DataISO,
): Cobranca[] {
  const cobrancas: Cobranca[] = []
  a.vigencias.forEach((v, i) => {
    if (v.valorCentavos === 0) return
    for (const data of datasDaVigencia(a, i)) {
      if (data > ate) break
      if (data >= de)
        cobrancas.push({
          assinaturaId: a.id,
          data,
          valorCentavos: v.valorCentavos,
        })
    }
  })
  return cobrancas
}

/** A primeira Cobrança em hoje ou depois (inclusive em Vigências futuras), ou `undefined`. */
export function proximoVencimento(
  a: Assinatura,
  hoje: DataISO,
): DataISO | undefined {
  for (const [i, v] of a.vigencias.entries()) {
    if (v.valorCentavos === 0) continue
    for (const data of datasDaVigencia(a, i)) {
      if (data >= hoje) return data
    }
  }
  return undefined
}
