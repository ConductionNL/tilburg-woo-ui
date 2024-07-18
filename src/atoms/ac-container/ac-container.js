import clsx from 'clsx';

const AcContainer = ({ children, compact, spacing, margin, restProps }) => {
  const _CLASSES = clsx(
    'container',
    compact && 'container--compact',
    spacing && `container--spacing-${spacing}`,
    margin && `container--margin-${margin}`
  );

  return (
    <div className={_CLASSES} {...restProps}>
      {children}
    </div>
  );
};

export default AcContainer;
