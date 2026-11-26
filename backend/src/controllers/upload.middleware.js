const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const config = require('../config');
const { AppError } = require('../errors');
const documentsService = require('../services/documents.service');

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, config.storageDir),
  filename: (req, file, callback) => {
    req.storageFilename = `${randomUUID()}${path.extname(file.originalname)}`;
    documentsService.registerActiveFile(req.storageFilename);
    callback(null, req.storageFilename);
  },
});

async function uploadSingleFile(req, res, next) {
  try {
    const uploadLimit = await documentsService.reserveUpload();
    if (req.destroyed) {
      await documentsService.releaseUpload(uploadLimit);
      return;
    }
    const upload = multer({
      storage,
      limits: { fileSize: uploadLimit, files: 1, fields: 0, parts: 2 },
    }).single('file');
    const timeout = setTimeout(() => req.destroy(), config.uploadTimeoutMs);

    upload(req, res, async (error) => {
      clearTimeout(timeout);
      await documentsService.releaseUpload(uploadLimit, req.storageFilename);
      if (error?.code === 'LIMIT_FILE_SIZE' && uploadLimit < config.maxUploadBytes) {
        return next(new AppError(507, 'Limite de armazenamento atingido.'));
      }
      return next(error);
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { uploadSingleFile };