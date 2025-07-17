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
 * modal to delete 1 or multiple voorzieningen
 * @param {object[]} voorzieningen - array of voorzieningen
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple voorzieningen
 */
const AcDeleteGebruikenModal = ({
  gebruiken,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleDeleteGebruikenOpenModal = () => modalRef?.current?.showModal();

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieninggebruik';

  const [error, setError] = useState(null);
  const handleDeleteGebruiken = async () => {
    try {
      const deletePromises = gebruiken.map((gebruik) =>
        makeRequest(`${BASE_URL}/apps/${endpoint}/${gebruik.id}`, null, {
          method: 'DELETE',
        })
      );

      const responses = await Promise.all(deletePromises);

      if (responses.some((response) => response.ok)) {
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
      handleDeleteGebruikenOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteGebruikenCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleDeleteGebruikenCloseModal);
  }, [modalRef.current]);

  const renderDeleteGebruikenModal = (
    <AcModal
      ref={modalRef}
      id='delete-gebruik-modal'
      title={`${gebruiken.length === 1 ? 'Gebruik' : 'Gebruiken'} verwijderen`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        { label: 'verwijderen', onClick: handleDeleteGebruiken },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze {gebruiken.length === 1 ? 'gebruik' : 'gebruiken'}{' '}
        wilt verwijderen?
        {gebruiken.map((gebruik) => (
          <Paragraph key={gebruik.id}>{gebruik.id}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteGebruikenModal;
};

export default withStore(observer(AcDeleteGebruikenModal));
