import { useState } from 'react'
import { Link } from 'react-router'
import { useAssinaturas, useCategorias } from '../../db/hooks'
import { estado } from '../../domain/assinatura'
import { proximoVencimento } from '../../domain/cobrancas'
import { custoMensalEquivalente } from '../../domain/custos'
import { EstadoVazio } from '../../shared/EstadoVazio'
import { botaoPrimario, campo, cartaoVazio, rotulo } from '../../shared/estilos'
import { formatarDataISO, formatarMoeda, hoje } from '../../shared/formatacao'
import { EtiquetaEstado } from './EtiquetaEstado'

type FiltroEstado = 'Ativa' | 'Cancelada' | 'Todas'

const TODAS = ''

export function AssinaturasPage() {
  const assinaturas = useAssinaturas()
  const categorias = useCategorias()
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('Ativa')
  const [filtroCategoria, setFiltroCategoria] = useState(TODAS)

  const cabecalho = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">Assinaturas</h1>
        <p className="mt-2 text-slate-600">Suas Assinaturas recorrentes.</p>
      </div>
      <Link to="/assinaturas/nova" className={botaoPrimario}>
        Nova Assinatura
      </Link>
    </div>
  )

  if (assinaturas === undefined || categorias === undefined) {
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
        <div className={cartaoVazio}>
          <EstadoVazio icone="assinaturas">
            <p>Nenhuma Assinatura cadastrada.</p>
            <Link to="/assinaturas/nova" className={`${botaoPrimario} mt-1`}>
              Cadastrar a primeira Assinatura
            </Link>
          </EstadoVazio>
        </div>
      </section>
    )
  }

  const dia = hoje()
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]))
  const linhas = assinaturas
    .map((a) => ({ assinatura: a, estado: estado(a, dia) }))
    .filter(
      (l) =>
        (filtroEstado === 'Todas' || l.estado === filtroEstado) &&
        (filtroCategoria === TODAS ||
          l.assinatura.categoriaId === filtroCategoria),
    )

  return (
    <section className="flex flex-col gap-6">
      {cabecalho}

      <div className="flex flex-wrap gap-4">
        <label className={rotulo}>
          Estado
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
            className={campo}
          >
            <option value="Ativa">Ativas</option>
            <option value="Cancelada">Canceladas</option>
            <option value="Todas">Todas</option>
          </select>
        </label>
        <label className={rotulo}>
          Categoria
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className={campo}
          >
            <option value={TODAS}>Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {linhas.length === 0 ? (
        <div className={cartaoVazio}>
          <EstadoVazio icone="filtro">
            <p>Nenhuma Assinatura com esses filtros.</p>
          </EstadoVazio>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Próximo vencimento</th>
                <th className="px-4 py-3 text-right font-medium">
                  Custo mensal equivalente
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map(({ assinatura: a, estado }) => {
                const vencimento = proximoVencimento(a, dia)
                return (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <Link
                        to={`/assinaturas/${a.id}`}
                        className="font-medium text-indigo-700 underline"
                      >
                        {a.servico}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {nomeCategoria.get(a.categoriaId)}
                    </td>
                    <td className="px-4 py-3">
                      <EtiquetaEstado estado={estado} />
                    </td>
                    <td className="px-4 py-3">
                      {vencimento === undefined
                        ? 'Nenhum'
                        : formatarDataISO(vencimento)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatarMoeda(custoMensalEquivalente(a, dia))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
