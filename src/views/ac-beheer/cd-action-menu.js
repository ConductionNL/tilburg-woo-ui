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

// Context for the CDActionMenu component
const CDActionMenuContext = createContext(null);
const useCDActionMenuContext = () => {
  const context = useContext(CDActionMenuContext);
  if (!context) {
    throw new Error('CDActionMenu.* must be used inside <CDActionMenu>');
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
 * Main CDActionMenu component that provides a toggle-able dropdown or popover menu.
 * It uses a React Context to manage its open/close state, which is shared with the sub-components.
 *
 * Sub-components:
 * - **CDActionMenu.Button**: A button that toggles the menu's open/close state.
 * - **CDActionMenu.Items**: A container that displays the menu items when open. Accepts a `position` prop for alignment.
 * - **CDActionMenu.Item**: A single clickable menu item. By default, it closes the menu when clicked.
 * - **CDActionMenu.Divider**: A visual divider (\<hr>) used to separate menu items.
 *
 * @function
 * @name CDActionMenu
 * @param {object} props - The props object.
 * @param {React.ReactNode} props.children - The compound sub-components to render (Button, Items, Item, etc.).
 * @param {string} [props.className] - Optional CSS class names to style the outer container.
 * @returns {JSX.Element} The rendered menu container with context providers.
 *
 * @example
 * // Basic usage of the CDActionMenu with all sub-components:
 * <CDActionMenu className="my-dropdown">
 *   <CDActionMenu.Button>Open Menu</CDActionMenu.Button>
 *
 *   <CDActionMenu.Items position="right">
 *     <CDActionMenu.Item onClick={() => console.log('Item 1 clicked')} doNotClose>Item 1</CDActionMenu.Item>
 *     <CDActionMenu.Divider />
 *     <CDActionMenu.Item icon={<IconSome />} onClick={() => alert('Item 2 clicked')}>
 *       Item 2
 *     </CDActionMenu.Item>
 *   </CDActionMenu.Items>
 * </CDActionMenu>
 *
 * // Note that clicking the button toggles the menu, clicking outside it closes the menu,
 * // and selecting any item also closes the menu automatically if doNotClose is not set.
 *
 * @author: Thijn Douwma (SudoThijn on github)
 * @version: 1.0.0
 * @since: 07/04/2025
 */
const CDActionMenu = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useOnClickOutside(menuRef, () => setIsOpen(false));

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  // Memoize the context value so child components don’t cause re-renders unnecessarily.
  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      handleToggle,
    }),
    [isOpen, handleToggle]
  );

  return (
    <CDActionMenuContext.Provider value={contextValue}>
      <div ref={menuRef} className={clsx('cd-action-menu', className)}>
        {children}
      </div>
    </CDActionMenuContext.Provider>
  );
};

/**
 * A sub-component of CDActionMenu that renders a button.
 * Clicking this button toggles the open/close state of the menu.
 *
 * @function
 * @param {object} props
 * @param {React.ReactNode} props.children - The button content.
 * @returns {JSX.Element} The rendered toggle button.
 *
 * @example
 * <CDActionMenu.Button>Options</CDActionMenu.Button>
 */
CDActionMenu.Button = ({ children, ...props }) => {
  const { handleToggle } = useCDActionMenuContext();

  return (
    <AcButton onClick={handleToggle} style='button' {...props}>
      {children}
    </AcButton>
  );
};

/**
 * A sub-component of CDActionMenu that renders the list of menu items.
 * Automatically hides or shows based on the menu's open state.
 *
 * @function
 * @param {object} props
 * @param {React.ReactNode} props.children - The menu items to display.
 * @param {'left'|'right'|'center'} [props.position='right'] - The alignment of the menu (CSS-based).
 * @returns {JSX.Element} The container for menu items.
 *
 * @example
 * <CDActionMenu.Items position="left">
 *   <CDActionMenu.Item>Item 1</CDActionMenu.Item>
 *   <CDActionMenu.Item>Item 2</CDActionMenu.Item>
 * </CDActionMenu.Items>
 */
CDActionMenu.Items = ({ children, position = 'right', ...props }) => {
  const { isOpen } = useCDActionMenuContext();

  return (
    <div
      className={clsx(
        'cd-action-menu__items',
        isOpen && 'cd-action-menu__items--open',
        `cd-action-menu__items--${position}`
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * A sub-component of CDActionMenu that represents a single clickable menu item.
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
 * <CDActionMenu.Item
 *   onClick={() => doSomething()}
 *   doNotClose
 *   icon={<VISUALS.PLUS />}
 * >
 *   Menu Option
 * </CDActionMenu.Item>
 */
CDActionMenu.Item = ({ children, onClick, doNotClose, icon, ...props }) => {
  const { setIsOpen } = useCDActionMenuContext();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (!doNotClose) {
      setIsOpen(false);
    }
  };

  return (
    <button className='cd-action-menu__item' onClick={handleClick} {...props}>
      {icon && <span className='cd-action-menu__item-icon'>{icon}</span>}
      {children}
    </button>
  );
};

/**
 * A sub-component of CDActionMenu that renders a horizontal divider.
 *
 * @function
 * @returns {JSX.Element} The rendered divider (\<hr>).
 *
 * @example
 * <CDActionMenu.Items>
 *   <CDActionMenu.Item>Item 1</CDActionMenu.Item>
 *   <CDActionMenu.Divider />
 *   <CDActionMenu.Item>Item 2</CDActionMenu.Item>
 * </CDActionMenu.Items>
 */
CDActionMenu.Divider = () => {
  return <hr className='cd-action-menu__divider' />;
};

export default CDActionMenu;
