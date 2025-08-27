import React, { memo, useEffect, useRef } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

/**
 * Dienstopbouw/Informatie Stage
 *
 * Introductory information for the dienst wizard. Also ensures aanbieder is
 * prefilled from the current user's active organisation (/user/me).
 */
const ConFormDienstopbouwStage = memo(({ setDienstData, userStore }) => {
  // Ensure aanbieder is set from /me so users cannot change it later
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;

    let cancelled = false;
    const resolveActiveOrganisation = async () => {
      try {
        // Prefer active org from store if available
        const activeFromStore = userStore?.activeOrganization || null;
        if (activeFromStore) {
          const id = String(
            activeFromStore?.uuid ||
              activeFromStore?.id ||
              activeFromStore?.slug ||
              ''
          );
          if (!cancelled && id) {
            setDienstData('aanbieder', id);
            hasInitializedRef.current = true;
            return;
          }
        }

        // Fallback to /me endpoint once
        const meUrl = `${BASE_URL}/openconnector/api/user/me`;
        let me = null;
        try {
          const res = await fetch(meUrl, {
            headers: { Accept: 'application/json' },
          });
          if (res.ok) {
            me = await res.json();
          }
        } catch {
          // ignore
        }

        const active = me?.organisations?.active || null;
        const id = String(active?.uuid || active?.id || active?.slug || '');
        if (!cancelled && id) {
          setDienstData('aanbieder', id);
          hasInitializedRef.current = true;
        }
      } catch {
        // ignore
      }
    };
    resolveActiveOrganisation();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='dienstopbouw-section-title'
    >
      <h2 id='dienstopbouw-section-title' className='sr-only'>
        Dienst informatie
      </h2>

      <Paragraph>
        <strong>Registreer uw dienst</strong>
        <br />
        In de volgende stappen vult u de basisgegevens in, selecteert u de
        bijbehorende producten en applicaties en kiest u relevante koppelingen. Deze
        informatie helpt organisaties om snel te begrijpen welk aanbod uw dienst
        omvat en hoe die binnen hun landschap past.
      </Paragraph>
    </div>
  );
});

ConFormDienstopbouwStage.displayName = 'ConFormDienstopbouwStage';

export default ConFormDienstopbouwStage;
