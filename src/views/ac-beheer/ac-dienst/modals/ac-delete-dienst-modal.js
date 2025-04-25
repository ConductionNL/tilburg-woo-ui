import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { getCookie } from '@src/utilities';

/**
 * modal to delete 1 or multiple voorzieningen
 * @param {object[]} voorzieningen - array of voorzieningen
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple voorzieningen
 */
const AcDeleteDienstModal = ({
  diensten,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const handleDeleteDienstOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteDienst = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      return;
    }

    try {
      diensten.forEach(async (dienst) => {
        const response = await fetch(
          //   config.authentication.baseURL +
          'https://vng.accept.commonground.nu/apps' +
            `/openconnector/api/endpoint/voorzieningaanboden/${dienst.id}`,
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
      handleDeleteDienstOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteDienstCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleDeleteDienstCloseModal);
  }, [modalRef.current]);

  const renderDeleteDienstModal = (
    <AcModal
      ref={modalRef}
      id='delete-dienst-modal'
      title={`${diensten.length === 1 ? 'Dienst' : 'Diensten'} verwijderen`}
      buttons={[{ label: 'verwijderen', onClick: handleDeleteDienst }]}
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze {diensten.length === 1 ? 'dienst' : 'diensten'}{' '}
        wilt verwijderen?
        {diensten.map((dienst) => (
          <Paragraph key={dienst.id}>{dienst.naam}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteDienstModal;
};

export default withStore(observer(AcDeleteDienstModal));
