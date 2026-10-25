import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { assinaturasRepo } from '../../db/assinaturasRepo'
import { ErroValidacao } from '../../db/esquemas'
import { useCategorias } from '../../db/hooks'
import type { Vigencia } from '../../domain/tipos'
import {
  botaoPrimario,
  botaoSecundario,
  campo,
  cartao,
  rotulo,
} from '../../shared/estilos'
import { hoje } from '../../shared/formatacao'
import { ListaErros } from '../../shared/ListaErros'
import { useAvisos } from '../../shared/useAvisos'
import { useEnvio } from '../../shared/useEnvio'
import { CamposBasicos } from './CamposBasicos'
import { CamposVigencia } from './CamposVigencia'
import { lerBasicos, lerVigencia } from './lerFormulario'

/**
 * Com Período gratuito, são duas Vigências no mesmo Ciclo: R$ 0 a partir do
 * início e a paga a partir da primeira Cobrança.
 */
function lerVigencias(dados: FormData, gratuito: boolean): Vigencia[] {
  const paga = lerVigencia(dados)
  if (!gratuito) return [paga]
  const primeira = String(dados.get('primeiraCobranca') ?? '')
  if (primeira === '') {
    throw new ErroValidacao(['Informe a data da primeira Cobrança.'])
  }
  if (primeira <= paga.inicio) {
    throw new ErroValidacao(['A primeira Cobrança deve ser depois do início.'])
  }
  return [
    { ...paga, valorCentavos: 0 },
    { ...paga, inicio: primeira },
  ]
}

export function NovaAssinaturaPage() {
  const categorias = useCategorias()
  const navigate = useNavigate()
  const avisar = useAvisos()
  const [gratuito, setGratuito] = useState(false)

  const { erros, enviar } = useEnvio(async (dados) => {
    const id = await assinaturasRepo.criar({
      ...lerBasicos(dados),
      vigencias: lerVigencias(dados, gratuito),
    })
    avisar('Assinatura cadastrada.')
    navigate(`/assinaturas/${id}`)
  })

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nova Assinatura</h1>
      {categorias === undefined ? (
        <p className="text-slate-600">Carregando…</p>
      ) : (
        <form
          noValidate
          onSubmit={enviar}
          className={`${cartao} flex max-w-2xl flex-col gap-4`}
        >
          <CamposBasicos categorias={categorias} />
          <CamposVigencia padrao={{ inicio: hoje() }} />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={gratuito}
              onChange={(e) => setGratuito(e.target.checked)}
            />
            Começa com Período gratuito
          </label>
          {gratuito && (
            <label className={rotulo}>
              Primeira Cobrança em
              <input type="date" name="primeiraCobranca" className={campo} />
            </label>
          )}
          <ListaErros erros={erros} />
          <div className="flex gap-2">
            <button type="submit" className={botaoPrimario}>
              Cadastrar
            </button>
            <Link to="/assinaturas" className={botaoSecundario}>
              Voltar
            </Link>
          </div>
        </form>
      )}
    </section>
  )
}
