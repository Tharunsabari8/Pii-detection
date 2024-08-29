import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Make sure this file includes the CSS provided earlier

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [piiData, setPiiData] = useState({});
  const [editedPiiData, setEditedPiiData] = useState({});
  const [maskedFilePath, setMaskedFilePath] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isPiiVerified, setIsPiiVerified] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsFileUploaded(true); // File is uploaded
    setPiiData({});
    setEditedPiiData({});
    setMaskedFilePath('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please upload a file before verifying PII.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPiiData(response.data.pii_list);
      setFilePath(response.data.file_path);
      setEditedPiiData({});
      setIsPiiVerified(true); // PII is verified
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleActionChange = (key, action) => {
    const value = piiData[key];
    let updatedValue = value;

    if (action === 'Redact') {
      updatedValue = '*'.repeat(value.length);
    } else if (action === 'Delete') {
      updatedValue = " ".repeat(value.length);
    } else if (action === 'Mask') {
      updatedValue = '[Masked]';
    }

    setEditedPiiData((prevData) => ({
      ...prevData,
      [key]: updatedValue,
    }));
  };

  const handleMask = async () => {
    if (Object.keys(editedPiiData).length === 0) {
      alert('Please select an action for detected PII before applying changes.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:5000/mask', {
        file_path: filePath,
        edited_pii_data: editedPiiData,
      });

      setMaskedFilePath(response.data.masked_file_path);
    } catch (error) {
      console.error('Error masking PII:', error);
    }
  };

  const handleDownload = () => {
    window.location.href = `http://127.0.0.1:5000/download/${maskedFilePath}`;
  };

  return (
    <div className="App">
      <h1>PII Detector and Masker</h1>
      {!isFileUploaded && (
        <>
          <input type="file" id="fileInput" onChange={handleFileChange} />
          <label htmlFor="fileInput">Upload Document</label>
        </>
      )}
      {isFileUploaded && !isPiiVerified && (
        <button onClick={handleUpload}>Verify PII</button>
      )}
      {isPiiVerified && Object.keys(piiData).length > 0 && (
        <div>
          <h2>Detected PII:</h2>
          <ul>
            {Object.entries(piiData).map(([key, value], index) => (
              <li key={index}>
                {key} - {value}
                <select onChange={(e) => handleActionChange(key, e.target.value)}>
                  <option value="">Select Action</option>
                  <option value="Redact">Redact</option>
                  <option value="Delete">Delete</option>
                  <option value="Mask">Mask</option>
                </select>
              </li>
            ))}
          </ul>
          <button onClick={handleMask}>Apply Changes</button>
        </div>
      )}
      {maskedFilePath && (
        <div>
          <button onClick={handleDownload}>Download Masked File</button>
        </div>
      )}
    </div>
  );
}

export default App;
