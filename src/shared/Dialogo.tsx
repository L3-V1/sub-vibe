import { useEffect, useId, useRef, type ReactNode } from 'react'
import { botaoPerigo, botaoPrimario, botaoSecundario, respiro } from './estilos'
import { ListaErros } from './ListaErros'
import { useEnvio } from './useEnvio'

interface Props {
  titulo: string
  rotuloConfirmar: string
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      <form
        noValidate
        onSubmit={enviar}
        className={`flex flex-col gap-4 ${respiro}`}
      >
        <h2 id={idTitulo} className="text-lg font-semibold">
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
            {rotuloConfirmar}
          </button>
        </div>
      </form>
    </dialog>
  )
}
