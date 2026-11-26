const multer = require('multer');
const { AppError } = require('../errors');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = status === 413
      ? 'Arquivo acima do tamanho máximo permitido.'
      : 'Falha ao processar o envio do arquivo.';
    return res.status(status).json({ error: message });
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { errorHandler };
