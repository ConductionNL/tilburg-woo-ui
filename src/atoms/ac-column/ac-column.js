import clsx from 'clsx';

const AcColumn = ({ gap, children, horizontalOverflowWrapper }) => {
  const _CLASSES = clsx('ac-column', gap && `ac-column--gap-${gap}`, horizontalOverflowWrapper && 'ac-column--horizontal-overflow-wrapper');
  return <div className={_CLASSES}>{children}</div>;
};

export default AcColumn;
