import React, { useState } from 'react';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import TilburgFlex from '@atoms/tilburg-flex/tilburg-flex';
import TilburgButton from '@molecules/tilburg-button/tilburg-button';
import clsx from 'clsx';

const TilburgModal = React.forwardRef(({ id, title, children }, ref) => {
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

  const _CLASSES = clsx('tilburg-modal', isOpen && 'open');

  return (
    <dialog id={id} className={_CLASSES} ref={ref} onClick={onBackdropClick}>
      <div className='tilburg-modal__header'>
        <TilburgFlex justifyContent='between' alignItems='center'>
          <Heading level={2}>{title}</Heading>
          <TilburgButton animate onClick={onCloseHandler}>
            <VISUALS.CLOSE />
            Sluiten
          </TilburgButton>
        </TilburgFlex>
      </div>
      <div className='tilburg-modal__content'>{children}</div>
      <div className='tilburg-modal__footer'>
        <TilburgButton style='button' onClick={onCloseHandler}>
          Sluiten
        </TilburgButton>
      </div>
    </dialog>
  );
});

export default TilburgModal;
