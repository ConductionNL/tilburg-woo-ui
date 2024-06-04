import clsx from 'clsx';

const TilburgContainer = ({ children, compact, flex, flexDirection }) => {
  const _CLASSES = clsx('container', compact && 'container--compact');

  return <div className={_CLASSES}>{children}</div>;
};

export default TilburgContainer;
