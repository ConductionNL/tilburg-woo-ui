import React from 'react';

/**
 * Escapes special regex characters in a string
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a combined regex from all glossary terms.
 * Terms are sorted by length descending so longer terms match first.
 * Matching is case-insensitive and partial (no word boundary requirement).
 *
 * @param {Array} terms - Array of glossary term objects with { id, title }
 * @returns {RegExp|null} Combined regex or null if no valid terms
 */
export const buildGlossaryRegex = (terms) => {
  if (!terms || terms.length === 0) return null;

  // Filter terms with valid titles and minimum length of 3 characters
  const validTerms = terms.filter(
    (term) => term.title && term.title.trim().length >= 3
  );

  if (validTerms.length === 0) return null;

  // Sort by title length descending so longer terms match first
  const sorted = [...validTerms].sort(
    (a, b) => b.title.length - a.title.length
  );

  const pattern = sorted.map((term) => escapeRegex(term.title.trim())).join('|');

  return new RegExp(`(${pattern})`, 'gi');
};

/**
 * Creates a lookup map from term title (lowercase) to term object.
 * For duplicate titles, the first (longest original) wins.
 *
 * @param {Array} terms - Array of glossary term objects
 * @returns {Map} Map of lowercase title -> term object
 */
export const buildTermLookup = (terms) => {
  const lookup = new Map();

  if (!terms) return lookup;

  for (const term of terms) {
    if (term.title && term.title.trim().length >= 3) {
      const key = term.title.trim().toLowerCase();
      if (!lookup.has(key)) {
        lookup.set(key, term);
      }
    }
  }

  return lookup;
};

/**
 * Finds all glossary term IDs that appear in the given text.
 *
 * @param {string} text - Text to scan
 * @param {Array} terms - Array of glossary term objects
 * @returns {string[]} Array of unique term IDs found in the text
 */
export const findGlossaryTerms = (text, terms) => {
  if (typeof text !== 'string' || !terms || terms.length === 0) return [];

  const regex = buildGlossaryRegex(terms);
  if (!regex) return [];

  const lookup = buildTermLookup(terms);
  const foundIds = new Set();
  let match;

  while ((match = regex.exec(text)) !== null) {
    const term = lookup.get(match[1].toLowerCase());
    if (term) {
      foundIds.add(term.id);
    }
  }

  return [...foundIds];
};

/**
 * Splits text into segments of plain text and glossary term matches.
 * Returns an array of React elements with <mark> tags for matched terms.
 *
 * Each matched term only gets highlighted on its first occurrence to avoid
 * cluttering the text with too many highlights.
 *
 * @param {string} text - Text to process
 * @param {Array} terms - Array of glossary term objects
 * @param {function} onTermClick - Callback when a highlighted term is clicked, receives term ID
 * @param {Set} [sharedHighlightedIds] - Optional shared set to track already-highlighted terms across multiple calls (used when walking React element trees)
 * @returns {React.ReactNode[]} Array of React elements
 */
export const highlightGlossaryTerms = (text, terms, onTermClick, sharedHighlightedIds) => {
  if (typeof text !== 'string' || !terms || terms.length === 0) {
    return [text];
  }

  const regex = buildGlossaryRegex(terms);
  if (!regex) return [text];

  const lookup = buildTermLookup(terms);
  const parts = [];
  let lastIndex = 0;
  let match;
  const highlightedIds = sharedHighlightedIds || new Set();

  // Reset regex state
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const term = lookup.get(match[1].toLowerCase());
    if (!term) continue;

    // Only highlight first occurrence of each term
    if (highlightedIds.has(term.id)) continue;
    highlightedIds.add(term.id);

    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add highlighted match
    parts.push(
      React.createElement(
        'mark',
        {
          key: `glossary-${term.id}-${match.index}`,
          className: 'con-glossary-term',
          'data-glossary-id': term.id,
          title: `Bekijk de definitie van "${term.title}"`,
          role: 'button',
          tabIndex: 0,
          onClick: (e) => {
            e.preventDefault();
            onTermClick?.(term.id);
          },
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTermClick?.(term.id);
            }
          },
        },
        match[1]
      )
    );

    lastIndex = match.index + match[1].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

export default {
  buildGlossaryRegex,
  buildTermLookup,
  findGlossaryTerms,
  highlightGlossaryTerms,
};
