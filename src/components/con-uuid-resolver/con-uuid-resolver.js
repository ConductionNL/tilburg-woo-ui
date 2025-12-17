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
 * @returns {React.ReactElement}
 */
const ConUuidResolver = ({ 
  children, 
  store: { object }, 
  as: Component = 'span',
  style,
  className,
  ...props 
}) => {
  // Only resolve if children is a string
  const resolvedText = typeof children === 'string' 
    ? useResolvedText(children, object)
    : children;

  return (
    <Component 
      style={style} 
      className={className}
      {...props}
    >
      {resolvedText}
    </Component>
  );
};

export default withStore(observer(ConUuidResolver));
