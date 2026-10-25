---
titulo: M2 · Persistência local (Sub-vibe)
data: 2026-10-25
status: aprovado
tipo: milestone
numero: "02"
pai: roadmaps/roadmap-01
triagem: ok
---

# M2 · Persistência local (Sub-vibe)

## Contexto

O M1 está concluído: `src/domain/` tem os tipos (`tipos.ts`), as invariantes (`validarAssinatura` em
`assinatura.ts`), Cobranças e custos, com 100% de cobertura. `src/db/` está vazio (só `.gitkeep`). Pelo ADR 0001
tudo persiste no IndexedDB do navegador. O M2 cria a camada que o M3 (telas) vai usar: Dexie com o schema v1,
repositórios finos que recusam dados inválidos, Categorias iniciais, `navigator.storage.persist()` e hooks
reativos.

**Pronto quando:** testes com `fake-indexeddb` cobrem a gravação, a leitura e a rejeição de dados inválidos.

## Decisões tomadas com o usuário

1. **Validação = Zod + `validarAssinatura`.** Schemas Zod checam o formato (DataISO real em `'AAAA-MM-DD'`,
   serviço e nome não vazios, unidade do ciclo válida, centavos inteiros); `validarAssinatura` (`src/domain/assinatura.ts`)
   checa as invariantes. Os schemas ficam prontos para o backup do M5.
2. **`preferencias` é um registro único** `{ id: 'preferencias', janelaVencimentosDias: number }`; a leitura aplica
   o padrão (7 dias) quando o registro ainda não existe.

## Premissas (sem pergunta; me corrija se alguma estiver errada)

- Dependências novas: `dexie`, `dexie-react-hooks`, `zod` (v4, que tem `z.iso.date()`); em dev, `fake-indexeddb`.
- Schema v1 (`src/db/db.ts`): `categorias: 'id'`, `assinaturas: 'id, categoriaId'` (Vigências embutidas no
  documento), `preferencias: 'id'`. Tipado com `EntityTable` do Dexie 4, reutilizando os tipos de `src/domain/tipos.ts`.
- IDs gerados pelo repositório com `crypto.randomUUID()`.
- Categorias iniciais (Streaming, Cursos, I.A., Software, Outros) gravadas no evento `db.on('populate')`, que o
  Dexie dispara só quando o banco é criado: é exatamente a "primeira execução", sem flag extra.
- Integridade referencial nos repositórios: uma Assinatura só grava se a `categoriaId` existir, e uma Categoria
  em uso **não** pode ser excluída (o M3 faz a reatribuição antes). Nome de Categoria repetido (ignorando
  maiúsculas e espaços) é recusado.
- Rejeição = exceção `ErroValidacao extends Error` com `erros: string[]` em pt-BR (mesmo formato de
  `validarAssinatura`), pronta para o M3 exibir. As mensagens do Zod são nossas, em pt-BR, não as padrão em inglês.
- Sem operações de alto nível como "cancelar" ou "reativar" no repositório: o M3 monta a nova lista de Vigências
  e chama `atualizar`, que revalida tudo. Nada além do que o roadmap pede.
- `navigator.storage.persist()` é chamado em `main.tsx` com checagem de existência (`navigator.storage?.persist`),
  ignorando o resultado; não bloqueia a renderização.

## Etapas

1. **Dependências e setup de testes** → verificar: `npm test` continua verde.
   - `npm i dexie dexie-react-hooks zod`; `npm i -D fake-indexeddb`.
   - `src/test/setup.ts`: `import 'fake-indexeddb/auto'` (o jsdom não tem IndexedDB).
   - `vite.config.ts`: `coverage.include` passa a `['src/domain/**', 'src/db/**']`.

2. **Banco e schemas** (`src/db/db.ts`, `src/db/esquemas.ts`) → verificar: `npm run build` passa.
   - `db.ts`: classe/instância Dexie `'sub-vibe'`, versão 1, as três tabelas, `populate` com as 5 Categorias,
     constante `PREFERENCIAS_PADRAO = { id: 'preferencias', janelaVencimentosDias: 7 }`.
   - `esquemas.ts`: `esquemaCategoria`, `esquemaVigencia`, `esquemaAssinatura`, `esquemaPreferencias` em Zod;
     `ErroValidacao`; helper que converte `ZodError` + `validarAssinatura` em `string[]`.

3. **Repositórios** (`src/db/categoriasRepo.ts`, `assinaturasRepo.ts`, `preferenciasRepo.ts` + `*.test.ts`)
   → verificar: os testes passam.
   - `categoriasRepo`: `listar()` (ordem alfabética pt-BR), `criar(nome)`, `renomear(id, nome)`, `excluir(id)`.
   - `assinaturasRepo`: `listar()`, `obter(id)`, `criar(dados sem id) → id`, `atualizar(assinatura)`, `excluir(id)`.
     `criar`/`atualizar` validam formato, invariantes e Categoria existente dentro de uma transação.
   - `preferenciasRepo`: `obter()` (com padrão), `atualizar(parcial)` (janela inteira ≥ 1).
   - Testes (com `beforeEach`: `await db.delete(); await db.open()`, o que refaz o `populate`):
     Categorias iniciais na primeira abertura; ida e volta de uma Assinatura com várias Vigências (incluindo `fim`
     e Período gratuito); rejeições: Vigências fora de ordem/sobrepostas, data inválida (`'2026-02-30'`, `'31/01/2026'`),
     serviço vazio, valor fracionário, Categoria inexistente, nome de Categoria vazio ou repetido, excluir Categoria em
     uso, janela 0; e que nada é gravado quando a validação falha.

4. **Hooks reativos** (`src/db/hooks.ts` + teste) → verificar: os testes passam.
   - `useCategorias()`, `useAssinaturas()`, `useAssinatura(id)`, `usePreferencias()` sobre `useLiveQuery`
     (devolvem `undefined` enquanto carregam).
   - Teste com `renderHook` + `waitFor`: o hook reflete uma gravação feita depois da montagem.

5. **Inicialização e documentação** → verificar: `npm run test:coverage` (meta ≥ 95% em `src/db/`), `npm run lint`,
   `npm run format:check` e `npm run build` passam; `npm run dev` abre sem erros no console e o DevTools mostra o
   banco `sub-vibe` com as 5 Categorias.
   - `main.tsx`: chamar `navigator.storage?.persist?.()`.
   - Remover `src/db/.gitkeep`.
   - `CLAUDE.md`: "Estado atual" (M2 concluído) e a menção a `fake-indexeddb` (já no setup).
   - Sem commit, a menos que você peça.

## Arquivos críticos

- `src/db/db.ts`, `src/db/esquemas.ts`, `src/db/*Repo.ts`, `src/db/hooks.ts` (+ `*.test.ts` ao lado)
- `src/test/setup.ts`, `vite.config.ts`, `package.json`, `src/main.tsx`, `CLAUDE.md`
- Reutiliza: `validarAssinatura` (`src/domain/assinatura.ts`) e os tipos de `src/domain/tipos.ts`

## Verificação

- `npm test` / `npm run test:coverage`: domínio e persistência verdes, cobertura alta em `src/db/`.
- `npm run build`, `npm run lint`, `npm run format:check`: limpos.
- Manual: `npm run dev`, abrir o app e conferir no DevTools (Application → IndexedDB) o banco com as Categorias iniciais.
