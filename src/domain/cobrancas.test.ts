import { describe, expect, it } from 'vitest'
import { cobrancasNoIntervalo, proximoVencimento } from './cobrancas'
import type { Assinatura, UnidadeCiclo, Vigencia } from './tipos'

const vig = (
  inicio: string,
  valorCentavos: number,
  unidade: UnidadeCiclo = 'mes',
  quantidade = 1,
  fim?: string,
): Vigencia => ({ inicio, valorCentavos, ciclo: { quantidade, unidade }, fim })

const assinatura = (...vigencias: Vigencia[]): Assinatura => ({
  id: 'a1',
  servico: 'Netflix',
  categoriaId: 'c1',
  vigencias,
})

const datas = (a: Assinatura, de: string, ate: string) =>
  cobrancasNoIntervalo(a, de, ate).map((c) => c.data)

describe('cobrancasNoIntervalo', () => {
  it('a primeira Cobrança cai no início e carrega id e valor', () => {
    const a = assinatura(vig('2026-01-10', 3990))
    expect(cobrancasNoIntervalo(a, '2026-01-01', '2026-02-10')).toEqual([
      { assinaturaId: 'a1', data: '2026-01-10', valorCentavos: 3990 },
      { assinaturaId: 'a1', data: '2026-02-10', valorCentavos: 3990 },
    ])
  })

  it('31/01 mensal cai no último dia de fevereiro e volta ao dia 31', () => {
    const a = assinatura(vig('2026-01-31', 3990))
    expect(datas(a, '2026-01-01', '2026-05-31')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
    ])
  })

  it('31/01 mensal em ano bissexto cai em 29/02', () => {
    const a = assinatura(vig('2024-01-31', 3990))
    expect(datas(a, '2024-02-01', '2024-03-31')).toEqual([
      '2024-02-29',
      '2024-03-31',
    ])
  })

  it('29/02 anual cai em 28/02 e volta a 29/02 no próximo bissexto', () => {
    const a = assinatura(vig('2024-02-29', 19900, 'ano'))
    expect(datas(a, '2024-01-01', '2028-12-31')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ])
  })

  it('troca de ciclo no meio do mês: a Vigência antiga para na véspera e a nova cobra no início', () => {
    const a = assinatura(
      vig('2026-01-10', 3990),
      vig('2026-03-10', 39900, 'ano'),
    )
    expect(cobrancasNoIntervalo(a, '2026-01-01', '2027-03-10')).toEqual([
      { assinaturaId: 'a1', data: '2026-01-10', valorCentavos: 3990 },
      { assinaturaId: 'a1', data: '2026-02-10', valorCentavos: 3990 },
      { assinaturaId: 'a1', data: '2026-03-10', valorCentavos: 39900 },
      { assinaturaId: 'a1', data: '2027-03-10', valorCentavos: 39900 },
    ])
  })

  it('a nova Vigência no meio do ciclo corta a Cobrança seguinte da antiga', () => {
    const a = assinatura(vig('2026-01-10', 3990), vig('2026-03-25', 4990))
    expect(cobrancasNoIntervalo(a, '2026-03-01', '2026-04-30')).toEqual([
      { assinaturaId: 'a1', data: '2026-03-10', valorCentavos: 3990 },
      { assinaturaId: 'a1', data: '2026-03-25', valorCentavos: 4990 },
      { assinaturaId: 'a1', data: '2026-04-25', valorCentavos: 4990 },
    ])
  })

  it('Vigência futura só cobra a partir do início', () => {
    const a = assinatura(vig('2027-01-05', 3990))
    expect(datas(a, '2026-10-01', '2027-02-28')).toEqual([
      '2027-01-05',
      '2027-02-05',
    ])
  })

  it('Período gratuito não gera Cobranças; a Vigência paga seguinte sim', () => {
    const a = assinatura(vig('2026-01-01', 0), vig('2026-01-31', 2990))
    expect(datas(a, '2026-01-01', '2026-03-31')).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ])
  })

  it('cancelar e reativar: nada no intervalo cancelado, e a Reativação recomeça a contagem', () => {
    const a = assinatura(
      vig('2026-01-10', 3990, 'mes', 1, '2026-03-05'),
      vig('2026-05-20', 3990),
    )
    expect(datas(a, '2026-01-01', '2026-06-30')).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-05-20',
      '2026-06-20',
    ])
  })

  it('conta a Cobrança exatamente no dia do cancelamento', () => {
    const a = assinatura(vig('2026-01-10', 3990, 'mes', 1, '2026-03-10'))
    expect(datas(a, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-03-10',
    ])
  })

  it('a cada 3 meses', () => {
    const a = assinatura(vig('2026-01-31', 9990, 'mes', 3))
    expect(datas(a, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-31',
      '2026-04-30',
      '2026-07-31',
      '2026-10-31',
    ])
  })

  it('a cada 2 semanas', () => {
    const a = assinatura(vig('2026-10-01', 1000, 'semana', 2))
    expect(datas(a, '2026-10-01', '2026-11-12')).toEqual([
      '2026-10-01',
      '2026-10-15',
      '2026-10-29',
      '2026-11-12',
    ])
  })

  it('ciclo diário atravessa a virada do mês', () => {
    const a = assinatura(vig('2026-02-27', 100, 'dia'))
    expect(datas(a, '2026-02-01', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
  })

  it('intervalo que corta uma Vigência pela metade, com as pontas inclusive', () => {
    const a = assinatura(vig('2026-01-10', 3990))
    expect(datas(a, '2026-04-10', '2026-06-10')).toEqual([
      '2026-04-10',
      '2026-05-10',
      '2026-06-10',
    ])
    expect(datas(a, '2026-04-11', '2026-06-09')).toEqual(['2026-05-10'])
  })

  it('intervalo antes do início ou depois do cancelamento fica vazio', () => {
    const a = assinatura(vig('2026-01-10', 3990, 'mes', 1, '2026-03-05'))
    expect(datas(a, '2025-01-01', '2026-01-09')).toEqual([])
    expect(datas(a, '2026-03-06', '2027-01-01')).toEqual([])
  })
})

describe('proximoVencimento', () => {
  it('é a próxima Cobrança da Vigência vigente', () => {
    const a = assinatura(vig('2026-01-10', 3990))
    expect(proximoVencimento(a, '2026-10-25')).toBe('2026-11-10')
  })

  it('inclui uma Cobrança no próprio dia', () => {
    const a = assinatura(vig('2026-01-10', 3990))
    expect(proximoVencimento(a, '2026-10-10')).toBe('2026-10-10')
  })

  it('respeita o último dia do mês', () => {
    const a = assinatura(vig('2026-01-31', 3990))
    expect(proximoVencimento(a, '2026-02-01')).toBe('2026-02-28')
  })

  it('é o início de uma Vigência futura', () => {
    const a = assinatura(vig('2027-01-05', 3990))
    expect(proximoVencimento(a, '2026-10-25')).toBe('2027-01-05')
  })

  it('pula o Período gratuito e aponta para a primeira Cobrança paga', () => {
    const a = assinatura(vig('2026-10-01', 0), vig('2026-10-31', 2990))
    expect(proximoVencimento(a, '2026-10-25')).toBe('2026-10-31')
  })

  it('é a nova Vigência quando ela começa antes do próximo ciclo da antiga', () => {
    const a = assinatura(
      vig('2026-01-10', 3990),
      vig('2026-11-01', 39900, 'ano'),
    )
    expect(proximoVencimento(a, '2026-10-25')).toBe('2026-11-01')
  })

  it('não existe para Assinatura Cancelada', () => {
    const a = assinatura(vig('2026-01-10', 3990, 'mes', 1, '2026-03-05'))
    expect(proximoVencimento(a, '2026-10-25')).toBeUndefined()
  })

  it('não existe se a Data de cancelamento vem antes da próxima Cobrança', () => {
    const a = assinatura(vig('2026-01-10', 3990, 'mes', 1, '2026-11-01'))
    expect(proximoVencimento(a, '2026-10-25')).toBeUndefined()
  })

  it('é a Reativação agendada de uma Assinatura Cancelada', () => {
    const a = assinatura(
      vig('2026-01-10', 3990, 'mes', 1, '2026-03-05'),
      vig('2026-12-01', 3990),
    )
    expect(proximoVencimento(a, '2026-10-25')).toBe('2026-12-01')
  })

  it('não existe para Período gratuito sem Vigência paga', () => {
    expect(
      proximoVencimento(assinatura(vig('2026-10-01', 0)), '2026-10-25'),
    ).toBeUndefined()
  })
})
