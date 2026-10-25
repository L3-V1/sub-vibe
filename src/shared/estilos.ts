// Classes Tailwind repetidas entre as telas.

/** Contorno índigo ao focar pelo teclado; o padrão do navegador some no índigo escuro. */
export const focoVisivel =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

export const botaoPrimario = `rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-indigo-800 ${focoVisivel}`

export const botaoPerigo = `rounded-md bg-red-700 px-4 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-red-800 ${focoVisivel}`

export const botaoSecundario = `rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-slate-800 hover:bg-slate-100 ${focoVisivel}`

/** Botão compacto para ações em linhas de tabela e listas. */
export const botaoPequeno = `rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-medium whitespace-nowrap text-slate-800 hover:bg-slate-100 ${focoVisivel}`

export const campo =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-2 focus:outline-indigo-600'

export const rotulo = 'block text-sm font-medium text-slate-700'

/** Contêiner principal: cartões, formulários e diálogos usam o mesmo respiro. */
export const respiro = 'p-4 sm:p-6'

export const cartao = `rounded-lg border border-slate-200 bg-white ${respiro}`

/** Moldura do estado vazio de uma tela inteira. */
export const cartaoVazio =
  'rounded-lg border border-dashed border-slate-300 bg-white p-8'
