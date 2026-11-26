import { useEffect, useState } from 'react';
import UploadComponent from '../components/UploadComponent.jsx';
import DocumentList from '../components/DocumentList.jsx';
import { listDocuments } from '../services/documentApi.js';

export default function DocumentsPage() {
  const [owner, setOwner] = useState('');
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const trimmedOwner = owner.trim();

  useEffect(() => {
    let active = true;
    setDocuments([]);
    setError('');
    if (!trimmedOwner) {
      return;
    }

    listDocuments(trimmedOwner).then(
      (result) => { if (active) setDocuments(result); },
      (err) => { if (active) setError(err.message); },
    );
    return () => { active = false; };
  }, [trimmedOwner, refresh]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <label>
        Usuário:{' '}
        <input value={owner} onChange={(event) => setOwner(event.target.value)} />
      </label>

      <section>
        <h2>Enviar documento</h2>
        <UploadComponent owner={trimmedOwner} onUploaded={() => setRefresh((value) => value + 1)} />
      </section>

      <section>
        <h2>Documentos</h2>
        {error && <p role="alert">{error}</p>}
        <DocumentList documents={documents} />
      </section>
    </main>
  );
}
