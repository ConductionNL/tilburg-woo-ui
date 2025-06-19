import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';

/**
 * Modal to publish an organization by calling the publish endpoint
 * @param {object} organization - The organization to publish
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to publish an organization
 */
const AcPublishOrganizationModal = ({
  organization,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handlePublishOrganizationOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handlePublishOrganization = async () => {
    try {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie/${organization.id}/publish`,
        null,
        {
          body: JSON.stringify(organization),
          method: 'POST',
        }
      );

      if (response.ok) {
        onSuccess?.();
        modalRef?.current?.close();
      } else {
        const status = response.status;
        const errorMessage = response.data.error;
        setError(`${status}: ${errorMessage}`);
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handlePublishOrganizationOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handlePublishOrganizationCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener(
      'close',
      handlePublishOrganizationCloseModal
    );
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

  const renderPublishOrganizationModal = (
    <AcModal
      ref={modalRef}
      id='publish-organization-modal'
      title='Organisatie publiceren'
      buttons={[
        {
          label: 'publiceren',
          icon: <VISUALS.PAPER_PLANE />,
          onClick: handlePublishOrganization,
        },
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
      ]}
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && <div style={errorStyle}>{error}</div>}
        Weet je zeker dat je deze organisatie wilt publiceren?
        <Paragraph>{organization?.naam ?? organization?.id}</Paragraph>
      </AcFlex>
    </AcModal>
  );

  return renderPublishOrganizationModal;
};

export default withStore(observer(AcPublishOrganizationModal));
