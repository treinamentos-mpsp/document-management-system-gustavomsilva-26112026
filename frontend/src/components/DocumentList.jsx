import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function DocumentList({ documents }) {
  if (documents.length === 0) {
    return <p>Nenhum documento encontrado.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tamanho</th>
          <th>Enviado em</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id}>
            <td data-label="Nome">{document.originalName}</td>
            <td data-label="Tamanho">{formatSize(document.size)}</td>
            <td data-label="Enviado em">{new Date(document.uploadedAt).toLocaleString('pt-BR')}</td>
            <td data-label="Ação"><DownloadButton document={document} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}