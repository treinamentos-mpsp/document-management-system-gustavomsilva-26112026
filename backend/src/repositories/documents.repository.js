const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findAll({ owner } = {}) {
  const allDocuments = [...documents.values()];
  return owner ? allDocuments.filter((document) => document.owner === owner) : allDocuments;
}

function findById(id) {
  return documents.get(id) || null;
}

module.exports = { save, findAll, findById };
