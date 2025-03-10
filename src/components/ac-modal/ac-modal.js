import React, { useState } from 'react';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import AcFlex from '@atoms/ac-flex/ac-flex';
import AcButton from '@molecules/ac-button/ac-button';
import clsx from 'clsx';

const AcModal = React.forwardRef(({ id, title, buttons, children }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const onCloseHandler = () => {
    setIsOpen(false);
    ref?.current?.close();
  };

  const onBackdropClick = (event) => {
    if (event.target !== ref.current) {
      return;
    }

    setIsOpen(false);
    ref?.current?.close();
  };

  const _CLASSES = clsx('ac-modal', isOpen && 'open');

  return (
    <dialog id={id} className={_CLASSES} ref={ref} onClick={onBackdropClick}>
      <div className='ac-modal__header'>
        <AcFlex justifyContent='between' alignItems='center'>
          <Heading level={2}>{title}</Heading>
          <AcButton animate onClick={onCloseHandler}>
            <VISUALS.CLOSE />
            {LABELS.CLOSE}
          </AcButton>
        </AcFlex>
      </div>
      <div className='ac-modal__content'>{children}</div>
      <div className='ac-modal__footer'>
        <AcFlex spacing='sm'>
        <AcButton style='button' onClick={onCloseHandler}>
          {LABELS.CLOSE}
        </AcButton>
        {buttons?.map((button) => (
          <AcButton style='button' onClick={button.onClick}>
            {button.icon}
            {button.label}
            </AcButton>
          ))}
        </AcFlex>
      </div>
    </dialog>
  );
});

export default AcModal;
