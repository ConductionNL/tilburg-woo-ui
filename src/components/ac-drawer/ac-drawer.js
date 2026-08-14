import React, { forwardRef } from 'react';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import AcFlex from '@atoms/ac-flex/ac-flex';
import AcButton from '@molecules/ac-button/ac-button';
import clsx from 'clsx';

const AcDrawer = forwardRef(
  ({ id, title, children, removeBackdrop = false }, ref) => {
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
      // Click-outside-to-dismiss. The keyboard equivalent is not missing: every
      // drawer is opened with showModal(), and a modal <dialog> closes on
      // Escape natively. The handler only fires when the click target is the
      // dialog itself (i.e. the backdrop), never its contents, so there is no
      // interactive region here for a keyboard user to reach.
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
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
  }
);

AcDrawer.displayName = 'AcDrawer';

export default AcDrawer;
