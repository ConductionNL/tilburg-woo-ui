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
 * @param {string[]} [allowedFileTypes=[]] The allowed file types
 * @param {string} [label] The label of the dropzone (replace the text in the middle of the dropzone)
 * @param {boolean} [multiple=false] Whether to allow multiple file uploads
 * @param {boolean} [disabled=false] Whether the dropzone is disabled
 * @returns {JSX.Element}
 */
export function ConFileDropZone({
  files,
  onFilesChange,
  allowedFileTypes = [],
  multiple = false,
  label,
  disabled = false,
  className,
  style,
}) {
  const dropRef = useRef(null);

  const id = useId();

  const handleDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    dropRef.current.style.background = '#f0f0f0';
  };

  const handleDragLeave = (e) => {
    if (disabled) return;
    e.preventDefault();
    dropRef.current.style.background = 'white';
  };

  const validateFileType = (file) => {
    if (!allowedFileTypes.length) return true;
    return allowedFileTypes.some((type) => file.type.startsWith(type));
  };

  const setFiles = async (newFiles) => {
    if (disabled) return;
    // If multiple is false, only take the first file
    const filesToProcess = multiple ? newFiles : [newFiles[0]];

    // Filter files by allowed types
    const allowedFiles = filesToProcess.filter(validateFileType);

    // add a random uuid to the files
    const fileArray = await Promise.all(
      allowedFiles.map(async (file) => {
        file.hash = (await generateFileHash(file)) ?? null;
        file.id = AcUUID('file');
        file.status = 'pending';
        file.getDataUrl = async () => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });
        };
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
    if (disabled) return;
    e.preventDefault();
    dropRef.current.style.background = 'white';

    const rawFiles = Array.from(e.dataTransfer.files);
    const realFiles = rawFiles.filter((f) => f.size > 0);

    if (realFiles.length) setFiles(realFiles);
  };

  const handleFileSelect = (e) => {
    if (disabled) return;
    const selected = Array.from(e.target.files);
    const realFiles = selected.filter((f) => f.size > 0);

    if (realFiles.length) setFiles(realFiles);
  };

  const acceptedTypes = allowedFileTypes.join(',') || undefined;

  const getAllowedFileTypesText = () => {
    const allowedFileTypesText = allowedFileTypes
      .map((type) => type.split(/[/+]/g)[1])
      .join(', ');
    return `Toegestane bestandstypen: ${allowedFileTypesText}`;
  };

  return (
    // Drag-and-drop is inherently pointer-only, so the zone also has to offer a
    // keyboard path. The file input itself is display:none and therefore not
    // focusable, which previously left no way to pick a file without a mouse.
    // The visible area is now a real button that opens the picker; the input
    // stays a sibling, because a form control may not live inside a button.
    // Only the drag handlers remain on this div, and dropping a file is a
    // pointer gesture with no keyboard equivalent to add.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={className}
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: '1.5px dashed var(--utrecht-button-secondary-action-border-color)',
        textAlign: 'center',
        borderRadius: 'var(--utrecht-select-border-radius)',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <button
        type='button'
        disabled={disabled}
        onClick={() => document.getElementById(`fileInput-${id}`).click()}
        style={{
          appearance: 'none',
          background: 'none',
          border: 'none',
          font: 'inherit',
          color: 'inherit',
          width: '100%',
          padding: '40px 0',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ display: 'block' }}>
          {label || 'Drag & drop files here or click to select'}
          {allowedFileTypes.length > 0 && (
            <small
              style={{
                display: 'block',
                marginTop: '0.75em',
                color: 'var(--utrecht-paragraph-color)',
                fontSize: '0.85em',
                fontStyle: 'italic',
                opacity: 0.85,
              }}
            >
              {getAllowedFileTypesText()}
            </small>
          )}
        </span>
      </button>
      <input
        id={`fileInput-${id}`}
        type='file'
        accept={acceptedTypes}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={disabled}
      />
    </div>
  );
}
