/**
 * ConSchemaResolver - Resolves schema IDs to slugs
 *
 * Works like ConUuidResolver but for schema IDs.
 * Looks up the schema ID in the schemaCache and displays the slug.
 * Reactively waits for cache warmup and re-renders when cache is populated.
 */

import React from 'react';
import _ from 'lodash';
import { useResolvedSchema } from '@src/utilities/con-resolve-schema';

/**
 * Display name overrides for specific schema slugs
 * Use this to map slugs to different display names
 */
const DISPLAY_NAME_OVERRIDES = {
  module: 'Applicatie',
  moduleversie: 'Applicatie Versie',
};

/**
 * Component that resolves a schema ID to its slug
 * @param {Object} props
 * @param {string|number} props.children - Schema ID to resolve
 * @param {string} props.as - HTML element to render as (default: 'span')
 * @param {boolean} props.capitalize - If true, capitalize the first letter (default: false)
 * @param {Object} props.style - CSS styles to apply
 * @param {string} props.className - CSS class name
 * @param {React.ReactNode} props.loadingPlaceholder - Content to show while loading (default: 'Loading...')
 * @returns {React.ReactElement}
 */
const ConSchemaResolver = ({
  children: schemaId,
  as: Component = 'span',
  capitalize: shouldCapitalize = false,
  style,
  className,
  loadingPlaceholder = 'Loading...',
  ...props
}) => {
  // Always call hook (React rules) - handle null schemaId inside hook
  const { slug, isLoading } = useResolvedSchema(schemaId);

  // Determine what to display
  let displayContent;
  if (!schemaId) {
    displayContent = '-';
  } else if (isLoading) {
    displayContent = loadingPlaceholder;
  } else if (slug) {
    // Check if there's a display name override for this slug
    const override = DISPLAY_NAME_OVERRIDES[slug];
    if (override) {
      displayContent = override;
    } else {
      // No override - show slug (optionally uppercase first letter using lodash)
      displayContent = shouldCapitalize ? _.upperFirst(slug) : slug;
    }
  } else {
    // Not in cache after waiting - show the ID as fallback
    displayContent = schemaId;
  }

  return (
    <Component style={style} className={className} {...props}>
      {displayContent}
    </Component>
  );
};

export default ConSchemaResolver;
