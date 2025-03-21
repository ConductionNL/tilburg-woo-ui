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
import { AcCheckbox, AcFormField } from '@src/molecules';
import { getCookie } from '@src/utilities';

const AcEditOrganisatieModal = ({
  organisatie,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const [organisatieFormData, setOrganisatieFormData] = useState({
    naam: '',
    type: '',
    kvkNummer: '',
    oidn: '',
    moederOrganisatie: '',
    sector: '',
    organisatietype: '',
    website: '',
    adres: {
      straat: '',
      huisnummer: '',
      postcode: '',
      plaats: '',
      land: '',
    },
    contactgegevens: {
      telefoon: '',
      email: '',
      contactpersoon: '',
    },
    beschrijving: '',
    logo: '',
    voorzieningen: [],
    gebruik: [],
    deelnemerIn: [],
  });

  // load contract data into the form
  useEffect(() => {
    if (organisatie) {
      setOrganisatieFormData((prev) => ({
        ...prev,
        ...organisatie,
        voorzieningen: Array.isArray(organisatie.voorzieningen)
          ? organisatie.voorzieningen.join(', ')
          : organisatie.voorzieningen,
        gebruik: Array.isArray(organisatie.gebruik)
          ? organisatie.gebruik.join(', ')
          : organisatie.gebruik,
        deelnemerIn: Array.isArray(organisatie.deelnemerIn)
          ? organisatie.deelnemerIn.join(', ')
          : organisatie.deelnemerIn,
      }));
    }
  }, [organisatie]);

  const handleEditOrganisatieOpenModal = () => modalRef?.current?.showModal();

  const handleEditOrganisatieFieldChange = (field) => (value) => {
    setOrganisatieFormData((prev) => ({
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
          `/openconnector/api/endpoint/organisaties/${organisatieFormData.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...organisatieFormData,
            voorzieningen: organisatieFormData.voorzieningen
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            gebruik: organisatieFormData.gebruik
              .trim()
              .split(/ *, */g)
              .filter(Boolean),
            deelnemerIn: organisatieFormData.deelnemerIn
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
        modalRef?.current?.close();
      }
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleEditOrganisatieOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditOrganisatieCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditOrganisatieCloseModal);
  }, [modalRef.current]);

  const renderEditOrganisatieModal = (
    <AcModal
      ref={modalRef}
      id='edit-organisatie-modal'
      title='Organisatie bewerken'
      buttons={[{ label: 'opslaan', icon: <VISUALS.SAVE />, onClick: handleSubmit }]}
    >
      <AcFlex column spacing='sm'>
        <AcFormField
          label='Naam'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('naam')}
          value={organisatieFormData.naam}
        />
        <AcFormField
          label='Type'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('type')}
          value={organisatieFormData.type}
        />
        <AcFormField
          label='KvK nummer'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('kvkNummer')}
          value={organisatieFormData.kvkNummer}
        />
        <AcFormField
          label='OIDN'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('oidn')}
          value={organisatieFormData.oidn}
        />
        <AcFormField
          label='Moeder Organisatie'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('moederOrganisatie')}
          value={organisatieFormData.moederOrganisatie}
        />
        <AcFormField
          label='Sector'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('sector')}
          value={organisatieFormData.sector}
        />
        <AcFormField
          label='Organisatietype'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('organisatietype')}
          value={organisatieFormData.organisatietype}
        />
        <AcFormField
          label='Website'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('website')}
          value={organisatieFormData.website}
        />
        <AcFormField
          label='Beschrijving'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('beschrijving')}
          value={organisatieFormData.beschrijving}
        />
        <AcFormField
          label='Logo'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('logo')}
          value={organisatieFormData.logo}
        />
        <AcFormField
          label='Voorzieningen'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('voorzieningen')}
          value={organisatieFormData.voorzieningen}
        />
        <AcFormField
          label='Gebruik'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('gebruik')}
          value={organisatieFormData.gebruik}
        />
        <AcFormField
          label='Deelnemer In'
          type='text'
          onBlur={handleEditOrganisatieFieldChange('deelnemerIn')}
          value={organisatieFormData.deelnemerIn}
        />
      </AcFlex>
    </AcModal>
  );

  return renderEditOrganisatieModal;
};

export default withStore(observer(AcEditOrganisatieModal));
