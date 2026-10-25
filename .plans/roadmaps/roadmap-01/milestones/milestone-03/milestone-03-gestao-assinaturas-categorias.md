---
titulo: M3 · Gestão de Assinaturas e Categorias (Sub-vibe)
data: 2026-10-25
status: implementado
tipo: milestone
numero: "03"
pai: roadmaps/roadmap-01
triagem: ok
---

# M3 · Gestão de Assinaturas e Categorias (Sub-vibe)

## Contexto

M0, M1 e M2 estão concluídos: domínio puro em `src/domain/` (invariantes, Cobranças, custos) e persistência
em `src/db/` (Dexie, repositórios que lançam `ErroValidacao` com mensagens pt-BR, hooks `useLiveQuery`). As
telas ainda são placeholders. O M3 entrega as telas para cadastrar e manter Assinaturas e Categorias de verdade.

**Pronto quando:** dá para cadastrar as assinaturas reais do dono e o histórico fica correto.

> Observação: o M2 ainda não foi commitado (arquivos `src/db/` não rastreados). Sugiro commitar o M2 antes de
> começar; não faço commit sem você pedir.

## Decisões tomadas com o usuário

1. **Rotas + diálogos:** `/assinaturas` (lista), `/assinaturas/nova` (cadastro), `/assinaturas/:id` (detalhe).
   As ações do detalhe abrem um `<dialog>` nativo.
2. **Excluir Categoria em uso:** o diálogo mostra quantas Assinaturas a usam e pede uma Categoria de destino;
   move todas e exclui numa só transação.
3. **Período gratuito inicial:** checkbox "Começa com Período gratuito" + campo "Primeira Cobrança em". Gera duas
   Vigências: R$ 0 a partir do início (mesmo Ciclo) e a paga a partir dessa data.
4. **Correção:** ação "Desfazer último registro": se a última Vigência tem Data de cancelamento, remove essa data
   (desfaz o cancelamento); senão, se houver mais de uma Vigência, remove a última.

## Premissas (sem pergunta; me corrija se alguma estiver errada)

- **Transformações puras no domínio** (`src/domain/assinatura.ts`, testadas a 100%): `cancelar(a, data)`,
  `adicionarVigencia(a, v)` (serve para nova Vigência e Reativação), `desfazerUltimo(a)`. Elas só montam a nova
  lista; a validação continua em `assinaturasRepo.atualizar` (mensagens do `validarAssinatura`).
- **Disponibilidade das ações no detalhe:** última Vigência aberta → "Nova Vigência" e "Cancelar"; última com
  `fim` → "Reativar" (nova Vigência prefixada com valor/Ciclo da última, início sugerido = dia após o `fim`).
  "Editar", "Excluir" e "Desfazer último registro" (quando aplicável) sempre. Cancelamento futuro é permitido
  (a Assinatura segue Ativa até a data).
- **`categoriasRepo.excluir(id, destinoId?)`:** sem uso → exclui; em uso sem destino → recusa (como hoje);
  com destino → valida que existe e é diferente, move as Assinaturas e exclui, na mesma transação.
- **Lista de Assinaturas:** tabela com Serviço, Categoria, Estado, Próximo vencimento e Custo mensal equivalente;
  filtros em `useState` (Estado: Ativas por padrão / Canceladas / Todas; Categoria: Todas ou uma). Estados vazios
  distintos: "nenhuma cadastrada" (com botão para cadastrar) e "nenhuma com esses filtros".
- **Próximas Cobranças no detalhe:** até 5, dentro dos próximos 12 meses, via `cobrancasNoIntervalo`
  (`src/domain/cobrancas.ts`); Período gratuito não aparece (o domínio já ignora valor 0).
- **Linha do tempo:** cada Vigência com início, Data de cancelamento (se houver), valor, Ciclo ("a cada 3 meses"),
  marcadores "Período gratuito" (valor 0), "Vigente" e "Futura".
- **Formulários:** `noValidate` + mensagens próprias em pt-BR. Erros de leitura do formulário (ex.: valor
  "abc") e `ErroValidacao.erros` do repositório aparecem numa lista `role="alert"` no próprio formulário.
- **Feedback de sucesso:** provider mínimo de avisos (`src/shared/Avisos.tsx`, `role="status"`, some sozinho),
  montado no `Layout`, para a mensagem sobreviver à navegação (ex.: após cadastrar, vai ao detalhe com
  "Assinatura cadastrada.").
- **Helpers em `src/shared/formatacao.ts`:** `lerMoeda('39,90') → 3990` (aceita "R$", ponto de milhar, vírgula;
  `undefined` se inválido), `formatarDataISO(DataISO)`, `formatarCiclo(ciclo)`. E `hoje(): DataISO`
  (`format(new Date(), 'yyyy-MM-dd')`), chamado nas páginas.
- **`<dialog>` no jsdom:** `showModal`/`close` não são implementados; `src/test/setup.ts` ganha um stub mínimo
  que alterna o atributo `open`.
- **Datas nos testes:** `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime`, para não travar o
  IndexedDB nem o `userEvent`.
- Sem dependências novas. Visual simples, no estilo do `Layout` (Tailwind, slate/indigo); polimento fica no M6.

## Etapas

1. **Domínio e repositório** → verificar: `npm run test:coverage` mantém 100% em `src/domain/`.
   - `cancelar`, `adicionarVigencia`, `desfazerUltimo` em `src/domain/assinatura.ts` + testes (incluindo
     desfazer cancelamento, desfazer Vigência, não remover a única Vigência).
   - `categoriasRepo.excluir(id, destinoId?)` + testes (move e exclui; destino inexistente ou igual recusado;
     nada muda quando falha).

2. **Shared** → verificar: testes de `formatacao.test.ts` e dos componentes passam.
   - `lerMoeda`, `formatarDataISO`, `formatarCiclo`, `hoje`.
   - `Dialogo.tsx` (wrapper do `<dialog>` com título e `aria-labelledby`), `Avisos.tsx` (provider + `useAvisos`).
   - Stub do `<dialog>` em `src/test/setup.ts`.

3. **Categorias** (`src/features/categorias/CategoriasPage.tsx` + teste) → verificar: o teste passa.
   - Lista com contagem de Assinaturas, criar, renomear (inline), excluir com diálogo (destino só quando em uso).
   - Teste: criar, nome repetido mostra erro, renomear, excluir em uso reatribui.

4. **Cadastro** (`NovaAssinaturaPage.tsx`, `CamposVigencia.tsx` reutilizado nos diálogos) → verificar: o teste passa.
   - Serviço, Categoria, Observações, início, valor, Ciclo; Período gratuito opcional.
   - Teste: cadastro simples; com Período gratuito gera 2 Vigências; mensagens de erro em pt-BR.

5. **Lista e detalhe** (`AssinaturasPage.tsx`, `AssinaturaPage.tsx`, rotas em `src/router.tsx`) → verificar: os testes passam.
   - Lista com filtros e estados vazios; detalhe com linha do tempo, próximas Cobranças e os diálogos de ação.
   - Testes (data fixa): mensal iniciada em 31/01 mostra o vencimento de fevereiro no último dia; nova Vigência
     anual; cancelar → Cancelada e sem próximas Cobranças; reativar; desfazer; editar; excluir com confirmação;
     `:id` inexistente mostra "Assinatura não encontrada"; filtros da lista.

6. **Fechamento** → verificar: `npm test`, `npm run lint`, `npm run format:check`, `npm run build` limpos.
   - `CLAUDE.md`: "Estado atual" (M3 concluído) e a lista de rotas.
   - Manual com a skill `run`: cadastrar 2 ou 3 assinaturas reais, cancelar, reativar e conferir o histórico.
   - Sem commit, a menos que você peça.

## Arquivos críticos

- `src/features/assinaturas/` (`AssinaturasPage`, `NovaAssinaturaPage`, `AssinaturaPage`, `CamposVigencia` + testes)
- `src/features/categorias/CategoriasPage.tsx` (+ teste)
- `src/shared/formatacao.ts`, `src/shared/Dialogo.tsx`, `src/shared/Avisos.tsx`, `src/shared/Layout.tsx`
- `src/domain/assinatura.ts`, `src/db/categoriasRepo.ts` (+ testes), `src/router.tsx`, `src/test/setup.ts`, `CLAUDE.md`
- Reutiliza: `estado`, `vigenciaEm`, `validarAssinatura` (`src/domain/assinatura.ts`), `cobrancasNoIntervalo`,
  `proximoVencimento` (`src/domain/cobrancas.ts`), `custoMensalEquivalente` (`src/domain/custos.ts`), repositórios
  e hooks de `src/db/`, `ErroValidacao` (`src/db/esquemas.ts`), `formatarMoeda` (`src/shared/formatacao.ts`).

## Verificação

- `npm test` / `npm run test:coverage`: domínio a 100%, persistência e telas verdes.
- `npm run build`, `npm run lint`, `npm run format:check`: limpos.
- Manual: `npm run dev`; cadastrar uma mensal iniciada em 31/01 (vencimento de fevereiro no último dia), aplicar
  uma Vigência anual, cancelar, reativar, desfazer, excluir uma Categoria em uso movendo as Assinaturas.
