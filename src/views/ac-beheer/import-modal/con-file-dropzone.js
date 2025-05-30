import { AcUUID } from '@src/utilities';
import React, { useId, useRef } from 'react';

const generateFileHash = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch {
    return null;
  }
};

/**
 * A dropzone for adding files.
 * Files are controlled by the parent component.
 * @param {File[]} files
 * @param {Function} onFilesChange
 * @param {boolean} [multiple=false] Whether to allow multiple file uploads
 * @returns {JSX.Element}
 */
export function ConFileDropZone({ files, onFilesChange, multiple = false }) {
  const dropRef = useRef(null);

  const id = useId();

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.style.background = '#f0f0f0';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dropRef.current.style.background = 'white';
  };

  const setFiles = async (newFiles) => {
    // If multiple is false, only take the first file
    const filesToProcess = multiple ? newFiles : [newFiles[0]];

    // add a random uuid to the files
    const fileArray = await Promise.all(
      filesToProcess.map(async (file) => {
        file.hash = (await generateFileHash(file)) ?? null;
        file.id = AcUUID('file');
        file.status = 'pending';
        return file;
      })
    );

    // remove files where no hash could be generated
    const filtered = fileArray.filter((f) => f.hash !== null);

    // remove files which already exist in the files array
    const uniqueFiles = filtered.filter(
      (f) => !files.find((f2) => f2.hash === f.hash)
    );

    // If multiple is false, replace existing files instead of adding
    onFilesChange &&
      onFilesChange(multiple ? [...files, ...uniqueFiles] : uniqueFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.style.background = 'white';

    const rawFiles = Array.from(e.dataTransfer.files);
    const realFiles = rawFiles.filter((f) => f.size > 0);

    if (!!realFiles.length) setFiles(realFiles);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const realFiles = selected.filter((f) => f.size > 0);

    if (!!realFiles.length) setFiles(realFiles);
  };

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: '1.5px dashed var(--utrecht-button-secondary-action-border-color)',
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
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
}
