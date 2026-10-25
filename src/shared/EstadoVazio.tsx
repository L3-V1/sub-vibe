import type { ReactNode } from 'react'

const icones = {
  assinaturas: '📭',
  calendario: '🗓️',
  grafico: '📉',
  categorias: '🏷️',
  filtro: '🔍',
}

/** Mensagem centralizada com um emoji do assunto acima. */
export function EstadoVazio({
  icone,
  children,
}: {
  icone: keyof typeof icones
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center text-texto-suave">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-2xl border border-borda bg-vidro text-2xl"
      >
        {icones[icone]}
      </span>
      {children}
    </div>
  )
}
