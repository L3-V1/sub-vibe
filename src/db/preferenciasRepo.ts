import { db, PREFERENCIAS_PADRAO, type Preferencias } from './db'
import { esquemaPreferencias, validar } from './esquemas'

export const preferenciasRepo = {
  /** Aplica o padrão enquanto o registro não existe. */
  async obter(): Promise<Preferencias> {
    return (
      (await db.preferencias.get(PREFERENCIAS_PADRAO.id)) ?? PREFERENCIAS_PADRAO
    )
  },

  async atualizar(parcial: Partial<Omit<Preferencias, 'id'>>): Promise<void> {
    await db.transaction('rw', db.preferencias, async () => {
      const preferencias = validar(esquemaPreferencias, {
        ...(await preferenciasRepo.obter()),
        ...parcial,
      })
      await db.preferencias.put(preferencias)
    })
  },
}
