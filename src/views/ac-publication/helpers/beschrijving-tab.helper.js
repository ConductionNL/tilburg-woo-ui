import MDEditor from '@uiw/react-md-editor';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import { remarkMark } from 'remark-mark-highlight';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import { VISUALS } from '@constants';

/**
 * Creates a description tab configuration for publication pages
 * @param {Object} publication - The publication object (get_single)
 * @returns {Object} Tab configuration object
 */
export const createBeschrijvingTab = (publication) => ({
  id: 'beschrijving',
  label: 'Beschrijving',
  icon: VISUALS.DOCUMENT_TEXT,
  render: () => {
    const description = publication?.beschrijvingLang;
    
    // Only render if we have a non-empty string (not a number or other type)
    const isValidDescription = 
      description && 
      typeof description === 'string' && 
      description.trim().length > 0;
    
    if (!isValidDescription) {
      return (
        <div style={{ padding: '16px', color: '#666', fontStyle: 'italic' }}>
          Nog geen beschrijving opgegeven
        </div>
      );
    }
    
    return (
      <MDEditor.Markdown
        wrapperElement={{
          'data-color-mode': 'light',
        }}
        source={description}
        remarkPlugins={[
          [remarkGfm, { singleTilde: false }],
          remarkDefinitionList,
          remarkEmoji,
          remarkSupersub,
          remarkMark,
        ]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeSanitize],
          [remarkRehype, { handlers: { ...defListHastHandlers } }],
        ]}
      />
    );
  },
});
