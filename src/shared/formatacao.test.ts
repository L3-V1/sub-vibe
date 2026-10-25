import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatarCiclo,
  formatarData,
  formatarDataISO,
  formatarMoeda,
  hoje,
  lerMoeda,
} from './formatacao'

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

describe('formatarDataISO', () => {
  it('formata sem depender do fuso', () => {
    expect(formatarDataISO('2026-01-31')).toBe('31/01/2026')
  })
})

describe('lerMoeda', () => {
  it.each([
    ['39,90', 3990],
    ['39,9', 3990],
    ['39', 3900],
    ['0', 0],
    [' R$ 39,90 ', 3990],
    [`R$${NBSP}1.234,56`, 123456],
    ['1234,56', 123456],
    ['1.234.567,89', 123456789],
  ])('lê "%s" como %i centavos', (texto, centavos) => {
    expect(lerMoeda(texto)).toBe(centavos)
  })

  it.each(['', 'abc', '-1', '39.90', '39,999', '1.23,00', '39,'])(
    'recusa "%s"',
    (texto) => {
      expect(lerMoeda(texto)).toBeUndefined()
    },
  )
})

describe('formatarCiclo', () => {
  it.each([
    [1, 'dia', 'diário'],
    [1, 'semana', 'semanal'],
    [1, 'mes', 'mensal'],
    [1, 'ano', 'anual'],
    [3, 'mes', 'a cada 3 meses'],
    [2, 'semana', 'a cada 2 semanas'],
    [15, 'dia', 'a cada 15 dias'],
    [2, 'ano', 'a cada 2 anos'],
  ] as const)('%i %s → "%s"', (quantidade, unidade, texto) => {
    expect(formatarCiclo({ quantidade, unidade })).toBe(texto)
  })
})

describe('hoje', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('usa a data local no formato AAAA-MM-DD', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 0, 5, 23, 30))
    expect(hoje()).toBe('2026-01-05')
  })
})
