import { estado, vigenciaEm } from './assinatura'
import { cobrancasNoIntervalo } from './cobrancas'
import type { Assinatura, DataISO, UnidadeCiclo } from './tipos'

/** Fator para um mês como fração inteira [multiplicador, divisor], para arredondar uma vez só. */
const fatorMensal: Record<UnidadeCiclo, [number, number]> = {
  dia: [365, 12],
  semana: [52, 12],
  mes: [1, 1],
  ano: [1, 12],
}

/** Custo mensal equivalente da Vigência vigente hoje, em centavos; 0 se Cancelada ou sem Vigência vigente. */
export function custoMensalEquivalente(a: Assinatura, hoje: DataISO): number {
  const v = vigenciaEm(a, hoje)
  if (v === undefined || estado(a, hoje) === 'Cancelada') return 0
  const [multiplicador, divisor] = fatorMensal[v.ciclo.unidade]
  return Math.round(
    (v.valorCentavos * multiplicador) / (divisor * v.ciclo.quantidade),
  )
}

/** Soma das Cobranças entre `de` e `ate`; passe `ate = hoje` para só as já ocorridas. */
export function gastoAcumulado(
  assinaturas: Assinatura[],
  de: DataISO,
  ate: DataISO,
): number {
  return assinaturas
    .flatMap((a) => cobrancasNoIntervalo(a, de, ate))
    .reduce((total, c) => total + c.valorCentavos, 0)
}

/** Gasto acumulado agrupado por `categoriaId`; Categorias sem Cobranças ficam de fora. */
export function gastoPorCategoria(
  assinaturas: Assinatura[],
  de: DataISO,
  ate: DataISO,
): Record<string, number> {
  const porCategoria: Record<string, number> = {}
  for (const a of assinaturas) {
    for (const c of cobrancasNoIntervalo(a, de, ate)) {
      porCategoria[a.categoriaId] =
        (porCategoria[a.categoriaId] ?? 0) + c.valorCentavos
    }
  }
  return porCategoria
}
