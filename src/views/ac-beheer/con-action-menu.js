import {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import clsx from 'clsx';
import { AcButton } from '@src/molecules';

// Context for the ConActionMenu component
const ConActionMenuContext = createContext(null);
const useConActionMenuContext = () => {
  const context = useContext(ConActionMenuContext);
  if (!context) {
    throw new Error('ConActionMenu.* must be used inside <ConActionMenu>');
  }
  return context;
};

// A small custom hook to handle clicks outside a ref
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    }
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
}

/**
 * Main ConActionMenu component that provides a toggle-able dropdown or popover menu.
 * It uses a React Context to manage its open/close state, which is shared with the sub-components.
 *
 * Sub-components:
 * - **ConActionMenu.Button**: A button that toggles the menu's open/close state.
 * - **ConActionMenu.Items**: A container that displays the menu items when open. Accepts a `position` prop for alignment.
 * - **ConActionMenu.Item**: A single clickable menu item. By default, it closes the menu when clicked.
 * - **ConActionMenu.Divider**: A visual divider (\<hr>) used to separate menu items.
 *
 * @function
 * @name ConActionMenu
 * @param {object} props - The props object.
 * @param {React.ReactNode} props.children - The compound sub-components to render (Button, Items, Item, etc.).
 * @param {string} [props.className] - Optional CSS class names to style the outer container.
 * @returns {JSX.Element} The rendered menu container with context providers.
 *
 * @example
 * // Basic usage of the ConActionMenu with all sub-components:
 * <ConActionMenu className="my-dropdown">
 *   <ConActionMenu.Button>Open Menu</ConActionMenu.Button>
 *
 *   <ConActionMenu.Items position="right">
 *     <ConActionMenu.Item onClick={() => console.log('Item 1 clicked')} doNotClose>Item 1</ConActionMenu.Item>
 *     <ConActionMenu.Divider />
 *     <ConActionMenu.Item icon={<IconSome />} onClick={() => alert('Item 2 clicked')}>
 *       Item 2
 *     </ConActionMenu.Item>
 *   </ConActionMenu.Items>
 * </ConActionMenu>
 *
 * // Note that clicking the button toggles the menu, clicking outside it closes the menu,
 * // and selecting any item also closes the menu automatically if doNotClose is not set.
 *
 * @author: Thijn Douwma (SudoThijn on github)
 * @version: 1.0.0
 * @since: 07/04/2025
 */
const ConActionMenu = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useOnClickOutside(menuRef, () => setIsOpen(false));

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  // Memoize the context value so child components don't cause re-renders unnecessarily.
  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      handleToggle,
    }),
    [isOpen, handleToggle]
  );

  return (
    <ConActionMenuContext.Provider value={contextValue}>
      <div ref={menuRef} className={clsx('con-action-menu', className)}>
        {children}
      </div>
    </ConActionMenuContext.Provider>
  );
};

/**
 * A sub-component of ConActionMenu that renders a button.
 * Clicking this button toggles the open/close state of the menu.
 *
 * @function
 * @param {object} props
 * @param {React.ReactNode} props.children - The button content.
 * @returns {JSX.Element} The rendered toggle button.
 *
 * @example
 * <ConActionMenu.Button>Options</ConActionMenu.Button>
 */
ConActionMenu.Button = ({ children, ...props }) => {
  const { handleToggle } = useConActionMenuContext();

  return (
    <AcButton onClick={handleToggle} style='button' {...props}>
      {children}
    </AcButton>
  );
};

/**
 * A sub-component of ConActionMenu that renders the list of menu items.
 * Automatically hides or shows based on the menu's open state.
 *
 * @function
 * @param {object} props
 * @param {React.ReactNode} props.children - The menu items to display.
 * @param {'left'|'right'|'center'} [props.position='right'] - The alignment of the menu (CSS-based).
 * @returns {JSX.Element} The container for menu items.
 *
 * @example
 * <ConActionMenu.Items position="left">
 *   <ConActionMenu.Item>Item 1</ConActionMenu.Item>
 *   <ConActionMenu.Item>Item 2</ConActionMenu.Item>
 * </ConActionMenu.Items>
 */
ConActionMenu.Items = ({ children, position = 'right', ...props }) => {
  const { isOpen } = useConActionMenuContext();

  return (
    <div
      className={clsx(
        'con-action-menu__items',
        isOpen && 'con-action-menu__items--open',
        `con-action-menu__items--${position}`
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * A sub-component of ConActionMenu that represents a single clickable menu item.
 * Clicking it closes the menu by default.
 *
 * @function
 * @param {object} props
 * @param {React.MouseEventHandler<HTMLButtonElement>} [props.onClick] - Click handler for the menu item.
 * @param {boolean} [props.doNotClose] - If true, the menu will not close when the item is clicked.
 * @param {React.ReactNode} [props.icon] - Optional icon element to render alongside text.
 * @param {React.ReactNode} props.children - The label of the menu item.
 * @returns {JSX.Element} The rendered menu item button.
 *
 * @example
 * <ConActionMenu.Item
 *   onClick={() => doSomething()}
 *   doNotClose
 *   icon={<VISUALS.PLUS />}
 * >
 *   Menu Option
 * </ConActionMenu.Item>
 */
ConActionMenu.Item = ({ children, onClick, doNotClose, icon, ...props }) => {
  const { setIsOpen } = useConActionMenuContext();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (!doNotClose) {
      setIsOpen(false);
    }
  };

  return (
    <button className='con-action-menu__item' onClick={handleClick} {...props}>
      {icon && <span className='con-action-menu__item-icon'>{icon}</span>}
      {children}
    </button>
  );
};

/**
 * A sub-component of ConActionMenu that renders a horizontal divider.
 *
 * @function
 * @returns {JSX.Element} The rendered divider (\<hr>).
 *
 * @example
 * <ConActionMenu.Items>
 *   <ConActionMenu.Item>Item 1</ConActionMenu.Item>
 *   <ConActionMenu.Divider />
 *   <ConActionMenu.Item>Item 2</ConActionMenu.Item>
 * </ConActionMenu.Items>
 */
ConActionMenu.Divider = () => {
  return <hr className='con-action-menu__divider' />;
};

export default ConActionMenu;
