import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { gravarAssinatura, mensal } from '../../test/dados'
import { renderizar } from '../../test/renderizar'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 25, 12))
  await db.delete()
  await db.open()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const backupDoArquivo = {
  versaoSchema: 1,
  exportadoEm: '2026-10-20T15:00:00.000Z',
  categorias: [
    { id: 'c1', nome: 'Vídeo' },
    { id: 'c2', nome: 'Jogos' },
  ],
  assinaturas: [
    {
      id: 'a1',
      servico: 'Game Pass',
      categoriaId: 'c2',
      vigencias: [mensal('2026-01-01')],
    },
  ],
  preferencias: { id: 'preferencias', janelaVencimentosDias: 30 },
}

async function importar(conteudo: string) {
  renderizar('/backup')
  const arquivo = new File([conteudo], 'backup.json', {
    type: 'application/json',
  })
  await userEvent.upload(screen.getByLabelText('Arquivo de backup'), arquivo)
  await userEvent.click(screen.getByRole('button', { name: 'Importar…' }))
}

describe('BackupPage', () => {
  it('exporta o backup num arquivo JSON com a data no nome', async () => {
    await gravarAssinatura('Netflix', 'Streaming', mensal('2026-01-01'))
    let blob: Blob | undefined
    URL.createObjectURL = vi.fn((b: Blob) => {
      blob = b
      return 'blob:backup'
    })
    URL.revokeObjectURL = vi.fn()
    let download = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      download = this.download
    })

    renderizar('/backup')
    await userEvent.click(
      screen.getByRole('button', { name: 'Exportar backup' }),
    )

    expect(await screen.findByText('Backup exportado.')).toBeInTheDocument()
    expect(download).toBe('sub-vibe-backup-2026-10-25.json')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:backup')
    const conteudo = JSON.parse(await blob!.text())
    expect(conteudo.versaoSchema).toBe(1)
    expect(
      conteudo.assinaturas.map((a: { servico: string }) => a.servico),
    ).toEqual(['Netflix'])
    expect(conteudo.categorias).toHaveLength(5)
  })

  it('mostra a prévia e, ao confirmar, substitui os dados', async () => {
    await gravarAssinatura('Netflix', 'Streaming', mensal('2026-01-01'))
    await importar(JSON.stringify(backupDoArquivo))

    const dialogo = await screen.findByRole('dialog', {
      name: 'Substituir todos os dados?',
    })
    expect(dialogo).toHaveTextContent(
      'Backup exportado em 20/10/2026, com 2 Categoria(s) e 1 Assinatura(s).',
    )
    expect(
      await within(dialogo).findByText(/Serão apagadas 5 Categoria\(s\) e 1/),
    ).toBeInTheDocument()

    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Substituir tudo' }),
    )

    expect(await screen.findByText('Backup importado.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Arquivo de backup')).toHaveValue('')
    expect(await db.categorias.toArray()).toEqual(backupDoArquivo.categorias)
    expect(await db.assinaturas.toArray()).toEqual(backupDoArquivo.assinaturas)
    expect(await db.preferencias.toArray()).toEqual([
      backupDoArquivo.preferencias,
    ])
  })

  it('"Voltar" fecha a prévia sem alterar nada', async () => {
    await gravarAssinatura('Netflix', 'Streaming', mensal('2026-01-01'))
    const antes = await db.assinaturas.toArray()
    await importar(JSON.stringify(backupDoArquivo))

    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialogo).getByRole('button', { name: 'Voltar' }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await db.assinaturas.toArray()).toEqual(antes)
    expect(await db.categorias.count()).toBe(5)
  })

  it.each([
    [
      'um JSON inválido',
      '{ isto não é JSON',
      'O arquivo não é um JSON válido.',
    ],
    [
      'uma versão desconhecida',
      JSON.stringify({ ...backupDoArquivo, versaoSchema: 2 }),
      'Este backup usa a versão 2 do formato, e este app só lê a versão 1.',
    ],
  ])('recusa %s com a mensagem', async (_, conteudo, mensagem) => {
    await importar(conteudo)
    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('pede um arquivo quando nenhum foi escolhido', async () => {
    renderizar('/backup')
    await userEvent.click(screen.getByRole('button', { name: 'Importar…' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Escolha um arquivo de backup.',
    )
  })
})
