import {
  DatabaseBackup,
  LayoutDashboard,
  Repeat,
  Settings,
  Tags,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { AvisosProvider } from './Avisos'
import { focoVisivel } from './estilos'

const links = [
  { to: '/', rotulo: 'Painel', Icone: LayoutDashboard },
  { to: '/assinaturas', rotulo: 'Assinaturas', Icone: Repeat },
  { to: '/categorias', rotulo: 'Categorias', Icone: Tags },
  { to: '/backup', rotulo: 'Backup', Icone: DatabaseBackup },
  { to: '/configuracoes', rotulo: 'Configurações', Icone: Settings },
]

export function Layout() {
  return (
    <AvisosProvider>
      <div className="min-h-screen text-texto">
        <header className="sticky top-0 z-10 border-b border-borda bg-fundo/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
            <span className="flex items-center gap-2 font-titulo text-xl font-bold tracking-tight">
              <svg
                aria-hidden="true"
                viewBox="0 0 32 32"
                className="size-6"
                fill="none"
              >
                <path
                  d="M7 16c3-8 6-8 9 0s6 8 9 0"
                  stroke="var(--acento)"
                  strokeWidth={3.2}
                  strokeLinecap="round"
                />
                <circle cx="16" cy="25" r="2.4" fill="var(--sucesso)" />
              </svg>
              Sub-vibe
            </span>
            <nav aria-label="Principal">
              <ul className="flex flex-wrap gap-1">
                {links.map(({ to, rotulo, Icone }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${focoVisivel} ${
                          isActive
                            ? 'border border-borda-forte bg-vidro-hover text-texto'
                            : 'border border-transparent text-texto-suave hover:bg-vidro hover:text-texto'
                        }`
                      }
                    >
                      <Icone className="size-4" />
                      {rotulo}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </AvisosProvider>
  )
}
