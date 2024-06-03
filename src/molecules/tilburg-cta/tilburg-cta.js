import loadable from '@loadable/component';
import { useEffect, useMemo } from 'react';

const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'));
const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { Paragraph } from '@utrecht/component-library-react';
import { AcSanitizeHtml } from '@utils';
import { VISUALS } from '@constants';
import TilburgRichText from '@atoms/tilburg-rich-text/tilburg-rich-text';

const TilburgCta = ({ button, content, title, url }) => {

    useEffect(() => {
        console.log({ button, content, title, url })
    }, [button, content, title, url]);

    const renderButton = useMemo(() => {
        return url && button && (
            <TilburgLink href={url} type="button">
                {button}
                <VISUALS.EXTERNAL_LINK_BLUE />
            </TilburgLink>
        )
    }, [button, url])

    return (
        <TilburgCard blue>
            <Heading level={2}>{title}</Heading>
            <TilburgRichText content={content} />
            {renderButton}
        </TilburgCard>
    )
}

export default TilburgCta
