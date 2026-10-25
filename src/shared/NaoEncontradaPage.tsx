import { Link } from 'react-router'
import { link, tituloPagina } from './estilos'

export function NaoEncontradaPage() {
  return (
    <section>
      <h1 className={tituloPagina}>
        Página não encontrada <span aria-hidden="true">🛸</span>
      </h1>
      <p className="mt-2 text-texto-suave">
        O endereço acessado não existe.{' '}
        <Link to="/" className={link}>
          Voltar ao Painel
        </Link>
      </p>
    </section>
  )
}
