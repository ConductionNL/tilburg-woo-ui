import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AcSetDocumentTitle, AcCapitalize } from '@utils';

/**
 * Hook that sets the document title based on the current path.
 */
export const useDocumentTitleFromPath = () => {
  const location = useLocation();

  const generateTitleFromPath = (path) => {
    if (path === '/') {
      return 'Home';
    }

    const segments = path.split('/').filter(Boolean);

    return segments
      .map((segment) => {
        return segment.split('-').map(AcCapitalize).join(' ');
      })
      .join(' - ');
  };

  useEffect(() => {
    const path = location.pathname;
    const currentPageName = generateTitleFromPath(path);

    AcSetDocumentTitle(currentPageName);
  }, [location]);
};
