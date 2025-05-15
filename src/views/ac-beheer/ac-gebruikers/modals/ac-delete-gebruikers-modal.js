import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { LABELS, VISUALS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import {
  PrimaryActionButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react';
import config from '@src/config';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';

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

  const handleDeleteGebruikerOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteGebruiker = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      return;
    }

    try {
      let deletePromises = [];

      gebruikers.forEach(async (gebruiker) => {
        const hostname = window.location.hostname;
        const baseUrl =
          hostname === 'vng.test.opencatalogi.nl'
            ? 'https://vng.test.commonground.nu/apps'
            : 'https://vng.accept.commonground.nu/apps';
        const response = await fetch(
          baseUrl +
            `/openconnector/api/endpoint/gebruikers/${gebruiker.id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        deletePromises.push(response);
      });

      await Promise.all(deletePromises);

      if (deletePromises.some((response) => response.ok)) {
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
