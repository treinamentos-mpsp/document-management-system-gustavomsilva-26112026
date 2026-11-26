const multer = require('multer');
const { AppError } = require('../errors');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: 'Não foi possível processar o arquivo enviado.' });
  }
  if (error instanceof AppError) return res.status(error.status).json({ error: error.message });
  if (error.code === 'ENOENT') return res.status(404).json({ error: 'Documento não encontrado.' });
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { errorHandler };