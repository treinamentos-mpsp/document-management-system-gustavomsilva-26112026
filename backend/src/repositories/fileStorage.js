const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');

const storageDirectory = path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '..', '..', 'storage'));
const maxUploadBytes = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10) * 1024 * 1024;
if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_MB deve ser um número positivo de megabytes.');
}
fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, storageDirectory),
  filename: (req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname)}`),
});
const uploadSingleFile = multer({ storage, limits: { fileSize: maxUploadBytes, files: 1 } }).single('file');

function getFilePath(filename) {
  return path.join(storageDirectory, filename);
}

function exists(filename) {
  return fs.existsSync(getFilePath(filename));
}

async function remove(filename) {
  await fs.promises.rm(getFilePath(filename), { force: true });
}

module.exports = { uploadSingleFile, getFilePath, exists, remove };