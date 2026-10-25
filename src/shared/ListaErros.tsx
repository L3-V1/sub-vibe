/** Erros de um formulário, anunciados ao aparecer. */
export function ListaErros({ erros }: { erros: string[] }) {
  if (erros.length === 0) return null
  return (
    <ul
      role="alert"
      className="list-disc rounded-xl border border-perigo/40 bg-perigo-fundo py-2.5 pr-4 pl-8 text-sm text-perigo-texto"
    >
      {erros.map((erro) => (
        <li key={erro}>{erro}</li>
      ))}
    </ul>
  )
}
