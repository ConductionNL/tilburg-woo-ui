import React from 'react'
import { Heading, Textbox, PrimaryActionButton } from '@utrecht/component-library-react/dist/css-module'
import clsx from 'clsx'

export const TilburgSearchbox = () => {

    const _CLASSES = clsx('ac-searchbox')

    return (
        <section className={_CLASSES}>
            <Heading level={2}>Zoeken</Heading>
            <Textbox placeholder="Vul je zoekterm in" />
            <PrimaryActionButton onClick={() => console.log('test')}>
                Click me
            </PrimaryActionButton>
        </section>
    )
}

export default TilburgSearchbox
