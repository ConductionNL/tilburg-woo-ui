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
 * modal to delete 1 or multiple contactpersonen
 * @param {object[]} contactpersonen - array of contactpersonen
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple contactpersonen
 */
const AcDeleteContactpersonenModal = ({
  contactpersonen,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleDeleteContactpersoonOpenModal = () => modalRef?.current?.showModal();

  const endpoint = 'openregister/api/objects/voorzieningen/contactpersoon';

  const [error, setError] = useState(null);
  const handleDeleteContactpersoon = async () => {
    try {
      contactpersonen.forEach(async (contactpersoon) => {
        const response = await makeRequest(
          `${BASE_URL}/apps/${endpoint}/${contactpersoon.id}`,
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
      handleDeleteContactpersoonOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteContactpersoonCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener(
      'close',
      handleDeleteContactpersoonCloseModal
    );
  }, [modalRef.current]);

  const renderDeleteContactpersoonModal = (
    <AcModal
      ref={modalRef}
      id='delete-contactpersoon-modal'
      title={`${
        contactpersonen.length === 1 ? 'Contactpersoon' : 'Contactpersonen'
      } verwijderen`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'verwijderen',
          icon: <VISUALS.TRASHCAN />,
          onClick: handleDeleteContactpersoon,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {contactpersonen.length === 1 ? 'Contactpersoon' : 'Contactpersonen'} wilt
        verwijderen?
        {contactpersonen.map((contactpersoon) => (
          <Paragraph key={contactpersoon.id}>
            {contactpersoon.voornaam} {contactpersoon.achternaam} (
            {contactpersoon.email})
          </Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteContactpersoonModal;
};

export default withStore(observer(AcDeleteContactpersonenModal));
