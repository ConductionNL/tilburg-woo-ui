import {useEffect} from "react";

import loadable from "@loadable/component";

// Imports => Atoms
const TilburgImage = loadable(() => import('@atoms/tilburg-image/tilburg-image'));
const TilburgRichText = loadable(() => import('@atoms/tilburg-rich-text/tilburg-rich-text'));
const TilburgCta = loadable(() => import('@molecules/tilburg-cta/tilburg-cta'));

const BLOCK_TYPES = {
    'RichText': TilburgRichText,
    'Image': TilburgImage,
    'Cta': TilburgCta
}

const TilburgBlockHandler = ({contents = []}) => {

    useEffect(() => {
        console.log(contents)
    }, [contents]);

    return (
        <>
            {contents.map((content, index) => {
                const BlockComponent = BLOCK_TYPES[content.type]
                if (!BlockComponent) {
                    return null
                }

                return <BlockComponent key={index} {...content.data} />
            })}
        </>
    )
}

export default TilburgBlockHandler
