import { useCallback, useState, type ReactNode } from 'react'
import { ContextoAvisos } from './useAvisos'

const DURACAO_MS = 4000

/** Mostra avisos de sucesso que somem sozinhos e sobrevivem à navegação. */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<{ id: number; texto: string }[]>([])

  const avisar = useCallback((texto: string) => {
    const id = Date.now() + Math.random()
    setAvisos((atuais) => [...atuais, { id, texto }])
    setTimeout(() => {
      setAvisos((atuais) => atuais.filter((a) => a.id !== id))
    }, DURACAO_MS)
  }, [])

  return (
    <ContextoAvisos value={avisar}>
      {children}
      <div
        role="status"
        className="fixed right-4 bottom-4 left-4 flex flex-col items-end gap-2 sm:left-auto"
      >
        {avisos.map((a) => (
          <p
            key={a.id}
            className="flex items-center gap-2 rounded-full border border-sucesso/30 bg-aviso px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/30 backdrop-blur-xl"
          >
            <span aria-hidden="true">✅</span>
            <span>{a.texto}</span>
          </p>
        ))}
      </div>
    </ContextoAvisos>
  )
}
