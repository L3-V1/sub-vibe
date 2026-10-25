import { describe, expect, it } from 'vitest'
import { intervaloDoPeriodo, proximasCobrancas } from './painel'
import type { Assinatura, UnidadeCiclo, Vigencia } from './tipos'

const vig = (
  inicio: string,
  valorCentavos: number,
  unidade: UnidadeCiclo = 'mes',
  fim?: string,
): Vigencia => ({
  inicio,
  valorCentavos,
  ciclo: { quantidade: 1, unidade },
  fim,
})

const assinatura = (id: string, ...vigencias: Vigencia[]): Assinatura => ({
  id,
  servico: id,
  categoriaId: 'c1',
  vigencias,
})

const HOJE = '2026-10-25'

describe('intervaloDoPeriodo', () => {
  it('ano corrente: de 01/01 até hoje', () => {
    expect(intervaloDoPeriodo('anoCorrente', [], HOJE)).toEqual({
      de: '2026-01-01',
      ate: HOJE,
    })
  })

  it('últimos 12 meses: de hoje − 12 meses + 1 dia até hoje', () => {
    expect(intervaloDoPeriodo('ultimos12Meses', [], HOJE)).toEqual({
      de: '2025-10-26',
      ate: HOJE,
    })
    // 29/02 − 12 meses = 28/02 do ano anterior, + 1 dia = 01/03
    expect(intervaloDoPeriodo('ultimos12Meses', [], '2028-02-29')).toEqual({
      de: '2027-03-01',
      ate: '2028-02-29',
    })
    // de 01/03 do ano bissexto volta a 02/03 do ano anterior
    expect(intervaloDoPeriodo('ultimos12Meses', [], '2028-03-01').de).toBe(
      '2027-03-02',
    )
  })

  it('desde o início: do menor início de todas as Vigências até hoje', () => {
    const assinaturas = [
      assinatura('a1', vig('2025-03-10', 3990)),
      assinatura(
        'a2',
        vig('2024-07-01', 2000, 'mes', '2024-12-01'),
        vig('2026-01-01', 2000),
      ),
      assinatura('a3', vig('2027-01-01', 9990)),
    ]
    expect(intervaloDoPeriodo('desdeOInicio', assinaturas, HOJE)).toEqual({
      de: '2024-07-01',
      ate: HOJE,
    })
  })

  it('desde o início sem Assinaturas: só hoje', () => {
    expect(intervaloDoPeriodo('desdeOInicio', [], HOJE)).toEqual({
      de: HOJE,
      ate: HOJE,
    })
  })
})

describe('proximasCobrancas', () => {
  it('junta as Cobranças de todas as Assinaturas em ordem de data, com limites inclusivos', () => {
    const assinaturas = [
      assinatura('a1', vig('2026-01-01', 3990)), // 01/11
      assinatura('a2', vig('2026-09-25', 2000)), // 25/10 (hoje)
      assinatura('a3', vig('2026-08-28', 1500)), // 28/10
      assinatura('a4', vig('2026-05-02', 1000)), // 02/11 (hoje + 8, fora)
    ]
    expect(proximasCobrancas(assinaturas, HOJE, 7)).toEqual([
      { assinaturaId: 'a2', data: '2026-10-25', valorCentavos: 2000 },
      { assinaturaId: 'a3', data: '2026-10-28', valorCentavos: 1500 },
      { assinaturaId: 'a1', data: '2026-11-01', valorCentavos: 3990 },
    ])
    expect(
      proximasCobrancas(assinaturas, HOJE, 8).map((c) => c.assinaturaId),
    ).toEqual(['a2', 'a3', 'a1', 'a4'])
  })

  it('várias Cobranças da mesma Assinatura na janela', () => {
    const semanal = assinatura('a1', vig('2026-10-20', 500, 'semana'))
    expect(proximasCobrancas([semanal], HOJE, 14).map((c) => c.data)).toEqual([
      '2026-10-27',
      '2026-11-03',
    ])
  })

  it('inclui Vigência futura e ignora Período gratuito e Assinatura Cancelada', () => {
    const assinaturas = [
      assinatura('futura', vig('2026-10-30', 3990)),
      assinatura('gratuito', vig('2026-10-01', 0), vig('2026-11-01', 2990)),
      assinatura('cancelada', vig('2026-01-27', 1990, 'mes', '2026-10-20')),
    ]
    expect(proximasCobrancas(assinaturas, HOJE, 7)).toEqual([
      { assinaturaId: 'futura', data: '2026-10-30', valorCentavos: 3990 },
      { assinaturaId: 'gratuito', data: '2026-11-01', valorCentavos: 2990 },
    ])
  })

  it('vazio sem Assinaturas', () => {
    expect(proximasCobrancas([], HOJE, 7)).toEqual([])
  })
})
