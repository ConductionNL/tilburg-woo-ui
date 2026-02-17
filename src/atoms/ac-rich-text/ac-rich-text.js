// Imports => Utilities
import { AcSanitizeHtml } from '@src/utilities';
import { processUserTemplate } from '@src/utilities/con-template-processor';
import ConGlossaryHighlight from '@components/con-glossary-highlight/con-glossary-highlight';
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

  return (
    <ConGlossaryHighlight as='div' className={_CLASSES}>
      {AcSanitizeHtml(processedContent)}
    </ConGlossaryHighlight>
  );
};

export default withStore(observer(AcRichText));
