import React, { memo, useEffect, useState } from 'react';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import ConSchemaEnhancedField from '@components/con-schema-enhanced-field/con-schema-enhanced-field';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

/**
 * Dienst Informatie Stage
 *
 * Fields (from schema dienst):
 * - naam, contactpersoon, aanbieder, website, type, beschrijvingKort, beschrijvingLang, logo
 */
const ConFormDienstInformatieStage = memo(
  ({ dienst, setDienstData, loading, touched, schemas, userStore }) => {
    const [aanbiederOptions, setAanbiederOptions] = useState([]);
    const [aanbiederLoading, setAanbiederLoading] = useState(false);

    // Prefill aanbieder with active organization (ID) if empty
    useEffect(() => {
      const org = userStore?.activeOrganization;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Dienst form - active organisation:', org);
      }
      if (org && !dienst.aanbieder) {
        const id = org.uuid || org.id || org.slug || '';
        if (id) setDienstData('aanbieder', id);
      }
    }, [userStore?.activeOrganization, dienst.aanbieder]);

    // Explicitly call /me, then search organisations by name
    useEffect(() => {
      let cancelled = false;
      const resolveOrganisationByName = async () => {
        setAanbiederLoading(true);
        try {
          const meUrl = `${BASE_URL}/openconnector/api/user/me`;
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('Dienst info - fetching /me:', meUrl);
          }
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
          const activeName = active?.name || active?.naam || '';
          if (!activeName) {
            if (!cancelled) setAanbiederOptions([]);
            return;
          }

          const params = new URLSearchParams({
            _limit: '1',
            _page: '1',
            _search: activeName,
          });
          const orgUrl = `${BASE_URL}/openregister/api/objects/organisaties/organisatie?${params}`;
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('Dienst info - fetching organisation by name:', orgUrl);
          }
          const res = await fetch(orgUrl, {
            headers: { Accept: 'application/json' },
          });
          let found = null;
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data)
              ? data
              : Array.isArray(data?.results)
              ? data.results
              : [];
            found =
              list.find((o) => (o?.name || o?.naam) === activeName) ||
              list[0] ||
              null;
          }

          const id = String(
            found?.uuid ||
              found?.id ||
              found?.slug ||
              active?.uuid ||
              active?.id ||
              active?.slug ||
              ''
          );
          const label = String(
            found?.naam || found?.name || found?.title || activeName
          );
          const option = id ? [{ value: id, label, data: found || active }] : [];
          if (!cancelled) {
            setAanbiederOptions(option);
            if (id && !dienst.aanbieder) setDienstData('aanbieder', id);
          }
        } catch {
          if (!cancelled) setAanbiederOptions([]);
        } finally {
          if (!cancelled) setAanbiederLoading(false);
        }
      };
      resolveOrganisationByName();
      return () => {
        cancelled = true;
      };
    }, []);

    return (
      <div
        className='ac-register-form-section'
        role='group'
        aria-labelledby='dienst-informatie-section-title'
      >
        <h2 id='dienst-informatie-section-title' className='sr-only'>
          Dienst informatie
        </h2>

        <Paragraph style={{ marginBottom: '2rem' }}>
          <strong>Basisinformatie van de dienst</strong>
          <br />
          Vul de naam, contactpersoon, aanbieder, website, type en beschrijvingen in.
          Voeg indien gewenst een logo toe.
        </Paragraph>

        <div className='con-dynamic-form-container'>
          <div className='con-form-fields-container'>
            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='naam'
              value={dienst.naam || ''}
              onChange={(value) => setDienstData('naam', value)}
              isDisabled={loading}
              width='half'
              touched={touched}
              schemas={schemas}
            />

            {/* Aanbieder before Website so required fields are on top */}
            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='aanbieder'
              value={
                dienst.aanbieder ||
                userStore?.activeOrganization?.uuid ||
                userStore?.activeOrganization?.id ||
                userStore?.activeOrganization?.slug ||
                ''
              }
              onChange={(value) => setDienstData('aanbieder', value)}
              isDisabled
              width='half'
              schemas={schemas}
              optionsProvider={aanbiederOptions}
              isLoading={aanbiederLoading}
              onSearch={() => {}}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='website'
              value={dienst.website || ''}
              onChange={(value) => setDienstData('website', value)}
              isDisabled={loading}
              width='half'
              touched={touched}
              schemas={schemas}
              customProps={{ inputType: 'text' }}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='beschrijvingKort'
              value={dienst.beschrijvingKort || ''}
              onChange={(value) => setDienstData('beschrijvingKort', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='beschrijvingLang'
              value={dienst.beschrijvingLang || ''}
              onChange={(value) => setDienstData('beschrijvingLang', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='logo'
              value={dienst.logo}
              onChange={(value) => setDienstData('logo', value)}
              isDisabled={loading}
              width='full'
              schemas={schemas}
              customProps={{ inputType: 'file', format: 'base64' }}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='contactpersoon'
              value={dienst.contactpersoon || ''}
              onChange={(value) => setDienstData('contactpersoon', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />

            {/* Aanbieder - required select, prefilled with user's active organization */}
            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='aanbieder'
              value={
                dienst.aanbieder ||
                userStore?.activeOrganization?.uuid ||
                userStore?.activeOrganization?.id ||
                userStore?.activeOrganization?.slug ||
                ''
              }
              onChange={(value) => setDienstData('aanbieder', value)}
              isDisabled
              width='half'
              schemas={schemas}
              optionsProvider={aanbiederOptions}
              isLoading={aanbiederLoading}
              onSearch={() => {}}
            />

            <ConSchemaEnhancedField
              schemaType='dienst'
              schemaProperty='type'
              value={dienst.type || ''}
              onChange={(value) => setDienstData('type', value)}
              isDisabled={loading}
              width='half'
              schemas={schemas}
            />
          </div>
        </div>
      </div>
    );
  }
);

ConFormDienstInformatieStage.displayName = 'ConFormDienstInformatieStage';

export default ConFormDienstInformatieStage;
