import { createBrowserRouter, type RouteObject } from 'react-router'
import { AssinaturaPage } from './features/assinaturas/AssinaturaPage'
import { AssinaturasPage } from './features/assinaturas/AssinaturasPage'
import { NovaAssinaturaPage } from './features/assinaturas/NovaAssinaturaPage'
import { BackupPage } from './features/backup/BackupPage'
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
      { path: 'assinaturas/nova', element: <NovaAssinaturaPage /> },
      { path: 'assinaturas/:id', element: <AssinaturaPage /> },
      { path: 'categorias', element: <CategoriasPage /> },
      { path: 'backup', element: <BackupPage /> },
      { path: 'configuracoes', element: <ConfiguracoesPage /> },
      { path: '*', element: <NaoEncontradaPage /> },
    ],
  },
]

export const router = createBrowserRouter(rotas)
