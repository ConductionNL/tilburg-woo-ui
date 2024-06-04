import { useEffect } from 'react';
import clsx from 'clsx';

import { TilburgImage, TilburgRichText, TilburgDataList } from '@atoms';
import { TilburgCta } from '@molecules';
import { TilburgFaq } from '@components';

const BLOCK_TYPES = {
  Cta: TilburgCta,
  DataList: TilburgDataList,
  Faq: TilburgFaq,
  // 'Image': TilburgImage,
  RichText: TilburgRichText,
};

const TilburgSectionsHandler = ({ contents = [] }) => {
  const _CLASSES = clsx('tilburg-sections');

  useEffect(() => {
    console.log(contents);
  }, [contents]);

  return (
    <div class={_CLASSES}>
      {contents.map((content, index) => {
        const BlockComponent = BLOCK_TYPES[content.type];
        if (!BlockComponent) {
          return null;
        }

        return <BlockComponent key={index} {...content.data} />;
      })}
    </div>
  );
};

export default TilburgSectionsHandler;
