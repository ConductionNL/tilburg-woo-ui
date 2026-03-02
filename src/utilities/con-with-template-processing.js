/**
 * Higher-Order Component for Template Processing
 * 
 * Wraps components to automatically process template variables in specified props.
 * This allows existing components to support template variables without modification.
 * 
 * Usage:
 * const TemplateHeading = withTemplateProcessing(Heading, ['children']);
 * <TemplateHeading>Welcome {{ user.displayName }}!</TemplateHeading>
 */

import React from 'react';
import { processUserTemplate } from '@src/utilities/con-template-processor';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

/**
 * Higher-order component that adds template processing to specified props
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Array<string>} templateProps - Array of prop names to process for templates
 * @param {Object} options - Additional options
 * @param {boolean} options.processChildren - Whether to process children prop
 * @returns {React.Component} Enhanced component with template processing
 */
export const withTemplateProcessing = (
  WrappedComponent, 
  templateProps = [], 
  options = { processChildren: true }
) => {
  const TemplateProcessedComponent = ({ store: { user }, children, ...props }) => {
    // Process specified props for template variables
    const processedProps = { ...props };
    
    templateProps.forEach(propName => {
      if (props[propName] && typeof props[propName] === 'string') {
        processedProps[propName] = processUserTemplate(props[propName], user);
      }
    });

    // Process children if enabled and children is a string
    let processedChildren = children;
    if (options.processChildren && typeof children === 'string') {
      processedChildren = processUserTemplate(children, user);
    }

    return (
      <WrappedComponent {...processedProps}>
        {processedChildren}
      </WrappedComponent>
    );
  };

  // Set display name for debugging
  TemplateProcessedComponent.displayName = `withTemplateProcessing(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return withStore(observer(TemplateProcessedComponent));
};

/**
 * Create template-enabled versions of common components
 * Note: Import Utrecht components in your own file to avoid build issues
 */
export const createTemplateComponents = (components = {}) => {
  const templateComponents = {};
  
  // Create template versions of provided components
  Object.entries(components).forEach(([name, Component]) => {
    templateComponents[`Template${name}`] = withTemplateProcessing(Component, ['children']);
  });
  
  return templateComponents;
};

export default withTemplateProcessing;
