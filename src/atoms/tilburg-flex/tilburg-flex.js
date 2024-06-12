import clsx from 'clsx';

const TilburgFlex = ({
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
    'tilburg-flex',
    column && 'tilburg-flex--column',
    spacing && `tilburg-flex--spacing-${spacing}`,
    margin && `tilburg-flex--margin-${margin}`,
    wrap && 'tilburg-flex--wrap',
    grow && 'tilburg-flex--grow',
    justifyContent && `tilburg-flex--justify-content-${justifyContent}`,
    alignItems && `tilburg-flex--align-items-${alignItems}`,
    className
  );

  return <div className={_CLASSES}>{children}</div>;
};

export default TilburgFlex;
