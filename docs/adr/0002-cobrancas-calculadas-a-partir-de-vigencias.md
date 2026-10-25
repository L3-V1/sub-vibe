# Cobranças calculadas a partir de Vigências, nunca persistidas

Uma Assinatura guarda apenas sua sequência de Vigências (data de início, valor e Ciclo de cobrança) e a Data de cancelamento. As Cobranças, o Próximo vencimento e o Gasto acumulado são sempre derivados dessas datas, sem registro de "pago". Escolhemos isso para que o dono nunca precise confirmar pagamentos à mão; o preço é não haver gasto real divergente do previsto (cobrança pulada, valor diferente com IOF).

## Consequências

- Cada nova Vigência recomeça a contagem das Cobranças a partir da sua data de início.
- Num ciclo mensal, um vencimento em dia inexistente no mês (ex.: 31) cai no último dia desse mês e volta ao dia original no mês seguinte.
- Registrar exceções exigiria introduzir Cobranças persistidas e rever esta decisão.
