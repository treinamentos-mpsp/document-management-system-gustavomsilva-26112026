const path = require('path');

const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '..', 'storage');
const BYTES_PER_MEGABYTE = 1024 * 1024;
const maxStorageBytes = Number(process.env.MAX_STORAGE_SIZE_MB ?? 100) * BYTES_PER_MEGABYTE;
const maxUploadBytes = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10) * BYTES_PER_MEGABYTE;
const uploadTimeoutMs = Number(process.env.UPLOAD_TIMEOUT_MS ?? 120000);

if (!Number.isSafeInteger(maxStorageBytes) || maxStorageBytes <= 0) {
  throw new Error('MAX_STORAGE_SIZE_MB deve ser um número positivo de megabytes.');
}

if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes <= 0) {
  throw new Error('MAX_UPLOAD_SIZE_MB deve ser um número positivo de megabytes.');
}

if (!Number.isSafeInteger(uploadTimeoutMs) || uploadTimeoutMs <= 0 || uploadTimeoutMs > 2147483647) {
  throw new Error('UPLOAD_TIMEOUT_MS deve ser um número positivo de milissegundos.');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  storageDir: path.resolve(process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR),
  maxUploadBytes,
  maxStorageBytes,
  uploadTimeoutMs,
};
