// Classes Tailwind repetidas entre as telas. As cores são tokens de `index.css`.

/** Contorno âmbar ao focar pelo teclado, visível sobre o vidro. */
export const focoVisivel =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento'

const botao = `inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${focoVisivel}`

export const botaoPrimario = `${botao} bg-acento text-sobre-acento hover:bg-acento-hover`

export const botaoPerigo = `${botao} bg-perigo text-sobre-perigo hover:bg-perigo-hover`

export const botaoSecundario = `${botao} border border-borda-forte bg-vidro text-texto hover:bg-vidro-hover`

/** Botão compacto para ações em linhas de tabela e listas. */
export const botaoPequeno = `inline-flex items-center gap-1.5 rounded-full border border-borda-forte bg-vidro px-3 py-1 text-sm font-medium whitespace-nowrap text-texto transition-colors hover:bg-vidro-hover ${focoVisivel}`

export const campo =
  'mt-1 block w-full rounded-xl border border-borda-forte bg-campo px-3 py-2 text-sm font-normal text-texto placeholder:text-texto-suave/70 focus:border-acento focus:outline-2 focus:outline-acento/40 aria-invalid:border-perigo aria-invalid:focus:outline-perigo/40'

export const rotulo = 'block text-sm font-medium text-texto-suave'

export const link = `font-medium text-link underline decoration-link/40 underline-offset-4 hover:decoration-link ${focoVisivel}`

/** Contêiner principal: cartões, formulários e diálogos usam o mesmo respiro. */
export const respiro = 'p-5 sm:p-6'

/** Superfície de vidro fosco, base de cartões, tabelas e listas. */
export const vidro =
  'rounded-2xl border border-borda bg-vidro shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl'

export const cartao = `${vidro} ${respiro}`

/** Moldura do estado vazio de uma tela inteira. */
export const cartaoVazio =
  'rounded-2xl border border-dashed border-borda-forte bg-vidro p-8 backdrop-blur-xl'

/** Cabeçalho de tabela. */
export const cabecalhoTabela = 'border-b border-borda text-texto-suave'

/** Etiqueta arredondada (estado, Vigente, Período gratuito). */
export const marcador =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap'
export const marcadorNeutro = `${marcador} bg-vidro-hover text-texto-suave`

export const tituloPagina = 'font-titulo text-3xl font-semibold'
export const tituloCartao = 'text-lg font-semibold'

/** Número de destaque (totais do Painel). */
export const numeroGrande =
  'font-titulo text-4xl font-semibold tabular-nums tracking-tight'
