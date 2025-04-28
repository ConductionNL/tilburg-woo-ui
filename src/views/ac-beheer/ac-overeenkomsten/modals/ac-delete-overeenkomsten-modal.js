import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
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
const AcDeleteOvereenkomstenModal = ({
  overeenkomsten,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const handleDeleteOvereenkomstOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteOvereenkomst = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      return;
    }

    try {
      overeenkomsten.forEach(async (overeenkomst) => {
        const response = await fetch(
          //   config.authentication.baseURL +
          'https://vng.test.commonground.nu/apps' +
            `/openregister/api/objects/voorzieningaanbod/voorzieningaanbod/${voorziening.id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
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
      handleDeleteOvereenkomstOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteOvereenkomstCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleDeleteOvereenkomstCloseModal);
  }, [modalRef.current]);

  const renderDeleteOvereenkomstModal = (
    <AcModal
      ref={modalRef}
      id='delete-overeenkomst-modal'
      title={`${overeenkomsten.length === 1 ? 'Overeenkomst' : 'Overeenkomsten'} verwijderen`}
      buttons={[{ label: 'verwijderen', onClick: handleDeleteOvereenkomst }]}
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {overeenkomsten.length === 1 ? 'overeenkomst' : 'overeenkomsten'} wilt verwijderen?
        {overeenkomsten.map((overeenkomst) => (
          <Paragraph key={overeenkomst.id}>{overeenkomst.contractNummer}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteOvereenkomstModal;
};

export default withStore(observer(AcDeleteOvereenkomstenModal));
