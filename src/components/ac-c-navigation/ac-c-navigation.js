import * as React from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router';

const AcCNavigation = ({ items = [], mobileLogo, layoutClassName }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleSubItemClick = (handleClick) => {
    setIsOpen(false);

    handleClick();
  };

  const isCurrent = (slug) => {
    return slug === window.location.pathname;
  };

  return (
    <div
      className={clsx(
        'ac-c-navigation__container',
        layoutClassName && layoutClassName
      )}
    >
      {/* @TODO: this element is not being shown due to line 412-414 of `_ac-c-navigation.scss`, decide what to do with this */}
      <div className='ac-c-navigation__menu-toggle-container'>
        {mobileLogo}

        <button
          className='ac-c-navigation__menu-toggle'
          onClick={() => setIsOpen((o) => !o)}
        ></button>
      </div>
      <nav
        className={clsx('ac-c-navigation__primary', isOpen && 'isOpen')}
        aria-label='Hoofdnavigatie'
      >
        <ul className='ac-c-navigation__ul'>
          {items.map(({ name, icon, link, slug, items }, idx) => (
            <li
              key={idx}
              to={!items?.length && link}
            >
              <Link
                to={!items.length && link}
                className='ac-c-navigation__link-container'
              >
                <div
                  className={clsx(
                    'ac-c-navigation__label',
                    items && 'ac-c-navigation__mobile-link',
                    isCurrent(slug) && 'ac-c-navigation__current-link',
                    icon && 'ac-c-navigation__icon'
                  )}
                >
                  {icon && icon}
                  {name}
                </div>

                {items?.length > 0 && (
                  <ul
                    className={clsx('ac-c-navigation__dropdown', [
                      items.length > 8 && 'ac-c-navigation__dropdown-overflow',
                    ])}
                  >
                    {items.map(({ name, icon, link, slug }, idx) => (
                      <li
                        key={idx}
                        className={clsx(
                          'ac-c-navigation__li',
                          'ac-c-navigation__dropdown-li',
                          isCurrent(slug) && 'ac-c-navigation__dropdown-current'
                        )}
                        onClick={() => handleSubItemClick(() => navigate(link))}
                      >
                        <Link
                          className={clsx(
                            'ac-c-navigation__label',
                            isCurrent(slug) &&
                              'ac-c-navigation__dropdown-current-link',
                            icon && 'ac-c-navigation__icon'
                          )}
                        >
                          {icon}
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AcCNavigation;
