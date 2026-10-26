import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAssinaturas, useCategorias, usePreferencias } from '../../db/hooks'
import { estado } from '../../domain/assinatura'
import { custoMensalEquivalente, gastoAcumulado } from '../../domain/custos'
import {
  intervaloDoPeriodo,
  proximasCobrancas,
  type Periodo,
} from '../../domain/painel'
import type { Assinatura, DataISO } from '../../domain/tipos'
import { EstadoVazio } from '../../shared/EstadoVazio'
import {
  botaoPrimario,
  campo,
  cartao,
  cartaoVazio,
  link,
  numeroGrande,
  rotulo,
  tituloPagina,
} from '../../shared/estilos'
import { formatarDataISO, formatarMoeda, hoje } from '../../shared/formatacao'
import { GastoPorCategoria } from './GastoPorCategoria'

const cabecalho = (
  <div>
    <h1 className={tituloPagina}>
      Painel <span aria-hidden="true">📊</span>
    </h1>
    <p className="mt-2 text-texto-suave">
      Resumo de gastos e próximos vencimentos.
    </p>
  </div>
)

export function PainelPage() {
  const assinaturas = useAssinaturas()
  const categorias = useCategorias()
  const preferencias = usePreferencias()
  const [periodo, setPeriodo] = useState<Periodo>('anoCorrente')

  if (
    assinaturas === undefined ||
    categorias === undefined ||
    preferencias === undefined
  ) {
    return (
      <section className="flex flex-col gap-6">
        {cabecalho}
        <p className="text-texto-suave">Carregando…</p>
      </section>
    )
  }

  if (assinaturas.length === 0) {
    return (
      <section className="flex flex-col gap-6">
        {cabecalho}
        <div className={cartaoVazio}>
          <EstadoVazio icone="assinaturas">
            <p>Nenhuma Assinatura cadastrada.</p>
            <Link to="/assinaturas/nova" className={`${botaoPrimario} mt-1`}>
              <Plus className="size-4" />
              Cadastrar a primeira Assinatura
            </Link>
          </EstadoVazio>
        </div>
      </section>
    )
  }

  const dia = hoje()
  const { de, ate } = intervaloDoPeriodo(periodo, assinaturas, dia)
  const totalMensal = assinaturas.reduce(
    (total, a) => total + custoMensalEquivalente(a, dia),
    0,
  )
  const ativas = assinaturas.filter((a) => estado(a, dia) === 'Ativa').length

  return (
    <section className="flex flex-col gap-6">
      {cabecalho}

      <div className="grid gap-6 md:grid-cols-2">
        <section
          aria-label="Total mensal equivalente"
          className={`${cartao} relative overflow-hidden`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-12 -z-10 size-56 rounded-full bg-acento/20 blur-3xl"
          />
          <h2 className="text-lg font-semibold">Total mensal equivalente</h2>
          <p className={`mt-2 ${numeroGrande}`}>{formatarMoeda(totalMensal)}</p>
          <p className="mt-1 text-sm text-texto-suave">
            {ativas} Assinatura(s) Ativa(s)
          </p>
        </section>

        <ProximosVencimentos
          assinaturas={assinaturas}
          dia={dia}
          dias={preferencias.janelaVencimentosDias}
        />
      </div>

      <section aria-label="Gasto acumulado" className={cartao}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Gasto acumulado</h2>
            <p className={`mt-2 ${numeroGrande}`}>
              {formatarMoeda(gastoAcumulado(assinaturas, de, ate))}
            </p>
            <p className="mt-1 text-sm text-texto-suave">
              De {formatarDataISO(de)} a {formatarDataISO(ate)}
            </p>
          </div>
          <label className={rotulo}>
            Período
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className={campo}
            >
              <option value="anoCorrente">Ano corrente</option>
              <option value="ultimos12Meses">Últimos 12 meses</option>
              <option value="desdeOInicio">Desde o início</option>
            </select>
          </label>
        </div>
      </section>

      <GastoPorCategoria
        assinaturas={assinaturas}
        categorias={categorias}
        de={de}
        ate={ate}
      />
    </section>
  )
}

function ProximosVencimentos({
  assinaturas,
  dia,
  dias,
}: {
  assinaturas: Assinatura[]
  dia: DataISO
  dias: number
}) {
  const cobrancas = proximasCobrancas(assinaturas, dia, dias)
  const servico = new Map(assinaturas.map((a) => [a.id, a.servico]))
  const [janela, vazio] =
    dias === 1
      ? ['Próximo dia', 'Nenhum vencimento no próximo dia.']
      : [
          `Próximos ${dias} dias`,
          `Nenhum vencimento nos próximos ${dias} dias.`,
        ]

  return (
    <section aria-label="Próximos vencimentos" className={cartao}>
      <h2 className="text-lg font-semibold">Próximos vencimentos</h2>
      <p className="mb-3 text-sm text-texto-suave">{janela}</p>
      {cobrancas.length === 0 ? (
        <EstadoVazio icone="calendario">
          <p className="text-sm">{vazio}</p>
        </EstadoVazio>
      ) : (
        <ul className="divide-y divide-borda">
          {cobrancas.map((c) => (
            <li
              key={`${c.assinaturaId}-${c.data}`}
              className="flex justify-between gap-3 py-2 text-sm"
            >
              <span className="tabular-nums">{formatarDataISO(c.data)}</span>
              <Link
                to={`/assinaturas/${c.assinaturaId}`}
                className={`flex-1 ${link}`}
              >
                {servico.get(c.assinaturaId)}
              </Link>
              <span className="font-medium tabular-nums">
                {formatarMoeda(c.valorCentavos)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
