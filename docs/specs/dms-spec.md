# Especificação - Document Management System (DMS)

## 1. Objetivo

Entregar um sistema web que permite a usuários enviar, listar e baixar documentos, com armazenamento local no servidor e metadados em memória nesta fase.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos (com filtro por dono)
- Download de documentos
- Gestão simples por usuário (cada documento pertence a um usuário)
- Validação básica de entrada (campo obrigatório, tamanho máximo)
- Interface web para as três operações acima

### Fora do escopo

- Armazenamento externo ou em nuvem (S3, GCS, Azure Blob etc.)
- Versionamento de documentos
- Autenticação e autorização completas (login, senha, tokens, perfis)
- Persistência em banco de dados (metadados ficam em memória)
- Exclusão, edição de metadados e compartilhamento de documentos
- Pré-visualização de conteúdo e busca textual

## 3. Requisitos funcionais

| ID    | Requisito                                                                               |
| ----- | --------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento informando o arquivo e seu identificador de usuário  |
| RF-02 | O sistema rejeita envios sem arquivo ou com arquivo acima do tamanho máximo configurado |
| RF-03 | O usuário pode listar os documentos enviados                                            |
| RF-04 | A listagem pode ser filtrada pelo dono (`owner`)                                        |
| RF-05 | O usuário pode baixar um documento pelo seu identificador                               |
| RF-06 | O download retorna `404` quando o identificador não existe                              |
| RF-07 | O frontend exibe formulário de upload, tabela de documentos e link de download          |
| RF-08 | O frontend exibe mensagens de erro e de sucesso em português                            |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local em `backend/storage` via `multer` com `diskStorage`          |
| RNF-02 | Metadados mantidos em memória nesta fase (perdidos ao reiniciar o processo)                         |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor), com valores padrão seguros                      |
| RNF-04 | Nome físico do arquivo é gerado pelo sistema (UUID + extensão); o nome original não define caminho |
| RNF-05 | Backend em CommonJS; frontend em React + Vite (ESM); sem TypeScript                                 |
| RNF-06 | Testes backend com runner nativo `node:test`                                                        |
| RNF-07 | Dependências preferencialmente já presentes em `package.json`                                       |

## 5. Modelo de dados

### Metadados do documento (em memória)

| Campo        | Tipo   | Descrição                                                          |
| ------------ | ------ | ------------------------------------------------------------------ |
| id           | string | Identificador único do documento (UUID v4)                         |
| originalName | string | Nome original do arquivo enviado                                   |
| storedName   | string | Nome do arquivo físico em `backend/storage` (interno, não exposto) |
| mimeType     | string | Tipo MIME informado no upload                                      |
| size         | number | Tamanho em bytes                                                   |
| uploadedAt   | string | Data/hora do upload (ISO 8601, UTC)                                |
| owner        | string | Identificador do usuário dono                                      |

### Variáveis de ambiente

| Variável           | Padrão            | Descrição                             |
| ------------------ | ----------------- | ------------------------------------- |
| PORT               | 3000              | Porta do servidor Express             |
| STORAGE_DIR        | `backend/storage` | Pasta de gravação dos arquivos        |
| MAX_UPLOAD_SIZE_MB | 10                | Tamanho máximo de upload em megabytes |

## 6. Contratos de API

Prefixo do frontend: `/api` (proxy do Vite para o backend, que remove o prefixo). Os endpoints abaixo são relativos ao backend.

Identificação do usuário nesta fase: header `X-User-Id` (sem autenticação).

### POST /upload

- Entrada: `multipart/form-data` com campo `file` e header `X-User-Id`
- Sucesso: `201 Created`, corpo com metadados do documento (sem `storedName`)

```json
{
  "id": "3f2a1c9e-8b7d-4e5f-9a1b-2c3d4e5f6a7b",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 20480,
  "uploadedAt": "2026-11-26T12:00:00.000Z",
  "owner": "user-1"
}
```

- Erros:
  - `400` - campo `file` ausente ou header `X-User-Id` ausente
  - `413` - arquivo acima de `MAX_UPLOAD_SIZE_MB`
  - `500` - falha inesperada

### GET /documents

- Query opcional: `owner` (filtra pelo dono)
- Sucesso: `200 OK`, array de metadados (sem `storedName`)

### GET /documents/:id/download

- Sucesso: `200 OK`, corpo binário com `Content-Type` (mimeType) e `Content-Disposition: attachment; filename="<originalName>"`
- Erros:
  - `404` - documento inexistente ou arquivo físico ausente
  - `500` - falha inesperada

### Formato de erro padrão

```json
{ "error": "Mensagem em português descrevendo o problema" }
```

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples dentro de `backend/src`:
  - `routes/` define endpoints e delega para controllers
  - `controllers/` trata HTTP, validação básica e códigos de status
  - `services/` concentra regras de negócio
  - `repositories/` cuida de persistência (metadados em memória e arquivos em disco)
- Fluxo de dependência: `routes -> controllers -> services -> repositories`.
- `multer` com `diskStorage` grava em `STORAGE_DIR`; o limite de tamanho vem de `MAX_UPLOAD_SIZE_MB`.
- Repositório de metadados é um `Map` em memória, encapsulado para permitir troca futura por banco.
- Frontend em React com Hooks, organizado em `components/`, `pages/` e `services/`. Chamadas via `fetch` ao prefixo `/api`.

## 8. Riscos e questões em aberto

| Risco                                                       | Mitigação proposta                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Identificação por `X-User-Id` não é segura                  | Aceito como limitação da fase; autenticação fica fora do escopo     |
| Perda de metadados ao reiniciar o processo                  | Documentado; persistência em banco será etapa futura                |
| Arquivos órfãos em disco se o metadado falhar após gravação | Remover o arquivo no service em caso de erro                        |
| Upload de tipos perigosos                                   | Arquivos são enviados com `Content-Disposition: attachment`         |
| Crescimento do `storage` sem limite                         | Limite por arquivo; limpeza fica fora do escopo                     |

## 9. Plano de execução

Cada etapa só começa após a anterior ser aceita.

1. **Configuração base do backend**
   - Arquivos: `backend/src/config.js`, `backend/src/app.js`
   - Critério de aceite: servidor sobe na `PORT` configurada; `STORAGE_DIR` é criado se não existir

2. **Repositórios de metadados e de arquivos**
   - Arquivos: `backend/src/repositories/documentRepository.js`, `backend/src/repositories/fileStorage.js`
   - Critério de aceite: inserção, listagem por dono e busca por id cobertas pelos testes de endpoint

3. **Serviço de documentos**
   - Arquivos: `backend/src/services/documentService.js`, `backend/src/errors.js`
   - Critério de aceite: regras de existência e ownership aplicadas; arquivo órfão removido em falha

4. **Upload (multer + diskStorage)**
   - Arquivos: `backend/src/controllers/documentController.js`, `backend/src/routes/documentRoutes.js`
   - Critério de aceite: `POST /upload` retorna `201` com metadados; `400` e `413` conforme contrato

5. **Listagem**
   - Arquivos: `backend/src/controllers/documentController.js`, `backend/src/routes/documentRoutes.js`
   - Critério de aceite: `GET /documents` retorna lista e aceita filtro `owner`

6. **Download**
   - Arquivos: `backend/src/controllers/documentController.js`, `backend/src/routes/documentRoutes.js`
   - Critério de aceite: `GET /documents/:id/download` retorna o binário com headers corretos; `404` para id inexistente

7. **Tratamento de erros e testes de backend**
   - Arquivos: `backend/src/controllers/errorController.js`, `backend/test/documents.test.js`
   - Critério de aceite: `npm test` passa cobrindo os três endpoints e os casos de erro

8. **Frontend - serviço de API**
   - Arquivos: `frontend/src/services/documentApi.js`
   - Critério de aceite: chamadas via `/api` funcionam com o proxy do Vite

9. **Frontend - componentes e página**
   - Arquivos: `frontend/src/components/UploadForm.jsx`, `frontend/src/components/DocumentTable.jsx`, `frontend/src/pages/DocumentsPage.jsx`, `frontend/src/App.jsx`
   - Critério de aceite: upload, listagem e download funcionam pela interface; erros exibidos em português; `npm run build` sem erros

10. **Revisão final**
    - Critério de aceite: fluxo completo validado manualmente; requisitos RF-01 a RF-08 e RNF-01 a RNF-07 atendidos
