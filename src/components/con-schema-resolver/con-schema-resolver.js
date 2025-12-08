/**
 * ConSchemaResolver - Resolves schema IDs to human-readable labels
 *
 * Works like ConUuidResolver but for schema IDs.
 * Looks up the schema ID in the schemaCache and displays the slug as a label.
 */

import React from 'react';
import { schemaCache } from '@services/schemaCache.service';

/**
 * Human-readable labels for schema types (Dutch)
 */
const SCHEMA_TYPE_LABELS = {
  gebruik: 'Gebruik',
  applicatie: 'Applicatie',
  koppeling: 'Koppeling',
  dienst: 'Dienst',
  module: 'Module',
  moduleversie: 'Moduleversie',
  organisatie: 'Organisatie',
  contactpersoon: 'Contactpersoon',
  view: 'View',
};

/**
 * Component that resolves a schema ID to a human-readable label
 * @param {Object} props
 * @param {string|number} props.children - Schema ID to resolve
 * @param {string} props.as - HTML element to render as (default: 'span')
 * @param {boolean} props.showSlug - If true, show slug instead of label (default: false)
 */
const ConSchemaResolver = ({
  children: schemaId,
  as: Component = 'span',
  showSlug = false,
  ...props
}) => {
  if (!schemaId) {
    return <Component {...props}>-</Component>;
  }

  // Look up slug in cache
  const slug = schemaCache.get(schemaId);

  if (slug) {
    // Found in cache - show label or slug
    const display = showSlug ? slug : SCHEMA_TYPE_LABELS[slug] || slug;
    return <Component {...props}>{display}</Component>;
  }

  // Not in cache - show the ID as fallback
  return <Component {...props}>{schemaId}</Component>;
};

export { SCHEMA_TYPE_LABELS };
export default ConSchemaResolver;
