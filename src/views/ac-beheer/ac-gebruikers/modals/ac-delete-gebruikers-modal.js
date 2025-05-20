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
 * modal to delete 1 or multiple gebruikers
 * @param {object[]} gebruikers - array of gebruikers
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple gebruikers
 */
const AcDeleteGebruikersModal = ({
  gebruikers,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleDeleteGebruikerOpenModal = () => modalRef?.current?.showModal();

  const endpoint = 'openregister/api/objects/voorzieningen/gebruiker';

  const [error, setError] = useState(null);
  const handleDeleteGebruiker = async () => {
    try {
      gebruikers.forEach(async (gebruiker) => {
        const response = await makeRequest(
          `${BASE_URL}/apps/${endpoint}/${gebruiker.id}`,
          null,
          {
            method: 'DELETE',
          }
        );
      });

      onSuccess?.();
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleDeleteGebruikerOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteGebruikerCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleDeleteGebruikerCloseModal);
  }, [modalRef.current]);

  const renderDeleteGebruikerModal = (
    <AcModal
      ref={modalRef}
      id='delete-gebruiker-modal'
      title={`${gebruikers.length === 1 ? 'Gebruiker' : 'Gebruikers'} verwijderen`}
      buttons={[
        {
          label: 'verwijderen',
          icon: <VISUALS.TRASHCAN />,
          onClick: handleDeleteGebruiker,
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
        Weet je zeker dat je deze{' '}
        {gebruikers.length === 1 ? 'gebruiker' : 'gebruikers'} wilt verwijderen?
        {gebruikers.map((gebruiker) => (
          <Paragraph key={gebruiker.id}>
            {gebruiker.voornaam} {gebruiker.achternaam} ({gebruiker.email})
          </Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteGebruikerModal;
};

export default withStore(observer(AcDeleteGebruikersModal));
