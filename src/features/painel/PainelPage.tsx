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
import { botaoPrimario, campo, rotulo } from '../../shared/estilos'
import { formatarDataISO, formatarMoeda, hoje } from '../../shared/formatacao'
import { GastoPorCategoria } from './GastoPorCategoria'

const cartao = 'rounded-lg border border-slate-200 bg-white p-4'

const cabecalho = (
  <div>
    <h1 className="text-2xl font-semibold">Painel</h1>
    <p className="mt-2 text-slate-600">
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
        <p className="text-slate-600">Carregando…</p>
      </section>
    )
  }

  if (assinaturas.length === 0) {
    return (
      <section className="flex flex-col gap-6">
        {cabecalho}
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">Nenhuma Assinatura cadastrada.</p>
          <Link
            to="/assinaturas/nova"
            className={`${botaoPrimario} mt-4 inline-block`}
          >
            Cadastrar a primeira Assinatura
          </Link>
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
        <section aria-label="Total mensal equivalente" className={cartao}>
          <h2 className="text-lg font-semibold">Total mensal equivalente</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {formatarMoeda(totalMensal)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
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
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {formatarMoeda(gastoAcumulado(assinaturas, de, ate))}
            </p>
            <p className="mt-1 text-sm text-slate-600">
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
      <p className="mb-3 text-sm text-slate-600">{janela}</p>
      {cobrancas.length === 0 ? (
        <p className="text-sm text-slate-600">{vazio}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {cobrancas.map((c) => (
            <li
              key={`${c.assinaturaId}-${c.data}`}
              className="flex justify-between gap-3 py-2 text-sm"
            >
              <span className="tabular-nums">{formatarDataISO(c.data)}</span>
              <Link
                to={`/assinaturas/${c.assinaturaId}`}
                className="flex-1 font-medium text-indigo-700 underline"
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
