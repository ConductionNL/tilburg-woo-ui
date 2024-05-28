import { useMemo } from 'react'
import clsx from 'clsx'
import { Textbox, PrimaryActionButton, Heading } from '@utrecht/component-library-react/dist/css-module'
import { VISUALS } from '@constants'

export const TilburgSearchbox = ({small = false, home = false, label}) => {

    const _CLASSES = clsx(
        'tilburg-searchbox',
        small && 'tilburg-searchbox--small',
        home && 'tilburg-searchbox--home'
    )

    const renderHeading = useMemo(() => {
        return label && <Heading level={1}>{label}</Heading>
    }, [label])

    return (
        <div className={_CLASSES}>
            {renderHeading}

            <div class="tilburg-searchbox__search">
                <Textbox placeholder="Vul je zoekterm in" />
                <PrimaryActionButton onClick={() => console.log('test')}>
                    <VISUALS.SEARCH />
                    Zoeken
                </PrimaryActionButton>
            </div>
        </div>
    )
}

export default TilburgSearchbox
