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
import { AcCheckbox, AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';

const AcEditContractModal = ({
  contract,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const [contractFormData, setContractFormData] = useState({
    naam: '',
    beschrijving: '',
    voorzieningstypeId: '',
    categorie: '',
    functionaliteiten: '',
    doelgroep: '',
    referentieComponenten: '',
    standaarden: '',
  });

  // load contract data into the form
  useEffect(() => {
    if (contract) {
      setContractFormData((prev) => ({
        ...prev,
        ...contract,
        functionaliteiten: Array.isArray(contract.functionaliteiten)
          ? contract.functionaliteiten.join(', ')
          : contract.functionaliteiten,
        doelgroep: Array.isArray(contract.doelgroep)
          ? contract.doelgroep.join(', ')
          : contract.doelgroep,
        referentieComponenten: Array.isArray(contract.referentieComponenten)
          ? contract.referentieComponenten.join(', ')
          : contract.referentieComponenten,
        standaarden: Array.isArray(contract.standaarden)
          ? contract.standaarden.join(', ')
          : contract.standaarden,
      }));
    }
  }, [contract]);

  const handleEditContractOpenModal = () => modalRef?.current?.showModal();

  const handleEditContractFieldChange = (field) => (value) => {
    setContractFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const accessToken = getCookie('nextcloud_access_token');

    if (!accessToken) {
      setError('Geen toegangstoken gevonden');
      modalRef?.current?.close();
      return;
    }

    try {
      const response = await fetch(
        //   config.authentication.baseURL +
        'https://vng.accept.commonground.nu/apps' +
          `/openconnector/api/endpoint/contracts/${contractFormData.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...contractFormData,
            functionaliteiten: contractFormData.functionaliteiten
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            doelgroep: contractFormData.doelgroep
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            referentieComponenten: contractFormData.referentieComponenten
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            standaarden: contractFormData.standaarden
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleEditContractOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditContractCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditContractCloseModal);
  }, [modalRef.current]);

  const renderEditContractModal = (
    <AcModal
      ref={modalRef}
      id='edit-contract-modal'
      title='Contract bewerken'
      buttons={[{ label: 'opslaan', onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditContractFieldChange('naam')}
          value={contractFormData.naam}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditContractFieldChange('beschrijving')}
          value={contractFormData.beschrijving}
        />
        <AcFormField
          label='Voorzieningstype ID'
          type='text'
          onBlur={handleEditContractFieldChange('voorzieningstypeId')}
          value={contractFormData.voorzieningstypeId}
        />
        <AcFormField
          label='Categorie'
          type='text'
          onBlur={handleEditContractFieldChange('categorie')}
          value={contractFormData.categorie}
        />
        <AcFormField
          label='Functionaliteiten'
          type='text'
          onBlur={handleEditContractFieldChange('functionaliteiten')}
          value={contractFormData.functionaliteiten}
        />
        <AcFormField
          label='Doelgroep'
          type='text'
          onBlur={handleEditContractFieldChange('doelgroep')}
          value={contractFormData.doelgroep}
        />
        <AcFormField
          label='Referentie Componenten'
          type='text'
          onBlur={handleEditContractFieldChange('referentieComponenten')}
          value={contractFormData.referentieComponenten}
        />
        <AcFormField
          label='Standaarden'
          type='text'
          onBlur={handleEditContractFieldChange('standaarden')}
          value={contractFormData.standaarden}
        />
      </AcFlex>
    </AcModal>
  );

  return renderEditContractModal;
};

export default withStore(observer(AcEditContractModal));
