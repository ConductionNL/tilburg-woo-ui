import { AcUUID } from '@src/utilities';
import React, { useId, useRef } from 'react';

/**
 * A dropzone for adding files.
 * Files are controlled by the parent component.
 * @param {File[]} files
 * @param {Function} onFilesChange
 * @returns {JSX.Element}
 */
export function ConFileDropZone({ files, onFilesChange }) {
  const dropRef = useRef(null);

  const id = useId()

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.style.background = '#f0f0f0';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dropRef.current.style.background = 'white';
  };

  const setFiles = (files) => {
    // add a random uuid to the files
    const fileArray = files.map((file) => {
      file.id = AcUUID('file');
      return file;
    });

    onFilesChange && onFilesChange([...files, ...fileArray]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.style.background = 'white';

    console.log('dropped')

    const rawFiles = Array.from(e.dataTransfer.files);
    const realFiles = rawFiles.filter((f) => f.size > 0);

    setFiles(realFiles);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const realFiles = selected.filter((f) => f.size > 0);

    console.log('selected')

    setFiles(realFiles);
  };

  return (
    <div>
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: '1px dashed var(--utrecht-button-secondary-action-border-color)',
          padding: '40px 0',
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: 'var(--utrecht-select-border-radius)',
        }}
        onClick={() => document.getElementById(`fileInput-${id}`).click()}
      >
        <p>Drag & drop files here or click to select</p>
        <input
          id={`fileInput-${id}`}
          type='file'
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'left' }}>
          <h4>Files ready:</h4>
          <ul>
            {files.map((file, idx) => (
              <li key={idx}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
