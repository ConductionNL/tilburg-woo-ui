import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * AcTile - Reusable colored tile component with icon and text
 * 
 * @param {Object} props
 * @param {React.Component} props.icon - SVG icon component to display
 * @param {string} props.text - Text to display below the icon
 * @param {string} props.href - URL to navigate to (external links)
 * @param {string} props.to - Internal route to navigate to
 * @param {Function} props.onClick - Custom click handler (overrides navigation)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the tile is disabled
 * @param {string} props.color - Color variant ('primary', 'secondary', 'success', 'warning', 'danger')
 * @param {string} props.size - Size variant ('small', 'medium', 'large')
 * @returns {React.ReactElement}
 */
const AcTile = ({ 
  icon: Icon, 
  text, 
  href, 
  to, 
  onClick, 
  className = '', 
  disabled = false,
  color = 'primary',
  size = 'medium',
  ...rest 
}) => {
  const navigate = useNavigate();

  const handleClick = (event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (onClick) {
      onClick(event);
    } else if (to) {
      navigate(to);
    } else if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  const tileClasses = [
    'ac-tile',
    `ac-tile--${color}`,
    `ac-tile--${size}`,
    disabled && 'ac-tile--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={tileClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...rest}
    >
      {Icon && (
        <div className="ac-tile__icon">
          <Icon />
        </div>
      )}
      {text && (
        <div className="ac-tile__text">
          {text}
        </div>
      )}
    </div>
  );
};

AcTile.propTypes = {
  icon: PropTypes.elementType,
  text: PropTypes.string,
  href: PropTypes.string,
  to: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'orange', 'green', 'purple', 'yellow', 'teal', 'blue']),
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default AcTile;
