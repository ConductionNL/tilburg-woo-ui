/**
 * Helper function to detect if a URL is a data URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a data URL
 */
export function isDataUrl(url) {
  return typeof url === 'string' && url.startsWith('data:');
}

/**
 * Helper function to detect if a string looks like a URL
 * @param {string} str - The string to check
 * @returns {boolean} - True if it looks like a URL
 */
export function isUrl(str) {
  if (typeof str !== 'string') return false;

  // First try as-is (for URLs with protocol)
  try {
    new URL(str);
    return true;
  } catch {
    // If that fails, try with https:// prefix (for URLs without protocol)
    try {
      new URL(`https://${str}`);
      // Additional check to ensure it looks like a domain
      // Must contain at least one dot and no spaces
      return str.includes('.') && !str.includes(' ') && !str.startsWith('/');
    } catch {
      return false;
    }
  }
}

/**
 * Helper function to extract filename and extension from data URL or generate from property name
 * @param {string} dataUrl - The data URL
 * @param {string} propertyName - The property name to use as fallback
 * @returns {string} - The filename with extension
 */
export function getDataUrlDisplayName(dataUrl, propertyName) {
  try {
    // Extract MIME type from data URL header (e.g., "data:application/pdf;base64,...")
    const [header] = dataUrl.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);

    if (mimeMatch) {
      const mimeType = mimeMatch[1];

      // Map common MIME types to extensions
      const mimeToExtension = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/svg+xml': '.svg',
        'image/webp': '.webp',
        'text/plain': '.txt',
        'text/csv': '.csv',
        'application/json': '.json',
        'application/xml': '.xml',
        'application/zip': '.zip',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      };

      const extension = mimeToExtension[mimeType] || '';

      // Check if there's a filename in the data URL (some data URLs include filename)
      const filenameMatch = header.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        let filename = filenameMatch[1].replace(/['"]/g, '');
        // Add extension if not present
        if (!filename.includes('.') && extension) {
          filename += extension;
        }
        return filename;
      }

      // Use property name with detected extension
      return `${propertyName}${extension}`;
    }
  } catch (error) {
    console.warn('Error parsing data URL:', error);
  }

  // Fallback to property name with generic extension
  return `${propertyName}.file`;
}

/**
 * Helper function to detect MIME type from file content
 * @param {Uint8Array} uint8Array - The file content as Uint8Array
 * @returns {string} - The detected MIME type
 */
function detectMimeTypeFromContent(uint8Array) {
  // Check for PDF signature
  if (
    uint8Array[0] === 0x25 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x44 &&
    uint8Array[3] === 0x46
  ) {
    return 'application/pdf';
  }
  // Check for PNG signature
  else if (
    uint8Array[0] === 0x89 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x4e &&
    uint8Array[3] === 0x47
  ) {
    return 'image/png';
  }
  // Check for JPEG signature
  else if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) {
    return 'image/jpeg';
  }
  // Check for GIF signature
  else if (
    uint8Array[0] === 0x47 &&
    uint8Array[1] === 0x49 &&
    uint8Array[2] === 0x46
  ) {
    return 'image/gif';
  }
  // Check for ZIP/Office documents (PK header)
  else if (uint8Array[0] === 0x50 && uint8Array[1] === 0x4b) {
    return 'application/zip';
  }
  // Check for Word document signature
  else if (
    uint8Array[0] === 0xd0 &&
    uint8Array[1] === 0xcf &&
    uint8Array[2] === 0x11 &&
    uint8Array[3] === 0xe0
  ) {
    return 'application/msword';
  }

  return 'application/octet-stream'; // default fallback
}

/**
 * Helper function to create blob URL from base64 data
 * @param {string} base64Data - The base64 data or data URL
 * @returns {string|null} - The blob URL or original URL
 */
function createBlobUrlFromBase64(base64Data) {
  if (!base64Data) return null;

  try {
    let decodedData;
    let mimeType = 'application/octet-stream';

    // Handle data URLs (e.g., "data:application/pdf;base64,...")
    if (base64Data.startsWith('data:')) {
      const [header, base64Content] = base64Data.split(',');
      if (base64Content) {
        decodedData = atob(base64Content);
        // Extract MIME type from data URL header
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      } else {
        return null;
      }
    }
    // Check if it's already a regular URL
    else if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
      return base64Data;
    }
    // Assume it's raw base64 encoded data
    else {
      decodedData = atob(base64Data);
      // Convert to uint8Array to detect MIME type from content
      const uint8Array = new Uint8Array(decodedData.length);
      for (let i = 0; i < decodedData.length; i++) {
        uint8Array[i] = decodedData.charCodeAt(i);
      }
      mimeType = detectMimeTypeFromContent(uint8Array);
    }

    // Convert decoded data to Uint8Array for blob creation
    const uint8Array = new Uint8Array(decodedData.length);
    for (let i = 0; i < decodedData.length; i++) {
      uint8Array[i] = decodedData.charCodeAt(i);
    }

    const blob = new Blob([uint8Array], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL from base64:', error);
    return null;
  }
}

/**
 * Helper function to handle file/data URL click - opens for viewing when possible
 * @param {string} fileData - The file data (data URL, regular URL, or base64)
 */
export function handleFileClick(fileData) {
  const blobUrl = createBlobUrlFromBase64(fileData);
  if (blobUrl) {
    window.open(blobUrl, '_blank');
    // Clean up the blob URL after a delay to allow the browser to load it
    setTimeout(() => {
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    }, 10000); // 10 seconds should be enough for browser to process
  }
}
