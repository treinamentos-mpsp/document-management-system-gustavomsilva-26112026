const documentsService = require('../services/documents.service');
const { AppError } = require('../errors');

async function upload(req, res) {
  const owner = req.get('X-User-Id');

  if (!req.file) {
    throw new AppError(400, 'Nenhum arquivo foi enviado no campo "file".');
  }

  if (!owner) {
    throw new AppError(400, 'O cabeçalho X-User-Id é obrigatório.');
  }

  const document = await documentsService.uploadDocument({ file: req.file, owner });
  res.status(201).json(document);
}

function list(req, res) {
  const owner = typeof req.query.owner === 'string' ? req.query.owner : undefined;
  res.json(documentsService.listDocuments({ owner }));
}

async function download(req, res) {
  const { document, filePath } = documentsService.getDocumentFile(req.params.id);
  res.attachment(document.originalName);
  res.type(document.mimeType);
  await res.sendFile(filePath);
}

module.exports = { upload, list, download };
