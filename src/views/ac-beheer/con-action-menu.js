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
import { AcButton, AcCheckbox } from '@src/molecules';

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
 * - **ConActionMenu.Trigger**: A button that toggles the menu's open/close state.
 * - **ConActionMenu.Items**: A container that displays the menu items when open. Accepts a `position` prop for alignment.
 * - **ConActionMenu.Item**: A generic container for menu items. Provides a close function to its children.
 * - **ConActionMenu.Button**: A clickable button menu item. By default, it closes the menu when clicked.
 * - **ConActionMenu.Checkbox**: A checkbox menu item. Allows for external control of the checkbox state.
 * - **ConActionMenu.Divider**: A visual divider (\<hr>) used to separate menu items.
 *
 * @function
 * @name ConActionMenu
 * @param {object} props - The props object.
 * @param {React.ReactNode} props.children - The compound sub-components to render (Trigger, Items, Item, etc.).
 * @param {string} [props.className] - Optional CSS class names to style the outer container.
 * @returns {JSX.Element} The rendered menu container with context providers.
 *
 * @example
 * // Basic usage of the ConActionMenu with all sub-components:
 * <ConActionMenu className="my-dropdown">
 *   <ConActionMenu.Trigger>Open Menu</ConActionMenu.Trigger>
 *
 *   <ConActionMenu.Items position="right">
 *     <ConActionMenu.Button onClick={() => console.log('Button 1 clicked')} doNotClose>Button 1</ConActionMenu.Button>
 *     <ConActionMenu.Divider />
 *     <ConActionMenu.Item>
 *       {(close) => (
 *         <CustomComponent onAction={() => {
 *           doSomething();
 *           close();
 *         }} />
 *       )}
 *     </ConActionMenu.Item>
 *     <ConActionMenu.Button icon={<IconSome />} onClick={() => alert('Button 2 clicked')}>
 *       Button 2
 *     </ConActionMenu.Button>
 *     <ConActionMenu.Checkbox defaultChecked={true} onChange={(checked) => alert('Checkbox changed: ' + checked)}>
 *       Checkbox
 *     </ConActionMenu.Checkbox>
 *   </ConActionMenu.Items>
 * </ConActionMenu>
 *
 * // Note that clicking the trigger toggles the menu, clicking outside it closes the menu,
 * // and clicking any button also closes the menu automatically if doNotClose is not set.
 *
 * @author: Thijn Douwma (SudoThijn on github)
 * @version: 1.0.1
 * @since: 08/04/2025
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
 * A sub-component of ConActionMenu that renders a trigger button.
 * Clicking this button toggles the menu's open/close state.
 *
 * @function
 * @param {object} props
 * @param {React.ReactNode} props.children - The button content.
 * @returns {JSX.Element} The rendered toggle button.
 *
 * @example
 * <ConActionMenu.Trigger>Options</ConActionMenu.Trigger>
 */
ConActionMenu.Trigger = ({ children, ...props }) => {
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
 *   <ConActionMenu.Button>Button 1</ConActionMenu.Button>
 *   <ConActionMenu.Item>{close => <CustomContent onDone={close} />}</ConActionMenu.Item>
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
 * A sub-component of ConActionMenu that represents a generic container for menu items.
 * Provides a close function to its children to allow custom closing behavior.
 *
 * @function
 * @param {object} props
 * @param {(close: () => void) => React.ReactNode} props.children - Render prop that receives close function.
 * @returns {JSX.Element} The rendered menu item container.
 *
 * @example
 * <ConActionMenu.Item>
 *   {(close) => (
 *     <CustomComponent
 *       onClick={() => {
 *         handleAction();
 *         close();
 *       }}
 *     />
 *   )}
 * </ConActionMenu.Item>
 */
ConActionMenu.Item = ({ children, ...props }) => {
  const { setIsOpen } = useConActionMenuContext();
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <div className='con-action-menu__item' {...props}>
      {children(close)}
    </div>
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
 *   <ConActionMenu.Button>Button 1</ConActionMenu.Button>
 *   <ConActionMenu.Divider />
 *   <ConActionMenu.Button>Button 2</ConActionMenu.Button>
 * </ConActionMenu.Items>
 */
ConActionMenu.Divider = () => {
  return <hr className='con-action-menu__divider' />;
};

/**
 * A sub-component of ConActionMenu that represents a clickable button menu item.
 * Clicking it closes the menu by default.
 *
 * @function
 * @param {object} props
 * @param {React.MouseEventHandler<HTMLButtonElement>} [props.onClick] - Click handler for the button.
 * @param {boolean} [props.doNotClose] - If true, the menu will not close when the button is clicked.
 * @param {React.ReactNode} [props.icon] - Optional icon element to render alongside text.
 * @param {React.ReactNode} props.children - The label of the button.
 * @returns {JSX.Element} The rendered menu button.
 *
 * @example
 * <ConActionMenu.Button
 *   onClick={() => doSomething()}
 *   doNotClose
 *   icon={<VISUALS.PLUS />}
 * >
 *   Menu Option
 * </ConActionMenu.Button>
 */
ConActionMenu.Button = ({ children, onClick, doNotClose, icon, ...props }) => {
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
    <button
      className='con-action-menu__item con-action-menu__item--button'
      onClick={handleClick}
      {...props}
    >
      {icon && <span className='con-action-menu__item-icon'>{icon}</span>}
      {children}
    </button>
  );
};

/**
 * A sub-component of ConActionMenu that renders a checkbox menu item.
 * The checkbox state can be controlled externally and responds to changes.
 * The entire item area is clickable to toggle the checkbox.
 *
 * @function
 * @param {object} props - Additional props are passed to the checkbox. (Not passed to the containing div element)
 * @param {boolean} [props.checked] - The controlled checked state of the checkbox
 * @param {function} [props.onChange] - Handler called when checkbox changes, receives new checked state as a boolean
 * @param {boolean} [props.defaultChecked] - Initial checked state when uncontrolled
 * @param {boolean} [props.disabled] - Whether the checkbox is disabled
 * @param {React.ReactNode} props.children - Label content next to checkbox
 * @returns {JSX.Element} The rendered checkbox menu item
 *
 * @example
 * // Controlled checkbox
 * const [checked, setChecked] = useState(false);
 * <ConActionMenu.Checkbox
 *   checked={checked}
 *   onChange={setChecked}
 *   disabled={false}
 * >
 *   Toggle Feature
 * </ConActionMenu.Checkbox>
 *
 * // Uncontrolled checkbox
 * <ConActionMenu.Checkbox defaultChecked={true}>
 *   Enable Option
 * </ConActionMenu.Checkbox>
 */
ConActionMenu.Checkbox = ({
  children,
  checked,
  onChange,
  defaultChecked,
  disabled,
  ...props
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked || false);
  const isControlled = checked !== undefined;

  const handleChange = (newChecked) => {
    if (!disabled) {
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onChange?.(newChecked);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      const newChecked = isControlled ? !checked : !internalChecked;
      handleChange(newChecked);
    }
  };

  return (
    <div
      className={clsx(
        'con-action-menu__item',
        'con-action-menu__item--checkbox',
        disabled && 'con-action-menu__item--disabled'
      )}
      onClick={handleClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <AcCheckbox
        checked={isControlled ? checked : internalChecked}
        onChange={handleChange}
        defaultChecked={defaultChecked}
        disabled={disabled}
        {...props}
      />
      {children}
    </div>
  );
};

export default ConActionMenu;
