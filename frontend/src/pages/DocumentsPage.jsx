import { useEffect, useState } from 'react';
import UploadComponent from '../components/UploadComponent.jsx';
import DocumentList from '../components/DocumentList.jsx';
import { listDocuments } from '../services/documentApi.js';

export default function DocumentsPage() {
  const [owner, setOwner] = useState('');
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const trimmedOwner = owner.trim();

  useEffect(() => {
    let active = true;
    setDocuments([]);
    setError('');
    if (!trimmedOwner) {
      setLoading(false);
      return;
    }

    setLoading(true);
    listDocuments(trimmedOwner).then(
      (result) => { if (active) { setDocuments(result); setLoading(false); } },
      (err) => { if (active) { setError(err.message); setLoading(false); } },
    );
    return () => { active = false; };
  }, [trimmedOwner, refresh]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand"><span className="brand-mark" aria-hidden="true">D</span><span>DMS<span className="brand-dot">.</span></span></div>
          <span className="topbar-label">GESTÃO DE DOCUMENTOS</span>
        </div>
      </header>
      <main className="workspace">
        <div className="page-heading">
          <div><p className="eyebrow">ÁREA DE TRABALHO</p><h1>Seus documentos<span className="heading-dot">.</span></h1></div>
          <div className="owner-field">
            <label htmlFor="owner">Usuário</label>
            <input id="owner" value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Seu identificador" autoComplete="username" disabled={uploading} />
          </div>
        </div>

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading"><div><p className="eyebrow">ADICIONAR ARQUIVO</p><h2 id="upload-title">Enviar documento</h2></div><span className="section-number" aria-hidden="true">01</span></div>
          <UploadComponent key={trimmedOwner} owner={trimmedOwner} onSendingChange={setUploading} onUploaded={() => setRefresh((value) => value + 1)} />
        </section>

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading"><div><p className="eyebrow">BIBLIOTECA</p><h2 id="documents-title">Documentos</h2></div><span className="document-count">{documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}</span></div>
          {error && <p className="feedback feedback-error" role="alert">{error}</p>}
          {loading ? <p role="status">Carregando documentos...</p> : !error && <DocumentList documents={documents} />}
        </section>
      </main>
    </>
  );
}
