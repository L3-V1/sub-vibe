import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { preferenciasRepo } from '../../db/preferenciasRepo'
import { custoMensalEquivalente, gastoAcumulado } from '../../domain/custos'
import { intervaloDoPeriodo } from '../../domain/painel'
import { formatarMoeda } from '../../shared/formatacao'
import { gravarAssinatura, mensal } from '../../test/dados'
import { renderizar } from '../../test/renderizar'

const HOJE = '2026-10-25'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 25, 12))
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Texto sem o U+00A0 que o Intl põe depois de "R$". */
const texto = (el: Element) => el.textContent?.replaceAll(' ', ' ')

/** `formatarMoeda` com espaço comum, para comparar com `texto`. */
const reais = (centavos: number) => formatarMoeda(centavos).replaceAll(' ', ' ')

const secao = (nome: string) => screen.findByRole('region', { name: nome })

/** Linhas da lista de Próximos vencimentos: [data, Serviço, valor]. */
async function vencimentos() {
  const itens = within(await secao('Próximos vencimentos')).getAllByRole(
    'listitem',
  )
  return itens.map((li) => [...li.children].map(texto))
}

/** Linhas da tabela de Gasto por Categoria, incluindo a de Total. */
async function tabelaPorCategoria() {
  const tabela = within(await secao('Gasto por Categoria')).getByRole('table')
  return within(tabela)
    .getAllByRole('row')
    .slice(1)
    .map((tr) => within(tr).getAllByRole('cell').map(texto))
}

describe('PainelPage', () => {
  it('sem Assinaturas, convida a cadastrar a primeira', async () => {
    renderizar('/')
    expect(
      await screen.findByText('Nenhuma Assinatura cadastrada.'),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('link', { name: 'Cadastrar a primeira Assinatura' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Nova Assinatura' }),
    ).toBeInTheDocument()
  })

  describe('com um conjunto de dados fixo', () => {
    beforeEach(async () => {
      // Mensal com dia 31: Cobranças em 31/01, 28/02, 31/03, …, 30/09; a próxima é 31/10.
      await gravarAssinatura('Netflix', 'Streaming', mensal('2026-01-31'))
      // Anual: 01/06/2025 e 01/06/2026.
      await gravarAssinatura(
        'ChatGPT',
        'I.A.',
        mensal('2025-06-01', {
          valorCentavos: 120000,
          ciclo: { quantidade: 1, unidade: 'ano' },
        }),
      )
      // Cancelada: 01/10/2025 a 01/02/2026, 5 Cobranças.
      await gravarAssinatura(
        'Curso X',
        'Cursos',
        mensal('2025-10-01', { fim: '2026-02-01' }),
      )
      // Período gratuito em outubro; a primeira Cobrança é 01/11.
      await gravarAssinatura(
        'Spotify',
        'Streaming',
        mensal('2026-10-01', { valorCentavos: 0 }),
        mensal('2026-11-01', { valorCentavos: 2190 }),
      )
      // Vigência futura.
      await gravarAssinatura(
        'Claude',
        'I.A.',
        mensal('2026-11-20', { valorCentavos: 11000 }),
      )
    })

    it('Total mensal equivalente soma só o que é cobrado hoje', async () => {
      renderizar('/')
      const total = await secao('Total mensal equivalente')
      // Netflix 39,90 + ChatGPT 1.200,00 / 12; Cancelada, gratuita e futura somam 0.
      expect(texto(total)).toContain('R$ 139,90')
      const assinaturas = await db.assinaturas.toArray()
      expect(texto(total)).toContain(
        reais(
          assinaturas.reduce((t, a) => t + custoMensalEquivalente(a, HOJE), 0),
        ),
      )
      expect(total).toHaveTextContent('4 Assinatura(s) Ativa(s)')
    })

    it('Próximos vencimentos usa a janela padrão de 7 dias', async () => {
      renderizar('/')
      expect(await secao('Próximos vencimentos')).toHaveTextContent(
        'Próximos 7 dias',
      )
      expect(await vencimentos()).toEqual([
        ['31/10/2026', 'Netflix', 'R$ 39,90'],
        ['01/11/2026', 'Spotify', 'R$ 21,90'],
      ])
    })

    it('o Serviço em Próximos vencimentos leva ao detalhe', async () => {
      renderizar('/')
      await userEvent.click(
        within(await secao('Próximos vencimentos')).getByRole('link', {
          name: 'Spotify',
        }),
      )
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Spotify' }),
      ).toBeInTheDocument()
    })

    it('a janela vem das preferências', async () => {
      await preferenciasRepo.atualizar({ janelaVencimentosDias: 30 })
      renderizar('/')
      expect(await secao('Próximos vencimentos')).toHaveTextContent(
        'Próximos 30 dias',
      )
      expect(await vencimentos()).toEqual([
        ['31/10/2026', 'Netflix', 'R$ 39,90'],
        ['01/11/2026', 'Spotify', 'R$ 21,90'],
        ['20/11/2026', 'Claude', 'R$ 110,00'],
      ])
    })

    it('Gasto acumulado e Gasto por Categoria no ano corrente', async () => {
      renderizar('/')
      const gasto = await secao('Gasto acumulado')
      // Netflix 9 × 39,90 + ChatGPT 1.200,00 + Curso X 2 × 39,90
      expect(texto(gasto)).toContain('R$ 1.638,90')
      expect(gasto).toHaveTextContent('De 01/01/2026 a 25/10/2026')
      expect(await tabelaPorCategoria()).toEqual([
        ['I.A.', 'R$ 1.200,00', '73,2%'],
        ['Streaming', 'R$ 359,10', '21,9%'],
        ['Cursos', 'R$ 79,80', '4,9%'],
        ['Total', 'R$ 1.638,90', '100%'],
      ])
    })

    it.each([
      ['Últimos 12 meses', 'ultimos12Meses', 'R$ 1.718,70'],
      ['Desde o início', 'desdeOInicio', 'R$ 2.958,60'],
    ] as const)(
      'o seletor de período "%s" vale para as duas seções',
      async (rotulo, periodo, esperado) => {
        renderizar('/')
        await userEvent.selectOptions(
          await screen.findByLabelText('Período'),
          rotulo,
        )
        const assinaturas = await db.assinaturas.toArray()
        const { de, ate } = intervaloDoPeriodo(periodo, assinaturas, HOJE)
        // A tela bate com o cálculo do domínio e com o valor feito à mão.
        expect(texto(await secao('Gasto acumulado'))).toContain(
          reais(gastoAcumulado(assinaturas, de, ate)),
        )
        expect(texto(await secao('Gasto acumulado'))).toContain(esperado)
        expect((await tabelaPorCategoria()).at(-1)).toEqual([
          'Total',
          esperado,
          '100%',
        ])
      },
    )
  })

  it('mostra os estados vazios de cada seção', async () => {
    await gravarAssinatura('Curso Y', 'Cursos', mensal('2027-01-01'))
    renderizar('/')
    expect(
      await screen.findByText('Nenhum vencimento nos próximos 7 dias.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nenhum gasto nesse período.')).toBeInTheDocument()
  })
})
