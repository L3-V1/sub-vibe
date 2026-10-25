import { Link } from 'react-router'

export function NaoEncontradaPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-slate-600">
        O endereço acessado não existe.{' '}
        <Link to="/" className="text-indigo-700 underline">
          Voltar ao Painel
        </Link>
      </p>
    </section>
  )
}
