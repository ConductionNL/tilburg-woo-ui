import { memo, useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

export const validateLogoUrl = (logoUrl) => {
  return new Promise((resolve) => {
    if (!logoUrl) {
      resolve(true); // Empty URL is valid (optional field)
      return;
    }

    try {
      // Handle data URLs
      if (logoUrl.startsWith('data:')) {
        const isImageData = logoUrl.startsWith('data:image/');
        if (!isImageData) {
          resolve(false);
          return;
        }
      } else {
        // For regular URLs, check protocol
        const url = new URL(logoUrl);
        if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
          resolve(false);
          return;
        }
      }

      // Verify it's actually an image by loading it
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = logoUrl;
    } catch (e) {
      resolve(false);
    }
  });
};

const ConLogoPreview = ({ logoUrl, className }) => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsValid(false);
    setIsLoading(true);

    validateLogoUrl(logoUrl).then((valid) => {
      setIsValid(valid);
      setIsLoading(false);
    });
  }, [logoUrl]);

  return (
    <div className={className}>
      {logoUrl && (
        <>
          {isLoading && <span>(Validating...)</span>}
          {!isLoading && isValid && <img src={logoUrl} alt='Organization logo' />}
          {!isLoading && !isValid && <span>(Invalid image URL)</span>}
        </>
      )}
    </div>
  );
};

export default withStore(observer(ConLogoPreview));
