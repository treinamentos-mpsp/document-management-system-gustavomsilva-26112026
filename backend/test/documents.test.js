const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_UPLOAD_SIZE_MB = '1';
process.env.MAX_STORAGE_SIZE_MB = '1.5';

const app = require('../src/app');

let server;
let baseUrl;
let uploaded;

function buildForm(content, fileName = 'contrato.pdf', type = 'application/pdf') {
  const form = new FormData();
  form.append('file', new Blob([content], { type }), fileName);
  return form;
}

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

test('POST /upload grava o arquivo e retorna os metadados', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm('conteudo do contrato'),
  });
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.strictEqual(body.originalName, 'contrato.pdf');
  assert.strictEqual(body.mimeType, 'application/pdf');
  assert.strictEqual(body.size, Buffer.byteLength('conteudo do contrato'));
  assert.strictEqual(body.owner, 'user-1');
  assert.strictEqual(body.storedName, undefined);
  assert.ok(body.id);
  assert.ok(!Number.isNaN(Date.parse(body.uploadedAt)));

  const storedFiles = fs.readdirSync(storageDir).filter((name) => name !== '.gitkeep');
  assert.strictEqual(storedFiles.length, 1);

  uploaded = body;
});

test('POST /upload sem arquivo retorna 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: new FormData(),
  });

  assert.strictEqual(response.status, 400);
  assert.ok((await response.json()).error);
});

test('POST /upload sem X-User-Id retorna 400', async () => {
  const filesBefore = fs.readdirSync(storageDir);
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: buildForm('sem dono'),
  });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(fs.readdirSync(storageDir), filesBefore);
});

test('POST /upload rejeita campos adicionais sem deixar arquivos', async () => {
  const filesBefore = fs.readdirSync(storageDir);
  const form = buildForm('arquivo');
  form.append('campo', 'valor');
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: form,
  });

  assert.strictEqual(response.status, 400);
  assert.deepStrictEqual(fs.readdirSync(storageDir), filesBefore);
});

test('POST /upload acima do limite retorna 413', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm(Buffer.alloc(2 * 1024 * 1024)),
  });

  assert.strictEqual(response.status, 413);
});

test('GET /documents lista os documentos e filtra por dono', async () => {
  const all = await (await fetch(`${baseUrl}/documents`)).json();
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0].id, uploaded.id);
  assert.strictEqual(all[0].storedName, undefined);

  const ownedByOther = await (await fetch(`${baseUrl}/documents?owner=user-2`)).json();
  assert.deepStrictEqual(ownedByOther, []);
});

test('GET /documents/:id/download retorna o conteúdo do arquivo', async () => {
  if (!uploaded) {
    const upload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-1' },
      body: buildForm('conteudo do contrato'),
    });
    assert.strictEqual(upload.status, 201);
    uploaded = await upload.json();
  }
  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`);
  const content = await response.text();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(content, 'conteudo do contrato');
  assert.strictEqual(response.headers.get('content-type'), 'application/pdf');
  assert.strictEqual(response.headers.get('cache-control'), 'private, no-store');
  assert.match(response.headers.get('content-disposition'), /^attachment/);
  assert.match(response.headers.get('content-disposition'), /contrato\.pdf/);
});

test('configuração rejeita limites de upload inválidos', () => {
  for (const value of ['0', '-1', 'Infinity', 'abc']) {
    const result = spawnSync(process.execPath, ['-e', "require('./src/config')"], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, MAX_UPLOAD_SIZE_MB: value },
      encoding: 'utf8',
    });
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /MAX_UPLOAD_SIZE_MB/);
  }
});

test('GET /documents/:id/download com id inexistente retorna 404', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`);

  assert.strictEqual(response.status, 404);
  assert.ok((await response.json()).error);
});

test('cota agregada rejeita upload sem deixar resíduos e permite arquivos menores', async () => {
  const first = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm(Buffer.alloc(900 * 1024)),
  });
  assert.strictEqual(first.status, 201);

  const filesBefore = fs.readdirSync(storageDir);
  const rejected = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm(Buffer.alloc(700 * 1024)),
  });
  assert.strictEqual(rejected.status, 507);
  assert.deepStrictEqual(fs.readdirSync(storageDir), filesBefore);

  const smaller = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm('arquivo pequeno'),
  });
  assert.strictEqual(smaller.status, 201);
});

test('uploads simultâneos não ultrapassam a cota agregada', async () => {
  const responses = await Promise.all([0, 1].map(() => fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm(Buffer.alloc(400 * 1024)),
  })));
  assert.deepStrictEqual(responses.map((response) => response.status).sort(), [201, 507]);
  const usedBytes = fs.readdirSync(storageDir)
    .reduce((total, name) => total + fs.statSync(path.join(storageDir, name)).size, 0);
  assert.ok(usedBytes <= 1.5 * 1024 * 1024);
});

test('upload com nome contendo caminho permanece no armazenamento local', async () => {
  const filesBefore = new Set(fs.readdirSync(storageDir));
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm('conteudo', '../../teste.txt', 'text/plain'),
  });
  assert.strictEqual(response.status, 201);
  const document = await response.json();
  assert.strictEqual(document.originalName, 'teste.txt');
  const filesAdded = fs.readdirSync(storageDir).filter((name) => !filesBefore.has(name));
  assert.strictEqual(filesAdded.length, 1);
  assert.match(filesAdded[0], /^[0-9a-f-]+\.txt$/);
  assert.strictEqual(await (await fetch(`${baseUrl}/documents/${document.id}/download`)).text(), 'conteudo');
});

test('download de arquivo removido retorna 404', async () => {
  const filesBefore = new Set(fs.readdirSync(storageDir));
  const upload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: buildForm('temporario', 'temporario.txt', 'text/plain'),
  });
  assert.strictEqual(upload.status, 201);
  const document = await upload.json();
  const filename = fs.readdirSync(storageDir).find((name) => !filesBefore.has(name));
  assert.ok(filename);
  fs.unlinkSync(path.join(storageDir, filename));
  const response = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(response.status, 404);
});
