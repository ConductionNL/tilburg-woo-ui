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
 * modal to delete 1 or multiple applicaties
 * @param {object[]} applicaties - array of applicaties
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to delete 1 or multiple applicaties
 */
const AcDeleteApplicatiesModal = ({
  applicaties,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const handleDeleteApplicatieOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteApplicatie = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      return;
    }

    try {
      let deletePromises = [];

      applicaties.forEach(async (applicatie) => {
        const response = await fetch(
          //   config.authentication.baseURL +
          'https://vng.test.commonground.nu/apps' +
            `/openregister/api/objects/voorzieningen/voorziening/${voorziening.id}`,
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
      handleDeleteApplicatieOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteApplicatieCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleDeleteApplicatieCloseModal);
  }, [modalRef.current]);

  const renderDeleteApplicatieModal = (
    <AcModal
      ref={modalRef}
      id='delete-applicatie-modal'
      title={`${
        applicaties.length === 1 ? 'Applicatie' : 'Applicaties'
      } verwijderen`}
      buttons={[
        {
          label: 'verwijderen',
          icon: <VISUALS.TRASHCAN />,
          onClick: handleDeleteApplicatie,
        },
      ]}
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {applicaties.length === 1 ? 'applicatie' : 'applicaties'} wilt verwijderen?
        {applicaties.map((applicatie) => (
          <Paragraph key={applicatie.id}>{applicatie.naam}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteApplicatieModal;
};

export default withStore(observer(AcDeleteApplicatiesModal));
