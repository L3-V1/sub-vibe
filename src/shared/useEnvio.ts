import { useState, type FormEvent } from 'react'
import { ErroValidacao } from '../db/esquemas'

/**
 * Envio de formulário: chama `aoEnviar` com os dados e, se ele lançar
 * `ErroValidacao`, guarda as mensagens em `erros` para mostrar no formulário.
 */
export function useEnvio(
  aoEnviar: (dados: FormData, formulario: HTMLFormElement) => Promise<void>,
) {
  const [erros, setErros] = useState<string[]>([])

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    try {
      await aoEnviar(new FormData(formulario), formulario)
      setErros([])
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e
      setErros(e.erros)
    }
  }

  return { erros, enviar }
}
