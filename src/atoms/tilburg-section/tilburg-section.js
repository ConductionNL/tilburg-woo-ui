import clsx from 'clsx';

const TilburgSection = ({ spacing, compact, className, children, ...restProps }) => {
  const _CLASSES = clsx(
    'tilburg-section',
    spacing && 'tilburg-section--spacing',
    compact && 'tilburg-section--spacing-compact',
    className
  );

  return (
    <section className={_CLASSES} {...restProps}>
      {children}
    </section>
  );
};

export default TilburgSection;
