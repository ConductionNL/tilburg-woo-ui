import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { LABELS } from '@constants';
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
const AcDeleteGebruikenModal = ({
  gebruiken,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const handleDeleteGebruikenOpenModal = () => modalRef?.current?.showModal();

  const [error, setError] = useState(null);
  const handleDeleteGebruiken = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      return;
    }

    try {
      voorzieningen.forEach(async (voorziening) => {
        const response = await fetch(
          //   config.authentication.baseURL +
          'https://vng.accept.commonground.nu/apps' +
            `/openconnector/api/endpoint/voorzieninggebruiken/${voorziening.id}`,
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
      buttons={[{ label: 'verwijderen', onClick: handleDeleteGebruiken }]}
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze{' '}
        {gebruiken.length === 1 ? 'gebruik' : 'gebruiken'} wilt verwijderen?
        {gebruiken.map((gebruik) => (
          <Paragraph key={gebruik.id}>{gebruik.id}</Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteGebruikenModal;
};

export default withStore(observer(AcDeleteGebruikenModal));
