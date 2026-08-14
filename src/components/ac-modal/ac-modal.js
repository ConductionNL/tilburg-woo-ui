import React, { useState } from 'react';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import AcFlex from '@atoms/ac-flex/ac-flex';
import AcButton from '@molecules/ac-button/ac-button';
import clsx from 'clsx';

const AcModal = React.forwardRef(
  (
    {
      id,
      title,
      disableDefaultButton,
      buttonType,
      buttons,
      buttonPosition = 'start',
      children,
      onClose,
      layoutClassName,
      style,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    const onCloseHandler = () => {
      setIsOpen(false);
      onClose && onClose();
      ref?.current?.close();
    };

    const onBackdropClick = (event) => {
      if (event.target !== ref.current) {
        return;
      }

      setIsOpen(false);
      ref?.current?.close();
    };

    const _CLASSES = clsx(
      'ac-modal',
      isOpen && 'open',
      layoutClassName && layoutClassName
    );

    return (
      // Click-outside-to-dismiss. The keyboard equivalent is not missing: every
      // modal is opened with showModal(), and a modal <dialog> closes on
      // Escape natively. The handler only fires when the click target is the
      // dialog itself (i.e. the backdrop), never its contents, so there is no
      // interactive region here for a keyboard user to reach.
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
      <dialog
        id={id}
        className={_CLASSES}
        ref={ref}
        onClick={onBackdropClick}
        style={style}
      >
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
          <AcFlex spacing='sm' justifyContent={buttonPosition}>
            {!disableDefaultButton && (
              <AcButton
                style='button'
                icon={<VISUALS.CLOSE />}
                buttonType={buttonType}
                onClick={onCloseHandler}
              >
                {LABELS.CLOSE}
              </AcButton>
            )}

            {buttons?.map((button) => {
              if (button.shareLink) {
                return (
                  <AcButton
                    key={button.label}
                    {...button}
                    className={clsx(button.className, 'copy-button')}
                    data-status={button.shareLinkStatus}
                    style='button'
                    aria-label={button.label}
                  >
                    <div className='particles'>
                      <VISUALS.CHECK />
                      <div className='particles-inner'>
                        <VISUALS.PARTICLES />
                      </div>
                    </div>
                    {button.label}
                  </AcButton>
                );
              }

              return (
                <AcButton
                  key={button.label}
                  {...button}
                  style='button'
                  icon={button.icon}
                  onClick={button.onClick}
                >
                  {button.label}
                </AcButton>
              );
            })}
          </AcFlex>
        </div>
      </dialog>
    );
  }
);

AcModal.displayName = 'AcModal';

export default AcModal;
