/**
 * ConRegisterResolver - Resolves register IDs to slugs
 *
 * Works like ConUuidResolver but for register IDs.
 * Looks up the register ID in the registerCache and displays the slug.
 */

import React from 'react';
import _ from 'lodash';
import { registerCache } from '@services/registerCache.service';

/**
 * Display name overrides for specific register slugs
 * Use this to map slugs to different display names
 */
const DISPLAY_NAME_OVERRIDES = {
  'vng-gemma': 'VNG GEMMA',
};

/**
 * Component that resolves a register ID to its slug
 * @param {Object} props
 * @param {string|number} props.children - Register ID to resolve
 * @param {string} props.as - HTML element to render as (default: 'span')
 * @param {boolean} props.capitalize - If true, capitalize the first letter (default: false)
 */
const ConRegisterResolver = ({
  children: registerId,
  as: Component = 'span',
  capitalize: shouldCapitalize = false,
  ...props
}) => {
  if (!registerId) {
    return <Component {...props}>-</Component>;
  }

  // Look up slug in cache
  const slug = registerCache.get(registerId);

  if (slug) {
    // Check if there's a display name override for this slug
    const override = DISPLAY_NAME_OVERRIDES[slug];
    if (override) {
      return <Component {...props}>{override}</Component>;
    }

    // No override - show slug (optionally uppercase first letter using lodash)
    const display = shouldCapitalize ? _.upperFirst(slug) : slug;
    return <Component {...props}>{display}</Component>;
  }

  // Not in cache - show the ID as fallback
  return <Component {...props}>{registerId}</Component>;
};

export default ConRegisterResolver;
