import { Heading } from '@utrecht/component-library-react/dist/css-module'
import { AccordionProvider } from '@utrecht/component-library-react'
import clsx from 'clsx'

export const TilburgFaq = ({faqItems = []}) => {

    const _CLASSES = clsx('faq')

    return (
        <section className={_CLASSES}>
            <Heading level={2}>FAQ</Heading>
            <AccordionProvider sections={faqItems} />
        </section>
    )
}

export default TilburgFaq;
