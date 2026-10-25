import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { rotas } from '../router'

/** Renderiza o app inteiro (com o Layout) a partir do caminho. */
export function renderizar(caminho: string) {
  const router = createMemoryRouter(rotas, { initialEntries: [caminho] })
  render(<RouterProvider router={router} />)
  return router
}
