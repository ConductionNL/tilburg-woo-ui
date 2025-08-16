/**
 * Template Text Component
 * 
 * A generic component that processes template variables in text content
 * and renders it as plain text or HTML based on the renderAsHtml prop.
 * 
 * Usage:
 * <ConTemplateText text="Welcome {{ user.displayName }}!" />
 * <ConTemplateText text="<h1>Hello {{ user.displayName }}</h1>" renderAsHtml />
 */

import { processUserTemplate } from '@src/utilities/con-template-processor';
import { AcSanitizeHtml } from '@src/utilities';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

const ConTemplateText = ({ 
  store: { user }, 
  text, 
  renderAsHtml = false, 
  className = '',
  tag: Tag = 'span',
  children,
  ...props 
}) => {
  // Use children if text is not provided
  const content = text || children;
  
  if (!content) {
    return null;
  }

  // Process template variables
  const processedContent = processUserTemplate(content, user);

  // Render as HTML or plain text
  if (renderAsHtml) {
    return (
      <Tag 
        className={className} 
        dangerouslySetInnerHTML={{ __html: AcSanitizeHtml(processedContent) }}
        {...props}
      />
    );
  }

  return (
    <Tag className={className} {...props}>
      {processedContent}
    </Tag>
  );
};

export default withStore(observer(ConTemplateText));
