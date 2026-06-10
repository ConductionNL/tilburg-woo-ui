import ReactMarkdown from 'react-markdown';

// Plugins
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import { remarkMark } from 'remark-mark-highlight';

const ConMarkdown = ({ children }) => {
  return (
    <div className='con-markdown'>
      <ReactMarkdown
        remarkPlugins={[
          [remarkGfm, { singleTilde: false }],
          remarkDefinitionList,
          remarkEmoji,
          remarkSupersub,
          remarkMark,
        ]}
        rehypePlugins={[
          rehypeSlug,
          [remarkRehype, { handlers: { ...defListHastHandlers } }],
        ]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default ConMarkdown;
