import { useEffect } from 'react';

import loadable from '@loadable/component';
import TilburgSection from '@atoms/tilburg-section/tilburg-section';

// Imports => Atoms
const TilburgImage = loadable(() => import('@atoms/tilburg-image/tilburg-image'));
const TilburgRichText = loadable(() => import('@atoms/tilburg-rich-text/tilburg-rich-text'));
const TilburgDataList = loadable(() => import('@atoms/tilburg-data-list/tilburg-data-list'));

// Imports => Molecules
const TilburgCta = loadable(() => import('@molecules/tilburg-cta/tilburg-cta'));

const BLOCK_TYPES = {
    'RichText': TilburgRichText,
    'Image': TilburgImage,
    'Cta': TilburgCta,
    'DataList': TilburgDataList,
}

const TilburgSectionsHandler = ({ contents = [] }) => {

    useEffect(() => {
        console.log(contents)
    }, [contents]);

    return (
        <>
            {contents.map((content, index) => {
                const BlockComponent = BLOCK_TYPES[content.type];
                console.log(content.type)
                if (!BlockComponent) {
                    return null
                }

                return (
                    <TilburgSection compact>
                        <BlockComponent key={index} {...content.data} />
                    </TilburgSection>
                )
            })}
        </>
    )
}

export default TilburgSectionsHandler
