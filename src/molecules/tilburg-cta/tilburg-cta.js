import loadable from '@loadable/component';
import {useEffect} from 'react';
const TilburgCard = loadable(() => import('@atoms/tilburg-card/tilburg-card'));
const TilburgLink = loadable(() => import('@molecules/tilburg-link/tilburg-link'));

import { Heading } from "@utrecht/component-library-react/dist/css-module";
import TilburgRichText from "@atoms/tilburg-rich-text/tilburg-rich-text";

const TilburgCta = ({ button, content, title, url }) => {

    useEffect(() => {
        console.log({ button, content, title, url })
    }, [button, content, title, url]);

    return (
        <TilburgCard blue>
            <Heading level={3}>{title}</Heading>
            <TilburgRichText content={content} />
            <TilburgLink label={button} href={url} />
        </TilburgCard>
    )
}

export default TilburgCta
