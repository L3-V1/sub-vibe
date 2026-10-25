import { ErroValidacao } from '../../db/esquemas'
import type { Assinatura, UnidadeCiclo, Vigencia } from '../../domain/tipos'
import { lerMoeda } from '../../shared/formatacao'

const texto = (dados: FormData, campo: string) =>
  String(dados.get(campo) ?? '').trim()

/** Serviço, Categoria e Observações (de `CamposBasicos`); o repositório valida. */
export function lerBasicos(
  dados: FormData,
): Pick<Assinatura, 'servico' | 'categoriaId' | 'observacoes'> {
  return {
    servico: texto(dados, 'servico'),
    categoriaId: texto(dados, 'categoriaId'),
    observacoes: texto(dados, 'observacoes') || undefined,
  }
}

/**
 * A Vigência de `CamposVigencia`. Lança `ErroValidacao` para o que o formulário
 * não consegue ler (data vazia, valor que não é dinheiro); o resto o repositório valida.
 */
export function lerVigencia(dados: FormData): Vigencia {
  const inicio = texto(dados, 'inicio')
  const valorCentavos = lerMoeda(texto(dados, 'valor'))
  const erros: string[] = []
  if (inicio === '') erros.push('Informe a data de início.')
  if (valorCentavos === undefined) {
    erros.push('Informe o valor em reais, como 39,90.')
  }
  if (erros.length > 0 || valorCentavos === undefined) {
    throw new ErroValidacao(erros)
  }
  return {
    inicio,
    valorCentavos,
    ciclo: {
      quantidade: Number(texto(dados, 'quantidade')),
      unidade: texto(dados, 'unidade') as UnidadeCiclo,
    },
  }
}
