import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
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
const AcDeleteDienstModal = ({
  diensten,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleDeleteDienstOpenModal = () => modalRef?.current?.showModal();

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieningaanbod';

  const [error, setError] = useState(null);
  const handleDeleteDienst = async () => {
    try {
      diensten.forEach(async (dienst) => {
        const response = await makeRequest(
          `${BASE_URL}/apps/${endpoint}/${dienst.id}`,
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
      buttons={[
        { label: 'verwijderen', onClick: handleDeleteDienst },
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
