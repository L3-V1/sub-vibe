import { addDays, format, parseISO, subMonths } from 'date-fns'
import { cobrancasNoIntervalo } from './cobrancas'
import type { Assinatura, Cobranca, DataISO } from './tipos'

export type Periodo = 'anoCorrente' | 'ultimos12Meses' | 'desdeOInicio'

const formatar = (data: Date): DataISO => format(data, 'yyyy-MM-dd')

/** Intervalo (inclusive) do gasto já ocorrido no período: sempre termina hoje. */
export function intervaloDoPeriodo(
  periodo: Periodo,
  assinaturas: Assinatura[],
  hoje: DataISO,
): { de: DataISO; ate: DataISO } {
  switch (periodo) {
    case 'anoCorrente':
      return { de: `${hoje.slice(0, 4)}-01-01`, ate: hoje }
    case 'ultimos12Meses':
      return {
        de: formatar(addDays(subMonths(parseISO(hoje), 12), 1)),
        ate: hoje,
      }
    case 'desdeOInicio': {
      // As Vigências são ordenadas: a primeira tem o menor início. Sem Assinaturas, só hoje.
      const inicios = assinaturas.map((a) => a.vigencias[0].inicio)
      const de = inicios.reduce((menor, d) => (d < menor ? d : menor), hoje)
      return { de, ate: hoje }
    }
  }
}

/** Cobranças de todas as Assinaturas de hoje até hoje + `dias` (inclusive), em ordem de data. */
export function proximasCobrancas(
  assinaturas: Assinatura[],
  hoje: DataISO,
  dias: number,
): Cobranca[] {
  const ate = formatar(addDays(parseISO(hoje), dias))
  return assinaturas
    .flatMap((a) => cobrancasNoIntervalo(a, hoje, ate))
    .sort((x, y) => x.data.localeCompare(y.data))
}
