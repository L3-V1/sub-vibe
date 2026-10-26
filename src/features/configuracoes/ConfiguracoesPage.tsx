import { Moon, Save, Sun, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { usePreferencias } from '../../db/hooks'
import { preferenciasRepo } from '../../db/preferenciasRepo'
import {
  botaoPrimario,
  campo,
  cartao,
  rotulo,
  tituloPagina,
} from '../../shared/estilos'
import { ListaErros } from '../../shared/ListaErros'
import { aplicarTema, lerTema, type Tema } from '../../shared/tema'
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
        <h1 className={tituloPagina}>
          Configurações <span aria-hidden="true">⚙️</span>
        </h1>
        <p className="mt-2 text-texto-suave">Preferências do app.</p>
      </div>

      {preferencias === undefined ? (
        <p className="text-texto-suave">Carregando…</p>
      ) : (
        <form
          noValidate
          onSubmit={enviar}
          className={`${cartao} flex flex-col gap-3`}
        >
          <label className={`${rotulo} max-w-xs`}>
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
          <p className="text-sm text-texto-suave">
            Quantos dias à frente o Painel mostra em Próximos vencimentos.
          </p>
          <ListaErros erros={erros} />
          <button type="submit" className={`${botaoPrimario} self-start`}>
            <Save className="size-4" />
            Salvar
          </button>
        </form>
      )}

      <Aparencia />
    </section>
  )
}

const temas: { valor: Tema; rotulo: string; Icone: LucideIcon }[] = [
  { valor: 'escuro', rotulo: 'Escuro', Icone: Moon },
  { valor: 'claro', rotulo: 'Claro', Icone: Sun },
]

/** Tema deste navegador; vale na hora, sem botão de salvar. */
function Aparencia() {
  const avisar = useAvisos()
  const [tema, setTema] = useState(lerTema)

  function escolher(novo: Tema) {
    aplicarTema(novo)
    setTema(novo)
    avisar(`Tema ${novo} aplicado.`)
  }

  return (
    <fieldset className={`${cartao} flex flex-col gap-3`}>
      <legend className="float-left text-lg font-semibold">Aparência</legend>
      <div className="flex gap-2">
        {temas.map((t) => (
          <label
            key={t.valor}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento ${
              tema === t.valor
                ? 'border-acento bg-acento/15 text-texto'
                : 'border-borda-forte bg-vidro text-texto-suave hover:bg-vidro-hover'
            }`}
          >
            <input
              type="radio"
              name="tema"
              value={t.valor}
              checked={tema === t.valor}
              onChange={() => escolher(t.valor)}
              className="sr-only"
            />
            <t.Icone className="size-4" />
            {t.rotulo}
          </label>
        ))}
      </div>
      <p className="text-sm text-texto-suave">
        Vale só para este navegador e não entra no backup.
      </p>
    </fieldset>
  )
}
