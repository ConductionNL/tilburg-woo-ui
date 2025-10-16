import { createContext, useContext, useMemo, useState, useRef } from 'preact/compat';
import clsx from 'clsx';
import { VISUALS } from '@src/constants';

// Context used to coordinate single-open behavior across items
const ConAccordionContext = createContext(null);
const useConAccordionContext = () => {
  const context = useContext(ConAccordionContext);
  return context;
};

/**
 * ConAccordion is a wrapper providing optional single-open behavior for its items.
 * When `singleOpen` is true, opening one item closes the others.
 */
const ConAccordion = ({ children, className, singleOpen = false }) => {
  const idRegistry = useRef(new Set());
  const [openId, setOpenId] = useState(null);

  const contextValue = useMemo(
    () => ({ singleOpen, openId, setOpenId, idRegistry }),
    [singleOpen, openId]
  );

  return (
    <ConAccordionContext.Provider value={contextValue}>
      <div className={clsx('con-accordion', className)}>{children}</div>
    </ConAccordionContext.Provider>
  );
};

/**
 * Renders a single accordion item with a clickable header and a content panel.
 * - header: ReactNode or function ({ isOpen }) => ReactNode
 * - id: required when the parent ConAccordion has singleOpen=true
 * - defaultOpen: initial open state for non-singleOpen usage
 */
const Item = ({
  id,
  header,
  defaultOpen = false,
  children,
  className,
  disabled,
  chevronClassName,
  chevronStyle,
  ...props
}) => {
  const ctx = useConAccordionContext();
  const panelIdRef = useRef(
    `con-accordion-panel-${Math.random().toString(36).slice(2)}`
  );
  const panelId = panelIdRef.current;

  // check if there is an ID when singleOpen is enabled
  if (ctx?.singleOpen && (id === undefined || id === null)) {
    throw new Error(
      'ConAccordion.Item: `id` is required when `singleOpen` is enabled.'
    );
  }

  // check if the ID is already in the registry
  if (ctx?.singleOpen && ctx.idRegistry.has(id)) {
    throw new Error(`ConAccordion.Item: \`id\` (${id}) must be unique.`);
  }

  // add the ID to the registry
  ctx?.idRegistry?.add?.(id);

  const isControlledByContext = !!ctx?.singleOpen;

  const [isOpenUncontrolled, setIsOpenUncontrolled] = useState(Boolean(defaultOpen));
  const isOpen = isControlledByContext ? ctx.openId === id : isOpenUncontrolled;

  const handleToggle = () => {
    if (disabled) return;
    if (isControlledByContext) {
      if (ctx.openId === id) {
        ctx.setOpenId(null);
      } else {
        ctx.setOpenId(id);
      }
    } else {
      setIsOpenUncontrolled((prev) => !prev);
    }
  };

  const headerContent = typeof header === 'function' ? header({ isOpen }) : header;

  return (
    <div
      className={clsx(
        'con-accordion__item',
        isOpen && 'con-accordion__item--open',
        disabled && 'con-accordion__item--disabled',
        className
      )}
      {...props}
    >
      <button
        type='button'
        className={clsx('con-accordion__header')}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className='con-accordion__header-content'>{headerContent}</span>
        <span
          className={clsx('con-accordion__icon', chevronClassName)}
          style={chevronStyle}
        >
          <VISUALS.CHEVRON_RIGHT style={{ width: '16px', height: '16px' }} />
        </span>
      </button>

      <div id={panelId} role='region' className='con-accordion__content'>
        {children}
      </div>
    </div>
  );
};
Item.displayName = 'ConAccordion.Item';
ConAccordion.Item = Item;

export default ConAccordion;
