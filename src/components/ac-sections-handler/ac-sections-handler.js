import { useEffect } from 'react';
import clsx from 'clsx';

import { AcImage, AcRichText, AcDataList, AcGrid, AcColumn } from '@atoms';
import { AcCta } from '@molecules';
import { AcFaq, AcLoader } from '@components';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcCardCategory } from '@molecules';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS } from '@constants';

const BLOCK_TYPES = {
  Cta: AcCta,
  DataList: AcDataList,
  Faq: AcFaq,
  Image: AcImage,
  RichText: AcRichText,
};

const CategoryBlock = withStore(
  observer(({ store: { categories } }) => {
    const { all_categories, fetchCategories, is_loading } = categories;

    useEffect(() => {
      if (!all_categories || all_categories.length === 0) {
        fetchCategories();
      }
    }, []);

    if (is_loading || !all_categories) {
      return <AcLoader />;
    }

    return (
      <>
        <br />
        <br />
        <AcColumn gap='rat'>
          <Heading level={2}>{LABELS.CATEGORIES}</Heading>
          <Paragraph>{LABELS.CATEGORIES_EXPLAIN}</Paragraph>
        </AcColumn>
        <br />
        <AcGrid row={2}>
          {all_categories?.map((category, index) => (
            <AcCardCategory key={index} {...category} />
          ))}
        </AcGrid>
      </>
    );
  })
);

const EXTENDED_BLOCK_TYPES = {
  ...BLOCK_TYPES,
  Category: CategoryBlock,
};

const AcSectionsHandler = ({ contents = [] }) => {
  const _CLASSES = clsx('ac-sections');

  return (
    <div className={_CLASSES}>
      {contents.map((content, index) => {
        const BlockComponent = EXTENDED_BLOCK_TYPES[content.type];
        if (!BlockComponent) {
          return null;
        }

        return <BlockComponent key={index} {...content.data} />;
      })}
    </div>
  );
};

export default AcSectionsHandler;
