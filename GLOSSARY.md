# Sub-vibe

Aplicação de uso pessoal para registrar e acompanhar as assinaturas recorrentes do dono (streaming, cursos, I.A. etc.). Nenhum pagamento passa pela aplicação: ela só controla gastos e vencimentos.

## Linguagem

**Assinatura**:
Um compromisso de pagamento recorrente do dono com um serviço externo, registrado manualmente, com valor sempre em reais.
_Evitar_: Plano, inscrição, serviço

**Serviço**:
O nome do produto externo assinado (ex.: Netflix Premium), guardado como atributo da Assinatura e não como cadastro próprio.
_Evitar_: Fornecedor, plataforma

**Categoria**:
Um agrupamento criado e editável pelo dono (ex.: Streaming, Curso, I.A.); cada Assinatura pertence a exatamente uma.
_Evitar_: Tipo, tag, natureza

**Ciclo de cobrança**:
O intervalo entre duas cobranças de uma Assinatura, expresso como N dias, semanas, meses ou anos.
_Evitar_: Periodicidade, frequência, recorrência

**Custo mensal equivalente**:
O valor de uma Assinatura convertido proporcionalmente para um mês, usado para comparar e somar Assinaturas de ciclos diferentes.
_Evitar_: Mensalidade, média

**Cobrança**:
Cada pagamento previsto de uma Assinatura, derivado do início e do Ciclo de cobrança da Vigência em que cai; não é registrada nem confirmada pelo dono.
_Evitar_: Pagamento, fatura, parcela

**Vigência**:
Um trecho da vida de uma Assinatura com valor e Ciclo de cobrança próprios, a partir de uma data de início; uma Assinatura é uma sequência de Vigências, e cada nova Vigência recomeça a contagem das Cobranças.
_Evitar_: Reajuste, troca de plano, versão, condição

**Próximo vencimento**:
A data da primeira Cobrança futura de uma Assinatura Ativa.
_Evitar_: Renovação, data de pagamento

**Período gratuito**:
Uma Vigência de valor zero, normalmente a primeira de uma Assinatura.
_Evitar_: Trial, teste grátis, estado em teste

**Data de cancelamento**:
O dia em que o dono cancelou a Assinatura, encerrando a Vigência corrente; não há Cobranças depois dela até uma eventual Reativação.
_Evitar_: Fim de acesso, data de término

**Reativação**:
A volta de uma Assinatura Cancelada, que começa uma nova Vigência na mesma Assinatura em vez de criar outra.
_Evitar_: Reassinatura, recadastro

**Ativa / Cancelada**:
Os dois únicos estados de uma Assinatura; a Cancelada não gera Cobranças futuras mas permanece no histórico e pode ser reativada.
_Evitar_: Pausada, inativa, encerrada, em teste

**Gasto acumulado**:
A soma das Cobranças já ocorridas num intervalo de tempo, incluindo as de Assinaturas hoje Canceladas.
_Evitar_: Total gasto, histórico
