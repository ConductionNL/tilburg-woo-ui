import { Heading } from '@utrecht/component-library-react/dist/css-module'
import { AccordionProvider } from '@utrecht/component-library-react'
import clsx from 'clsx'
import loadable from '@loadable/component'

const TilburgContainer = loadable(() => import('@atoms/tilburg-container/tilburg-container'));

export const TilburgFaq = ({faqItems = []}) => {

    const _CLASSES = clsx('faq')

    return (
        <div className={_CLASSES}>
            <Heading level={2}>FAQ</Heading>
            <AccordionProvider sections={faqItems} />
        </div>
    )
}

export default TilburgFaq;
