import clsx from 'clsx';

/**
 * @param {Object} props
 * @param {"horse" | "tiger" | "sm"} props.gap - The gap between the children.
 * @param {React.ReactNode} props.children - The children to render.
 * @param {boolean} props.horizontalOverflowWrapper - Whether to wrap the children in a horizontal overflow wrapper.
 * @returns {React.ReactNode} The rendered component.
 */
const AcColumn = ({ gap, children, horizontalOverflowWrapper, style }) => {
  const _CLASSES = clsx(
    'ac-column',
    gap && `ac-column--gap-${gap}`,
    horizontalOverflowWrapper && 'ac-column--horizontal-overflow-wrapper'
  );
  return <div className={_CLASSES} style={style}>{children}</div>;
};

export default AcColumn;
