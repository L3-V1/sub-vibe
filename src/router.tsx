import { createBrowserRouter, type RouteObject } from 'react-router'
import { AssinaturasPage } from './features/assinaturas/AssinaturasPage'
import { CategoriasPage } from './features/categorias/CategoriasPage'
import { ConfiguracoesPage } from './features/configuracoes/ConfiguracoesPage'
import { PainelPage } from './features/painel/PainelPage'
import { Layout } from './shared/Layout'
import { NaoEncontradaPage } from './shared/NaoEncontradaPage'

export const rotas: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <PainelPage /> },
      { path: 'assinaturas', element: <AssinaturasPage /> },
      { path: 'categorias', element: <CategoriasPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
      { path: '*', element: <NaoEncontradaPage /> },
    ],
  },
]

export const router = createBrowserRouter(rotas)
