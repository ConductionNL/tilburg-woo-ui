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
const AcDeleteVoorzieningVersieModal = ({
  voorzieningen,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleDeleteVoorzieningOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieningversie';

  const handleDeleteVoorziening = async () => {
    try {
      voorzieningen.forEach(async (voorziening) => {
        const response = await makeRequest(
          `${BASE_URL}/apps/${endpoint}/${voorziening.id}`,
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
      handleDeleteVoorzieningOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteVoorzieningCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleDeleteVoorzieningCloseModal);
  }, [modalRef.current]);

  const renderDeleteVoorzieningModal = (
    <AcModal
      ref={modalRef}
      id='delete-voorziening-modal'
      title={`${
        voorzieningen.length === 1 ? 'Voorziening versie' : 'Voorziening versies'
      } verwijderen`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        { label: 'verwijderen', onClick: handleDeleteVoorziening },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {voorzieningen.length === 1 ? 'voorziening versie' : 'voorziening versies'}{' '}
        wilt verwijderen?
        {voorzieningen.map((voorziening) => (
          <Paragraph key={voorziening.id}>{voorziening.naam}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteVoorzieningModal;
};

export default withStore(observer(AcDeleteVoorzieningVersieModal));
