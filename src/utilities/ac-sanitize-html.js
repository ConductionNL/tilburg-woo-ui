import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

export const AcSanitizeHtml = (html) => {
    return parse(DOMPurify.sanitize(html))
}
