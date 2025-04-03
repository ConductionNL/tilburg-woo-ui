import clsx from 'clsx';

const AcGrid = ({ children, row = 3 }) => {
  const _CLASSES = clsx('ac-grid', row && `ac-grid--${row}`);

  return <div className={_CLASSES}>{children}</div>;
};

export default AcGrid;
