import { useId } from 'react'
import type { Vigencia } from '../../domain/tipos'
import { campo, rotulo } from '../../shared/estilos'
import { formatarMoeda } from '../../shared/formatacao'

/** Início, valor e Ciclo de cobrança de uma Vigência; leia com `lerVigencia`. */
export function CamposVigencia({
  padrao,
}: {
  padrao: Pick<Vigencia, 'inicio'> & Partial<Vigencia>
}) {
  const id = useId()
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className={rotulo}>
        Início
        <input
          type="date"
          name="inicio"
          defaultValue={padrao.inicio}
          className={campo}
        />
      </label>
      <label className={rotulo}>
        Valor
        <input
          name="valor"
          inputMode="decimal"
          placeholder="39,90"
          defaultValue={
            padrao.valorCentavos === undefined
              ? ''
              : formatarMoeda(padrao.valorCentavos)
          }
          className={campo}
        />
      </label>
      <fieldset>
        <legend className={rotulo}>Ciclo de cobrança</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor={`${id}-quantidade`}>
            A cada
          </label>
          <input
            id={`${id}-quantidade`}
            type="number"
            name="quantidade"
            min={1}
            defaultValue={padrao.ciclo?.quantidade ?? 1}
            className={campo}
          />
          <label className="sr-only" htmlFor={`${id}-unidade`}>
            Unidade
          </label>
          <select
            id={`${id}-unidade`}
            name="unidade"
            defaultValue={padrao.ciclo?.unidade ?? 'mes'}
            className={campo}
          >
            <option value="dia">dia(s)</option>
            <option value="semana">semana(s)</option>
            <option value="mes">mês(es)</option>
            <option value="ano">ano(s)</option>
          </select>
        </div>
      </fieldset>
    </div>
  )
}
