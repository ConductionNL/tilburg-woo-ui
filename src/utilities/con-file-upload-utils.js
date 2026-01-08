import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

/**
 * Upload a File object directly to OpenRegister filesMultipart endpoint
 *
 * This is the preferred method for uploading files as it avoids base64 conversion.
 * The backend will automatically link the uploaded file to the specified field
 * when using the fieldName parameter.
 *
 * @param {File} file - The File object to upload
 * @param {string} registerSlug - The register slug (e.g., 'voorzieningen')
 * @param {string} schemaSlug - The schema slug (e.g., 'organisatie', 'dienst')
 * @param {string} objectId - The object ID to attach the file to
 * @param {string} fieldName - The field name for backend to link the file to (e.g., 'logo', 'bewijs')
 * @param {string} [filename] - Optional filename override (defaults to file.name)
 * @returns {Promise<Object|null>} The file object with path or null if upload failed
 *
 * @example
 * // Upload a logo File object
 * const result = await uploadFileToObjectDirect(
 *   logoFile,
 *   'voorzieningen',
 *   'dienst',
 *   dienstId,
 *   'logo'
 * );
 */
export async function uploadFileToObjectDirect(
  file,
  registerSlug,
  schemaSlug,
  objectId,
  fieldName,
  filename = null
) {
  if (!(file instanceof File)) {
    console.error('uploadFileToObjectDirect: Expected File object');
    return null;
  }

  try {
    // Use provided filename or file.name
    const fileWithExtension = filename || file.name;

    // Upload file as multipart form data
    const formData = new FormData();
    formData.append('files', file);
    formData.append('fieldName', fieldName);
    // Add title parameter to explicitly set the file title in the backend
    formData.append('title', fileWithExtension);

    const uploadResponse = await fetch(
      `${BASE_URL}/openregister/api/objects/${registerSlug}/${schemaSlug}/${objectId}/filesMultipart`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();

      // Backend returns an array, get the first item
      const firstFile = Array.isArray(uploadData) ? uploadData[0] : uploadData;

      if (firstFile?.path) {
        return {
          path: firstFile.path,
          fullUrl: `${BASE_URL}${firstFile.path}`,
          id: firstFile.id,
          accessUrl: firstFile.accessUrl || null,
          downloadUrl: firstFile.downloadUrl || null,
          fileData: firstFile,
        };
      } else {
        console.error('File upload succeeded but response has no path property');
        return null;
      }
    } else {
      console.error(
        'File upload failed:',
        uploadResponse.status,
        uploadResponse.statusText
      );
      return null;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Generic file upload utility for OpenRegister filesMultipart endpoint
 *
 * This utility handles uploading files with automatic backend linking.
 * Supports both File objects (preferred) and data URLs (backward compatibility).
 * The backend will automatically link the uploaded file to the specified field
 * when using the fieldName parameter.
 *
 * @param {File|string} fileOrDataUrl - The File object or data URL of the file (base64 encoded)
 * @param {string} registerSlug - The register slug (e.g., 'voorzieningen')
 * @param {string} schemaSlug - The schema slug (e.g., 'organisatie', 'voorziening')
 * @param {string} objectId - The object ID to attach the file to
 * @param {string} fieldName - The field name for backend to link the file to (e.g., 'logo', 'bewijs')
 * @param {string} [filename='file'] - Optional filename (default: 'file')
 * @returns {Promise<Object|null>} The file object with path or null if upload failed
 *
 * @example
 * // Upload a File object (preferred)
 * const result = await uploadFileToObject(
 *   logoFile,
 *   'voorzieningen',
 *   'organisatie',
 *   orgId,
 *   'logo',
 *   'logo.png'
 * );
 *
 * @example
 * // Upload a data URL (backward compatibility)
 * const result = await uploadFileToObject(
 *   logoDataUrl,
 *   'voorzieningen',
 *   'organisatie',
 *   orgId,
 *   'logo',
 *   'logo.png'
 * );
 */
export async function uploadFileToObject(
  fileOrDataUrl,
  registerSlug,
  schemaSlug,
  objectId,
  fieldName,
  filename = 'file'
) {
  // If it's a File object, use the direct upload function
  if (fileOrDataUrl instanceof File) {
    return uploadFileToObjectDirect(
      fileOrDataUrl,
      registerSlug,
      schemaSlug,
      objectId,
      fieldName,
      filename || fileOrDataUrl.name
    );
  }

  // Otherwise, handle as data URL (backward compatibility)
  try {
    const dataUrl = fileOrDataUrl;
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Determine file extension from mime type
    const extension = blob.type.split('/')[1] || 'bin';
    const fileWithExtension = filename.includes('.')
      ? filename
      : `${filename}.${extension}`;

    // Create a File object from the blob
    const file = new File([blob], fileWithExtension, { type: blob.type });

    // Upload file as multipart form data
    const formData = new FormData();
    formData.append('files', file);
    formData.append('fieldName', fieldName);
    // Add title parameter to explicitly set the file title in the backend
    formData.append('title', fileWithExtension);

    const uploadResponse = await fetch(
      `${BASE_URL}/openregister/api/objects/${registerSlug}/${schemaSlug}/${objectId}/filesMultipart`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();

      // Backend returns an array, get the first item
      const firstFile = Array.isArray(uploadData) ? uploadData[0] : uploadData;

      if (firstFile?.path) {
        return {
          path: firstFile.path,
          fullUrl: `${BASE_URL}${firstFile.path}`,
          id: firstFile.id,
          accessUrl: firstFile.accessUrl || null,
          downloadUrl: firstFile.downloadUrl || null,
          fileData: firstFile,
        };
      } else {
        console.error('File upload succeeded but response has no path property');
        return null;
      }
    } else {
      console.error(
        'File upload failed:',
        uploadResponse.status,
        uploadResponse.statusText
      );
      return null;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Fetch a file from the OpenRegister files endpoint
 *
 * @param {string} registerSlug - The register slug
 * @param {string} schemaSlug - The schema slug
 * @param {string} objectId - The object ID
 * @param {string} fieldNameOrFileId - The field name (e.g., 'logo') or file ID
 * @returns {Promise<Object|null>} The file object with path or null if fetch failed
 *
 * @example
 * const logoFile = await fetchFileFromObject('voorzieningen', 'organisatie', orgId, 'logo');
 */
export async function fetchFileFromObject(
  registerSlug,
  schemaSlug,
  objectId,
  fieldNameOrFileId
) {
  try {
    const fileUrl = `${BASE_URL}/openregister/api/objects/${registerSlug}/${schemaSlug}/${objectId}/files/${fieldNameOrFileId}`;

    const response = await fetch(fileUrl);

    if (response.ok) {
      const fileData = await response.json();
      if (fileData.path) {
        return {
          path: fileData.path,
          fullUrl: `${BASE_URL}${fileData.path}`,
          id: fileData.id,
          fileData: fileData,
        };
      }
      return null;
    } else {
      console.error('Failed to fetch file:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    return null;
  }
}

/**
 * Batch upload multiple files to a single object in one multipart request
 *
 * @param {Array<{dataUrl: string, fieldName: string, filename: string}>} files - Array of file objects to upload
 * @param {string} registerSlug - The register slug (e.g., 'voorzieningen')
 * @param {string} schemaSlug - The schema slug (e.g., 'module')
 * @param {string} objectId - The object ID to attach the files to
 * @returns {Promise<Array|null>} Array of uploaded file objects or null if upload failed
 *
 * @example
 * const results = await uploadMultipleFilesToObject(
 *   [
 *     { dataUrl: file1DataUrl, fieldName: 'bewijs', filename: 'evidence1.pdf' },
 *     { dataUrl: file2DataUrl, fieldName: 'bewijs', filename: 'evidence2.pdf' }
 *   ],
 *   'voorzieningen',
 *   'module',
 *   moduleId
 * );
 */
export async function uploadMultipleFilesToObject(
  files,
  registerSlug,
  schemaSlug,
  objectId
) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  try {
    const formData = new FormData();

    // Convert all data URLs to File objects and append to FormData
    for (const fileInfo of files) {
      const response = await fetch(fileInfo.dataUrl);
      const blob = await response.blob();

      // Use the original filename from the user
      const file = new File([blob], fileInfo.filename, { type: blob.type });

      // Append each file - backend will handle multiple files with same field name
      formData.append('files', file);
      formData.append('fieldName', fileInfo.fieldName);
    }

    const uploadResponse = await fetch(
      `${BASE_URL}/openregister/api/objects/${registerSlug}/${schemaSlug}/${objectId}/filesMultipart`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();

      // Backend returns an array of uploaded files
      const filesArray = Array.isArray(uploadData) ? uploadData : [uploadData];

      return filesArray.map((file) => ({
        path: file.path,
        fullUrl: `${BASE_URL}${file.path}`,
        id: file.id,
        fileData: file,
      }));
    } else {
      console.error(
        'Batch file upload failed:',
        uploadResponse.status,
        uploadResponse.statusText
      );
      return null;
    }
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return null;
  }
}

/**
 * Check if a value is a data URL that needs to be uploaded
 *
 * @param {any} value - The value to check
 * @returns {boolean} True if value is a data URL
 */
export function isDataUrlNeedingUpload(value) {
  return value && typeof value === 'string' && value.startsWith('data:');
}
