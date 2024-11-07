import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './dashboard.css';

function EnhancedStatusChecker() {
  const [docID, setDocID] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(savedSearches);
  }, []);

  const handleSearch = async () => {
    if (!docID) {
      setError('Please enter a Document ID');
      return;
    }
    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const response = await axios.get(`http://localhost:5000/status/${docID}`);
      const newStatus = {
        id: docID,
        status: response.data.status,
        timestamp: new Date().toISOString(),
        details: response.data.details || 'No additional details available.'
      };
      setStatus(newStatus);
      updateRecentSearches(newStatus);
    } catch (error) {
      console.error('Error fetching document status:', error);
      setError('Error fetching document status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateRecentSearches = (newStatus) => {
    const updatedSearches = [newStatus, ...recentSearches.filter(s => s.id !== newStatus.id)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const exportResults = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Document ID,Status,Timestamp,Details\n"
      + recentSearches.map(s => `${s.id},${s.status},${s.timestamp},"${s.details}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "document_status_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="status-checker-container">
      <div className="status-checker-card">
        <h1>Enhanced Document Status Checker</h1>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter Document ID"
            value={docID}
            onChange={(e) => setDocID(e.target.value)}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Check Status'}
          </button>
        </div>

        {error && (
          <div className="message error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="message info">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Checking document status...</p>
          </div>
        )}

        {status && !loading && (
          <div className={`status-result ${status.status.toLowerCase()}`}>
            <h2>Status: {status.status}</h2>
            <p>Document ID: {status.id}</p>
            <p>Last Checked: {new Date(status.timestamp).toLocaleString()}</p>
            <p>Details: {status.details}</p>
          </div>
        )}

        <div className="recent-searches">
          <h3>Recent Searches</h3>
          <ul>
            {recentSearches.map((search, index) => (
              <li key={index} className={search.status.toLowerCase()}>
                <span className="doc-id">{search.id}</span>
                <span className="doc-status">{search.status}</span>
                <span className="doc-time">{new Date(search.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          {recentSearches.length > 0 && (
            <button onClick={exportResults} className="export-button">
              Export to CSV
            </button>
          )}
        </div>

        <div className="status-legend">
          <div className="legend-item">
            <span className="status-dot approved"></span>
            <p>Approved</p>
          </div>
          <div className="legend-item">
            <span className="status-dot rejected"></span>
            <p>Rejected</p>
          </div>
          <div className="legend-item">
            <span className="status-dot pending"></span>
            <p>Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedStatusChecker;