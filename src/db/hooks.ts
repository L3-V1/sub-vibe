import { useLiveQuery } from 'dexie-react-hooks'
import { assinaturasRepo } from './assinaturasRepo'
import { categoriasRepo } from './categoriasRepo'
import { preferenciasRepo } from './preferenciasRepo'

// Todos devolvem `undefined` enquanto carregam e se atualizam a cada gravação.

export function useCategorias() {
  return useLiveQuery(() => categoriasRepo.listar())
}

export function useAssinaturas() {
  return useLiveQuery(() => assinaturasRepo.listar())
}

/** `null` quando a Assinatura não existe (para distinguir de "carregando"). */
export function useAssinatura(id: string) {
  return useLiveQuery(
    async () => (await assinaturasRepo.obter(id)) ?? null,
    [id],
  )
}

export function usePreferencias() {
  return useLiveQuery(() => preferenciasRepo.obter())
}
