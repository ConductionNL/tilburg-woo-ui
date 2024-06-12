import clsx from 'clsx';

const TilburgFlex = ({
  children,
  column,
  spacing,
  justifyContent,
  alignItems,
  grow,
  className,
}) => {
  const _CLASSES = clsx(
    'tilburg-flex',
    column && 'tilburg-flex--column',
    spacing && `tilburg-flex--spacing-${spacing}`,
    grow && 'tilburg-flex--grow',
    justifyContent && `tilburg-flex--justify-content-${justifyContent}`,
    alignItems && `tilburg-flex--align-items-${alignItems}`,
    className
  );

  return <div className={_CLASSES}>{children}</div>;
};

export default TilburgFlex;
