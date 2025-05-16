import clsx from 'clsx';

const AcGrid = ({ children, columns = 1 }) => {
  document.documentElement.style.setProperty('--ac-grid-columns', columns);

  const _CLASSES = clsx('ac-grid', `columns-${columns}`);

  return <div className={_CLASSES}>{children}</div>;
};

export default AcGrid;
