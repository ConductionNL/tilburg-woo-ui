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
  id,
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

  return (
    <div className={_CLASSES} id={id}>
      {children}
    </div>
  );
};

export default AcFlex;
