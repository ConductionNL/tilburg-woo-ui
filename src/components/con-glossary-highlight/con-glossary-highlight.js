import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import {
  findGlossaryTerms,
  highlightGlossaryTerms,
} from '@src/utilities/con-glossary-highlight';

/**
 * Recursively walks a React element tree and highlights glossary terms
 * found in text nodes. Preserves the original element structure.
 */
const walkAndHighlight = (node, terms, onTermClick, highlightedSet) => {
  if (typeof node === 'string') {
    return highlightGlossaryTerms(node, terms, onTermClick, highlightedSet);
  }
  if (typeof node === 'number') {
    return [String(node)];
  }
  if (!React.isValidElement(node)) {
    return [node];
  }
  // Don't recurse into interactive elements like buttons, links, inputs
  const tag = typeof node.type === 'string' ? node.type : null;
  if (tag && ['button', 'a', 'input', 'select', 'textarea', 'mark'].includes(tag)) {
    return [node];
  }
  const children = React.Children.toArray(node.props.children);
  if (children.length === 0) return [node];
  const newChildren = children.flatMap((child) =>
    walkAndHighlight(child, terms, onTermClick, highlightedSet)
  );
  return [React.cloneElement(node, { ...node.props, key: node.key }, ...newChildren)];
};

/**
 * Extracts all plain text from a React element tree for term scanning.
 */
const extractText = (node) => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!React.isValidElement(node)) return '';
  const children = React.Children.toArray(node.props.children);
  return children.map(extractText).join(' ');
};

/**
 * ConGlossaryHighlight
 *
 * Wraps content and automatically highlights glossary terms found within it.
 * Supports both plain string children and React element trees (e.g. from
 * AcSanitizeHtml). Reports found terms to the glossary store for the
 * "Deze pagina" tab. Clicking a highlighted term opens the glossary drawer
 * scrolled to that term.
 *
 * @param {React.ReactNode} children - The content to scan and highlight
 * @param {string} as - HTML element to render as (default: 'span')
 * @param {string} className - Optional CSS class
 * @param {object} store - MobX store (injected via withStore)
 */
const ConGlossaryHighlight = observer(
  ({ children, as: Element = 'span', className, store }) => {
    const { glossary } = store;

    const terms = glossary.all_terms;
    const isString = typeof children === 'string';

    // Collect all text (string or from React tree) for term scanning
    const fullText = useMemo(() => {
      if (!children) return '';
      if (isString) return children;
      // Walk React children to extract text
      const childArray = React.Children.toArray(children);
      return childArray.map(extractText).join(' ');
    }, [children, isString]);

    // Find terms present in this text and report to store
    const foundIds = useMemo(
      () => findGlossaryTerms(fullText, terms),
      [fullText, terms]
    );

    useEffect(() => {
      if (foundIds.length > 0) {
        glossary.addPageTermIds(foundIds);
      }
    }, [foundIds, glossary]);

    // Build highlighted content
    const highlighted = useMemo(() => {
      if (!glossary.is_warmed_up || terms.length === 0 || !children) {
        return isString ? [children] : React.Children.toArray(children);
      }

      const onTermClick = (termId) => glossary.openDrawer(termId);

      if (isString) {
        return highlightGlossaryTerms(children, terms, onTermClick);
      }

      // Walk React element tree and highlight text nodes
      const highlightedSet = new Set();
      const childArray = React.Children.toArray(children);
      return childArray.flatMap((child) =>
        walkAndHighlight(child, terms, onTermClick, highlightedSet)
      );
    }, [children, terms, glossary.is_warmed_up, glossary, isString]);

    return React.createElement(Element, { className }, ...highlighted);
  }
);

ConGlossaryHighlight.displayName = 'ConGlossaryHighlight';

export default withStore(ConGlossaryHighlight);
