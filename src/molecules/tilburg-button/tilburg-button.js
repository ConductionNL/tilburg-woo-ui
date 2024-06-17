import clsx from 'clsx';

const TilburgButton = ({
  href,
  style = 'link',
  animate,
  children,
  className,
  sr,
  ...restProps
}) => {
  const _CLASSES = clsx(
    style === 'link' && 'utrecht-link utrecht-link--html-a',
    style === 'button' && 'utrecht-button utrecht-button--primary-action',
    animate && 'tilburg-button--animate',
    'tilburg-button',
    className
  );

  return (
    <button className={_CLASSES} {...restProps}>
      {children}

      {sr && <span className='sr-only'>{sr}</span>}
    </button>
  );
};

export default TilburgButton;
