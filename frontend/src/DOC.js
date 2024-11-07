import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, AlertCircle, Save, Eye, FileSearch, FileText, Search, Filter, Moon, Sun, FileOutput } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [keyInformation, setKeyInformation] = useState({});
  const [showTextModal, setShowTextModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [darkMode, setDarkMode] = useState(false);
  const [fileTypes, setFileTypes] = useState({});
  

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/documents');
        setDocuments(response.data);
        setFilteredDocuments(response.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    const results = documents.filter(doc =>
      doc.docID.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'All' || doc.status === statusFilter)
    );
    setFilteredDocuments(results);
  }, [searchTerm, statusFilter, documents]);

  const handleStatusChange = (docId, newStatus) => {
    const updatedDocuments = documents.map(doc => 
      doc.docID === docId ? { ...doc, status: newStatus } : doc
    );
    setDocuments(updatedDocuments);
  };

  const handleSave = async () => {
    try {
      await axios.post('http://localhost:5000/status/update', { documents });
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving documents:', error);
      alert('Failed to save changes.');
    }
  };

  const handleExtractText = async (docID) => {
    try {
      const response = await axios.get(`http://localhost:5000/extract-text/${docID}`);
      setExtractedText(response.data.extractedText);
      setDocumentTypes(response.data.documentTypes || []);
      setKeyInformation(response.data.keyInformation || {}); // Ensure it's an object
      setShowTextModal(true);
    } catch (error) {
      console.error('Error extracting text:', error);
      alert('Failed to extract text.');
    }
  };

  const handleGenerateReport = async (docID) => {
    try {
      const response = await axios.get(`http://localhost:5000/generate-report/${docID}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${docID}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <Check className="status-icon approved" />;
      case 'Rejected':
        return <X className="status-icon rejected" />;
      default:
        return <AlertCircle className="status-icon pending" />;
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">Save Before Leave</h1>
        <div className="dashboard-actions">
          <button className="btn btn-icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="btn-icon" /> : <Moon className="btn-icon" />}
          </button>
          <button className="btn btn-primary save-btn" onClick={handleSave}>
            <Save className="btn-icon" />
            Save All Changes
          </button>
        </div>
      </header>
      <div className="dashboard-controls">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by Client ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdown">
          <Filter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="documents-grid">
        {filteredDocuments.map((doc) => (
          <div key={doc.docID} className="document-card">
            <div className="card-header">
              <FileText className="card-icon" />
              <h2 className="card-title">Client ID: {doc.docID}</h2>
            </div>
            <div className="card-content">
              <div className="status-section">
                <div className="status-display">
                  {getStatusIcon(doc.status)}
                  <span className={`status-text ${doc.status.toLowerCase()}`}>{doc.status}</span>
                </div>
                <select 
                  className="status-select"
                  value={doc.status} 
                  onChange={(e) => handleStatusChange(doc.docID, e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="files-section">
                <h3 className="section-title">Files</h3>
                {doc.files && doc.files.length > 0 ? (
                  doc.files.map(file => (
                    <ViewPDF key={file.filename} docID={doc.docID} filename={file.filename} />
                  ))
                ) : (
                  <span className="no-files">No files uploaded</span>
                )}
              </div>
              <div className="actions-section">
                <button className="btn btn-outline extract-btn" onClick={() => handleExtractText(doc.docID)}>
                  <FileSearch className="btn-icon" />
                  Extract Text
                </button>
                <button className="btn btn-secondary generate-btn" onClick={() => handleGenerateReport(doc.docID)}>
                  <FileOutput className="btn-icon" />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showTextModal && (
        <div className="modal-overlay">
          <div className="modal-popup">
            <div className="modal-header">
              <h3 className="modal-title">Document Analysis</h3>
              <button className="close-btn" onClick={() => setShowTextModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <h4>Document Types:</h4>
              <ul className="document-types-list">
                {documentTypes.map(({ filename, type }) => (
                  <li key={filename}>
                    <strong>{filename}:</strong> {type}
                  </li>
                ))}
              </ul>
              <h4>File Types:</h4>
              <ul className="file-types-list">
                {Object.entries(fileTypes).map(([filename, contentType]) => (
                  <li key={filename}>
                    <strong>{filename}:</strong> {contentType}
                  </li>
                ))}
              </ul>
              <h4>Key Information:</h4>
              {Object.entries(keyInformation).map(([filename, info]) => (
                <div key={filename}>
                  <h5>{filename}</h5>
                  <ul className="key-info-list">
                    {Object.entries(info || {}).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <h4>Extracted Text:</h4>
              <pre className="extracted-text">{extractedText}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ViewPDF = ({ docID, filename }) => {
  const viewPDF = () => {
    const url = `http://localhost:5000/file/${docID}/${filename}`;
    window.open(url, '_blank');
  };

  return (
    <button className="btn btn-ghost file-btn" onClick={viewPDF}>
      <Eye className="btn-icon" />
      {filename}
    </button>
  );
};

export default AdminDashboard;
