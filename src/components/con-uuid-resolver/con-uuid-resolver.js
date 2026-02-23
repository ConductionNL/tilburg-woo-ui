/**
 * ConUuidResolver - A wrapper component that automatically resolves UUIDs in text content
 *
 * This component can wrap any text content and will automatically detect and resolve
 * UUIDs to human-readable names using the names cache system.
 */

import React from 'react';
import { useResolvedText } from '@src/utilities/con-resolve-uuids-in-text';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

/**
 * Component that automatically resolves UUIDs in text content
 * @param {Object} props
 * @param {string|React.ReactNode} props.children - Text content that may contain UUIDs
 * @param {Object} props.store - MobX store (injected by withStore)
 * @param {string} props.as - HTML element to render as (default: 'span')
 * @param {Object} props.style - CSS styles to apply
 * @param {string} props.className - CSS class name
 * @param {React.ReactNode} props.loadingPlaceholder - Content to show while loading (default: '...')
 * @returns {React.ReactElement}
 */
const ConUuidResolver = ({
  children,
  store: { object },
  as: Component = 'span',
  style,
  className,
  loadingPlaceholder = 'Loading...',
  ...props
}) => {
  // Normalize children: extract string from object formats like {value: uuid}
  const normalized = typeof children === 'string'
    ? children
    : children && typeof children === 'object' && !React.isValidElement(children)
      ? children.value || children.id || children.uuid || ''
      : children;

  const isStringChild = typeof normalized === 'string';

  // Always call the hook with a string value to satisfy React's rules of hooks
  const textToResolve = isStringChild ? normalized : '';
  const { resolvedText, isLoading } = useResolvedText(textToResolve, object);

  // Determine what to display
  const displayContent = isStringChild
    ? isLoading
      ? loadingPlaceholder
      : resolvedText
    : normalized;

  return (
    <Component style={style} className={className} {...props}>
      {displayContent}
    </Component>
  );
};

export default withStore(observer(ConUuidResolver));
