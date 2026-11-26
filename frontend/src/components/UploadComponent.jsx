import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const document = await uploadDocument(file, owner);
      setSuccess(`Documento "${document.originalName}" enviado com sucesso.`);
      setFile(null);
      form.reset();
      onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="document-file">Arquivo</label>{' '}
      <input
        id="document-file"
        type="file"
        onChange={(event) => setFile(event.target.files[0] || null)}
      />
      <button type="submit" disabled={sending || !owner}>
        {sending ? 'Enviando...' : 'Enviar documento'}
      </button>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </form>
  );
}