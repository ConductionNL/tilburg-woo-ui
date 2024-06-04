import clsx from 'clsx';

const TilburgSection = ({ spacing, compact, className, children }) => {
  const _CLASSES = clsx(
    'tilburg-section',
    spacing && 'tilburg-section--spacing',
    compact && 'tilburg-section--spacing-compact',
    className
  );

  return <section className={_CLASSES}>{children}</section>;
};

export default TilburgSection;
