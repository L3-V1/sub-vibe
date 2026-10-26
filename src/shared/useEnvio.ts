import { useState, type FormEvent } from 'react'
import { ErroValidacao } from '../db/esquemas'

/** Marca com `aria-invalid` os campos citados no erro e limpa os demais. */
function marcarCampos(formulario: HTMLFormElement, campos: string[]) {
  for (const elemento of formulario.querySelectorAll('[name]')) {
    if (campos.includes(elemento.getAttribute('name')!)) {
      elemento.setAttribute('aria-invalid', 'true')
    } else {
      elemento.removeAttribute('aria-invalid')
    }
  }
}

/**
 * Envio de formulário: chama `aoEnviar` com os dados e, se ele lançar
 * `ErroValidacao`, guarda as mensagens em `erros` para mostrar no formulário
 * e destaca os campos com erro.
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
      marcarCampos(formulario, [])
    } catch (e) {
      if (!(e instanceof ErroValidacao)) throw e
      setErros(e.erros)
      marcarCampos(formulario, e.campos)
    }
  }

  return { erros, enviar }
}
