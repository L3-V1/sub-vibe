import { describe, expect, it } from 'vitest'
import { formatarData, formatarMoeda } from './formatacao'

// O Intl separa "R$" do número com espaço não separável (U+00A0).
const NBSP = ' '

describe('formatarMoeda', () => {
  it('converte centavos inteiros em reais', () => {
    expect(formatarMoeda(3990)).toBe(`R$${NBSP}39,90`)
  })

  it('formata zero', () => {
    expect(formatarMoeda(0)).toBe(`R$${NBSP}0,00`)
  })

  it('mantém os centavos de valores pequenos', () => {
    expect(formatarMoeda(5)).toBe(`R$${NBSP}0,05`)
  })

  it('usa ponto como separador de milhar', () => {
    expect(formatarMoeda(123456)).toBe(`R$${NBSP}1.234,56`)
  })

  it('formata valores grandes', () => {
    expect(formatarMoeda(123456789)).toBe(`R$${NBSP}1.234.567,89`)
  })
})

describe('formatarData', () => {
  it('formata como dd/MM/aaaa', () => {
    expect(formatarData(new Date(2026, 9, 25))).toBe('25/10/2026')
  })

  it('completa dia e mês com zero à esquerda', () => {
    expect(formatarData(new Date(2026, 0, 5))).toBe('05/01/2026')
  })
})
