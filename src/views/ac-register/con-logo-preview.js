import { memo, useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

const ConLogoPreview = ({ logoUrl, className }) => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when URL changes
    setIsValid(false);
    setIsLoading(true);

    if (!logoUrl) {
      setIsLoading(false);
      return;
    }

    // Check if URL is potentially safe
    try {
      // Handle data URLs
      if (logoUrl.startsWith('data:')) {
        const isImageData = logoUrl.startsWith('data:image/');
        if (!isImageData) {
          setIsLoading(false);
          return;
        }
      } else {
        // For regular URLs, check protocol
        const url = new URL(logoUrl);
        if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
          setIsLoading(false);
          return;
        }
      }

      // Verify it's actually an image by loading it
      const img = new Image();
      img.onload = () => {
        setIsValid(true);
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsValid(false);
        setIsLoading(false);
      };
      img.src = logoUrl;
    } catch (e) {
      setIsLoading(false);
    }
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
