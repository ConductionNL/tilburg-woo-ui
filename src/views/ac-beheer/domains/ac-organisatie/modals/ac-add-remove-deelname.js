// eslint-disable-line import/no-unresolved
import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import ReactSelect from 'react-select';

/**
 * Modal to add or remove a deelname (participation) to/from an organization
 * @param {object} organization - The organization to modify deelname for
 * @param {boolean} remove - Whether to remove (true) or add (false) a deelname
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @param {object} [deelnameToRemove] - Optional pre-selected deelname to remove
 * @returns {React.JSX.Element} - modal to add/remove deelname
 */
const AcAddRemoveDeelnameModal = ({
  organization,
  remove = false,
  showModal = false,
  onClose,
  onSuccess,
  deelnameToRemove = null,
  store: { object },
}) => {
  const modalRef = useRef(null);

  const typeKey = object.getTypeFromParams(
    'voorzieningen',
    'organisatie',
    null,
    'deelname-opties'
  );

  const [error, setError] = useState(null);
  const [deelnameOptions, setDeelnameOptions] = useState([]);
  const [selectedDeelname, setSelectedDeelname] = useState(
    deelnameToRemove
      ? {
          value: deelnameToRemove.id,
          label: deelnameToRemove.naam || deelnameToRemove.id,
        }
      : null
  );

  const handleOpenModal = () => modalRef?.current?.showModal();

  /**
   * Fetch organizations for deelname selection
   *
   * Note: We use _source: 'index' instead of 'database' because communities and
   * samenwerkingsverbanden (collaborations) are owned by different organizations/tenants,
   * and we need to access the public index to see all available options across tenants.
   */
  const fetchOrganisations = async () => {
    // Skip fetching if we have a predefined deelname to remove
    if (remove && deelnameToRemove) return;

    try {
      await object.fetchCollection(
        'voorzieningen',
        'organisatie',
        {
          'type[]': ['Samenwerking', 'Community'],
          _limit: 300,
          _source: 'index', // Use index to get public organizations from all tenants
          _published: 'false',
        },
        false,
        'deelname-opties'
      );

      const collection = object.getCollection(typeKey);
      const orgs = (collection?.results || []).filter((org) => {
        const id = org?.id || org?.['@self']?.id;
        return id !== undefined && id !== null;
      });
      const organizationDeelnames = Array.isArray(
        organization && organization.deelnames
      )
        ? organization.deelnames
        : [];
      const existingDeelnameIds = organizationDeelnames
        .map((d) => (typeof d === 'object' ? d?.id || d?.['@self']?.id : d))
        .filter(Boolean)
        .filter((id) => id !== 'undefined' && id !== 'null')
        .map(String);

      if (remove) {
        // For remove, include existing deelnames that no longer exist as organisations first
        const orgIdsSet = new Set(orgs.map((o) => String(o.id || o?.['@self']?.id)));
        const missingIds = existingDeelnameIds.filter((id) => !orgIdsSet.has(id));
        const missingOptions = missingIds.map((id) => ({ value: id, label: id }));

        const existingOptions = orgs
          .filter((org) => {
            const orgId = String(org.id || org?.['@self']?.id);
            return existingDeelnameIds.includes(orgId);
          })
          .map((org) => {
            const orgId = org.id || org?.['@self']?.id;
            return {
              value: orgId,
              label: org.naam || org?.['@self']?.name || orgId,
            };
          });

        setDeelnameOptions([...missingOptions, ...existingOptions]);
      } else {
        // For add, filter out existing deelnames
        setDeelnameOptions(
          orgs
            .filter((org) => {
              const orgId = String(org.id || org?.['@self']?.id);
              return !existingDeelnameIds.includes(orgId);
            })
            .filter((org) => {
              const orgId = String(org.id || org?.['@self']?.id);
              return orgId !== String(organization.id);
            })
            .map((org) => {
              const orgId = org.id || org?.['@self']?.id;
              return {
                value: orgId,
                label: org.naam || org?.['@self']?.name || orgId,
              };
            })
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Er is een fout opgetreden bij het ophalen van de organisaties');
    }
  };

  const handleAddOrRemoveDeelname = async () => {
    if (!selectedDeelname) {
      setError('Selecteer eerst een organisatie');
      return;
    }

    try {
      const existingDeelnameIds = Array.isArray(organization.deelnames)
        ? organization.deelnames
            .map((d) => (typeof d === 'object' ? d?.id || d?.['@self']?.id : d))
            .filter(Boolean)
            .filter((id) => id !== 'undefined' && id !== 'null')
        : [];
      const normalizedExistingIds = existingDeelnameIds.map(String);
      const selectedId = String(selectedDeelname.value);

      const updatedDeelnames = remove
        ? normalizedExistingIds.filter((id) => id !== selectedId)
        : Array.from(new Set([...normalizedExistingIds, selectedId]));

      // Ensure we only send valid IDs
      const validDeelnames = updatedDeelnames.filter(
        (id) => id && id !== 'undefined' && id !== 'null'
      );

      await object.patchObject('voorzieningen', 'organisatie', organization.id, {
        deelnames: validDeelnames,
      });

      onSuccess?.();
      modalRef?.current?.close();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(
        `Er is een fout opgetreden bij het ${
          remove ? 'verlaten' : 'toevoegen'
        } van de deelname`
      );
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

  const renderModal = (
    <AcModal
      ref={modalRef}
      id='add-remove-deelname-modal'
      title={`Deelname ${remove ? 'verlaten' : 'toevoegen'}`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: remove ? 'verlaten' : 'toevoegen',
          icon: remove ? <VISUALS.TRASHCAN /> : <VISUALS.PLUS />,
          onClick: handleAddOrRemoveDeelname,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && <div style={errorStyle}>{error}</div>}
        {remove && deelnameToRemove ? (
          <Paragraph>
            Weet u zeker dat u de deelname &quot;
            {deelnameToRemove.naam || deelnameToRemove.id}&quot; wilt verlaten?
          </Paragraph>
        ) : (
          <>
            <Paragraph>
              {remove
                ? 'Selecteer een deelname om te verlaten:'
                : 'Selecteer een organisatie van de type Samenwerking of Community om aan toe te voegen:'}
            </Paragraph>
            <ReactSelect
              options={deelnameOptions}
              onChange={(selected) => setSelectedDeelname(selected)}
              value={selectedDeelname}
              placeholder='Selecteer een organisatie...'
            />
          </>
        )}
      </AcFlex>
    </AcModal>
  );

  return renderModal;
};

export default withStore(observer(AcAddRemoveDeelnameModal));
