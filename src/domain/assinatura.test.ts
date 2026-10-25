import { describe, expect, it } from 'vitest'
import { estado, validarAssinatura, vigenciaEm } from './assinatura'
import type { Assinatura, Vigencia } from './tipos'

const mensal = (inicio: string, extras: Partial<Vigencia> = {}): Vigencia => ({
  inicio,
  valorCentavos: 3990,
  ciclo: { quantidade: 1, unidade: 'mes' },
  ...extras,
})

const assinatura = (...vigencias: Vigencia[]): Assinatura => ({
  id: 'a1',
  servico: 'Netflix',
  categoriaId: 'c1',
  vigencias,
})

describe('validarAssinatura', () => {
  it('aceita uma Vigência aberta', () => {
    expect(validarAssinatura(assinatura(mensal('2026-01-10')))).toEqual([])
  })

  it('exige pelo menos uma Vigência', () => {
    expect(validarAssinatura(assinatura())).toEqual([
      'A Assinatura precisa de pelo menos uma Vigência.',
    ])
  })

  it('aceita Reativação: Vigência com fim seguida de outra depois dele', () => {
    const a = assinatura(
      mensal('2026-01-10', { fim: '2026-03-05' }),
      mensal('2026-03-06'),
    )
    expect(validarAssinatura(a)).toEqual([])
  })

  it('aceita cancelamento no dia do início', () => {
    expect(
      validarAssinatura(
        assinatura(mensal('2026-01-10', { fim: '2026-01-10' })),
      ),
    ).toEqual([])
  })

  it('aceita Período gratuito (R$ 0)', () => {
    expect(
      validarAssinatura(assinatura(mensal('2026-01-10', { valorCentavos: 0 }))),
    ).toEqual([])
  })

  it.each([-1, 10.5])('rejeita valor %s', (valorCentavos) => {
    expect(
      validarAssinatura(assinatura(mensal('2026-01-10', { valorCentavos }))),
    ).toEqual([
      'Vigência 1: o valor deve ser maior ou igual a zero, em centavos inteiros.',
    ])
  })

  it.each([0, 1.5])(
    'rejeita Ciclo de cobrança com quantidade %s',
    (quantidade) => {
      const a = assinatura(
        mensal('2026-01-10', { ciclo: { quantidade, unidade: 'mes' } }),
      )
      expect(validarAssinatura(a)).toEqual([
        'Vigência 1: o Ciclo de cobrança deve ser um número inteiro maior ou igual a 1.',
      ])
    },
  )

  it('rejeita cancelamento antes do início', () => {
    expect(
      validarAssinatura(
        assinatura(mensal('2026-01-10', { fim: '2026-01-09' })),
      ),
    ).toEqual([
      'Vigência 1: a Data de cancelamento não pode ser anterior ao início.',
    ])
  })

  it('rejeita inícios fora de ordem ou repetidos', () => {
    expect(
      validarAssinatura(assinatura(mensal('2026-02-10'), mensal('2026-02-10'))),
    ).toEqual([
      'Vigência 2: o início deve ser posterior ao da Vigência anterior.',
    ])
    expect(
      validarAssinatura(assinatura(mensal('2026-02-10'), mensal('2026-01-10'))),
    ).toEqual([
      'Vigência 2: o início deve ser posterior ao da Vigência anterior.',
    ])
  })

  it('rejeita Vigência que começa no dia do cancelamento da anterior', () => {
    const a = assinatura(
      mensal('2026-01-10', { fim: '2026-03-05' }),
      mensal('2026-03-05'),
    )
    expect(validarAssinatura(a)).toEqual([
      'Vigência 2: o início deve ser posterior à Data de cancelamento da Vigência anterior.',
    ])
  })

  it('reúne vários erros', () => {
    const a = assinatura(
      mensal('2026-01-10', { valorCentavos: -1 }),
      mensal('2026-01-01', { fim: '2025-12-31' }),
    )
    expect(validarAssinatura(a)).toHaveLength(3)
  })
})

describe('estado', () => {
  const cancelada = assinatura(mensal('2026-01-10', { fim: '2026-03-05' }))

  it('é Ativa sem Data de cancelamento', () => {
    expect(estado(assinatura(mensal('2026-01-10')), '2030-01-01')).toBe('Ativa')
  })

  it('é Ativa antes da Data de cancelamento (cancelamento com data futura)', () => {
    expect(estado(cancelada, '2026-03-04')).toBe('Ativa')
  })

  it('é Cancelada no dia e depois da Data de cancelamento', () => {
    expect(estado(cancelada, '2026-03-05')).toBe('Cancelada')
    expect(estado(cancelada, '2026-04-01')).toBe('Cancelada')
  })

  it('volta a ser Ativa depois de uma Reativação', () => {
    const a = assinatura(
      mensal('2026-01-10', { fim: '2026-03-05' }),
      mensal('2026-05-01'),
    )
    expect(estado(a, '2026-04-01')).toBe('Ativa')
  })

  it('é Ativa com só uma Vigência futura', () => {
    expect(estado(assinatura(mensal('2027-01-01')), '2026-10-25')).toBe('Ativa')
  })
})

describe('vigenciaEm', () => {
  const primeira = mensal('2026-01-10', { fim: '2026-03-05' })
  const segunda = mensal('2026-05-01', { valorCentavos: 4990 })
  const terceira = mensal('2026-08-15', { valorCentavos: 5990 })
  const a = assinatura(primeira, segunda, terceira)

  it('não há Vigência antes do primeiro início', () => {
    expect(vigenciaEm(a, '2026-01-09')).toBeUndefined()
  })

  it('inclui o início e a Data de cancelamento', () => {
    expect(vigenciaEm(a, '2026-01-10')).toBe(primeira)
    expect(vigenciaEm(a, '2026-03-05')).toBe(primeira)
  })

  it('não há Vigência entre o cancelamento e a Reativação', () => {
    expect(vigenciaEm(a, '2026-03-06')).toBeUndefined()
    expect(vigenciaEm(a, '2026-04-30')).toBeUndefined()
  })

  it('a Vigência sem fim vai até a véspera da próxima', () => {
    expect(vigenciaEm(a, '2026-08-14')).toBe(segunda)
    expect(vigenciaEm(a, '2026-08-15')).toBe(terceira)
    expect(vigenciaEm(a, '2030-01-01')).toBe(terceira)
  })
})
