// Preferência de aparência deste navegador. Fica no localStorage, fora do
// IndexedDB e do backup, porque só muda a aparência. O `index.html` aplica a
// mesma chave antes do React carregar, para a tela não piscar.

export type Tema = 'escuro' | 'claro'

const CHAVE = 'sub-vibe:tema'

export function lerTema(): Tema {
  try {
    return localStorage.getItem(CHAVE) === 'claro' ? 'claro' : 'escuro'
  } catch {
    return 'escuro'
  }
}

export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.tema = tema
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // Sem armazenamento (ex.: janela privada), o tema vale só nesta visita.
  }
}
