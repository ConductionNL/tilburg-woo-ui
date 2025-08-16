// Imports => Utilities
import { AcSanitizeHtml } from '@src/utilities';
import { processUserTemplate } from '@src/utilities/con-template-processor';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

const AcRichText = ({ store: { user }, content }) => {
  const _CLASSES = clsx('ac-rich-text');

  if (!content) {
    return null;
  }

  // Process template variables in content before sanitizing HTML
  const processedContent = processUserTemplate(content, user);

  return <div className={_CLASSES}>{AcSanitizeHtml(processedContent)}</div>;
};

export default withStore(observer(AcRichText));
