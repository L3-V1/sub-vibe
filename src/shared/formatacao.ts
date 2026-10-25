const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const data = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Formata um valor em centavos inteiros como reais: 123456 → "R$ 1.234,56". */
export function formatarMoeda(centavos: number): string {
  return moeda.format(centavos / 100)
}

/** Formata uma data como dd/MM/aaaa: "25/10/2026". */
export function formatarData(valor: Date): string {
  return data.format(valor)
}
