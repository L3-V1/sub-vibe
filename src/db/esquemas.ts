import { z } from 'zod'
import { validarAssinatura } from '../domain/assinatura'
import type { Assinatura } from '../domain/tipos'

/** Dados recusados na gravação; `erros` traz as mensagens em pt-BR. */
export class ErroValidacao extends Error {
  erros: string[]

  constructor(erros: string[]) {
    super(erros.join(' '))
    this.name = 'ErroValidacao'
    this.erros = erros
  }
}

const dataISO = (campo: string) =>
  z.iso.date({
    error: `${campo} deve ser uma data real no formato AAAA-MM-DD.`,
  })

const id = z.string({ error: 'O identificador é obrigatório.' }).min(1, {
  error: 'O identificador é obrigatório.',
})

const MSG_NOME = 'O nome da Categoria não pode ficar vazio.'
export const esquemaCategoria = z.object({
  id,
  nome: z.string({ error: MSG_NOME }).trim().min(1, { error: MSG_NOME }),
})

const MSG_VALOR =
  'o valor deve ser maior ou igual a zero, em centavos inteiros.'
const MSG_QUANTIDADE =
  'o Ciclo de cobrança deve ser um número inteiro maior ou igual a 1.'
export const esquemaVigencia = z.object({
  inicio: dataISO('o início'),
  valorCentavos: z.int({ error: MSG_VALOR }).min(0, { error: MSG_VALOR }),
  ciclo: z.object({
    quantidade: z
      .int({ error: MSG_QUANTIDADE })
      .min(1, { error: MSG_QUANTIDADE }),
    unidade: z.enum(['dia', 'semana', 'mes', 'ano'], {
      error: 'a unidade do Ciclo de cobrança deve ser dia, semana, mês ou ano.',
    }),
  }),
  fim: dataISO('a Data de cancelamento').optional(),
})

const MSG_SERVICO = 'O Serviço não pode ficar vazio.'
export const esquemaAssinatura = z.object({
  id,
  servico: z.string({ error: MSG_SERVICO }).trim().min(1, {
    error: MSG_SERVICO,
  }),
  categoriaId: z.string({ error: 'Escolha uma Categoria.' }).min(1, {
    error: 'Escolha uma Categoria.',
  }),
  observacoes: z
    .string({ error: 'As observações devem ser um texto.' })
    .optional(),
  vigencias: z.array(esquemaVigencia, {
    error: 'As Vigências devem ser uma lista.',
  }),
})

const MSG_JANELA =
  'A janela de vencimentos deve ser um número inteiro de dias, maior ou igual a 1.'
export const esquemaPreferencias = z.object({
  id: z.literal('preferencias'),
  janelaVencimentosDias: z
    .int({ error: MSG_JANELA })
    .min(1, { error: MSG_JANELA }),
})

/** Mensagens do Zod; as de uma Vigência ganham o prefixo "Vigência N:". */
function mensagens(erro: z.ZodError): string[] {
  return erro.issues.map(({ path, message }) =>
    path[0] === 'vigencias' && typeof path[1] === 'number'
      ? `Vigência ${path[1] + 1}: ${message}`
      : message,
  )
}

/** Devolve os dados validados (e normalizados) ou lança `ErroValidacao`. */
export function validar<T>(esquema: z.ZodType<T>, dados: unknown): T {
  const resultado = esquema.safeParse(dados)
  if (!resultado.success) throw new ErroValidacao(mensagens(resultado.error))
  return resultado.data
}

/** Formato (Zod) e, se ele estiver certo, as invariantes do domínio. */
export function validarParaGravar(dados: unknown): Assinatura {
  const assinatura: Assinatura = validar(esquemaAssinatura, dados)
  const erros = validarAssinatura(assinatura)
  if (erros.length > 0) throw new ErroValidacao(erros)
  return assinatura
}
