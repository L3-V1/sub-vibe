import { addMonths, format, parseISO } from 'date-fns'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAssinatura, useCategorias } from '../../db/hooks'
import { desfazerUltimo, estado, vigenciaEm } from '../../domain/assinatura'
import { cobrancasNoIntervalo } from '../../domain/cobrancas'
import type { Assinatura, DataISO } from '../../domain/tipos'
import { EstadoVazio } from '../../shared/EstadoVazio'
import {
  botaoPequeno,
  cartao,
  link,
  marcador,
  marcadorNeutro,
  tituloPagina,
} from '../../shared/estilos'
import {
  formatarCiclo,
  formatarDataISO,
  formatarMoeda,
  hoje,
} from '../../shared/formatacao'
import {
  DialogoCancelar,
  DialogoDesfazer,
  DialogoEditar,
  DialogoExcluir,
  DialogoVigencia,
} from './DialogosAssinatura'
import { EtiquetaEstado } from './EtiquetaEstado'

type Acao = 'vigencia' | 'cancelar' | 'editar' | 'desfazer' | 'excluir'

const linkVoltar = (
  <Link to="/assinaturas" className={`text-sm ${link}`}>
    Voltar às Assinaturas
  </Link>
)

export function AssinaturaPage() {
  const { id = '' } = useParams()
  const assinatura = useAssinatura(id)
  const categorias = useCategorias()
  const [acao, setAcao] = useState<Acao | null>(null)

  if (assinatura === undefined || categorias === undefined) {
    return <p className="text-texto-suave">Carregando…</p>
  }
  if (assinatura === null) {
    return (
      <section className="flex flex-col gap-2">
        <h1 className={tituloPagina}>Assinatura não encontrada</h1>
        <p className="text-texto-suave">
          Ela pode ter sido excluída. {linkVoltar}
        </p>
      </section>
    )
  }

  const dia = hoje()
  const aberta = assinatura.vigencias.at(-1)?.fim === undefined
  const fechar = () => setAcao(null)
  const botao = (rotulo: string, para: Acao) => (
    <button
      type="button"
      className={botaoPequeno}
      onClick={() => setAcao(para)}
    >
      {rotulo}
    </button>
  )

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {linkVoltar}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={tituloPagina}>{assinatura.servico}</h1>
          <EtiquetaEstado estado={estado(assinatura, dia)} />
        </div>
        <p className="text-texto-suave">
          Categoria:{' '}
          {categorias.find((c) => c.id === assinatura.categoriaId)?.nome}
        </p>
        {assinatura.observacoes !== undefined && (
          <p className="whitespace-pre-line text-texto-suave">
            {assinatura.observacoes}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {aberta ? (
          <>
            {botao('Nova Vigência', 'vigencia')}
            {botao('Cancelar', 'cancelar')}
          </>
        ) : (
          botao('Reativar', 'vigencia')
        )}
        {botao('Editar', 'editar')}
        {desfazerUltimo(assinatura) !== undefined &&
          botao('Desfazer último registro', 'desfazer')}
        {botao('Excluir', 'excluir')}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ProximasCobrancas assinatura={assinatura} dia={dia} />
        <LinhaDoTempo assinatura={assinatura} dia={dia} />
      </div>

      {acao === 'vigencia' && (
        <DialogoVigencia assinatura={assinatura} onFechar={fechar} />
      )}
      {acao === 'cancelar' && (
        <DialogoCancelar assinatura={assinatura} onFechar={fechar} />
      )}
      {acao === 'editar' && (
        <DialogoEditar
          assinatura={assinatura}
          categorias={categorias}
          onFechar={fechar}
        />
      )}
      {acao === 'desfazer' && (
        <DialogoDesfazer assinatura={assinatura} onFechar={fechar} />
      )}
      {acao === 'excluir' && (
        <DialogoExcluir assinatura={assinatura} onFechar={fechar} />
      )}
    </section>
  )
}

/** Até 5 Cobranças nos próximos 12 meses; Período gratuito não gera Cobranças. */
function ProximasCobrancas({
  assinatura,
  dia,
}: {
  assinatura: Assinatura
  dia: DataISO
}) {
  const ate = format(addMonths(parseISO(dia), 12), 'yyyy-MM-dd')
  const cobrancas = cobrancasNoIntervalo(assinatura, dia, ate).slice(0, 5)

  return (
    <section aria-label="Próximas Cobranças" className={cartao}>
      <h2 className="mb-3 text-lg font-semibold">Próximas Cobranças</h2>
      {cobrancas.length === 0 ? (
        <EstadoVazio icone="calendario">
          <p className="text-sm">
            Nenhuma Cobrança prevista nos próximos 12 meses.
          </p>
        </EstadoVazio>
      ) : (
        <ul className="divide-y divide-borda">
          {cobrancas.map((c) => (
            <li key={c.data} className="flex justify-between py-2 text-sm">
              <span>{formatarDataISO(c.data)}</span>
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

function LinhaDoTempo({
  assinatura,
  dia,
}: {
  assinatura: Assinatura
  dia: DataISO
}) {
  const vigente = vigenciaEm(assinatura, dia)

  return (
    <section aria-label="Linha do tempo" className={cartao}>
      <h2 className="mb-3 text-lg font-semibold">Linha do tempo</h2>
      <ol className="flex flex-col gap-3 border-l-2 border-borda-forte pl-4">
        {assinatura.vigencias.map((v) => (
          <li key={v.inicio} className="text-sm">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                A partir de {formatarDataISO(v.inicio)}
              </span>
              {v.valorCentavos === 0 && (
                <span className={marcadorNeutro}>Período gratuito</span>
              )}
              {v === vigente && (
                <span className={`${marcador} bg-acento/15 text-link`}>
                  Vigente
                </span>
              )}
              {v.inicio > dia && <span className={marcadorNeutro}>Futura</span>}
            </p>
            <p className="text-texto-suave">
              {formatarMoeda(v.valorCentavos)}, {formatarCiclo(v.ciclo)}
            </p>
            {v.fim !== undefined && (
              <p className="text-texto-suave">
                Data de cancelamento: {formatarDataISO(v.fim)}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
