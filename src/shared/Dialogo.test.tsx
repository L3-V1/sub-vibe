import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErroValidacao } from '../db/esquemas'
import { Dialogo } from './Dialogo'

function renderizar(onConfirmar: (dados: FormData) => Promise<void>) {
  const onFechar = vi.fn()
  render(
    <Dialogo
      titulo="Cancelar Assinatura"
      rotuloConfirmar="Confirmar"
      onConfirmar={onConfirmar}
      onFechar={onFechar}
    >
      <label>
        Data <input name="data" defaultValue="2026-01-10" />
      </label>
    </Dialogo>,
  )
  return onFechar
}

describe('Dialogo', () => {
  it('abre ao montar, nomeado pelo título', () => {
    renderizar(async () => {})
    expect(
      screen.getByRole('dialog', { name: 'Cancelar Assinatura' }),
    ).toHaveAttribute('open')
  })

  it('"Voltar" chama onFechar', async () => {
    const onFechar = renderizar(async () => {})
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(onFechar).toHaveBeenCalled()
  })

  it('entrega os dados do formulário ao confirmar', async () => {
    const onConfirmar = vi.fn<(dados: FormData) => Promise<void>>(
      async () => {},
    )
    renderizar(onConfirmar)
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirmar.mock.calls[0][0].get('data')).toBe('2026-01-10')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra as mensagens de ErroValidacao sem fechar', async () => {
    const onFechar = renderizar(async () => {
      throw new ErroValidacao(['Informe a data.', 'Outra mensagem.'])
    })
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Informe a data.')
    expect(alerta).toHaveTextContent('Outra mensagem.')
    expect(onFechar).not.toHaveBeenCalled()
  })
})
