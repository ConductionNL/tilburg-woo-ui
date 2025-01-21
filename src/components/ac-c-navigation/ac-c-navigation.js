import * as React from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router';

const AcCNavigation = ({ items = [], mobileLogo, layoutClassName }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 992);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubItemClick = (handleClick) => {
    setIsOpen(false);

    handleClick();
  };

  const isCurrent = (slug) => {
    return slug === window.location.pathname;
  };

  return (
    <div className='ac-c-navigation__container'>
      <div className='ac-c-navigation__menu-toggle-container'>
        {mobileLogo}

        <button
          className='ac-c-navigation__menu-toggle'
          onClick={() => setIsOpen((o) => !o)}
        ></button>
      </div>
      <nav className={clsx('ac-c-navigation__primary', isOpen && 'isOpen')}>
        <ul className='ac-c-navigation__ul'>
          {items.map(({ name, icon, link, slug, items }, idx) => (
            <Link to={!items && link} className='ac-c-navigation__link-container'>
              <li
                className={clsx(
                  'ac-c-navigation__li',
                  isCurrent(slug) && 'ac-c-navigation__current'
                )}
                c
                key={idx}
              >
                <div
                  className={clsx(
                    'ac-c-navigation__label',
                    items && 'ac-c-navigation__mobile-link',
                    isCurrent(slug) && 'ac-c-navigation__current-link'
                  )}
                >
                  {icon && icon}
                  {name}{' '}
                  {items && isMobile && (
                    <FontAwesomeIcon
                      className='ac-c-navigation__toggle-icon'
                      icon={faChevronRight}
                    />
                  )}
                </div>

                {items && (
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
                          isCurrent(slug) && 'ac-c-navigation__dropdown-current'
                        )}
                        onClick={() => handleSubItemClick(() => navigate(link))}
                      >
                        <Link
                          className={clsx(
                            'ac-c-navigation__label',
                            isCurrent(slug) &&
                              'ac-c-navigation__dropdown-current-link'
                          )}
                        >
                          {icon}
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </Link>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AcCNavigation;
