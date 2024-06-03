import { AccordionProvider } from '@utrecht/component-library-react'

export const TilburgFaq = ({faqs = []}) => {
    return <AccordionProvider sections={faqs} />
}

export default TilburgFaq;
