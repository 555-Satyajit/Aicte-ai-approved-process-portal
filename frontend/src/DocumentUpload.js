import React, { useState } from 'react';
import axios from 'axios';
import './DocumentUpload.css';

const DocumentUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [processedData, setProcessedData] = useState([]);

  const handleFileChange = (event) => {
    setSelectedFiles([...event.target.files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus('No files selected');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('documents', file);
    });

    try {
      const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus('Documents uploaded successfully!');
    } catch (error) {
      console.error('Error uploading documents:', error);
      setUploadStatus('Failed to upload documents.');
    }
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) {
      setProcessingStatus('No documents to process');
      return;
    }

    try {
      setProcessingStatus('Processing documents...');
      const processResponse = await axios.post('http://localhost:5000/process', { documents: selectedFiles });
      setProcessedData(processResponse.data);
      setProcessingStatus('Documents processed successfully!');
    } catch (error) {
      console.error('Error processing documents:', error);
      setProcessingStatus('Failed to process documents.');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload and Process Documents</h2>
      <div className="file-input-container">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="file-input"
        />
        <button onClick={handleUpload} className="upload-button">
          Upload
        </button>
        <button onClick={handleProcess} className="process-button">
          Process Documents
        </button>
      </div>
      <div className="file-list">
        {selectedFiles.map((file, index) => (
          <div key={index} className="file-item">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        ))}
      </div>
      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.includes('successfully') ? 'success' : 'error'}`}>
          {uploadStatus}
        </div>
      )}
      {processingStatus && (
        <div className={`processing-status ${processingStatus.includes('successfully') ? 'success' : 'error'}`}>
          {processingStatus}
        </div>
      )}
      {processedData.length > 0 && (
        <div className="processed-data">
          <h3>Processed Data:</h3>
          <ul>
            {processedData.map((data, index) => (
              <li key={index}>
                <strong>Document ID:</strong> {data.id}
                <br />
                <strong>Key Information:</strong> {data.keyInfo}
                <br />
                <strong>Document Type:</strong> {data.documentType}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;