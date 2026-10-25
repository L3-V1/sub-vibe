import type { EstadoAssinatura } from '../../domain/tipos'
import { marcador } from '../../shared/estilos'

export function EtiquetaEstado({ estado }: { estado: EstadoAssinatura }) {
  return (
    <span
      className={`${marcador} ${
        estado === 'Ativa'
          ? 'bg-sucesso-fundo text-sucesso'
          : 'bg-vidro-hover text-texto-suave'
      }`}
    >
      {estado}
    </span>
  )
}
