import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
import { VISUALS } from '@constants';

/**
 * Modal to invite users to join the organization
 * @param {object[]} contactpersonen - array of users to invite
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @param {function} onSuccess - function to call when invitation is successful
 * @returns {React.JSX.Element} - modal to invite users
 */
const AcContactpersonenUitnodigenModal = ({
  contactpersonen,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const { makeRequest } = useNextcloudRequests();

  const [error, setError] = useState(null);

  const handleOpenModal = () => modalRef?.current?.showModal();

  // I think this is good possible endpoint, but the function is not implemented yet
  const endpoint = 'openregister/api/objects/voorzieningen/contactpersoon/invite';

  const handleInviteUsers = async () => {
    try {
      const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
        method: 'POST',
        body: JSON.stringify({
          users: contactpersonen.map((user) => ({
            email: user.email,
            voornaam: user.voornaam,
            achternaam: user.achternaam,
          })),
          // organization would come from logged in user
          organization: null,
        }),
      });

      if (response.ok) {
        onSuccess?.();
        modalRef?.current?.close();
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  const handleCloseModal = () => {
    onClose?.();
  };

  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleCloseModal);
  }, [modalRef.current]);

  const renderInviteModal = (
    <AcModal
      ref={modalRef}
      id='invite-contactpersonen-modal'
      title={`${contactpersonen.length === 1 ? 'Contactpersoon' : 'Contactpersonen'} uitnodigen`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'uitnodigen',
          icon: <VISUALS.PAPER_PLANE />,
          onClick: handleInviteUsers,
          disabled: true,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        <Paragraph style={{ fontSize: '1.1em', marginBottom: '1rem' }}>
          Weet je zeker dat je deze{' '}
          {contactpersonen.length === 1 ? 'Contactpersoon' : 'Contactpersonen'} wilt uitnodigen?
        </Paragraph>
        <div>
          {contactpersonen.map((contactpersoon) => (
            <Paragraph
              key={contactpersoon.id}
              style={{
                padding: '0.75rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                marginBottom: '0.5rem',
              }}
            >
              <strong>
                {contactpersoon.voornaam} {contactpersoon.achternaam}
              </strong>
              <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                ({contactpersoon.email})
              </span>
            </Paragraph>
          ))}
        </div>
        {error && (
          <Paragraph
            className='error'
            style={{
              color: '#dc3545',
              padding: '0.75rem',
              backgroundColor: '#f8d7da',
              borderRadius: '4px',
            }}
          >
            Er is een fout opgetreden bij het versturen van de uitnodigingen.
          </Paragraph>
        )}
      </AcFlex>
    </AcModal>
  );

  return renderInviteModal;
};

export default withStore(observer(AcContactpersonenUitnodigenModal));
