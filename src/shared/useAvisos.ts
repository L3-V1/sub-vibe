import { createContext, useContext } from 'react'

export const ContextoAvisos = createContext<(texto: string) => void>(() => {})

/** Devolve `avisar(texto)`, que mostra um aviso de sucesso (ver `AvisosProvider`). */
export function useAvisos() {
  return useContext(ContextoAvisos)
}
