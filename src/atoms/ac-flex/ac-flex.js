import clsx from 'clsx';

/**
 * A flexible container component that uses CSS Flexbox for layout
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to render inside the flex container
 * @param {boolean} [props.column] - Whether to use column direction (default is row)
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'xxl'} [props.spacing] - Gap spacing between flex items
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'xxl'} [props.margin] - Margin around the flex container
 * @param {'center'|'between'|'start'|'end'} [props.justifyContent] - Justify-content alignment
 * @param {'center'} [props.alignItems] - Align-items alignment
 * @param {boolean} [props.wrap] - Whether items should wrap to next line
 * @param {boolean} [props.grow] - Whether container should grow to fill space
 * @param {string} [props.className] - Additional CSS class names
 * @returns {JSX.Element} Flex container div element
 */
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
