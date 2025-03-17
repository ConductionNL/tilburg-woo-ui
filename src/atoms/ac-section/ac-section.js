import clsx from 'clsx';

const AcSection = ({
  spacing,
  compact,
  className,
  children,
  blue,
  ...restProps
}) => {
  const _CLASSES = clsx(
    'ac-section',
    spacing && 'ac-section--spacing',
    compact && 'ac-section--spacing-compact',
    blue && 'ac-section--blue',
    className
  );

  return (
    <section className={_CLASSES} {...restProps}>
      {children}
    </section>
  );
};

export default AcSection;
