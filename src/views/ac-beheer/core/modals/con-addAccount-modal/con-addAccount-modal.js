// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';

/**
 * Modal to confirm adding an account to a contactpersoon
 * @param {object} contactpersoon - Contactperson object with @self metadata
 * @param {boolean} showModal - Whether the modal is shown
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSuccess - Callback when operation is confirmed
 * @returns {React.JSX.Element|null}
 */
const ConAddAccountModal = ({
  contactpersoon,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const handleOpenModal = () => modalRef?.current?.showModal();

  // Extract metadata from the contactpersoon for display purposes
  const getDisplayMetadata = () => {
    if (!contactpersoon) return null;

    const metadata = contactpersoon['@self'];

    if (!metadata) return null;

    return {
      name: metadata.name,
      schemaTitle: metadata.schema?.title,
    };
  };

  const displayMetadata = getDisplayMetadata();

  // State for add account operation
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleConfirm = async () => {
    if (isProcessing) return; // Prevent double-clicks

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/softwarecatalog/api/contactpersonen/${
          contactpersoon.id
        }/convert-to-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Failed to add account to contactpersoon');
        return;
      }

      // Close modal first to prevent state conflicts
      modalRef?.current?.close();

      // Call onSuccess after a small delay to ensure modal is closed
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (err) {
      console.error('❌ Failed to add account to contactpersoon:', err);
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  const handleCloseModal = useCallback(() => {
    // Reset state when modal closes
    setIsProcessing(false);
    setErrorMessage(null);

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

  // Early return if no metadata or contactpersoon
  if (!displayMetadata || !contactpersoon) {
    return null;
  }

  const displayName =
    displayMetadata.schemaTitle || displayMetadata.name || 'contactpersoon';

  const renderModal = (
    <AcModal
      ref={modalRef}
      id='add-account-modal'
      title='Account toevoegen'
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
          disabled: isProcessing,
        },
        {
          label: isProcessing ? 'Toevoegen...' : 'Toevoegen',
          icon: isProcessing ? <VISUALS.SPINNER /> : <VISUALS.USER_PLUS />,
          onClick: handleConfirm,
          disabled: isProcessing,
          loading: isProcessing,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {/* Error message display */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#fdecea',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '1rem',
              borderRadius: '4px',
            }}
          >
            <Paragraph>{errorMessage}</Paragraph>
          </div>
        )}
        {/* Confirmation text for adding account */}
        Weet je zeker dat je een account wilt toevoegen voor deze {displayName}?
        {/* Show contactpersoon details */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem',
          }}
        >
          <Paragraph style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            Contactpersoon:
          </Paragraph>
          <Paragraph style={{ marginLeft: '1rem' }}>
            •{' '}
            {contactpersoon['@self']?.name ||
              contactpersoon.naam ||
              contactpersoon.name ||
              contactpersoon.id}
          </Paragraph>
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderModal;
};

export default observer(ConAddAccountModal);
