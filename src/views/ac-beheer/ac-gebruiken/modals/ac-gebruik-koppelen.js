import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { VISUALS } from '@constants';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
import ReactSelect from 'react-select';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import _ from 'lodash';

const AcGebruikKoppelenModal = ({
  gebruik,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);

  const { makeRequest } = useNextcloudRequests();

  const handleOpenModal = () => modalRef?.current?.showModal();
  const handleCloseModal = () => modalRef?.current?.close();
  const onCloseModal = () => {
    onClose?.();
  };

  const endpoint = 'openregister/api/objects/voorzieningen/voorzieninggebruik';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${gebruikFormData.id}` : baseUrl;

    try {
      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...gebruikFormData,
          ...(gebruikFormData.status &&
            gebruikFormData.status !== (gebruik?.status || initialData.status) && {
              [`startDatum${gebruikFormData.status}`]: new Date().toISOString(),
            }),
        }),
      });

      if (response.ok) {
        onSuccess?.(response);
        handleCloseModal()
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', onCloseModal);
  }, [modalRef.current]);

  const renderGebruikFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-gebruik-modal'
      title='Gebruik koppelen'
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'koppelen',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
        },
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
      ]}
      disableDefaultButton
    >
      <AcGrid columns={2}>
        test
      </AcGrid>
    </AcModal>
  );

  return renderGebruikFormModal;
};

export default withStore(observer(AcGebruikenFormModal));
