import React, { forwardRef } from 'react';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import AcFlex from '@atoms/ac-flex/ac-flex';
import AcButton from '@molecules/ac-button/ac-button';
import clsx from 'clsx';

const AcDrawer = forwardRef(({ id, title, children, removeBackdrop = false }, ref) => {
  const onCloseHandler = () => {
    ref?.current?.close();
  };

  const onBackdropClick = (event) => {
    if (event.target !== ref.current) {
      return;
    }
    onCloseHandler();
  };

  return (
    <dialog
      id={id}
      className={clsx('ac-drawer', { 'ac-drawer--backdrop': !removeBackdrop })}
      ref={ref}
      onClick={onBackdropClick}
    >
      <div className='ac-drawer__header'>
        <AcFlex justifyContent='between' alignItems='center'>
          <Heading level={2}>{title}</Heading>
          <AcButton animate onClick={onCloseHandler}>
            <VISUALS.CLOSE />
            {LABELS.CLOSE}
          </AcButton>
        </AcFlex>
      </div>
      <div className='ac-drawer__content'>{children}</div>
    </dialog>
  );
});

export default AcDrawer;
