# App somente no navegador, com dados no IndexedDB

O Sub-vibe é de uso pessoal, então decidimos não ter backend: a aplicação é só frontend e persiste tudo no IndexedDB do navegador. Isso dispensa login, servidor e banco hospedado, ao custo de os dados ficarem presos a um navegador de um dispositivo e poderem ser perdidos se o armazenamento do site for limpo.

## Opções consideradas

- Hospedado com login e Postgres: acesso de qualquer dispositivo, mas exige infraestrutura e autenticação para um único usuário.
- Local com SQLite: exige um processo servidor rodando na máquina.

## Consequências

- Alertas de vencimento só aparecem com o app aberto (nada de e-mail ou push agendado).
- Sincronizar entre dispositivos exigiria rever esta decisão.
