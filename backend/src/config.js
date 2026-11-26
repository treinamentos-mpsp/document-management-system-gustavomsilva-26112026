const path = require('path');

const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '..', 'storage');
const BYTES_PER_MEGABYTE = 1024 * 1024;

module.exports = {
  port: Number(process.env.PORT) || 3000,
  storageDir: path.resolve(process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR),
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_SIZE_MB) || 10) * BYTES_PER_MEGABYTE,
};
