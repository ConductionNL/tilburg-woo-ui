import { useEffect } from 'react';
import clsx from 'clsx';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcImage, AcRichText, AcDataList } from '@atoms';
import { AcCta } from '@molecules';
import { AcFaq } from '@components';
import { filterPageSections } from '@src/utilities/con-authentication-filters';

const BLOCK_TYPES = {
  Cta: AcCta,
  DataList: AcDataList,
  Faq: AcFaq,
  Image: AcImage,
  RichText: AcRichText,
};

const AcSectionsHandler = ({ store: { user }, contents = [] }) => {
  const _CLASSES = clsx('ac-sections');

  // Filter sections based on authentication state
  const filteredContents = filterPageSections(contents, user.isAuthenticated);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('AcSectionsHandler - user.isAuthenticated:', user.isAuthenticated);
    console.log('AcSectionsHandler - original contents:', contents);
    console.log('AcSectionsHandler - filtered contents:', filteredContents);
  }

  return (
    <div className={_CLASSES}>
      {filteredContents.map((content, index) => {
        const BlockComponent = BLOCK_TYPES[content.type];
        if (!BlockComponent) {
          return null;
        }

        return <BlockComponent key={index} {...content.data} />;
      })}
    </div>
  );
};

export default withStore(observer(AcSectionsHandler));
