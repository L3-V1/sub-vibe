import { NavLink, Outlet } from 'react-router'

const links = [
  { to: '/', rotulo: 'Painel' },
  { to: '/assinaturas', rotulo: 'Assinaturas' },
  { to: '/categorias', rotulo: 'Categorias' },
  { to: '/configuracoes', rotulo: 'Configurações' },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
          <span className="text-lg font-bold text-indigo-700">Sub-vibe</span>
          <nav aria-label="Principal">
            <ul className="flex flex-wrap gap-1">
              {links.map(({ to, rotulo }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-1.5 text-sm font-medium ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    {rotulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
