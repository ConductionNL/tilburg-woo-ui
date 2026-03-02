import clsx from 'clsx';

const AcContainer = ({ children, compact, spacing, margin, className, restProps }) => {
  const _CLASSES = clsx(
    'container',
    compact && 'container--compact',
    spacing && `container--spacing-${spacing}`,
    margin && `container--margin-${margin}`,
    className && className
  );

  return (
    <div className={_CLASSES} {...restProps}>
      {children}
    </div>
  );
};

export default AcContainer;
