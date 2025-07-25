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
const AcDeleteKwetsbaarhedenModal = ({
  kwetsbaarheden,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleDeleteKwetsbaarheidOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteKwetsbaarheid = async () => {
    try {
      const endpoint = 'openregister/api/objects/voorzieningen/kwetsbaarheid';

      const deletePromises = kwetsbaarheden.map((kwetsbaarheid) =>
        makeRequest(`${BASE_URL}/${endpoint}/${kwetsbaarheid.id}`, null, {
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
      handleDeleteKwetsbaarheidOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleDeleteKwetsbaarheidCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener(
      'close',
      handleDeleteKwetsbaarheidCloseModal
    );
  }, [modalRef.current]);

  const renderDeleteKwetsbaarheidModal = (
    <AcModal
      ref={modalRef}
      id='delete-kwetsbaarheid-modal'
      title={`${
        kwetsbaarheden.length === 1 ? 'Kwetsbaarheid' : 'Kwetsbaarheden'
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
          onClick: handleDeleteKwetsbaarheid,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {kwetsbaarheden.length === 1 ? 'kwetsbaarheid' : 'kwetsbaarheden'} wilt
        verwijderen?
        {kwetsbaarheden.map((kwetsbaarheid) => (
          <Paragraph key={kwetsbaarheid.id}>{kwetsbaarheid.titel}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteKwetsbaarheidModal;
};

export default withStore(observer(AcDeleteKwetsbaarhedenModal));
