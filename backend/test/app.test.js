const { test, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_UPLOAD_SIZE_MB = '1';
const app = require('../src/app');

after(() => fs.rmSync(storageDirectory, { recursive: true, force: true }));

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de um documento', async (context) => {
  const server = app.listen(0, '127.0.0.1');
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const form = new FormData();
  form.append('file', new Blob(['documento de teste'], { type: 'text/plain' }), 'teste.txt');
  const upload = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-teste' },
    body: form,
  });
  assert.strictEqual(upload.status, 201);
  const document = await upload.json();
  assert.strictEqual(document.originalName, 'teste.txt');
  assert.strictEqual(document.owner, 'usuario-teste');
  assert.ok(document.id);
  assert.strictEqual(document.storedName, undefined);

  const list = await fetch(`${baseUrl}/documents?owner=usuario-teste`);
  assert.strictEqual(list.status, 200);
  const documents = await list.json();
  assert.ok(documents.some((item) => item.id === document.id));
  const otherList = await fetch(`${baseUrl}/documents?owner=outro-usuario`);
  assert.deepStrictEqual(await otherList.json(), []);

  const download = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(download.status, 200);
  assert.strictEqual(await download.text(), 'documento de teste');
});

test('endpoints retornam erros para entradas e documentos inválidos', async (context) => {
  const server = app.listen(0, '127.0.0.1');
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const filesBefore = fs.readdirSync(storageDirectory);
  const form = new FormData();
  form.append('file', new Blob(['teste']), 'teste.txt');
  const withoutOwner = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(withoutOwner.status, 400);
  assert.deepStrictEqual(fs.readdirSync(storageDirectory), filesBefore);

  const withoutFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-teste' },
    body: new FormData(),
  });
  assert.strictEqual(withoutFile.status, 400);
  assert.ok((await withoutFile.json()).error);

  const largeForm = new FormData();
  largeForm.append('file', new Blob([Buffer.alloc(1024 * 1024 + 1)]), 'grande.txt');
  const tooLarge = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'usuario-teste' },
    body: largeForm,
  });
  assert.strictEqual(tooLarge.status, 413);
  assert.deepStrictEqual(fs.readdirSync(storageDirectory), filesBefore);

  const missing = await fetch(`${baseUrl}/documents/nao-existe/download`);
  assert.strictEqual(missing.status, 404);
  assert.ok((await missing.json()).error);
});
