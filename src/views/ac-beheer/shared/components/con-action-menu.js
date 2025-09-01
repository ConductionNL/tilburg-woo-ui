import {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
// eslint-disable-next-line import/no-unresolved
} from 'react';
// eslint-disable-next-line import/no-unresolved
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AcButton, AcCheckbox } from '@src/molecules';
import { VISUALS } from '@src/constants';
import { Separator } from '@utrecht/component-library-react/dist/css-module';

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
function useOnClickOutside(refs, handler) {
  useEffect(() => {
    function listener(e) {
      const isInside = refs.some(
        (ref) => ref.current && ref.current.contains(e.target)
      );
      if (isInside) return;
      handler(e);
    }
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [refs, handler]);
}

/**
 * Main ConActionMenu component that provides a toggle-able dropdown or popover menu.
 * It uses a React Context to manage its open/close state, which is shared with the sub-components.
 *
 * Sub-components:
 * - **ConActionMenu.Trigger**: A button that toggles the menu's open/close state.
 * - **ConActionMenu.Menu**: A container that displays the menu items when open. Accepts a `position` prop for alignment.
 * - **ConActionMenu.SubMenu**: A nested submenu that can be used to create a menu with multiple levels of options. Can be placed anywhere in the menu.
 * - **ConActionMenu.Dropdown**: A collapsible section that reveals additional menu items when clicked. Can be nested within other menu items.
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
 *   <ConActionMenu.Menu position="right">
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
 *
 *     <ConActionMenu.Dropdown label='Dropdown'>
 *       <ConActionMenu.Button>Nested Item 1</ConActionMenu.Button>
 *       <ConActionMenu.Button>Nested Item 2</ConActionMenu.Button>
 *     </ConActionMenu.Dropdown>
 *     <ConActionMenu.SubMenu label='SubMenu'>
 *       <ConActionMenu.Button>Nested Item 1</ConActionMenu.Button>
 *       <ConActionMenu.Button>Nested Item 2</ConActionMenu.Button>
 *     </ConActionMenu.SubMenu>
 *   </ConActionMenu.Menu>
 * </ConActionMenu>
 *
 * // Note that clicking the trigger toggles the menu, clicking outside it closes the menu,
 * // and clicking any button also closes the menu automatically if doNotClose is not set.
 *
 * @author: Thijn Douwma (SudoThijn on github)
 * @version: 1.1.3
 * @since: 10/04/2025
 */
const ConActionMenu = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const portalRef = useRef(null);

  useOnClickOutside([menuRef, portalRef], () => setIsOpen(false));

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  // Memoize the context value so child components don't cause re-renders unnecessarily.
  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      handleToggle,
      triggerRef,
      portalRef,
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
  const { handleToggle, triggerRef } = useConActionMenuContext();

  return (
    <div ref={triggerRef}>
      <AcButton onClick={handleToggle} style='button' {...props}>
        {children}
      </AcButton>
    </div>
  );
};
ConActionMenu.Trigger.displayName = 'ConActionMenu.Trigger';

/**
 * A sub-component of ConActionMenu that renders the list of menu items.
 * Automatically hides or shows based on the menu's open state.
 *
 * @function
 * @param {object} props
 * @param {'left'|'right'|'center'} [props.position='right'] - The alignment of the menu (CSS-based). defaults to right.
 * @param {React.ReactNode} props.children - The menu items to display.
 * @returns {JSX.Element} The container for menu items.
 *
 * @example
 * <ConActionMenu.Menu position="left">
 *   <ConActionMenu.Button>Button 1</ConActionMenu.Button>
 *   <ConActionMenu.Item>{(close) => <CustomContent onDone={close} />}</ConActionMenu.Item>
 * </ConActionMenu.Menu>
 */
ConActionMenu.Menu = ({ children, position = 'left', ...props }) => {
  const { isOpen, triggerRef, portalRef } = useConActionMenuContext();
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      let left = 0;
      switch (position) {
        case 'right':
          left = triggerRect.right;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2;
          break;
        case 'left':
        default:
          left = triggerRect.left;
          break;
      }

      setMenuPosition({
        top: triggerRect.bottom + scrollTop + 4, // 4px offset from trigger
        left: left,
      });
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const menuContent = (
    <div
      ref={portalRef}
      className={clsx('con-action-menu__menu', `con-action-menu__menu--${position}`)}
      style={{
        position: 'absolute',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        transform:
          position === 'center'
            ? 'translateX(-50%)'
            : position === 'right'
            ? 'translateX(-100%)'
            : 'none',
      }}
      {...props}
    >
      {children}
    </div>
  );

  return createPortal(menuContent, document.body);
};
ConActionMenu.Menu.displayName = 'ConActionMenu.Menu';

/**
 * A sub-component of ConActionMenu that creates a nested submenu.
 * Provides a trigger button and nested menu items.
 *
 * @function
 * @param {object} props
 * @param {React.ReactNode} props.label - The label for the submenu trigger button
 * @param {React.ReactNode} props.icon - The icon for the submenu trigger button
 * @param {'left'|'right'} props.position - The alignment of the submenu, defaults to left
 * @param {boolean} props.disabled - Whether the submenu is disabled
 * @param {React.ReactNode} props.children - The submenu items to display
 * @returns {JSX.Element} The rendered submenu component
 *
 * @example
 * <ConActionMenu.Menu>
 *   <ConActionMenu.SubMenu label="More Options" position="left">
 *     <ConActionMenu.Button>Nested Item 1</ConActionMenu.Button>
 *     <ConActionMenu.Button>Nested Item 2</ConActionMenu.Button>
 *   </ConActionMenu.SubMenu>
 * </ConActionMenu.Menu>
 */
ConActionMenu.SubMenu = ({
  label,
  icon,
  children,
  position = 'right',
  disabled,
  ...props
}) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const submenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target)) {
        setIsSubmenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='con-action-submenu' ref={submenuRef} {...props}>
      <ConActionMenu.Button
        icon={icon}
        doNotClose
        className='con-action-submenu__trigger'
        onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
        disabled={disabled}
      >
        <span className='con-action-submenu__trigger-label'>
          {label}
          {<VISUALS.CHEVRON_RIGHT />}
        </span>
      </ConActionMenu.Button>
      <div
        className={clsx(
          'con-action-submenu__menu',
          isSubmenuOpen && 'con-action-submenu__menu--open',
          `con-action-submenu__menu--${position}`
        )}
      >
        {children}
      </div>
    </div>
  );
};
ConActionMenu.SubMenu.displayName = 'ConActionMenu.SubMenu';

/**
 * A sub-component of ConActionMenu that creates a dropdown menu.
 * Provides a trigger button and dropdown items.
 *
 * @function
 * @param {object} props
 * @param {React.ReactNode} props.label - The label for the dropdown trigger button
 * @param {React.ReactNode} props.icon - The icon for the dropdown trigger button
 * @param {boolean} props.disabled - Whether the dropdown is disabled
 * @param {React.ReactNode} props.children - The dropdown items to display
 * @returns {JSX.Element} The rendered dropdown component
 *
 * @example
 * <ConActionMenu.Menu>
 *   <ConActionMenu.Dropdown label="More Options">
 *     <ConActionMenu.Button>Nested Item 1</ConActionMenu.Button>
 *   </ConActionMenu.Dropdown>
 * </ConActionMenu.Menu>
 */
ConActionMenu.Dropdown = ({ label, icon, children, disabled, ...props }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='con-action-dropdown' ref={dropdownRef} {...props}>
      <ConActionMenu.Button
        doNotClose
        className='con-action-dropdown__trigger'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        icon={icon}
        disabled={disabled}
      >
        <span className='con-action-dropdown__trigger-label'>
          {label}

          {
            <VISUALS.CHEVRON_RIGHT
              className={clsx(
                'con-action-dropdown__arrow',
                isDropdownOpen && 'con-action-dropdown__arrow--open'
              )}
            />
          }
        </span>
      </ConActionMenu.Button>
      <div
        className={clsx(
          'con-action-dropdown__menu',
          isDropdownOpen && 'con-action-dropdown__menu--open'
        )}
      >
        {children}
      </div>
    </div>
  );
};
ConActionMenu.Dropdown.displayName = 'ConActionMenu.Dropdown';

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
ConActionMenu.Item = ({ children, className, ...props }) => {
  const { setIsOpen } = useConActionMenuContext();
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <div className={clsx('con-action-menu__item', className)} {...props}>
      {children(close)}
    </div>
  );
};
ConActionMenu.Item.displayName = 'ConActionMenu.Item';

/**
 * A sub-component of ConActionMenu that renders a horizontal divider using the Utrecht Separator component.
 *
 * @function
 * @returns {JSX.Element} The rendered Utrecht Separator component.
 *
 * @example
 * <ConActionMenu.Menu>
 *   <ConActionMenu.Button>Button 1</ConActionMenu.Button>
 *   <ConActionMenu.Divider />
 *   <ConActionMenu.Button>Button 2</ConActionMenu.Button>
 * </ConActionMenu.Menu>
 */
ConActionMenu.Divider = () => {
  return <Separator className='con-action-divider' />;
};
ConActionMenu.Divider.displayName = 'ConActionMenu.Divider';

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
ConActionMenu.Button = ({
  children,
  onClick,
  doNotClose,
  icon,
  className,
  ...props
}) => {
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
      className={clsx(
        'con-action-menu__item',
        'con-action-menu__item--button',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className='con-action-menu__item-icon'>{icon}</span>}
      {children}
    </button>
  );
};
ConActionMenu.Button.displayName = 'ConActionMenu.Button';

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
ConActionMenu.Checkbox.displayName = 'ConActionMenu.Checkbox';

export default ConActionMenu;
