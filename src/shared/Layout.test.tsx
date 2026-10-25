import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { rotas } from '../router'

function renderizar(caminho = '/') {
  const router = createMemoryRouter(rotas, { initialEntries: [caminho] })
  render(<RouterProvider router={router} />)
}

describe('Layout', () => {
  it('mostra os cinco links de navegação', () => {
    renderizar()
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    for (const rotulo of [
      'Painel',
      'Assinaturas',
      'Categorias',
      'Backup',
      'Configurações',
    ]) {
      expect(
        within(nav).getByRole('link', { name: rotulo }),
      ).toBeInTheDocument()
    }
  })

  it('navega para Assinaturas e destaca o link ativo', async () => {
    renderizar()
    const link = screen.getByRole('link', { name: 'Assinaturas' })
    await userEvent.click(link)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Assinaturas' }),
    ).toBeInTheDocument()
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('mostra "Página não encontrada" em rota desconhecida', () => {
    renderizar('/nao-existe')
    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument()
  })
})
