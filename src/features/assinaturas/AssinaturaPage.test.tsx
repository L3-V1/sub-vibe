import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { gravarAssinatura, mensal } from '../../test/dados'
import { renderizar } from '../../test/renderizar'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 1, 10, 12)) // hoje: 10/02/2026
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Texto do elemento, com o U+00A0 do Intl trocado por espaço. */
const texto = (el: HTMLElement) => (el.textContent ?? '').replaceAll(' ', ' ')

/** Data e valor de cada próxima Cobrança. */
async function proximas() {
  const secao = await screen.findByRole('region', {
    name: 'Próximas Cobranças',
  })
  return within(secao).queryAllByRole('listitem').map(texto)
}

/** Texto de cada Vigência da linha do tempo. */
function vigencias() {
  return within(screen.getByRole('region', { name: 'Linha do tempo' }))
    .getAllByRole('listitem')
    .map(texto)
}

async function abrir(acao: string) {
  await userEvent.click(await screen.findByRole('button', { name: acao }))
  return screen.getByRole('dialog')
}

async function preencher(dialogo: HTMLElement, campo: string, valor: string) {
  const elemento = within(dialogo).getByLabelText(campo)
  await userEvent.clear(elemento)
  await userEvent.type(elemento, valor)
}

const confirmar = (dialogo: HTMLElement, rotulo: string) =>
  userEvent.click(within(dialogo).getByRole('button', { name: rotulo }))

const netflix = () =>
  gravarAssinatura('Netflix', 'Streaming', mensal('2026-01-31'))

describe('AssinaturaPage', () => {
  it('mensal iniciada em 31/01 vence no último dia de fevereiro e volta ao dia 31', async () => {
    renderizar(`/assinaturas/${await netflix()}`)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Netflix' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Categoria: Streaming')).toBeInTheDocument()
    expect(await proximas()).toEqual([
      '28/02/2026R$ 39,90',
      '31/03/2026R$ 39,90',
      '30/04/2026R$ 39,90',
      '31/05/2026R$ 39,90',
      '30/06/2026R$ 39,90',
    ])
    expect(vigencias()).toEqual([
      'A partir de 31/01/2026VigenteR$ 39,90, mensal',
    ])
    expect(
      screen.queryByRole('button', { name: 'Desfazer último registro' }),
    ).toBeNull()
  })

  it('Período gratuito aparece na linha do tempo e não gera Cobranças', async () => {
    const id = await gravarAssinatura(
      'Curso X',
      'Cursos',
      mensal('2026-02-01', { valorCentavos: 0 }),
      mensal('2026-03-01'),
    )
    renderizar(`/assinaturas/${id}`)
    expect((await proximas())[0]).toBe('01/03/2026R$ 39,90')
    expect(vigencias()).toEqual([
      'A partir de 01/02/2026Período gratuitoVigenteR$ 0,00, mensal',
      'A partir de 01/03/2026FuturaR$ 39,90, mensal',
    ])
  })

  it('registra uma nova Vigência anual futura', async () => {
    renderizar(`/assinaturas/${await netflix()}`)
    const dialogo = await abrir('Nova Vigência')
    expect(within(dialogo).getByLabelText('Início')).toHaveValue('2026-02-10')
    await preencher(dialogo, 'Início', '2026-03-01')
    await preencher(dialogo, 'Valor', '399,00')
    await userEvent.selectOptions(
      within(dialogo).getByLabelText('Unidade'),
      'ano(s)',
    )
    await confirmar(dialogo, 'Registrar')

    expect(
      await screen.findByText('Nova Vigência registrada.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(await proximas()).toEqual([
      '28/02/2026R$ 39,90',
      '01/03/2026R$ 399,00',
    ])
    expect(vigencias()[1]).toBe('A partir de 01/03/2026FuturaR$ 399,00, anual')
  })

  it('mostra no diálogo os erros do repositório', async () => {
    renderizar(`/assinaturas/${await netflix()}`)
    const dialogo = await abrir('Nova Vigência')
    await preencher(dialogo, 'Início', '2026-01-31')
    await confirmar(dialogo, 'Registrar')
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'Vigência 2: o início deve ser posterior ao da Vigência anterior.',
    )
  })

  it('cancelar deixa a Assinatura Cancelada e sem próximas Cobranças', async () => {
    renderizar(`/assinaturas/${await netflix()}`)
    const dialogo = await abrir('Cancelar')
    expect(within(dialogo).getByLabelText('Data de cancelamento')).toHaveValue(
      '2026-02-10',
    )
    await confirmar(dialogo, 'Cancelar Assinatura')

    expect(
      await screen.findByText('Cancelamento registrado.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma Cobrança prevista nos próximos 12 meses.'),
    ).toBeInTheDocument()
    expect(vigencias()[0]).toContain('Data de cancelamento: 10/02/2026')
    expect(screen.getByRole('button', { name: 'Reativar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull()
  })

  it('reativa a partir do dia seguinte ao cancelamento, com valor e Ciclo da última Vigência', async () => {
    const id = await gravarAssinatura(
      'Netflix',
      'Streaming',
      mensal('2025-10-15', { fim: '2026-02-01' }),
    )
    renderizar(`/assinaturas/${id}`)
    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    const dialogo = await abrir('Reativar')
    expect(dialogo).toHaveAccessibleName('Reativar Assinatura')
    expect(within(dialogo).getByLabelText('Início')).toHaveValue('2026-02-02')
    expect(within(dialogo).getByLabelText('Valor')).toHaveValue('R$ 39,90')
    await confirmar(dialogo, 'Reativar')

    expect(await screen.findByText('Assinatura reativada.')).toBeInTheDocument()
    expect(await screen.findByText('Ativa')).toBeInTheDocument()
    expect((await proximas())[0]).toBe('02/03/2026R$ 39,90')
  })

  it('desfaz o cancelamento e depois a Reativação', async () => {
    const id = await gravarAssinatura(
      'Netflix',
      'Streaming',
      mensal('2025-10-15', { fim: '2026-01-01' }),
      mensal('2026-01-20', { fim: '2026-02-05' }),
    )
    renderizar(`/assinaturas/${id}`)
    let dialogo = await abrir('Desfazer último registro')
    expect(dialogo).toHaveTextContent(
      'Remover a Data de cancelamento de 05/02/2026?',
    )
    await confirmar(dialogo, 'Desfazer')
    expect(await screen.findByText('Ativa')).toBeInTheDocument()
    expect(screen.getByText('Último registro desfeito.')).toBeInTheDocument()

    dialogo = await abrir('Desfazer último registro')
    expect(dialogo).toHaveTextContent(
      'Remover a Vigência iniciada em 20/01/2026?',
    )
    await confirmar(dialogo, 'Desfazer')
    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    expect(vigencias()).toHaveLength(1)
  })

  it('edita Serviço, Categoria e Observações', async () => {
    renderizar(`/assinaturas/${await netflix()}`)
    const dialogo = await abrir('Editar')
    await preencher(dialogo, 'Serviço', 'Netflix Premium')
    await userEvent.selectOptions(
      within(dialogo).getByLabelText('Categoria'),
      'Outros',
    )
    await preencher(dialogo, 'Observações', 'cartão final 1234')
    await confirmar(dialogo, 'Salvar')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Netflix Premium' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Categoria: Outros')).toBeInTheDocument()
    expect(screen.getByText('cartão final 1234')).toBeInTheDocument()
    expect(screen.getByText('Assinatura atualizada.')).toBeInTheDocument()
  })

  it('"Voltar" fecha o diálogo sem gravar', async () => {
    renderizar(`/assinaturas/${await netflix()}`)
    const dialogo = await abrir('Excluir')
    await confirmar(dialogo, 'Voltar')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(await db.assinaturas.count()).toBe(1)
  })

  it('exclui com confirmação e volta para a lista', async () => {
    const router = renderizar(`/assinaturas/${await netflix()}`)
    const dialogo = await abrir('Excluir')
    expect(dialogo).toHaveTextContent('Excluir a Assinatura Netflix?')
    await confirmar(dialogo, 'Excluir')

    expect(await screen.findByText('Assinatura excluída.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/assinaturas')
    expect(
      await screen.findByText('Nenhuma Assinatura cadastrada.'),
    ).toBeInTheDocument()
  })

  it('id inexistente mostra "Assinatura não encontrada"', async () => {
    renderizar('/assinaturas/nao-existe')
    expect(
      await screen.findByRole('heading', { name: 'Assinatura não encontrada' }),
    ).toBeInTheDocument()
  })
})
