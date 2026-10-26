import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db/db'
import { renderizar } from '../../test/renderizar'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

/** O item da lista com a Categoria `nome`. */
const item = async (nome: string) =>
  (await screen.findByText(nome)).closest('li')!

describe('CategoriasPage', () => {
  it('lista as Categorias iniciais com a contagem de Assinaturas', async () => {
    renderizar('/categorias')
    expect(await item('Streaming')).toHaveTextContent('0 Assinatura(s)')
  })

  it('cria uma Categoria e mostra o aviso', async () => {
    renderizar('/categorias')
    await userEvent.type(screen.getByLabelText('Nova Categoria'), 'Jogos')
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))
    expect(await screen.findByText('Categoria criada.')).toBeInTheDocument()
    expect(await item('Jogos')).toBeInTheDocument()
    expect(screen.getByLabelText('Nova Categoria')).toHaveValue('')
  })

  it('mostra erro para nome repetido', async () => {
    renderizar('/categorias')
    await userEvent.type(screen.getByLabelText('Nova Categoria'), 'streaming')
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe uma Categoria chamada "Streaming".',
    )
    expect(screen.getByLabelText('Nova Categoria')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('renomeia inline', async () => {
    renderizar('/categorias')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Renomear Outros' }),
    )
    const nome = screen.getByLabelText('Novo nome de Outros')
    await userEvent.clear(nome)
    await userEvent.type(nome, 'Diversos')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await item('Diversos')).toBeInTheDocument()
    expect(screen.getByText('Categoria renomeada.')).toBeInTheDocument()
  })

  it('exclui uma Categoria sem uso', async () => {
    renderizar('/categorias')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Excluir Software' }),
    )
    const dialogo = screen.getByRole('dialog', { name: 'Excluir Categoria' })
    expect(dialogo).toHaveTextContent('Excluir a Categoria Software?')
    expect(within(dialogo).queryByLabelText('Mover para')).toBeNull()
    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Excluir' }),
    )
    expect(await screen.findByText('Categoria excluída.')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Excluir Software' }),
    ).toBeNull()
  })

  it('exclui uma Categoria em uso movendo as Assinaturas para o destino', async () => {
    const categorias = await db.categorias.toArray()
    const id = (nome: string) => categorias.find((c) => c.nome === nome)!.id
    await db.assinaturas.add({
      id: 'a1',
      servico: 'Netflix',
      categoriaId: id('Streaming'),
      vigencias: [
        {
          inicio: '2026-01-10',
          valorCentavos: 3990,
          ciclo: { quantidade: 1, unidade: 'mes' },
        },
      ],
    })

    renderizar('/categorias')
    expect(await item('Streaming')).toHaveTextContent('1 Assinatura(s)')
    await userEvent.click(
      screen.getByRole('button', { name: 'Excluir Streaming' }),
    )
    const dialogo = screen.getByRole('dialog', { name: 'Excluir Categoria' })
    expect(dialogo).toHaveTextContent('usada por 1 Assinatura(s)')
    await userEvent.selectOptions(
      within(dialogo).getByLabelText('Mover para'),
      'Outros',
    )
    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Excluir' }),
    )

    expect(await screen.findByText('Categoria excluída.')).toBeInTheDocument()
    expect(await item('Outros')).toHaveTextContent('1 Assinatura(s)')
    expect((await db.assinaturas.get('a1'))?.categoriaId).toBe(id('Outros'))
  })
})
