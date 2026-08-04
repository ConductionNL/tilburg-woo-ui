import React from 'react';
import { VISUALS } from '@constants';

/**
 * Schema slug to icon mapping
 */
const SCHEMA_ICONS = {
  product: VISUALS.CUBES,
  module: VISUALS.CUBE,
  organisatie: VISUALS.BUILDING,
  gebruik: VISUALS.CURSOR_CLICK,
  contactpersoon: VISUALS.USER,
  dienst: VISUALS.COG,
  moduleversie: VISUALS.DOCUMENT_TEXT,
  moduleVersie: VISUALS.DOCUMENT_TEXT,
  koppeling: VISUALS.LINK,
};

/**
 * Schema slug to display name mapping (singular form)
 */
const SCHEMA_NAMES = {
  product: 'Product',
  module: 'Applicatie',
  dienst: 'Dienst',
  gebruik: 'Gebruik',
  versie: 'Versie',
  contract: 'Contract',
  overeenkomst: 'Overeenkomst',
  organisatie: 'Organisatie',
  kwetsbaarheid: 'Kwetsbaarheid',
  koppeling: 'Koppeling',
  contactpersoon: 'Contactpersoon',
  moduleversie: 'Applicatie Versie',
  moduleVersie: 'Applicatie Versie',
};

/**
 * ConPublicationTypeBadge - Displays the publication type with icon and name
 * Returns just the icon and text content - parent should provide heading wrapper if needed
 * 
 * @param {Object} props
 * @param {string} props.schemaSlug - The schema slug (e.g., 'organisatie', 'product')
 * @param {string} props.className - Optional CSS class name
 * @returns {JSX.Element|null} The type badge content or null if no schema
 */
const ConPublicationTypeBadge = ({ schemaSlug, className = 'con-publication-type-badge' }) => {
  if (!schemaSlug) {
    return null;
  }

  const IconComponent = SCHEMA_ICONS[schemaSlug];
  const displayName = SCHEMA_NAMES[schemaSlug] || schemaSlug;

  return (
    <>
      {IconComponent && <IconComponent />}
      {displayName}
    </>
  );
};

export default ConPublicationTypeBadge;
