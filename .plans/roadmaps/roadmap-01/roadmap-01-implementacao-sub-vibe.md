---
titulo: Roadmap de implementação do Sub-vibe
data: 2026-10-25
status: aprovado
tipo: roadmap
numero: "01"
triagem: ok
---

# Roadmap de implementação do Sub-vibe

## Contexto

O projeto `sub-vibe` está vazio, exceto pelo modelo de domínio fechado na sabatina:
`GLOSSARY.md`, `docs/adr/0001-app-somente-no-navegador-com-indexeddb.md` e
`docs/adr/0002-cobrancas-calculadas-a-partir-de-vigencias.md`. Este roadmap leva da
pasta vazia a um app pessoal funcional, que roda só no navegador, para controlar
Assinaturas. Cada marco entrega algo utilizável e verificável. O vocabulário do código segue o glossário
(Assinatura, Vigência, Cobrança, Ciclo de cobrança, Categoria, Reativação...).

Stack: React + Vite + TypeScript, Dexie (IndexedDB), date-fns, Vitest, React Router,
Zod (validação de formulários e do backup).

---

## M0 · Fundação do projeto

- `git init`, Vite com o template `react-ts`, ESLint e Prettier, Vitest + Testing Library.
- Estrutura de pastas:
  - `src/domain/`: regras puras, sem React nem Dexie
  - `src/db/`: Dexie e repositórios
  - `src/features/<área>/`: telas e componentes
  - `src/shared/`: formatação de moeda e data em pt-BR, componentes de UI
- Layout base com navegação (Painel, Assinaturas, Categorias, Configurações) e idioma pt-BR.

**Pronto quando:** `npm run dev`, `npm test` e `npm run build` passam.

## M1 · Núcleo de domínio (puro e muito testado)

O coração do sistema, porque Cobranças nunca são persistidas (ADR 0002).

- Tipos em `src/domain/`:
  - `Assinatura { id, servico, categoriaId, observacoes?, vigencias: Vigencia[] }`
  - `Vigencia { inicio, valorCentavos, ciclo: { quantidade, unidade: 'dia'|'semana'|'mes'|'ano' }, fim? }`
  - `Categoria { id, nome }`
  - Dinheiro sempre em centavos inteiros (BRL).
- Cancelamento = `fim` na última Vigência. Reativação = nova Vigência após esse `fim`.
  O estado (Ativa ou Cancelada) é **derivado**, nunca armazenado.
- Funções:
  - `cobrancasNoIntervalo(assinatura, de, ate)`: calcula cada vencimento como `inicio + k·N`
    a partir da âncora da Vigência (sem somar iterativamente, para não perder o dia original).
    No ciclo mensal, um dia inexistente cai no último dia do mês.
  - `proximoVencimento(assinatura, hoje)`, considerando Vigências futuras.
  - `estado(assinatura, hoje)`.
  - `custoMensalEquivalente(assinatura, hoje)` com a Vigência vigente hoje. Fatores:
    mês → valor/N, ano → valor/12N, semana → valor·52/12N, dia → valor·365/12N.
  - `gastoAcumulado(assinaturas, de, ate)` e `gastoPorCategoria(...)`.
  - Invariantes: Vigências em ordem e sem sobreposição; `fim` em qualquer Vigência, e a próxima começa depois do `fim`; cancelamento ≥ início.
- Testes de casos-limite: 31/01 mensal, 29/02 anual, troca de ciclo no meio do mês, Vigência futura,
  Período gratuito (R$ 0), cancelar e reativar, Cobrança exatamente no dia do cancelamento.

**Pronto quando:** cobertura alta em `src/domain/` e todos os cenários da sabatina viram testes.

## M2 · Persistência local

- `src/db/db.ts`: Dexie com o schema v1 (`categorias`, `assinaturas` com as Vigências embutidas, `preferencias`).
- Repositórios finos (`assinaturasRepo`, `categoriasRepo`, `preferenciasRepo`) que validam as invariantes do domínio antes de gravar.
- Categorias iniciais na primeira execução: Streaming, Cursos, I.A., Software, Outros.
- Chamar `navigator.storage.persist()` na inicialização para reduzir o risco do ADR 0001.
- Hooks reativos com `useLiveQuery`.

**Pronto quando:** testes com `fake-indexeddb` cobrem a gravação, a leitura e a rejeição de dados inválidos.

## M3 · Gestão de Assinaturas e Categorias

- **Categorias:** listar, criar, renomear, excluir. Uma Categoria em uso não pode ser excluída sem reatribuir suas Assinaturas.
- **Assinaturas:**
  - lista com filtro (Ativas/Canceladas/Todas) e por Categoria, mostrando o Próximo vencimento e o Custo mensal equivalente
  - cadastro com serviço, Categoria, primeira Vigência e opção de Período gratuito inicial
  - detalhe com a linha do tempo das Vigências e as próximas Cobranças
  - ações: nova Vigência (pode ser futura), cancelar (com data), reativar, editar dados básicos, excluir (com confirmação)
- Mensagens de validação em pt-BR, feedback de sucesso e erro, estados vazios.

**Pronto quando:** dá para cadastrar as assinaturas reais do dono e o histórico fica correto.

## M4 · Painel

- Total mensal equivalente das Assinaturas Ativas.
- Próximos vencimentos na janela configurável (padrão de 7 dias, salva em `preferencias`).
- Gasto por Categoria em gráfico de barras horizontais ou rosca, com tabela de apoio.
- Gasto acumulado com seletor: ano corrente (padrão), últimos 12 meses, desde o início.
- Configurações: janela de vencimentos.

**Pronto quando:** os números do painel batem com os cálculos de domínio para um conjunto de dados de teste.

## M5 · Backup

- Exportar: baixa `sub-vibe-backup-AAAA-MM-DD.json` com `{ versaoSchema, exportadoEm, categorias, assinaturas, preferencias }`.
- Importar: valida com Zod e mostra uma prévia (quantidades) antes de **substituir** tudo, com confirmação.
- Rejeitar arquivos de versão desconhecida, com mensagem clara.

**Pronto quando:** exportar, limpar o IndexedDB e importar devolve um estado idêntico (teste automatizado de ida e volta).

## M6 · Polimento e distribuição (opcional)

- Responsividade (uso no celular), acessibilidade, revisão com a skill `ui-ux-kit:ui-guidelines`.
- PWA para instalar e usar offline (manifest + service worker via `vite-plugin-pwa`).
- Deploy estático (GitHub Pages ou Netlify). Os dados continuam locais em cada navegador.

---

## Arquivos críticos

- `src/domain/cobrancas.ts`, `src/domain/assinatura.ts`, `src/domain/custos.ts` (+ `*.test.ts`)
- `src/db/db.ts`, `src/db/*Repo.ts`
- `src/features/assinaturas/`, `src/features/categorias/`, `src/features/painel/`, `src/features/backup/`

## Verificação

- `npm test`: testes de domínio (M1), persistência com `fake-indexeddb` (M2) e ida e volta do backup (M5).
- `npm run build` sem erros de tipo.
- Teste manual com a skill `run` ou o Playwright: cadastrar uma assinatura mensal iniciada em 31/01,
  ver o vencimento de fevereiro no último dia, aplicar uma Vigência anual, cancelar, reativar, conferir o painel,
  exportar, limpar os dados do site e importar.
