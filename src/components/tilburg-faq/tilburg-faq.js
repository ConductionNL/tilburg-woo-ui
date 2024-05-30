import { Heading } from '@utrecht/component-library-react/dist/css-module'
import { AccordionProvider } from '@utrecht/component-library-react'
import clsx from 'clsx'

export const TilburgFaq = ({faqItems = [], title}) => {

    const _CLASSES = clsx('tilburg-faq')

    return (
        <div className={_CLASSES}>
            <Heading level={2}>{title}</Heading>
            <AccordionProvider sections={faqItems} />
        </div>
    )
}

export default TilburgFaq;
