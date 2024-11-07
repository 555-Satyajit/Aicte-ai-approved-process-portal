import React, { useState } from 'react';
import axios from 'axios';

const OCRComponent = () => {
  const [docID, setDocID] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExtractText = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/extract-text/${docID}`);
      setExtractedText(response.data.extractedText);
    } catch (err) {
      setError('Failed to extract text. Please make sure the docID is correct.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Extract Text from Document</h1>
      <div>
        <input
          type="text"
          placeholder="Enter Document ID"
          value={docID}
          onChange={(e) => setDocID(e.target.value)}
        />
        <button onClick={handleExtractText} disabled={loading}>
          {loading ? 'Extracting...' : 'Extract Text'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {extractedText && (
        <div>
          <h3>Extracted Text:</h3>
          <pre>{extractedText}</pre>
        </div>
      )}
    </div>
  );
};

export default OCRComponent;
