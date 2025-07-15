import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal, ConDynamicSchemaForm } from '@components';
import { VISUALS, LANGUAGES } from '@constants';
import { AcCheckbox, AcFormField } from '@src/molecules';
import ReactSelect from 'react-select';
import _ from 'lodash';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
import clsx from 'clsx';
import AcGrid from '@src/atoms/ac-grid/ac-grid';
import AcColumn from '@src/atoms/ac-column/ac-column';
import { AcFlex } from '@src/atoms';
import { Switch } from '@amsterdam/design-system-react';
import { Alert, Paragraph } from '@utrecht/component-library-react/dist/css-module';

const AcContactpersoonFormModal = ({
  contactpersoon,
  showModal = false,
  onClose,
  onSuccess,
  isEdit = false,
}) => {
  const modalRef = useRef(null);

  const initialData = {
    username: '',
    email: '',
    voornaam: '',
    achternaam: '',
    functie: '',
    organisatie: 'ce0391a9-2006-426c-88cd-adedc10579b7', // Always set to this value
    telefoonnummer: '',
    rollen: [], // as array
    actief: true,
    laatsteInlogdatum: '', // as date
    aanmaakdatum: '', // as date
    wijzigingsdatum: '', // as date
    voorkeuren: { taal: 'NL-nl', thema: 'licht' },
    aanspreekPunt: false,
  };

  const rollenOptions = [
    // { label: 'Admin', value: 'admin' },
    // { label: 'Editor', value: 'editor' },
    // { label: 'Viewer', value: 'viewer' },
    { label: 'Aanbod-beheerder', value: 'aanbod-beheerder' },
    { label: 'Gebruik-beheerder', value: 'gebruik-beheerder' },
    { label: 'Gebruik-raadpleger', value: 'gebruik-raadpleger' },
    { label: 'Functioneel beheerder', value: 'functioneel beheerder' },
    { label: 'VNG-raadpleger', value: 'VNG-raadpleger' },
    { label: 'Bezoeker', value: 'Bezoeker' },
  ];

  // form data
  const [contactpersoonFormData, setContactpersoonFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /** @type {[
    { type: 'error' | 'info' | 'success', message: string } | null,
    (state: { type: 'error' | 'info' | 'success', message: string } | null) => void
  ]} */
  const [result, setResult] = useState(null);
  const [schema, setSchema] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const [organisatieOptions, setOrganisatieOptions] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  // nextcloud requests
  const { makeRequest, getUser } = useNextcloudRequests();

  const fetchUserInfo = async () => {
    const user = await getUser();
    setUserInfo(user.data);
  };

  const fetchOrganisationOptions = async () => {
    const response = await makeRequest(
      `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie`
    );
    const data = response.data;
    setOrganisatieOptions(
      data.results.map((item) => ({
        value: item.id,
        label: item.naam || item.id,
      }))
    );
  };

  useEffect(() => {
    const fetchSchema = async () => {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/schemas/contactpersoon`
      );
      const data = response.data;
      setSchema(data);
    };

    if (showModal) {
      fetchOrganisationOptions();
      fetchSchema();
      fetchUserInfo();
    }
  }, [showModal]);

  useEffect(() => {
    // Set the form data in 1 go
    // This is a simple and compact way to conditionally set the form data
    // if preSelectedVoorziening is provided, set the voorziening to the preSelectedVoorziening
    // if dienst is provided, set the form data to the dienst data
    setContactpersoonFormData({
      // initial data
      ..._.cloneDeep(initialData),
      // data to edit (only if data is provided and isEdit is true)
      ...(contactpersoon &&
        isEdit && {
          ...contactpersoon,
          // Always ensure organisatie is set to the required value
          organisatie: 'ce0391a9-2006-426c-88cd-adedc10579b7',
        }),
    });
  }, [contactpersoon, showModal]);

  const handleEditContactpersoonOpenModal = () => modalRef?.current?.showModal();

  const handleFormValidCheck = (isValid) => {
    /* possibly also handle checks outside of the dynamic form factory */
    setIsValid(isValid);
  };

  const endpoint = 'openregister/api/objects/voorzieningen/contactpersoon';

  const handleSubmit = async () => {
    const baseUrl = `${BASE_URL}/apps/${endpoint}`;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${baseUrl}/${contactpersoonFormData.id}` : baseUrl;

    try {
      setIsLoading(true);

      const response = await makeRequest(url, null, {
        method: method,
        body: JSON.stringify({
          ...contactpersoonFormData,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.statusText ||
            'Er is een fout opgetreden bij het opslaan van de contactpersoon'
        );
      }

      onSuccess?.(response);

      setResult({
        type: 'success',
        message: isEdit
          ? 'Contactpersoon succesvol bijgewerkt'
          : 'Contactpersoon succesvol toegevoegd',
      });

      setTimeout(() => {
        setResult(null);
        onClose?.();
        modalRef?.current?.close();
      }, 3000);
    } catch (err) {
      console.error(err);
      setResult({
        type: 'error',
        message:
          err.message ||
          'Er is een fout opgetreden bij het opslaan van de contactpersoon',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleEditContactpersoonOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleEditContactpersoonCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleEditContactpersoonCloseModal);
  }, [modalRef.current]);

  const renderContactpersoonFormModal = (
    <AcModal
      ref={modalRef}
      id='edit-contactpersoon-modal'
      title={isEdit ? 'Contactpersoon bewerken' : 'Contactpersoon toevoegen'}
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'opslaan',
          icon: <VISUALS.SAVE />,
          onClick: handleSubmit,
          disabled: !isValid || isLoading || result?.type === 'success',
          loading: isLoading,
        },
      ]}
      disableDefaultButton
    >
      <AcFlex column spacing='sm' style={{ marginBottom: '1rem' }}>
        <Alert type='info'>
          <AcFlex spacing='sm'>
            <VISUALS.INFO_BLUE />
            <Paragraph>
              Verplichte gegevens zijn zichtbaar voor andere contactpersonen.
            </Paragraph>
          </AcFlex>
        </Alert>

        {result && (
          <Alert type={result.type === 'success' ? 'info' : result.type}>
            <AcFlex spacing='sm'>
              {result.type === 'error' ? <VISUALS.ERROR /> : <VISUALS.INFO_BLUE />}
              <Paragraph>{result.message}</Paragraph>
            </AcFlex>
          </Alert>
        )}
      </AcFlex>

      <AcGrid columns={2}>
        <ConDynamicSchemaForm
          schema={schema}
          formData={{
            // Map schema properties to form data fields
            username: contactpersoonFormData.username,
            email: contactpersoonFormData.email,
            voornaam: contactpersoonFormData.voornaam,
            achternaam: contactpersoonFormData.achternaam,
            functie: contactpersoonFormData.functie,
            organisatie: contactpersoonFormData.organisatie,
            telefoonnummer: contactpersoonFormData.telefoonnummer,
            rollen: contactpersoonFormData.rollen,
            actief: contactpersoonFormData.actief,
            aanspreekPunt: contactpersoonFormData.aanspreekPunt,
          }}
          onFieldChange={(fieldName, value) => {
            // Map schema property names back to form data field names
            const fieldMappings = {
              username: 'username',
              email: 'email',
              voornaam: 'voornaam',
              achternaam: 'achternaam',
              functie: 'functie',
              organisatie: 'organisatie',
              telefoonnummer: 'telefoonnummer',
              rollen: 'rollen',
              actief: 'actief',
              aanspreekPunt: 'aanspreekPunt',
            };

            const formFieldName = fieldMappings[fieldName] || fieldName;
            setContactpersoonFormData((prev) => ({
              ...prev,
              [formFieldName]: value,
            }));
          }}
          fieldConfigs={{
            // Hide fields that are not in the current form
            id: { visible: false },
            laatsteInlogdatum: { visible: false },
            aanmaakdatum: { visible: false },
            wijzigingsdatum: { visible: false },
            voorkeuren: { visible: false },
            // Disable organisatie field for non-admin users
            organisatie: {
              visible: true,
              disabled: true, // Always disabled
            },
            // Make telefoonnummer required when aanspreekPunt is true
            telefoonnummer: {
              visible: true,
              required: contactpersoonFormData.aanspreekPunt,
            },
          }}
          optionsProviders={{
            rollen: rollenOptions,
            organisatie: organisatieOptions,
          }}
          loadingStates={{}}
          disabledStates={{}}
          getIsValid={handleFormValidCheck}
          honorImmutable={isEdit}
        />
      </AcGrid>
    </AcModal>
  );

  return renderContactpersoonFormModal;
};

export default withStore(observer(AcContactpersoonFormModal));
