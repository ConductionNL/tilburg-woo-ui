import clsx from 'clsx';

const TilburgContainer = ({
  children,
  compact,
  flex,
  flexDirection,
  spacing,
  restProps,
}) => {
  const _CLASSES = clsx(
    'container',
    compact && 'container--compact',
    spacing && `container--spacing-${spacing}`
  );

  return (
    <div className={_CLASSES} {...restProps}>
      {children}
    </div>
  );
};

export default TilburgContainer;
