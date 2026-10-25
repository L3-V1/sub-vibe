import type { Assinatura, Categoria } from '../../domain/tipos'
import { campo, rotulo } from '../../shared/estilos'

/** Serviço, Categoria e Observações; leia com `lerBasicos`. */
export function CamposBasicos({
  categorias,
  padrao,
}: {
  categorias: Categoria[]
  padrao?: Assinatura
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={rotulo}>
          Serviço
          <input
            name="servico"
            placeholder="Netflix Premium"
            defaultValue={padrao?.servico}
            className={campo}
          />
        </label>
        <label className={rotulo}>
          Categoria
          <select
            name="categoriaId"
            defaultValue={padrao?.categoriaId}
            className={campo}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={rotulo}>
        Observações
        <textarea
          name="observacoes"
          rows={2}
          defaultValue={padrao?.observacoes}
          className={campo}
        />
      </label>
    </>
  )
}
