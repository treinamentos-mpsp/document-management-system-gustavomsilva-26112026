const { randomUUID } = require('crypto');
const documentsRepository = require('../repositories/documents.repository');
const fileStorage = require('../repositories/fileStorage');
const { AppError } = require('../errors');

function toPublicDocument(document) {
  const { storedName, ...publicFields } = document;
  return publicFields;
}

async function uploadDocument({ file, owner }) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  try {
    documentsRepository.save(document);
  } catch (error) {
    await fileStorage.remove(file.filename);
    throw error;
  }

  return toPublicDocument(document);
}

function listDocuments({ owner } = {}) {
  return documentsRepository.findAll({ owner }).map(toPublicDocument);
}

function getDocumentFile(id) {
  const document = documentsRepository.findById(id);

  if (!document || !fileStorage.exists(document.storedName)) {
    throw new AppError(404, 'Documento não encontrado.');
  }

  return {
    document: toPublicDocument(document),
    filePath: fileStorage.getFilePath(document.storedName),
  };
}

module.exports = { uploadDocument, listDocuments, getDocumentFile };
