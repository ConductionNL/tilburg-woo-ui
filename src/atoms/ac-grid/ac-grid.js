import clsx from 'clsx';

const AcGrid = ({ children }) => {
  const _CLASSES = clsx('ac-grid');

  return <div className={_CLASSES}>{children}</div>;
};

export default AcGrid;
