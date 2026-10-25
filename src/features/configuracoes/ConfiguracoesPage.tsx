import { usePreferencias } from '../../db/hooks'
import { preferenciasRepo } from '../../db/preferenciasRepo'
import { botaoPrimario, campo, cartao, rotulo } from '../../shared/estilos'
import { ListaErros } from '../../shared/ListaErros'
import { useAvisos } from '../../shared/useAvisos'
import { useEnvio } from '../../shared/useEnvio'

export function ConfiguracoesPage() {
  const preferencias = usePreferencias()
  const avisar = useAvisos()
  const { erros, enviar } = useEnvio(async (dados) => {
    await preferenciasRepo.atualizar({
      janelaVencimentosDias: Number(dados.get('janelaVencimentosDias')),
    })
    avisar('Preferências salvas.')
  })

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="mt-2 text-slate-600">Preferências do app.</p>
      </div>

      {preferencias === undefined ? (
        <p className="text-slate-600">Carregando…</p>
      ) : (
        <form
          noValidate
          onSubmit={enviar}
          className={`${cartao} flex max-w-md flex-col gap-3`}
        >
          <label className={rotulo}>
            Janela de vencimentos (dias)
            <input
              name="janelaVencimentosDias"
              type="number"
              min={1}
              step={1}
              defaultValue={preferencias.janelaVencimentosDias}
              className={campo}
            />
          </label>
          <p className="text-sm text-slate-600">
            Quantos dias à frente o Painel mostra em Próximos vencimentos.
          </p>
          <ListaErros erros={erros} />
          <button type="submit" className={`${botaoPrimario} self-start`}>
            Salvar
          </button>
        </form>
      )}
    </section>
  )
}
