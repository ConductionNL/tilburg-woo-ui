import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../ac-beheer';
import { VISUALS } from '@constants';

/**
 * Modal to publish or depublish a file by calling the publish/depublish endpoint
 * @param {object} register - register object
 * @param {object} schema - schema object
 * @param {string} id - id of the object
 * @param {object} file - file object
 * @param {boolean} publish - Whether to publish (true) or depublish (false)
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to publish/depublish a file
 */
const ConPublishDepublishFileModal = ({
  register,
  schema,
  id,
  file,
  publish = true,
  showModal = false,
  onClose = () => {},
  onSuccess = () => {},
}) => {
  useEffect(() => {
    // if you open the modal without required props, throw an error
    if ((!register || !schema || !id || !file) && showModal) {
      console.error('register, schema, id and file are required');
      throw new Error('register, schema, id and file are required');
    }
  }, [showModal]);

  const modalRef = useRef(null);

  const [error, setError] = useState(null);

  const { makeRequest } = useNextcloudRequests();

  const handlePublishDepublish = async () => {
    try {
      const endpoint = `openregister/api/objects/${register}/${schema}/${id}/files/${
        file.title
      }/${publish ? 'publish' : 'depublish'}`;

      const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
        method: 'POST',
      });

      if (response.ok) {
        onSuccess?.();
        handleCloseModal();
      } else {
        const status = response.status;
        const errorMessage = response.data.error;
        setError(`${status}: ${errorMessage}`);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        `Er is een fout opgetreden bij het ${
          publish ? 'publiceren' : 'depubliceren'
        } van het bestand`;
      console.error(
        `Error ${publish ? 'publishing' : 'depublishing'} file:`,
        errorMessage
      );
      setError(errorMessage);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
    if (!showModal) {
      setError(null);
    }
  }, [showModal]);

  const handleOpenModal = () => modalRef?.current?.showModal();
  const handleCloseModal = () => modalRef?.current?.close();

  // add event listener to the modal when it is closed
  useEffect(() => {
    const handleClose = () => {
      onClose?.();
    };

    modalRef?.current?.addEventListener('close', handleClose);
    return () => {
      modalRef?.current?.removeEventListener('close', handleClose);
    };
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
      id={`${publish ? 'publish' : 'depublish'}-file-modal`}
      title={`Bestand ${publish ? 'publiceren' : 'depubliceren'}`}
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: handleCloseModal,
          buttonType: 'secondary',
        },
        {
          label: publish ? 'Publiceren' : 'Depubliceren',
          icon: publish ? <VISUALS.PUBLISH /> : <VISUALS.PUBLISH_OFF />,
          onClick: handlePublishDepublish,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && <div style={errorStyle}>{error}</div>}
        Weet je zeker dat je dit bestand wilt{' '}
        {publish ? 'publiceren' : 'depubliceren'}?
        <Paragraph>{file?.title}</Paragraph>
      </AcFlex>
    </AcModal>
  );

  return renderModal;
};

export default withStore(observer(ConPublishDepublishFileModal));
