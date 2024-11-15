// Imports => Utilities
import { AcSanitizeHtml } from '@src/utilities';
import clsx from 'clsx';

const AcRichText = ({ content }) => {
  const _CLASSES = clsx('ac-rich-text');

  if (!content) {
    return null;
  }

  return <div className={_CLASSES}>{AcSanitizeHtml(content)}</div>;
};

export default AcRichText;
