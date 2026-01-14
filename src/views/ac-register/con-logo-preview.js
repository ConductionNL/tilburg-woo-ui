import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

const isBase64 = (str) => {
  try {
    // Check if the string is valid base64
    return btoa(atob(str)) === str;
  } catch (e) {
    return false;
  }
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
      if (logoUrl.startsWith('data:')) {
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

const ConLogoPreview = ({ logoUrl, className, style }) => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processedUrl, setProcessedUrl] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    setIsValid(false);
    setIsLoading(true);

    // Cleanup previous blob URL if it exists
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    // Handle File objects directly
    if (logoUrl instanceof File) {
      // Create blob URL from File object
      const blobUrl = URL.createObjectURL(logoUrl);
      blobUrlRef.current = blobUrl;
      setIsValid(true);
      setProcessedUrl(blobUrl);
      setIsLoading(false);
      return;
    }

    // Handle string URLs (data URLs, base64, regular URLs)
    if (logoUrl && typeof logoUrl === 'string') {
      validateAndProcessLogoUrl(logoUrl).then(({ isValid, processedUrl }) => {
        setIsValid(isValid);
        setProcessedUrl(processedUrl);
        setIsLoading(false);
      });
    } else {
      // No logo provided
      setIsValid(false);
      setProcessedUrl(null);
      setIsLoading(false);
    }

    // Cleanup function: revoke blob URL on unmount or change
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [logoUrl]);

  return (
    <div className={className} style={style}>
      {logoUrl && (
        <>
          {isLoading && <span>(Validating...)</span>}
          {!isLoading && isValid && (
            <img src={processedUrl || logoUrl} alt='Organization logo' />
          )}
          {!isLoading && !isValid && <span>(Invalid image URL)</span>}
        </>
      )}
    </div>
  );
};

export default withStore(observer(ConLogoPreview));
