const fs = require('fs');
const path = require('path');
const config = require('../config');
const { AppError } = require('../errors');

fs.mkdirSync(config.storageDir, { recursive: true });

let reservedBytes = 0;
let quotaLock = Promise.resolve();
const activeFiles = new Set();

function withQuotaLock(action) {
  const result = quotaLock.then(action);
  quotaLock = result.catch(() => {});
  return result;
}

async function reserveUpload() {
  const entries = await fs.promises.readdir(config.storageDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && !activeFiles.has(entry.name));
  const sizes = await Promise.all(files.map((entry) => fs.promises.stat(path.join(config.storageDir, entry.name))));
  const usedBytes = sizes.reduce((total, stats) => total + stats.size, 0);
  const availableBytes = config.maxStorageBytes - usedBytes - reservedBytes;
  if (availableBytes <= 0) throw new AppError(507, 'Limite de armazenamento atingido.');
  const uploadLimit = Math.min(config.maxUploadBytes, availableBytes);
  reservedBytes += uploadLimit;
  return uploadLimit;
}

function registerActiveFile(filename) {
  activeFiles.add(filename);
}

function releaseUpload(uploadLimit, filename) {
  return withQuotaLock(() => {
    reservedBytes -= uploadLimit;
    activeFiles.delete(filename);
  });
}

function getFilePath(storedName) {
  return path.join(config.storageDir, storedName);
}

function exists(storedName) {
  return fs.existsSync(getFilePath(storedName));
}

async function remove(storedName) {
  await fs.promises.rm(getFilePath(storedName), { force: true });
}

module.exports = {
  reserveUpload: () => withQuotaLock(reserveUpload),
  registerActiveFile,
  releaseUpload,
  getFilePath,
  exists,
  remove,
};
