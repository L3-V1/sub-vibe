import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { renderizar } from '../../test/renderizar'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 1, 10, 12))
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.useRealTimers()
})

async function preencher(campo: string, valor: string) {
  const elemento = screen.getByLabelText(campo)
  await userEvent.clear(elemento)
  if (valor !== '') await userEvent.type(elemento, valor)
}

async function preencherBasico() {
  await screen.findByLabelText('Serviço')
  await preencher('Serviço', 'Netflix')
  await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Streaming')
  await preencher('Início', '2026-01-31')
  await preencher('Valor', '39,90')
}

const cadastrar = () =>
  userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

describe('NovaAssinaturaPage', () => {
  it('começa com a data de hoje e Ciclo mensal', async () => {
    renderizar('/assinaturas/nova')
    expect(await screen.findByLabelText('Início')).toHaveValue('2026-02-10')
    expect(screen.getByLabelText('A cada')).toHaveValue(1)
    expect(screen.getByLabelText('Unidade')).toHaveValue('mes')
  })

  it('cadastra e vai para o detalhe com o aviso', async () => {
    const router = renderizar('/assinaturas/nova')
    await preencherBasico()
    await preencher('Observações', 'cartão final 1234')
    await cadastrar()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Netflix' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Assinatura cadastrada.')).toBeInTheDocument()

    const [a] = await db.assinaturas.toArray()
    expect(router.state.location.pathname).toBe(`/assinaturas/${a.id}`)
    expect(a).toMatchObject({
      servico: 'Netflix',
      observacoes: 'cartão final 1234',
      vigencias: [
        {
          inicio: '2026-01-31',
          valorCentavos: 3990,
          ciclo: { quantidade: 1, unidade: 'mes' },
        },
      ],
    })
  })

  it('com Período gratuito gera duas Vigências no mesmo Ciclo', async () => {
    renderizar('/assinaturas/nova')
    await preencherBasico()
    await preencher('A cada', '3')
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Começa com Período gratuito' }),
    )
    await preencher('Primeira Cobrança em', '2026-03-02')
    await cadastrar()

    await screen.findByText('Assinatura cadastrada.')
    const [a] = await db.assinaturas.toArray()
    const ciclo = { quantidade: 3, unidade: 'mes' }
    expect(a.vigencias).toEqual([
      { inicio: '2026-01-31', valorCentavos: 0, ciclo },
      { inicio: '2026-03-02', valorCentavos: 3990, ciclo },
    ])
  })

  it('mostra os erros do formulário em pt-BR sem gravar', async () => {
    renderizar('/assinaturas/nova')
    await screen.findByLabelText('Serviço')
    await preencher('Início', '')
    await preencher('Valor', 'abc')
    await cadastrar()
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Informe a data de início.')
    expect(alerta).toHaveTextContent('Informe o valor em reais, como 39,90.')
    expect(screen.getByLabelText('Início')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Valor')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Serviço')).not.toHaveAttribute('aria-invalid')

    await preencher('Início', '2026-01-31')
    await preencher('Valor', '39,90')
    await cadastrar()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O Serviço não pode ficar vazio.',
    )
    expect(screen.getByLabelText('Serviço')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Valor')).not.toHaveAttribute('aria-invalid')
    expect(await db.assinaturas.count()).toBe(0)
  })

  it('recusa primeira Cobrança ausente ou antes do início', async () => {
    renderizar('/assinaturas/nova')
    await preencherBasico()
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Começa com Período gratuito' }),
    )
    await cadastrar()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Informe a data da primeira Cobrança.',
    )
    expect(screen.getByLabelText('Primeira Cobrança em')).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    await preencher('Primeira Cobrança em', '2026-01-31')
    await cadastrar()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A primeira Cobrança deve ser depois do início.',
    )
    expect(await db.assinaturas.count()).toBe(0)
  })
})
