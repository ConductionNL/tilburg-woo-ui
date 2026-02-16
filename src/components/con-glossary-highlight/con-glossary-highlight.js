import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import {
  findGlossaryTerms,
  highlightGlossaryTerms,
} from '@src/utilities/con-glossary-highlight';

/**
 * ConGlossaryHighlight
 *
 * Wraps text content and automatically highlights glossary terms found within it.
 * Reports found terms to the glossary store for the "Deze pagina" tab.
 * Clicking a highlighted term opens the glossary drawer scrolled to that term.
 *
 * @param {string} children - The text content to scan and highlight
 * @param {string} as - HTML element to render as (default: 'span')
 * @param {string} className - Optional CSS class
 * @param {object} store - MobX store (injected via withStore)
 */
const ConGlossaryHighlight = observer(
  ({ children, as: Element = 'span', className, store }) => {
    const { glossary } = store;

    // Only process string children
    if (typeof children !== 'string' || !children) {
      return React.createElement(Element, { className }, children);
    }

    const terms = glossary.all_terms;

    // Find terms present in this text and report to store
    const foundIds = useMemo(
      () => findGlossaryTerms(children, terms),
      [children, terms]
    );

    useEffect(() => {
      if (foundIds.length > 0) {
        glossary.addPageTermIds(foundIds);
      }
    }, [foundIds, glossary]);

    // Build highlighted content
    const highlighted = useMemo(() => {
      if (!glossary.is_warmed_up || terms.length === 0) {
        return [children];
      }

      return highlightGlossaryTerms(children, terms, (termId) => {
        glossary.openDrawer(termId);
      });
    }, [children, terms, glossary.is_warmed_up, glossary]);

    return React.createElement(Element, { className }, ...highlighted);
  }
);

ConGlossaryHighlight.displayName = 'ConGlossaryHighlight';

export default withStore(ConGlossaryHighlight);
