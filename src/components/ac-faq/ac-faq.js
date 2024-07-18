import { AccordionProvider } from '@utrecht/component-library-react';
import { useMemo } from 'react';
import { AcSanitizeHtml } from '@utils';

export const AcFaq = ({ faqs = [] }) => {
  const getFaqs = useMemo(() => {
    return faqs.map((faq) => ({
      label: faq.question,
      body: AcSanitizeHtml(faq.answer),
    }));
  }, [faqs]);

  return <AccordionProvider sections={getFaqs} />;
};

export default AcFaq;
