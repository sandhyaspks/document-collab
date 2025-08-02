import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DocumentCard.css';

function DocumentCard({ document }) {
  const navigate = useNavigate();

  return (
    <div className="document-card">
      <h3>{document.title}</h3>
      <p>Last Updated: {new Date(document.updatedAt).toLocaleString()}</p>
      <button onClick={() => navigate(`/editor/${document.id}`)}>Edit</button>
      <button onClick={() => navigate(`/history/${document.id}`)}>History</button>
    </div>
  );
}

export default DocumentCard;
