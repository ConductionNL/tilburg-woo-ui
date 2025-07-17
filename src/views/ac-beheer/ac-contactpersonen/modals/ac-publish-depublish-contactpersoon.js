import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';

/**
 * Modal to publish or depublish a contact person by calling the publish/depublish endpoint
 * @param {object} contactPerson - The contact person to publish/depublish
 * @param {boolean} publish - Whether to publish (true) or depublish (false)
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to publish/depublish a contact person
 */
const AcPublishDepublishContactpersoonModal = ({
  contactpersoon,
  publish = true,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleModalOpen = () => modalRef?.current?.showModal();

  /** @type {[
    { type: 'error' | 'info' | 'success', message: string } | null,
    (state: { type: 'error' | 'info' | 'success', message: string } | null) => void
  ]} */
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePublishDepublish = async () => {
    try {
      setIsLoading(true);
      const endpoint = publish ? 'publish' : 'depublish';

      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/contactpersoon/${contactpersoon.id}/${endpoint}`,
        null,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      onSuccess?.();

      setResult({
        type: 'success',
        message: `Contactpersoon succesvol ${
          publish ? 'gepubliceerd' : 'gedepubliceerd'
        }`,
      });

      setTimeout(() => {
        setResult(null);
        onClose?.();
        modalRef?.current?.close();
      }, 3000);
    } catch (err) {
      console.error(err);
      setResult({
        type: 'error',
        message:
          err.message ||
          `Er is een fout opgetreden bij het ${
            publish ? 'publiceren' : 'depubliceren'
          } van de contactpersoon`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleModalOpen();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleModalClose = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleModalClose);
  }, [modalRef.current]);

  const errorStyle = {
    backgroundColor:
      'color-mix(in srgb, var(--utrecht-form-field-error-message-color, #e53e3e) 5%, #ffffff)',
    border: '1px solid var(--utrecht-form-field-error-message-color, #e53e3e)',
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
  };

  const renderModal = (
    <AcModal
      ref={modalRef}
      id={`${publish ? 'publish' : 'depublish'}-contactpersoon-modal`}
      title={`Contactpersoon ${publish ? 'publiceren' : 'depubliceren'}`}
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: publish ? 'Publiceren' : 'Depubliceren',
          icon: publish ? (
            <VISUALS.PUBLISH className='ac-publish-depublish-icon' />
          ) : (
            <VISUALS.PUBLISH_OFF className='ac-publish-depublish-icon' />
          ),
          onClick: handlePublishDepublish,
          disabled: isLoading || result?.type === 'success',
          loading: isLoading,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {result && (
          <Alert type={result.type === 'success' ? 'info' : result.type}>
            <AcFlex spacing='sm'>
              {result.type === 'error' ? <VISUALS.ERROR /> : <VISUALS.INFO_BLUE />}
              <Paragraph>{result.message}</Paragraph>
            </AcFlex>
          </Alert>
        )}
        Weet je zeker dat je de volgende gebruiker wilt{' '}
        {publish ? 'publiceren' : 'depubliceren'}? Hiermee wordt deze gebruiker{' '}
        {!publish && 'niet meer'} zichtbaar voor anderen.
        <Paragraph>{contactpersoon?.username ?? contactpersoon?.id}</Paragraph>
      </AcFlex>
    </AcModal>
  );

  return renderModal;
};

export default withStore(observer(AcPublishDepublishContactpersoonModal));
