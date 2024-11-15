import clsx from 'clsx';

const AcColumn = ({ gap, children }) => {
  const _CLASSES = clsx('ac-column', gap && `ac-column--gap-${gap}`);
  return <div className={_CLASSES}>{children}</div>;
};

export default AcColumn;
