/**
 * AcSectionsHandler Component
 * 
 * Renders dynamic page content sections based on their type. This component handles
 * the mapping between API content types and their corresponding React components.
 * 
 * Supported content types:
 * - Cta: Call-to-action components
 * - DataList: Data list components
 * - Faq: FAQ components
 * - Image: Image components
 * - RichText: Rich text content (expects data.content field with formatted HTML)
 * - text: Plain text content (expects data.html field, mapped to RichText component)
 * 
 * Data format examples:
 * - RichText: { type: "RichText", data: { content: "<h1>Title</h1>..." } }
 * - text: { type: "text", data: { html: "<h1>Title</h1>...", text: "Title" } }
 * 
 * The component also filters sections based on user authentication state.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.store - MobX store containing user state
 * @param {Object} props.store.user - User store with authentication state
 * @param {Array} props.contents - Array of content sections to render
 * @returns {JSX.Element} Rendered sections container
 */
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
  text: AcRichText, // Support lowercase "text" type from API
};

const AcSectionsHandler = ({ store: { user }, contents = [] }) => {
  const _CLASSES = clsx('ac-sections');

  // Filter sections based on authentication state
  const filteredContents = filterPageSections(contents, user.isAuthenticated);

  return (
    <div className={_CLASSES}>
      {filteredContents.map((content, index) => {
        const BlockComponent = BLOCK_TYPES[content.type];
        if (!BlockComponent) {
          console.warn(`Unknown content type: ${content.type}`, content);
          return null;
        }

        // Map API data format to component props
        const componentProps = { ...content.data };
        
        // Handle "text" type: map "html" field to "content" field for AcRichText
        // RichText type already has "content" field, so no transformation needed
        if (content.type === 'text' && content.data.html) {
          componentProps.content = content.data.html;
        }

        return <BlockComponent key={index} {...componentProps} />;
      })}
    </div>
  );
};

export default withStore(observer(AcSectionsHandler));
