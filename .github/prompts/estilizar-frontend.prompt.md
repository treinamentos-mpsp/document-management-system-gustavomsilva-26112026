---
description: Estiliza o frontend React do DMS com foco em responsividade, acessibilidade e consistência visual.
name: estilizar-frontend
argument-hint: objetivo visual ou componentes a estilizar
agent: agent
---

# Estilizar o frontend do DMS

Estilize o frontend conforme a solicitação: `${input:objetivo:Descreva o objetivo visual ou os componentes a estilizar}`.

Antes de editar, examine os componentes, estilos e dependências existentes. Mantenha a identidade visual já estabelecida quando houver uma e adapte as escolhas ao uso do sistema de gestão de documentos.

## Requisitos

- Preserve as funcionalidades de upload, listagem e download, os estados existentes e a integração via `fetch` com `/api`.
- Mantenha React com componentes funcionais e Hooks, JavaScript e a organização existente em `components/`, `pages/` e `services/`. Reutilize componentes e estilos; evite duplicação e alterações no backend.
- Prefira CSS moderno e as dependências já instaladas. Use variáveis CSS para cores, espaçamentos e tipografia, além de Flexbox, Grid e consultas de mídia quando apropriado. Acrescente dependências somente quando necessárias.
- Crie uma interface clara e funcional para uso frequente, com hierarquia visual, cores e tipografia consistentes. Evite elementos decorativos que prejudiquem a leitura ou a execução das tarefas.
- Garanta layouts responsivos em telas pequenas e grandes, sem sobreposição ou corte de conteúdo. Adapte tabelas e controles para dispositivos móveis.
- Use HTML semântico, rótulos associados aos campos, contraste adequado, navegação por teclado e foco visível. Respeite a preferência por movimento reduzido e mantenha mensagens de sucesso e erro acessíveis em português.
- Organize os estilos junto aos componentes ou em arquivos CSS compartilhados quando houver reutilização. Evite estilos inline extensos e mudanças não relacionadas.

## Validação

- Execute `npm run build` no diretório `frontend` e corrija erros relacionados às alterações.
- Verifique o upload, a listagem e o download, incluindo estados de erro, e inspecione a apresentação em tamanhos de tela móvel e desktop quando houver navegador disponível.
- Informe o que foi alterado, os resultados da validação e quaisquer verificações que não puderam ser executadas.