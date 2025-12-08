/**
 * ConSchemaResolver - Resolves schema IDs to slugs
 *
 * Works like ConUuidResolver but for schema IDs.
 * Looks up the schema ID in the schemaCache and displays the slug.
 */

import React from 'react';
import _ from 'lodash';
import { schemaCache } from '@services/schemaCache.service';

/**
 * Component that resolves a schema ID to its slug
 * @param {Object} props
 * @param {string|number} props.children - Schema ID to resolve
 * @param {string} props.as - HTML element to render as (default: 'span')
 * @param {boolean} props.capitalize - If true, capitalize the first letter (default: false)
 */
const ConSchemaResolver = ({
  children: schemaId,
  as: Component = 'span',
  capitalize: shouldCapitalize = false,
  ...props
}) => {
  if (!schemaId) {
    return <Component {...props}>-</Component>;
  }

  // Look up slug in cache
  const slug = schemaCache.get(schemaId);

  if (slug) {
    // Found in cache - show slug (optionally uppercase first letter using lodash)
    const display = shouldCapitalize ? _.upperFirst(slug) : slug;
    return <Component {...props}>{display}</Component>;
  }

  // Not in cache - show the ID as fallback
  return <Component {...props}>{schemaId}</Component>;
};

export default ConSchemaResolver;
