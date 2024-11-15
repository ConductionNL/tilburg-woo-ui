import { useEffect } from 'react';
import clsx from 'clsx';

import { AcImage, AcRichText, AcDataList } from '@atoms';
import { AcCta } from '@molecules';
import { AcFaq } from '@components';

const BLOCK_TYPES = {
  Cta: AcCta,
  DataList: AcDataList,
  Faq: AcFaq,
  Image: AcImage,
  RichText: AcRichText,
};

const AcSectionsHandler = ({ contents = [] }) => {
  const _CLASSES = clsx('ac-sections');

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

export default AcSectionsHandler;
