import { useEffect } from 'react';

import loadable from '@loadable/component';
import clsx from 'clsx';

// Imports => Atoms
const TilburgImage = loadable(() => import('@atoms/tilburg-image/tilburg-image'));
const TilburgRichText = loadable(() => import('@atoms/tilburg-rich-text/tilburg-rich-text'));
const TilburgDataList = loadable(() => import('@atoms/tilburg-data-list/tilburg-data-list'));

// Imports => Molecules
const TilburgCta = loadable(() => import('@molecules/tilburg-cta/tilburg-cta'));

const TilburgFaq = loadable(() => import('@components/tilburg-faq/tilburg-faq'));

const BLOCK_TYPES = {
    'RichText': TilburgRichText,
    // 'Image': TilburgImage,
    'Cta': TilburgCta,
    'DataList': TilburgDataList,
    'Faq': TilburgFaq,
}

const TilburgSectionsHandler = ({ contents = [] }) => {

    const _CLASSES = clsx('tilburg-sections')

    useEffect(() => {
        console.log(contents)
    }, [contents]);

    return (
        <div class={_CLASSES}>
            {contents.map((content, index) => {
                const BlockComponent = BLOCK_TYPES[content.type];
                if (!BlockComponent) {
                    return null
                }

                return (
                    <BlockComponent key={index} {...content.data}  />
                )
            })}
        </div>
    )
}

export default TilburgSectionsHandler
