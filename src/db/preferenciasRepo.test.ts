import { beforeEach, describe, expect, it } from 'vitest'
import { db, PREFERENCIAS_PADRAO } from './db'
import { ErroValidacao } from './esquemas'
import { preferenciasRepo } from './preferenciasRepo'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('preferenciasRepo', () => {
  it('aplica o padrão de 7 dias enquanto não há registro', async () => {
    expect(await preferenciasRepo.obter()).toEqual(PREFERENCIAS_PADRAO)
    expect(await db.preferencias.count()).toBe(0)
  })

  it('grava e lê a janela de vencimentos', async () => {
    await preferenciasRepo.atualizar({ janelaVencimentosDias: 15 })
    expect(await preferenciasRepo.obter()).toEqual({
      id: 'preferencias',
      janelaVencimentosDias: 15,
    })
  })

  it.each([0, 2.5])('recusa janela %s sem gravar', async (dias) => {
    await expect(
      preferenciasRepo.atualizar({ janelaVencimentosDias: dias }),
    ).rejects.toEqual(
      new ErroValidacao(
        [
          'A janela de vencimentos deve ser um número inteiro de dias, maior ou igual a 1.',
        ],
        ['janelaVencimentosDias'],
      ),
    )
    expect(await db.preferencias.count()).toBe(0)
  })
})
