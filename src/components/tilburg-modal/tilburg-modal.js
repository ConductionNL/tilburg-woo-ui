import { Heading } from '@utrecht/component-library-react/dist/css-module';
import React, { useState, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { VISUALS } from '@constants';
import TilburgFlex from '@atoms/tilburg-flex/tilburg-flex';
import TilburgButton from '@molecules/tilburg-button/tilburg-button';
import clsx from 'clsx';

const TilburgModal = React.forwardRef(({ id, title, onClose, children }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleBackdropClick = (event) => {
      if (event.target === ref.current) {
        onClose();
      }
    };

    if (ref.current) {
      ref.current.addEventListener('close', () => setIsOpen(false));
      ref.current.addEventListener('open', () => setIsOpen(true));
      ref.current.addEventListener('click', handleBackdropClick);
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [ref, onClose]);

  const _CLASSES = clsx('tilburg-modal', isOpen && 'open');

  return (
    <FocusTrap active={isOpen}>
      <dialog id={id} className={_CLASSES} ref={ref}>
        <div className='tilburg-modal__header'>
          <TilburgFlex justifyContent='between' alignItems='center'>
            <Heading level={2}>{title}</Heading>
            <TilburgButton animate onClick={onClose}>
              <VISUALS.CLOSE />
              Sluiten
            </TilburgButton>
          </TilburgFlex>
        </div>
        <div className='tilburg-modal__content'>{children}</div>
        <div className='tilburg-modal__footer'>
          <TilburgButton style='button' onClick={onClose}>
            Sluiten
          </TilburgButton>
        </div>
      </dialog>
    </FocusTrap>
  );
});

export default TilburgModal;
