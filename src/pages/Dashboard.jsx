import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // your axios instance with JWT
import './Dashboard.css';

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [shareDocId, setShareDocId] = useState(null);
  const [collaborator, setCollaborator] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const navigate = useNavigate();

  // Fetch documents from backend on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Could not load documents');
    }
  };

  const createDocument = async () => {
    try {
      const newId = crypto.randomUUID(); // or use uuidv4 if you prefer
      const newDoc = {
        id: newId,
        title: `Untitled Document ${documents.length + 1}`,
        content: '',
      };

      const res = await api.post('/documents', newDoc);
      setDocuments((prev) => [...prev, res.data]);
      navigate(`/editor/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      setError('Failed to create document');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete document');
    }
  };

  const handleEdit = (id) => {
    navigate(`/editor/${id}`);
  };

  const openShareModal = (id) => {
    setShareDocId(id);
    setCollaborator('');
    setShareMessage('');
  };

  const closeShareModal = () => {
    setShareDocId(null);
    setShareMessage('');
  };

  const shareDocument = async () => {
    if (!collaborator.trim()) {
      setShareMessage('Please enter a username or email');
      return;
    }
    try {
      await api.post(
        `/documents/${shareDocId}/share`,
        null,
        { params: { collaboratorUsername: collaborator.trim() } }
      );
      setShareMessage('Document shared successfully!');
      fetchDocuments(); // refresh docs to include shared ones
      setTimeout(() => closeShareModal(), 1500);
    } catch (err) {
      console.error('Share failed:', err);
      setShareMessage('Failed to share document');
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={createDocument}>+ New Document</button>
      <ul>
        {documents.length === 0 && <li>No documents found.</li>}
        {documents.map((doc) => (
          <li key={doc.id}>
            <strong onClick={() => handleEdit(doc.id)} style={{ cursor: 'pointer' }}>
              {doc.title}
            </strong>{' '}
            - Last Updated: {new Date(doc.lastUpdated).toLocaleString()}{' '}
            <button onClick={() => handleEdit(doc.id)}>Edit</button>{' '}
            <button onClick={() => handleDelete(doc.id)}>Delete</button>{' '}
            <button onClick={() => openShareModal(doc.id)}>Share</button>
          </li>
        ))}
      </ul>

      {shareDocId && (
        <div className="modal">
          <div className="modal-content">
            <h3>Share Document</h3>
            <input
              type="text"
              placeholder="Enter username or email"
              value={collaborator}
              onChange={(e) => setCollaborator(e.target.value)}
            />
            <button onClick={shareDocument}>Share</button>{' '}
            <button onClick={closeShareModal}>Cancel</button>
            {shareMessage && <p>{shareMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
