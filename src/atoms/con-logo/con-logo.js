import * as React from 'react';
import clsx from 'clsx';

const ConLogo = ({ onClick, layoutClassName, variant = 'header' }) => {
  return (
    <div
      className={clsx('con-logo-container', variant, [
        onClick && 'clickable',
        layoutClassName && layoutClassName,
      ])}
      {...{ onClick }}
    />
  );
};

export default ConLogo;
