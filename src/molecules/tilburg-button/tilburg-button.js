import clsx from 'clsx';

const TilburgButton = ({ href, style = 'link', children, ...restProps }) => {
  const _CLASSES = clsx(
    style === 'link' && 'utrecht-link utrecht-link--html-a',
    style === 'button' && 'utrecht-button utrecht-button--primary-action',
    'tilburg-button'
  );

  return (
    <button className={_CLASSES} {...restProps}>
      {children}
    </button>
  );
};

export default TilburgButton;
