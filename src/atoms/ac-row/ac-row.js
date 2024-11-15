import clsx from 'clsx';

const AcRow = ({ children }) => {
  const _CLASSES = clsx('ac-row');

  return <div className={_CLASSES}>{children}</div>;
};

export default AcRow;
