import { gastoPorCategoria } from '../../domain/custos'
import type { Assinatura, Categoria, DataISO } from '../../domain/tipos'
import { EstadoVazio } from '../../shared/EstadoVazio'
import { cabecalhoTabela, cartao } from '../../shared/estilos'
import { formatarMoeda } from '../../shared/formatacao'

const porcentagem = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

/** Barras proporcionais à maior Categoria e tabela com o % do total. */
export function GastoPorCategoria({
  assinaturas,
  categorias,
  de,
  ate,
}: {
  assinaturas: Assinatura[]
  categorias: Categoria[]
  de: DataISO
  ate: DataISO
}) {
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]))
  const linhas = Object.entries(gastoPorCategoria(assinaturas, de, ate))
    .map(([id, valor]) => ({ id, nome: nomeCategoria.get(id), valor }))
    .sort((x, y) => y.valor - x.valor)
  const total = linhas.reduce((soma, l) => soma + l.valor, 0)

  return (
    <section aria-label="Gasto por Categoria" className={cartao}>
      <h2 className="mb-3 text-lg font-semibold">Gasto por Categoria</h2>
      {linhas.length === 0 ? (
        <EstadoVazio icone="grafico">
          <p className="text-sm">Nenhum gasto nesse período.</p>
        </EstadoVazio>
      ) : (
        <div className="flex flex-col gap-6">
          <ul aria-hidden="true" className="flex flex-col gap-2">
            {linhas.map((l) => (
              <li
                key={l.id}
                className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[8rem_1fr_7rem]"
              >
                <span className="truncate">{l.nome}</span>
                <span className="h-2.5 rounded-full bg-vidro-hover">
                  <span
                    className="block h-full rounded-full bg-linear-to-r from-sucesso to-acento"
                    style={{ width: `${(l.valor / linhas[0].valor) * 100}%` }}
                  />
                </span>
                <span className="text-right tabular-nums">
                  {formatarMoeda(l.valor)}
                </span>
              </li>
            ))}
          </ul>

          <div className="-mx-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={cabecalhoTabela}>
                <tr>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 text-right font-medium">
                    % do total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">{l.nome}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatarMoeda(l.valor)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {porcentagem.format(l.valor / total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-borda font-medium">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatarMoeda(total)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {porcentagem.format(1)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
