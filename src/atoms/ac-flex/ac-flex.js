import clsx from 'clsx';

const AcFlex = ({
  children,
  column,
  spacing,
  margin,
  justifyContent,
  alignItems,
  wrap,
  grow,
  className,
}) => {
  const _CLASSES = clsx(
    'ac-flex',
    column && 'ac-flex--column',
    spacing && `ac-flex--spacing-${spacing}`,
    margin && `ac-flex--margin-${margin}`,
    wrap && 'ac-flex--wrap',
    grow && 'ac-flex--grow',
    justifyContent && `ac-flex--justify-content-${justifyContent}`,
    alignItems && `ac-flex--align-items-${alignItems}`,
    className
  );

  return <div className={_CLASSES}>{children}</div>;
};

export default AcFlex;
