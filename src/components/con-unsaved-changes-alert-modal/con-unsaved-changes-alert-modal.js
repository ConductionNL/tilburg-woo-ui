// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Generic warning modal component to alert users about actions they are about to perform
 * @param {boolean} showModal - Whether the modal is shown
 * @param {function} onClose - Callback when modal closes
 * @param {function} onConfirm - Callback when action is confirmed
 * @param {string} title - Modal title (default: "Waarschuwing")
 * @param {string|React.JSX.Element} message - Warning message to display
 * @param {string} confirmLabel - Label for confirm button (default: "Bevestigen")
 * @param {string} cancelLabel - Label for cancel button (default: "Annuleren")
 * @param {React.JSX.Element} confirmIcon - Icon for confirm button (default: TRIANGLE_EXCLAMATION)
 * @param {React.JSX.Element} cancelIcon - Icon for cancel button (default: CLOSE)
 * @param {string} confirmButtonType - Button type for confirm button (default: "primary")
 * @param {React.JSX.Element} children - Additional content to display in modal
 * @returns {React.JSX.Element|null}
 */
const ConUnsavedChangesAlertModal = ({
  showModal = false,
  onClose,
  onConfirm,
  title = 'Waarschuwing',
  message,
  confirmLabel = 'Bevestigen',
  cancelLabel = 'Annuleren',
  confirmIcon = <VISUALS.TRIANGLE_EXCLAMATION />,
  cancelIcon = <VISUALS.CLOSE />,
  confirmButtonType = 'primary',
  children,
}) => {
  const modalRef = useRef(null);

  const handleOpenModal = () => modalRef?.current?.showModal();

  // State for async operations
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (isProcessing) return; // Prevent double-clicks

    if (
      // programmatically check if onConfirm is an async function
      onConfirm instanceof Object.getPrototypeOf(async function () {}).constructor
    ) {
      setIsProcessing(true);
      try {
        await onConfirm?.();
        // Close modal after successful confirmation
        modalRef?.current?.close();
      } catch (err) {
        console.error('❌ Failed to confirm action:', err);
        // TODO: add user-facing error handling if required by UX guidelines
      } finally {
        setIsProcessing(false);
      }
    } else {
      onConfirm?.();
      modalRef?.current?.close();
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  const handleCloseModal = useCallback(() => {
    // Reset processing state when modal closes
    setIsProcessing(false);

    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const modal = modalRef?.current;
    if (modal) {
      modal.addEventListener('close', handleCloseModal);

      // Cleanup function to remove event listener
      return () => {
        modal.removeEventListener('close', handleCloseModal);
      };
    }
  }, [modalRef.current, handleCloseModal]);

  return (
    <AcModal
      ref={modalRef}
      id='unsaved-changes-alert-modal'
      title={title}
      buttons={[
        {
          label: cancelLabel,
          icon: cancelIcon,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
          disabled: isProcessing,
        },
        {
          label: isProcessing ? 'Bezig...' : confirmLabel,
          icon: isProcessing ? <VISUALS.SPINNER /> : confirmIcon,
          onClick: handleConfirm,
          disabled: isProcessing,
          loading: isProcessing,
          buttonType: confirmButtonType,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {message && <Paragraph>{message}</Paragraph>}
        {children}
      </AcFlex>
    </AcModal>
  );
};

export default observer(ConUnsavedChangesAlertModal);
