import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

export const AcSanitizeHtml = (html) => {
  if (!html) {
    return html;
  }

  return parse(DOMPurify.sanitize(html.replaceAll('<p></p>', '<br />')));
};
