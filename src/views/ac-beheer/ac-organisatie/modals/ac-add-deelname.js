import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../../ac-beheer';
import ReactSelect from 'react-select';

/**
 * Modal to add a deelname (participation) to an organization
 * @param {object} organization - The organization to add deelname to
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to add deelname
 */
const AcAddDeelnameModal = ({
  organization,
  showModal = false,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const { makeRequest } = useNextcloudRequests();

  const [error, setError] = useState(null);
  const [deelnameOptions, setDeelnameOptions] = useState([]);
  const [selectedDeelname, setSelectedDeelname] = useState(null);

  const handleOpenModal = () => modalRef?.current?.showModal();

  const fetchOrganisations = async () => {
    try {
      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie?type[]=samenwerking&type[]=community&_limit=300`
      );

      if (response.ok) {
        const orgs = response.data.results;
        const existingDeelnameIds = Array.isArray(organization.deelnames)
          ? organization.deelnames.map((d) => (typeof d === 'object' ? d.id : d))
          : [];

        const filteredOrgs = orgs
          .filter((org) => !existingDeelnameIds.includes(org.id))
          .filter((org) => org.id !== organization.id);

        setDeelnameOptions(
          filteredOrgs.map((org) => ({
            value: org.id,
            label: org.naam || org.id,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setError('Er is een fout opgetreden bij het ophalen van de organisaties');
    }
  };

  const handleAddDeelname = async () => {
    if (!selectedDeelname) {
      setError('Selecteer eerst een organisatie');
      return;
    }

    try {
      const existingDeelnameIds = Array.isArray(organization.deelnames)
        ? organization.deelnames
        : organization.deelnames?.map((deelname) => deelname.id) || [];

      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/voorzieningen/organisatie/${organization.id}`,
        null,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...organization,
            deelnames: [
              ...existingDeelnameIds.map((d) => (typeof d === 'object' ? d.id : d)),
              selectedDeelname.value,
            ].map(String),
          }),
        }
      );

      if (response.ok) {
        onSuccess?.();
        modalRef?.current?.close();
      } else {
        setError(`Er is een fout opgetreden: ${response.data.error}`);
      }
    } catch (err) {
      console.error(err);
      setError('Er is een fout opgetreden bij het toevoegen van de deelname');
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
      fetchOrganisations();
    }
  }, [showModal]);

  const handleCloseModal = () => {
    onClose?.();
  };

  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleCloseModal);
  }, [modalRef.current]);

  const errorStyle = {
    backgroundColor:
      'color-mix(in srgb, var(--utrecht-form-field-error-message-color, #e53e3e) 5%, #ffffff)',
    border: '1px solid var(--utrecht-form-field-error-message-color, #e53e3e)',
    borderRadius: '4px',
    color: 'var(--utrecht-form-field-error-message-color, #e53e3e)',
    fontSize: 'var(--utrecht-form-field-error-message-font-size, 1rem)',
    fontWeight: 'var(--utrecht-form-field-error-message-font-weight, 400)',
    padding: '1rem',
    margin: '0 0 1rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--utrecht-form-field-error-message-font-family)',
  };

  const renderAddDeelnameModal = (
    <AcModal
      ref={modalRef}
      id='add-deelname-modal'
      title='Deelname toevoegen'
      layoutClassName='wide-content'
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'toevoegen',
          icon: <VISUALS.PLUS />,
          onClick: handleAddDeelname,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && <div style={errorStyle}>{error}</div>}
        <Paragraph>
          Selecteer een organisatie van de type samenwerking of community om aan toe
          te voegen:
        </Paragraph>
        <ReactSelect
          options={deelnameOptions}
          onChange={(selected) => setSelectedDeelname(selected)}
          value={selectedDeelname}
          placeholder='Selecteer een organisatie...'
        />
      </AcFlex>
    </AcModal>
  );

  return renderAddDeelnameModal;
};

export default withStore(observer(AcAddDeelnameModal));
