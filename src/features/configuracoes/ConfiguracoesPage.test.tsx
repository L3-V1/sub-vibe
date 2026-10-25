import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/db'
import { preferenciasRepo } from '../../db/preferenciasRepo'
import { gravarAssinatura, mensal } from '../../test/dados'
import { renderizar } from '../../test/renderizar'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const MSG_JANELA =
  'A janela de vencimentos deve ser um número inteiro de dias, maior ou igual a 1.'

async function salvarJanela(valor: string) {
  const campo = await screen.findByLabelText('Janela de vencimentos (dias)')
  await userEvent.clear(campo)
  await userEvent.type(campo, valor)
  await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

describe('ConfiguracoesPage', () => {
  it('carrega a janela padrão de 7 dias', async () => {
    renderizar('/configuracoes')
    expect(
      await screen.findByLabelText('Janela de vencimentos (dias)'),
    ).toHaveValue(7)
  })

  it('salva a janela e mostra o aviso', async () => {
    renderizar('/configuracoes')
    await salvarJanela('30')
    expect(await screen.findByText('Preferências salvas.')).toBeInTheDocument()
    expect((await preferenciasRepo.obter()).janelaVencimentosDias).toBe(30)
  })

  it.each(['0', 'abc'])(
    'recusa "%s" com a mensagem em pt-BR',
    async (valor) => {
      renderizar('/configuracoes')
      await salvarJanela(valor)
      expect(await screen.findByRole('alert')).toHaveTextContent(MSG_JANELA)
      expect((await preferenciasRepo.obter()).janelaVencimentosDias).toBe(7)
    },
  )

  it('o Painel passa a usar a janela salva', async () => {
    await gravarAssinatura('Netflix', 'Streaming', mensal('2026-01-01'))
    const router = renderizar('/configuracoes')
    await salvarJanela('30')
    await screen.findByText('Preferências salvas.')
    await router.navigate('/')
    expect(await screen.findByText('Próximos 30 dias')).toBeInTheDocument()
  })
})
