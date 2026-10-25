import type { EstadoAssinatura } from '../../domain/tipos'

export function EtiquetaEstado({ estado }: { estado: EstadoAssinatura }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
        estado === 'Ativa'
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-slate-200 text-slate-700'
      }`}
    >
      {estado}
    </span>
  )
}
