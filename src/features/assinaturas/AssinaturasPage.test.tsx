import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { gravarAssinatura, mensal } from '../../test/dados'
import { renderizar } from '../../test/renderizar'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 1, 10, 12))
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Textos das células de cada linha do corpo da tabela (U+00A0 do Intl vira espaço). */
async function linhas() {
  const tabela = await screen.findByRole('table')
  return within(tabela)
    .getAllByRole('row')
    .slice(1)
    .map((tr) =>
      within(tr)
        .getAllByRole('cell')
        .map((td) => td.textContent?.replaceAll(' ', ' ')),
    )
}

describe('AssinaturasPage', () => {
  it('sem Assinaturas, convida a cadastrar a primeira', async () => {
    renderizar('/assinaturas')
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

  describe('com Assinaturas', () => {
    beforeEach(async () => {
      await gravarAssinatura('Netflix', 'Streaming', mensal('2026-01-31'))
      await gravarAssinatura(
        'ChatGPT',
        'I.A.',
        mensal('2025-06-01', {
          valorCentavos: 120000,
          ciclo: { quantidade: 1, unidade: 'ano' },
        }),
      )
      await gravarAssinatura(
        'Curso X',
        'Cursos',
        mensal('2025-10-01', { fim: '2026-02-01' }),
      )
    })

    it('mostra só as Ativas por padrão, com Próximo vencimento e Custo mensal equivalente', async () => {
      renderizar('/assinaturas')
      expect(await linhas()).toEqual([
        ['ChatGPT', 'I.A.', 'Ativa', '01/06/2026', 'R$ 100,00'],
        ['Netflix', 'Streaming', 'Ativa', '28/02/2026', 'R$ 39,90'],
      ])
    })

    it('filtra por Estado e por Categoria', async () => {
      renderizar('/assinaturas')
      await screen.findByRole('table')
      await userEvent.selectOptions(
        screen.getByLabelText('Estado'),
        'Canceladas',
      )
      expect(await linhas()).toEqual([
        ['Curso X', 'Cursos', 'Cancelada', 'Nenhum', 'R$ 0,00'],
      ])

      await userEvent.selectOptions(screen.getByLabelText('Estado'), 'Todas')
      expect(await linhas()).toHaveLength(3)

      await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'I.A.')
      expect((await linhas()).map((l) => l[0])).toEqual(['ChatGPT'])

      await userEvent.selectOptions(
        screen.getByLabelText('Estado'),
        'Canceladas',
      )
      expect(
        screen.getByText('Nenhuma Assinatura com esses filtros.'),
      ).toBeInTheDocument()
    })

    it('o Serviço leva ao detalhe', async () => {
      renderizar('/assinaturas')
      await userEvent.click(
        await screen.findByRole('link', { name: 'Netflix' }),
      )
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Netflix' }),
      ).toBeInTheDocument()
    })
  })
})
