const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const config = require('../config');

fs.mkdirSync(config.storageDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storageDir),
  filename: (req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
});

const uploadSingleFile = multer({
  storage: diskStorage,
  limits: { fileSize: config.maxUploadBytes, files: 1 },
}).single('file');

function getFilePath(storedName) {
  return path.join(config.storageDir, storedName);
}

function exists(storedName) {
  return fs.existsSync(getFilePath(storedName));
}

async function remove(storedName) {
  await fs.promises.rm(getFilePath(storedName), { force: true });
}

module.exports = { uploadSingleFile, getFilePath, exists, remove };
