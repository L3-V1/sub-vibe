import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AvisosProvider } from './Avisos'
import { useAvisos } from './useAvisos'

function Botao() {
  const avisar = useAvisos()
  return (
    <button type="button" onClick={() => avisar('Assinatura cadastrada.')}>
      Avisar
    </button>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('AvisosProvider', () => {
  it('mostra o aviso em role="status" e o remove depois de alguns segundos', () => {
    vi.useFakeTimers()
    render(
      <AvisosProvider>
        <Botao />
      </AvisosProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avisar' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Assinatura cadastrada.',
    )

    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
