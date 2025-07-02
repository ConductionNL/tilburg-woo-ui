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
 * Modal to accept an organization by changing its beoordeling to Actief
 * @param {object} organization - The organization to accept
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to accept an organization
 */
const AcAcceptOrganizationModal = ({
  organization,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleAcceptOrganizationOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleAcceptOrganization = async () => {
    try {
      const endpoint = 'openregister/api/objects/voorzieningen/contactpersoon';

      const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
        method: 'POST',
        body: JSON.stringify({
          username: `${organization.contactpersonen[0].voornaam} ${organization.contactpersonen[0].tussenvoegsel} ${organization.contactpersonen[0].achternaam}`,
          email: organization.contactpersonen[0].email,
          voornaam: organization.contactpersonen[0].voornaam,
          achternaam: organization.contactpersonen[0].achternaam,
          organisatie: organization.naam,
          functie: organization.contactpersonen[0].functie,
          telefoonnummer: organization.contactpersonen[0].telefoon,
        }),
      });
    } catch (err) {
      console.error(err);
      setError(err);
    }

    try {
      let endpoint = '';
      if (BASE_URL.includes('test')) {
        endpoint = `openregister/api/objects/14/37`;
      } else {
        endpoint = `openregister/api/objects/14/37`;
      }

      const response = await makeRequest(
        `${BASE_URL}/apps/${endpoint}/${organization.id}`,
        null,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...organization,
            beoordeling: 'Actief',
          }),
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
      handleAcceptOrganizationOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleAcceptOrganizationCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleAcceptOrganizationCloseModal);
  }, [modalRef.current]);

  const errorStyle = {
    // the goal is to convert a value like #e53e3e to something like #fff5f5
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

  const renderAcceptOrganizationModal = (
    <AcModal
      ref={modalRef}
      id='accept-organization-modal'
      title='Organisatie activeren'
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'Activeren',
          icon: <VISUALS.CHECK />,
          onClick: handleAcceptOrganization,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && <div style={errorStyle}>{error}</div>}
        Weet je zeker dat je deze organisatie wilt activeren?
        <Paragraph>{organization?.naam ?? organization?.id}</Paragraph>
      </AcFlex>
    </AcModal>
  );

  return renderAcceptOrganizationModal;
};

export default withStore(observer(AcAcceptOrganizationModal));
