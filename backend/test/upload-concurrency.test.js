const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-concurrency-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_UPLOAD_SIZE_MB = '1';
process.env.MAX_STORAGE_SIZE_MB = '1.5';
process.env.UPLOAD_TIMEOUT_MS = '1500';

const app = require('../src/app');
let server;
let baseUrl;

before(() => new Promise((resolve) => {
  server = app.listen(0, '127.0.0.1', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => new Promise((resolve) => {
  server.close(() => {
    fs.rmSync(storageDir, { recursive: true, force: true });
    resolve();
  });
}));

async function waitFor(predicate) {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('Tempo esgotado aguardando o upload.');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function beginPartialUpload() {
  const request = http.request(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1', 'Content-Type': 'multipart/form-data; boundary=dms-test' },
  });
  request.on('error', () => {});
  request.write('--dms-test\r\nContent-Disposition: form-data; name="file"; filename="parcial.txt"\r\nContent-Type: text/plain\r\n\r\n');
  request.write(Buffer.alloc(400 * 1024));
  return request;
}

test('arquivo parcial reservado não é contado duas vezes na cota', async () => {
  const request = beginPartialUpload();
  try {
    await waitFor(() => fs.readdirSync(storageDir).some((name) => fs.statSync(path.join(storageDir, name)).size >= 400 * 1024));
    const form = new FormData();
    form.append('file', new Blob([Buffer.alloc(200 * 1024)]), 'outro.txt');
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-1' },
      body: form,
    });
    assert.strictEqual(response.status, 201);
  } finally {
    request.destroy();
  }
  await waitFor(() => fs.readdirSync(storageDir).length === 1);
});

test('upload incompleto expira, remove o arquivo e libera a reserva', async () => {
  const request = beginPartialUpload();
  await new Promise((resolve) => request.once('close', resolve));
  await waitFor(() => fs.readdirSync(storageDir).length === 1);

  const form = new FormData();
  form.append('file', new Blob(['arquivo']), 'novo.txt');
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: form,
  });
  assert.strictEqual(response.status, 201);
});