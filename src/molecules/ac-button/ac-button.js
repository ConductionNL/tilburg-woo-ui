import clsx from 'clsx';

const AcButton = ({
  href,
  style = 'link',
  animate,
  children,
  className,
  icon,
  sr,
  ...restProps
}) => {
  const _CLASSES = clsx(
    style === 'link' && 'utrecht-link utrecht-link--html-a',
    style === 'button' && 'utrecht-button utrecht-button--primary-action',
    animate && 'ac-button--animate',
    'ac-button',
    className
  );

  return (
    <button className={_CLASSES} {...restProps}>
      {icon && <span className='ac-button__icon'>{icon}</span>}
      {children}

      {sr && <span className='sr-only'>{sr}</span>}
    </button>
  );
};

export default AcButton;
