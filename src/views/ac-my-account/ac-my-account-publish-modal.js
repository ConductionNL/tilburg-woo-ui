import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import AcModal from '@components/ac-modal/ac-modal';
import { VISUALS } from '@constants';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@atoms';

const AcMyAccountPublishModal = ({
  store: { object },
  showModal = false,
  onClose,
  onSuccess,
  data = null,
  isPublish = true, // true for publish, false for depublish
}) => {
  const modalRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Handle modal opening
  const handleOpenModal = useCallback(() => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  }, []);

  // Handle modal closing
  const handleCloseModal = useCallback(() => {
    if (modalRef.current) {
      modalRef.current.close();
    }
    setError(null);
    setIsProcessing(false);
    onClose?.();
  }, [onClose]);

  // Handle publish/depublish action
  const handleConfirm = useCallback(async () => {
    if (!data || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Prepare the object for the mass operation
      const objectsToProcess = [data];

      let results;
      if (isPublish) {
        results = await object.massPublishObjects(objectsToProcess);
      } else {
        results = await object.massDepublishObjects(objectsToProcess);
      }

      if (results.successful.length > 0) {
        // Close modal first
        handleCloseModal();

        // Call onSuccess after a small delay
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      } else if (results.failed.length > 0) {
        // Show error if operation failed
        const failedResult = results.failed[0];
        setError(
          failedResult.error ||
            `Failed to ${isPublish ? 'publish' : 'depublish'} organization`
        );
      }
    } catch (err) {
      console.error(
        `Error ${isPublish ? 'publishing' : 'depublishing'} organization:`,
        err
      );
      setError(
        err.message ||
          `Er is een fout opgetreden bij het ${
            isPublish ? 'publiceren' : 'depubliceren'
          } van de organisatie.`
      );
    } finally {
      setIsProcessing(false);
    }
  }, [data, isPublish, isProcessing, object, handleCloseModal, onSuccess]);

  // Open modal when showModal becomes true
  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal, handleOpenModal]);

  // Add event listener for modal close
  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.addEventListener('close', handleCloseModal);

      return () => {
        modal.removeEventListener('close', handleCloseModal);
      };
    }
  }, [handleCloseModal]);

  // Get organization name for display
  const organizationName =
    data?.['@self']?.name || data?.naam || data?.name || 'deze organisatie';

  const modalTitle = isPublish
    ? 'Organisatie publiceren'
    : 'Organisatie depubliceren';
  const actionLabel = isPublish ? 'Publiceren' : 'Depubliceren';
  const actionIcon = isPublish ? <VISUALS.PUBLISH /> : <VISUALS.PUBLISH_OFF />;
  const confirmationText = `Weet je zeker dat je "${organizationName}" wilt ${
    isPublish ? 'publiceren' : 'depubliceren'
  }?`;

  return (
    <AcModal
      ref={modalRef}
      id={`my-account-${isPublish ? 'publish' : 'depublish'}-modal`}
      title={modalTitle}
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: handleCloseModal,
          buttonType: 'secondary',
          disabled: isProcessing,
        },
        {
          label: isProcessing
            ? isPublish
              ? 'Publiceren...'
              : 'Depubliceren...'
            : actionLabel,
          icon: isProcessing ? <VISUALS.SPINNER /> : actionIcon,
          onClick: handleConfirm,
          disabled: isProcessing,
          loading: isProcessing,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && (
          <div
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--utrecht-form-field-error-message-color, #e53e3e) 5%, #ffffff)',
              border:
                '1px solid var(--utrecht-form-field-error-message-color, #e53e3e)',
              borderRadius: '4px',
              color: 'var(--utrecht-form-field-error-message-color, #e53e3e)',
              fontSize: 'var(--utrecht-form-field-error-message-font-size, 1rem)',
              fontWeight: 'var(--utrecht-form-field-error-message-font-weight, 400)',
              padding: '1rem',
              margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--utrecht-form-field-error-message-font-family)',
            }}
          >
            <VISUALS.ALERT_CIRCLE />
            {error}
          </div>
        )}

        <Paragraph>{confirmationText}</Paragraph>

        {isPublish && (
          <Paragraph style={{ fontSize: '0.875rem', color: '#666' }}>
            Na het publiceren wordt de organisatie zichtbaar voor andere gebruikers.
          </Paragraph>
        )}

        {!isPublish && (
          <Paragraph style={{ fontSize: '0.875rem', color: '#666' }}>
            Na het depubliceren wordt de organisatie niet meer zichtbaar voor andere
            gebruikers.
          </Paragraph>
        )}
      </AcFlex>
    </AcModal>
  );
};

export default withStore(observer(AcMyAccountPublishModal));
