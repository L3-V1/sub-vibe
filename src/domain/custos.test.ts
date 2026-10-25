import { describe, expect, it } from 'vitest'
import {
  custoMensalEquivalente,
  gastoAcumulado,
  gastoPorCategoria,
} from './custos'
import type { Assinatura, UnidadeCiclo, Vigencia } from './tipos'

const vig = (
  inicio: string,
  valorCentavos: number,
  unidade: UnidadeCiclo = 'mes',
  quantidade = 1,
  fim?: string,
): Vigencia => ({ inicio, valorCentavos, ciclo: { quantidade, unidade }, fim })

const assinatura = (
  vigencias: Vigencia[],
  id = 'a1',
  categoriaId = 'c1',
): Assinatura => ({
  id,
  servico: 'Netflix',
  categoriaId,
  vigencias,
})

const HOJE = '2026-10-25'

describe('custoMensalEquivalente', () => {
  it.each<[UnidadeCiclo, number, number, number]>([
    ['mes', 1, 3990, 3990],
    ['ano', 1, 12000, 1000],
    ['semana', 1, 1200, 5200],
    ['dia', 1, 120, 3650],
    ['mes', 3, 9000, 3000],
    ['ano', 2, 24000, 1000],
    ['semana', 2, 1200, 2600],
    ['dia', 2, 120, 1825],
  ])('%s a cada %i, valor %i → %i', (unidade, quantidade, valor, esperado) => {
    const a = assinatura([vig('2026-01-01', valor, unidade, quantidade)])
    expect(custoMensalEquivalente(a, HOJE)).toBe(esperado)
  })

  it('arredonda para centavos inteiros', () => {
    // 19990 / 12 = 1665,83…
    expect(
      custoMensalEquivalente(
        assinatura([vig('2026-01-01', 19990, 'ano')]),
        HOJE,
      ),
    ).toBe(1666)
    // 1000 / 3 = 333,33…
    expect(
      custoMensalEquivalente(
        assinatura([vig('2026-01-01', 1000, 'mes', 3)]),
        HOJE,
      ),
    ).toBe(333)
  })

  it('usa a Vigência vigente hoje', () => {
    const a = assinatura([
      vig('2026-01-01', 3990),
      vig('2026-10-01', 12000, 'ano'),
    ])
    expect(custoMensalEquivalente(a, HOJE)).toBe(1000)
    expect(custoMensalEquivalente(a, '2026-09-30')).toBe(3990)
  })

  it('é 0 para Assinatura Cancelada, inclusive no dia do cancelamento', () => {
    const a = assinatura([vig('2026-01-01', 3990, 'mes', 1, HOJE)])
    expect(custoMensalEquivalente(a, '2026-10-24')).toBe(3990)
    expect(custoMensalEquivalente(a, HOJE)).toBe(0)
    expect(custoMensalEquivalente(a, '2026-11-01')).toBe(0)
  })

  it('é 0 com só Vigência futura', () => {
    expect(
      custoMensalEquivalente(assinatura([vig('2027-01-01', 3990)]), HOJE),
    ).toBe(0)
  })

  it('é 0 no Período gratuito', () => {
    expect(
      custoMensalEquivalente(assinatura([vig('2026-10-01', 0)]), HOJE),
    ).toBe(0)
  })
})

describe('gastoAcumulado', () => {
  it('soma as Cobranças do intervalo, incluindo as de Assinaturas hoje Canceladas', () => {
    const ativa = assinatura([vig('2026-01-10', 3990)], 'a1')
    const cancelada = assinatura(
      [vig('2026-01-05', 2000, 'mes', 1, '2026-03-05')],
      'a2',
    )
    // ativa: de 10/01 a 10/10 = 10 Cobranças; cancelada: 05/01, 05/02 e 05/03 = 3 Cobranças
    expect(gastoAcumulado([ativa, cancelada], '2026-01-01', HOJE)).toBe(
      10 * 3990 + 3 * 2000,
    )
  })

  it('é 0 sem Assinaturas ou sem Cobranças no intervalo', () => {
    expect(gastoAcumulado([], '2026-01-01', HOJE)).toBe(0)
    expect(
      gastoAcumulado(
        [assinatura([vig('2027-01-01', 3990)])],
        '2026-01-01',
        HOJE,
      ),
    ).toBe(0)
  })
})

describe('gastoPorCategoria', () => {
  it('agrupa o Gasto acumulado por Categoria', () => {
    const assinaturas = [
      assinatura([vig('2026-01-10', 3990)], 'a1', 'streaming'),
      assinatura([vig('2026-06-01', 2000)], 'a2', 'streaming'),
      assinatura([vig('2026-01-01', 50000, 'ano')], 'a3', 'curso'),
      assinatura([vig('2027-01-01', 9990)], 'a4', 'ia'),
    ]
    expect(gastoPorCategoria(assinaturas, '2026-01-01', HOJE)).toEqual({
      streaming: 10 * 3990 + 5 * 2000,
      curso: 50000,
    })
  })
})
