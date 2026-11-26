const documents = new Map();

function save(document) {
  documents.set(document.id, document);
}

function findAll({ owner } = {}) {
  return [...documents.values()].filter((document) => !owner || document.owner === owner);
}

function findById(id) {
  return documents.get(id);
}

module.exports = { save, findAll, findById };