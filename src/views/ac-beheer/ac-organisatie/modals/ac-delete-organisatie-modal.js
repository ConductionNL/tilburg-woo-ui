import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
/**
 * modal to delete 1 or multiple voorzieningen
 * @param {object[]} voorzieningen - array of voorzieningen
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple voorzieningen
 */
const AcDeleteOrganisatiesModal = ({
  organisaties,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleDeleteOrganisatieOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteOrganisatie = async () => {
    try {
      let deletePromises = [];

      const endpoint = 'openregister/api/objects/voorzieningen/organisatie';

      organisaties.forEach(async (organisatie) => {
        const response = await makeRequest(
          `${BASE_URL}/apps/${endpoint}/${organisatie.id}`,
          null,
          {
            method: 'DELETE',
          }
        );

        deletePromises.push(response);
      });

      await Promise.all(deletePromises);

      onSuccess?.();
      modalRef?.current?.close();
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleDeleteOrganisatieOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteOrganisatieCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleDeleteOrganisatieCloseModal);
  }, [modalRef.current]);

  const renderDeleteOrganisatieModal = (
    <AcModal
      ref={modalRef}
      id='delete-organisatie-modal'
      title={`${
        organisaties.length === 1 ? 'Organisatie' : 'Organisaties'
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
          onClick: handleDeleteOrganisatie,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {organisaties.length === 1 ? 'organisatie' : 'organisaties'} wilt
        verwijderen?
        {organisaties.map((organisatie) => (
          <Paragraph key={organisatie.id}>{organisatie.naam}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteOrganisatieModal;
};

export default withStore(observer(AcDeleteOrganisatiesModal));
