import type { Assinatura, DataISO, EstadoAssinatura, Vigencia } from './tipos'

/** Lista as invariantes violadas, em pt-BR. Lista vazia = Assinatura válida. */
export function validarAssinatura(a: Assinatura): string[] {
  if (a.vigencias.length === 0) {
    return ['A Assinatura precisa de pelo menos uma Vigência.']
  }

  const erros: string[] = []
  a.vigencias.forEach((v, i) => {
    const rotulo = `Vigência ${i + 1}`
    if (!Number.isInteger(v.valorCentavos) || v.valorCentavos < 0) {
      erros.push(
        `${rotulo}: o valor deve ser maior ou igual a zero, em centavos inteiros.`,
      )
    }
    if (!Number.isInteger(v.ciclo.quantidade) || v.ciclo.quantidade < 1) {
      erros.push(
        `${rotulo}: o Ciclo de cobrança deve ser um número inteiro maior ou igual a 1.`,
      )
    }
    if (v.fim !== undefined && v.fim < v.inicio) {
      erros.push(
        `${rotulo}: a Data de cancelamento não pode ser anterior ao início.`,
      )
    }

    const anterior = a.vigencias[i - 1]
    if (anterior === undefined) return
    if (v.inicio <= anterior.inicio) {
      erros.push(
        `${rotulo}: o início deve ser posterior ao da Vigência anterior.`,
      )
    } else if (anterior.fim !== undefined && v.inicio <= anterior.fim) {
      erros.push(
        `${rotulo}: o início deve ser posterior à Data de cancelamento da Vigência anterior.`,
      )
    }
  })
  return erros
}

/** Cancelada quando a última Vigência tem Data de cancelamento até hoje. */
export function estado(a: Assinatura, hoje: DataISO): EstadoAssinatura {
  const fim = a.vigencias.at(-1)?.fim
  return fim !== undefined && fim <= hoje ? 'Cancelada' : 'Ativa'
}

/**
 * A Vigência vigente na data, ou `undefined`. Cada Vigência vai do início até o menor
 * entre a Data de cancelamento (inclusive) e a véspera do início da próxima.
 */
export function vigenciaEm(a: Assinatura, data: DataISO): Vigencia | undefined {
  return a.vigencias.find((v, i) => {
    const proxima = a.vigencias[i + 1]
    return (
      v.inicio <= data &&
      (v.fim === undefined || data <= v.fim) &&
      (proxima === undefined || data < proxima.inicio)
    )
  })
}

// As transformações abaixo só montam a nova lista de Vigências; quem grava valida.

/** Cancelamento: Data de cancelamento na última Vigência. */
export function cancelar(a: Assinatura, data: DataISO): Assinatura {
  const vigencias = [...a.vigencias]
  vigencias[vigencias.length - 1] = {
    ...vigencias[vigencias.length - 1],
    fim: data,
  }
  return { ...a, vigencias }
}

/** Nova Vigência ao final; também serve para a Reativação. */
export function adicionarVigencia(a: Assinatura, v: Vigencia): Assinatura {
  return { ...a, vigencias: [...a.vigencias, v] }
}

/**
 * Desfaz o último registro: remove a Data de cancelamento da última Vigência ou,
 * sem ela, remove a última Vigência. `undefined` se só resta uma Vigência aberta.
 */
export function desfazerUltimo(a: Assinatura): Assinatura | undefined {
  const ultima = a.vigencias.at(-1)
  if (ultima?.fim !== undefined) {
    const { fim: _fim, ...semFim } = ultima
    return { ...a, vigencias: [...a.vigencias.slice(0, -1), semFim] }
  }
  if (a.vigencias.length > 1) {
    return { ...a, vigencias: a.vigencias.slice(0, -1) }
  }
  return undefined
}
