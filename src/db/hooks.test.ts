import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { assinaturasRepo } from './assinaturasRepo'
import { categoriasRepo } from './categoriasRepo'
import { db } from './db'
import {
  useAssinatura,
  useAssinaturas,
  useCategorias,
  usePreferencias,
} from './hooks'
import { preferenciasRepo } from './preferenciasRepo'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('hooks reativos', () => {
  it('useCategorias reflete uma gravação feita depois da montagem', async () => {
    const { result } = renderHook(() => useCategorias())
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toHaveLength(5))

    await act(() => categoriasRepo.criar('Jogos'))
    await waitFor(() => expect(result.current).toHaveLength(6))
  })

  it('useAssinaturas e useAssinatura acompanham a criação', async () => {
    const lista = renderHook(() => useAssinaturas())
    const uma = renderHook(({ id }) => useAssinatura(id), {
      initialProps: { id: 'nao-existe' },
    })
    await waitFor(() => expect(lista.result.current).toEqual([]))
    await waitFor(() => expect(uma.result.current).toBeNull())

    const categoriaId = (await db.categorias.toCollection().first())!.id
    const id = await act(() =>
      assinaturasRepo.criar({
        servico: 'Netflix',
        categoriaId,
        vigencias: [
          {
            inicio: '2026-01-10',
            valorCentavos: 3990,
            ciclo: { quantidade: 1, unidade: 'mes' },
          },
        ],
      }),
    )
    await waitFor(() => expect(lista.result.current).toHaveLength(1))

    uma.rerender({ id })
    await waitFor(() => expect(uma.result.current?.servico).toBe('Netflix'))
  })

  it('usePreferencias reflete a atualização', async () => {
    const { result } = renderHook(() => usePreferencias())
    await waitFor(() => expect(result.current?.janelaVencimentosDias).toBe(7))

    await act(() => preferenciasRepo.atualizar({ janelaVencimentosDias: 30 }))
    await waitFor(() => expect(result.current?.janelaVencimentosDias).toBe(30))
  })
})
