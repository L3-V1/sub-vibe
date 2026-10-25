/** Erros de um formulário, anunciados ao aparecer. */
export function ListaErros({ erros }: { erros: string[] }) {
  if (erros.length === 0) return null
  return (
    <ul
      role="alert"
      className="list-disc rounded-md border border-red-200 bg-red-50 py-2 pr-3 pl-7 text-sm text-red-800"
    >
      {erros.map((erro) => (
        <li key={erro}>{erro}</li>
      ))}
    </ul>
  )
}
