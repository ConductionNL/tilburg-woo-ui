import clsx from 'clsx';

const AcSection = ({ spacing, compact, className, children, ...restProps }) => {
  const _CLASSES = clsx(
    'ac-section',
    spacing && 'ac-section--spacing',
    compact && 'ac-section--spacing-compact',
    className
  );

  return (
    <section className={_CLASSES} {...restProps}>
      {children}
    </section>
  );
};

export default AcSection;
