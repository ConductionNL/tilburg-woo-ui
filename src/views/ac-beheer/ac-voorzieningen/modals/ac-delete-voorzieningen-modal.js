import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import config from '@src/config';
import { getCookie } from '@src/utilities';

/**
 * modal to delete 1 or multiple voorzieningen
 * @param {object[]} voorzieningen - array of voorzieningen
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple voorzieningen
 */
const AcDeleteVoorzieningenModal = ({
  voorzieningen,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const handleDeleteVoorzieningOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteVoorziening = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      return;
    }

    try {
      let deletePromises = [];

      voorzieningen.forEach(async (voorziening) => {
        const response = await fetch(
          //   config.authentication.baseURL +
          'https://vng.accept.commonground.nu/apps' +
            `/openconnector/api/endpoint/voorziening/${voorziening.id}`,
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
        voorzieningen.length === 1 ? 'Voorziening' : 'Voorzieningen'
      } verwijderen`}
      buttons={[
        {
          label: 'verwijderen',
          icon: <VISUALS.TRASHCAN />,
          onClick: handleDeleteVoorziening,
        },
      ]}
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {voorzieningen.length === 1 ? 'voorziening' : 'voorzieningen'} wilt
        verwijderen?
        {voorzieningen.map((voorziening) => (
          <Paragraph key={voorziening.id}>{voorziening.naam}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteVoorzieningModal;
};

export default withStore(observer(AcDeleteVoorzieningenModal));
