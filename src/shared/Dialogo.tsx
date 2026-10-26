import type { LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import {
  botaoPerigo,
  botaoPrimario,
  botaoSecundario,
  respiro,
  tituloCartao,
} from './estilos'
import { ListaErros } from './ListaErros'
import { useEnvio } from './useEnvio'

interface Props {
  titulo: string
  rotuloConfirmar: string
  /** Ícone do botão de confirmar, o mesmo da ação que abriu o diálogo. */
  icone?: LucideIcon
  /** Botão de confirmar em vermelho, para ações destrutivas. */
  perigo?: boolean
  /** Lança `ErroValidacao` para mostrar os erros sem fechar. */
  onConfirmar: (dados: FormData) => Promise<void>
  onFechar: () => void
  children: ReactNode
}

/** `<dialog>` modal com um formulário; abre ao montar. */
export function Dialogo({
  titulo,
  rotuloConfirmar,
  icone: Icone,
  perigo = false,
  onConfirmar,
  onFechar,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const { erros, enviar } = useEnvio(onConfirmar)

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={onFechar}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-borda-forte bg-vidro-forte p-0 text-texto shadow-2xl shadow-black/40 backdrop-blur-2xl backdrop:bg-black/55 backdrop:backdrop-blur-sm"
    >
      <form
        noValidate
        onSubmit={enviar}
        className={`flex flex-col gap-4 ${respiro}`}
      >
        <h2 id={idTitulo} className={tituloCartao}>
          {titulo}
        </h2>
        {children}
        <ListaErros erros={erros} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onFechar} className={botaoSecundario}>
            Voltar
          </button>
          <button
            type="submit"
            className={perigo ? botaoPerigo : botaoPrimario}
          >
            {Icone && <Icone className="size-4" />}
            {rotuloConfirmar}
          </button>
        </div>
      </form>
    </dialog>
  )
}
