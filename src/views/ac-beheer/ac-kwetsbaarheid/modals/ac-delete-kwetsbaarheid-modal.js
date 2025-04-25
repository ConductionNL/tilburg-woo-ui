import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { LABELS, VISUALS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import {
  PrimaryActionButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@utrecht/component-library-react';
import config from '@src/config';
import { AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';

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

  const handleDeleteKwetsbaarheidOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteKwetsbaarheid = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      return;
    }

    try {
      let deletePromises = [];

      kwetsbaarheden.forEach(async (kwetsbaarheid) => {
        const response = await fetch(
          //   config.authentication.baseURL +
          'https://vng.test.commonground.nu/apps' +
            `/openregister/api/objects/7/14/${kwetsbaarheid.id}`,
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
          label: 'verwijderen',
          icon: <VISUALS.TRASHCAN />,
          onClick: handleDeleteKwetsbaarheid,
        },
      ]}
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
