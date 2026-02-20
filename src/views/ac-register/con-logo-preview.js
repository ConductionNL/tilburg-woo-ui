import { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

const isBase64 = (str) => {
  try {
    return btoa(atob(str)) === str;
  } catch (e) {
    return false;
  }
};

/**
 * Returns true when the given value is a numeric file ID (integer or numeric string),
 * rather than a URL, data URI, or base64 string.
 */
const isFileId = (value) => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'number') return Number.isInteger(value);
  if (typeof value === 'string') return /^\d+$/.test(value.trim());
  return false;
};

export const validateAndProcessLogoUrl = (logoUrl) => {
  return new Promise((resolve) => {
    if (!logoUrl) {
      resolve({ isValid: true, processedUrl: null }); // Empty URL is valid (optional field)
      return;
    }

    try {
      let imageUrl = logoUrl;

      // Handle data URLs
      if (typeof logoUrl === 'string' && logoUrl.startsWith('data:')) {
        const isImageData = logoUrl.startsWith('data:image/');
        if (!isImageData) {
          resolve({ isValid: false, processedUrl: null });
          return;
        }
      }
      // Handle raw base64 string
      else if (isBase64(logoUrl)) {
        // Try to determine the image type from the decoded content
        const decodedData = atob(logoUrl);
        const uint8Array = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; i++) {
          uint8Array[i] = decodedData.charCodeAt(i);
        }

        // Check for common image file signatures
        const signature = uint8Array.slice(0, 4);
        let mimeType = '';

        if (signature[0] === 0xff && signature[1] === 0xd8) {
          mimeType = 'image/jpeg';
        } else if (
          signature[0] === 0x89 &&
          signature[1] === 0x50 &&
          signature[2] === 0x4e &&
          signature[3] === 0x47
        ) {
          mimeType = 'image/png';
        } else if (
          signature[0] === 0x47 &&
          signature[1] === 0x49 &&
          signature[2] === 0x46
        ) {
          mimeType = 'image/gif';
        } else {
          resolve({ isValid: false, processedUrl: null });
          return;
        }

        imageUrl = `data:${mimeType};base64,${logoUrl}`;
      } else {
        // For regular URLs, check protocol
        const url = new URL(logoUrl);
        if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
          resolve({ isValid: false, processedUrl: null });
          return;
        }
      }

      // Verify it's actually an image by loading it
      const img = new Image();
      img.onload = () => resolve({ isValid: true, processedUrl: imageUrl });
      img.onerror = () => resolve({ isValid: false, processedUrl: null });
      img.src = imageUrl;
    } catch (e) {
      resolve({ isValid: false, processedUrl: null });
    }
  });
};

/**
 * Displays a logo image from a URL, data URI, base64 string, or a numeric file ID.
 *
 * When a numeric `fileId` is provided together with `objectSelf` (containing `register`,
 * `schema`, and `id`), the component fetches the file from the OpenRegister files API
 * and uses the returned `accessUrl` for display.
 *
 * @param {string} [props.logoUrl] - Direct URL, data URI, or base64 string for the logo.
 * @param {number|string} [props.fileId] - Numeric file ID to resolve via the files API.
 * @param {{ register: string, schema: string, id: string }} [props.objectSelf] - Object @self context required when fileId is provided.
 * @param {string} [props.className]
 * @param {object} [props.style]
 * @param {object} [props.store] - Injected by withStore.
 */
const ConLogoPreview = ({
  logoUrl,
  fileId,
  objectSelf,
  className,
  style,
  store,
}) => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processedUrl, setProcessedUrl] = useState(null);

  const resolvedFileId = fileId ?? (isFileId(logoUrl) ? logoUrl : null);
  const effectiveLogoUrl = resolvedFileId ? null : logoUrl;

  useEffect(() => {
    if (!resolvedFileId) return;
    if (!objectSelf?.register || !objectSelf?.schema || !objectSelf?.id) return;

    setIsValid(false);
    setIsLoading(true);

    store.object
      .fetchObjectFile(
        objectSelf.register,
        objectSelf.schema,
        objectSelf.id,
        resolvedFileId
      )
      .then((fileData) => {
        const url = fileData?.downloadUrl || fileData?.accessUrl;
        if (url) {
          setProcessedUrl(url);
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      })
      .catch(() => {
        setIsValid(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    resolvedFileId,
    objectSelf?.register,
    objectSelf?.schema,
    objectSelf?.id,
    store,
  ]);

  useEffect(() => {
    if (resolvedFileId) return;

    setIsValid(false);
    setIsLoading(true);

    validateAndProcessLogoUrl(effectiveLogoUrl).then(
      ({ isValid: valid, processedUrl: nextProcessedUrl }) => {
        setIsValid(valid);
        setProcessedUrl((prev) => (valid ? nextProcessedUrl : prev));
        setIsLoading(false);
      }
    );
  }, [effectiveLogoUrl, resolvedFileId]);

  const displayUrl = processedUrl || effectiveLogoUrl;
  const hasContent = resolvedFileId ? !!resolvedFileId : !!effectiveLogoUrl;

  return (
    <div className={className} style={style}>
      {hasContent && (
        <>
          {isLoading && <span>(Validating...)</span>}
          {!isLoading && isValid && displayUrl && (
            <img src={displayUrl} alt='Organization logo' />
          )}
          {!isLoading && !isValid && <span>(Invalid image URL)</span>}
        </>
      )}
    </div>
  );
};

export default withStore(observer(ConLogoPreview));
