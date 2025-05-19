import clsx from 'clsx';

const AcGrid = ({ children, columns = 1, className }) => {
  document.documentElement.style.setProperty('--ac-grid-columns', columns);

  const _CLASSES = clsx('ac-grid', `columns-${columns}`, className);

  return <div className={_CLASSES}>{children}</div>;
};

export default AcGrid;
