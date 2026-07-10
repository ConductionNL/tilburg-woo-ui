import { useState, useEffect, useMemo } from 'react';

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if a file is an image based on its MIME type
 * @param {File} file - File object to check
 * @returns {boolean} True if file is an image
 */
const isImageFile = (file) => {
  if (!(file instanceof File)) return false;
  const imageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  return imageTypes.includes(file.type);
};

/**
 * Process data recursively to extract files and replace them with placeholders
 * @param {any} data - Data to process
 * @param {string} path - Current path in the data structure
 * @param {Array} imageFiles - Array to collect image files
 * @param {Array} nonImageFiles - Array to collect non-image files
 * @returns {any} Processed data with file placeholders
 */
const processDataForDisplay = (
  data,
  path = '',
  imageFiles = [],
  nonImageFiles = []
) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof File) {
    const fileInfo = {
      file: data,
      path: path || 'root',
      name: data.name,
      size: data.size,
      type: data.type,
      lastModified: data.lastModified,
    };

    if (isImageFile(data)) {
      imageFiles.push(fileInfo);
    } else {
      nonImageFiles.push(fileInfo);
    }

    return `[File: ${data.name}]`;
  }

  if (Array.isArray(data)) {
    return data.map((item, index) =>
      processDataForDisplay(item, `${path}[${index}]`, imageFiles, nonImageFiles)
    );
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const processed = {};
    for (const [key, value] of Object.entries(data)) {
      const newPath = path ? `${path}.${key}` : key;
      processed[key] = processDataForDisplay(
        value,
        newPath,
        imageFiles,
        nonImageFiles
      );
    }
    return processed;
  }

  return data;
};

/**
 * Format JSON string with truncated large text values
 * @param {any} data - Data to stringify
 * @returns {string} Formatted JSON string
 */
const formatJSONWithTruncation = (data) => {
  const threshold = 500;

  const truncateReplacer = (key, value) => {
    if (typeof value === 'string' && value.length > threshold) {
      return `${value.substring(0, threshold)}... [truncated, ${
        value.length
      } chars total]`;
    }
    return value;
  };

  return JSON.stringify(data, truncateReplacer, 2);
};

/**
 * FileMetadata component for displaying file metadata tags
 */
const FileMetadata = ({ fileInfo }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.5rem',
      }}
    >
      <span
        style={{
          padding: '0.25rem 0.5rem',
          backgroundColor: '#e9ecef',
          borderRadius: '3px',
          fontSize: '0.75rem',
        }}
      >
        {fileInfo.name}
      </span>
      <span
        style={{
          padding: '0.25rem 0.5rem',
          backgroundColor: '#e9ecef',
          borderRadius: '3px',
          fontSize: '0.75rem',
        }}
      >
        {formatFileSize(fileInfo.size)}
      </span>
      <span
        style={{
          padding: '0.25rem 0.5rem',
          backgroundColor: '#e9ecef',
          borderRadius: '3px',
          fontSize: '0.75rem',
        }}
      >
        {fileInfo.type || 'unknown'}
      </span>
      {fileInfo.lastModified && (
        <span
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: '#e9ecef',
            borderRadius: '3px',
            fontSize: '0.75rem',
          }}
        >
          Modified: {new Date(fileInfo.lastModified).toLocaleString()}
        </span>
      )}
    </div>
  );
};

/**
 * ImagePreview component for displaying image files
 */
const ImagePreview = ({ fileInfo, objectUrl }) => {
  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          fontSize: '0.85rem',
          color: '#495057',
        }}
      >
        {fileInfo.path}
      </div>
      <FileMetadata fileInfo={fileInfo} />
      {objectUrl && (
        <img
          src={objectUrl}
          alt={fileInfo.name}
          style={{
            maxWidth: '200px',
            maxHeight: '200px',
            width: 'auto',
            height: 'auto',
            borderRadius: '4px',
          }}
        />
      )}
    </div>
  );
};

/**
 * NonImageFileDisplay component for displaying non-image files
 */
const NonImageFileDisplay = ({ fileInfo }) => {
  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          fontSize: '0.85rem',
          color: '#495057',
        }}
      >
        {fileInfo.path}
      </div>
      <FileMetadata fileInfo={fileInfo} />
    </div>
  );
};

const ConDebugViewer = ({ data, title = 'data' }) => {
  const [imageUrls, setImageUrls] = useState({});

  const { processedData, imageFiles, nonImageFiles } = useMemo(() => {
    const images = [];
    const nonImages = [];
    const processed = processDataForDisplay(data, '', images, nonImages);
    return {
      processedData: processed,
      imageFiles: images,
      nonImageFiles: nonImages,
    };
  }, [data]);

  useEffect(() => {
    const urls = {};
    imageFiles.forEach((fileInfo, index) => {
      urls[index] = URL.createObjectURL(fileInfo.file);
    });
    setImageUrls(urls);

    return () => {
      Object.values(urls).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imageFiles]);

  const jsonString = useMemo(() => {
    return formatJSONWithTruncation(processedData);
  }, [processedData]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div
      style={{
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '0.8rem',
      }}
    >
      <details>
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          🐛 Debug: {title} (Click to expand)
        </summary>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '300px',
            overflow: 'auto',
            backgroundColor: '#ffffff',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '2px',
            marginTop: '0.5rem',
          }}
        >
          {jsonString}
        </pre>

        {imageFiles.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#495057',
              }}
            >
              Image Files:
            </div>
            {imageFiles.map((fileInfo, index) => (
              <ImagePreview
                key={index}
                fileInfo={fileInfo}
                objectUrl={imageUrls[index]}
              />
            ))}
          </div>
        )}

        {nonImageFiles.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#495057',
              }}
            >
              Non-Image Files:
            </div>
            {nonImageFiles.map((fileInfo, index) => (
              <NonImageFileDisplay key={index} fileInfo={fileInfo} />
            ))}
          </div>
        )}
      </details>
    </div>
  );
};

ConDebugViewer.displayName = 'ConDebugViewer';

export default ConDebugViewer;
