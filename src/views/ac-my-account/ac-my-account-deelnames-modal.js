import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import AcModal from '@components/ac-modal/ac-modal';
import { VISUALS } from '@constants';
import { AcColumn, AcFlex } from '@atoms';
import {
  Paragraph,
  Heading,
} from '@utrecht/component-library-react/dist/css-module';
import AcCheckbox from '@molecules/ac-checkbox/ac-checkbox';

/**
 * Modal to manage deelnemers (participations) for the active organisation.
 * - Fetches organisations of type Samenwerking and Community
 * - Leveranciers can only join Communities, not Samenwerkingsverbanden
 * - Displays them under subtitles with checkboxes
 * - Allows filtering and persists selections on save via PATCH
 */
const AcMyAccountDeelnamesModal = ({
  store: { object },
  showModal = false,
  onClose,
  onSuccess,
  data = null, // active organisation full data
}) => {
  const modalRef = useRef(null);

  const orgId = useMemo(() => {
    return String(data?.['@self']?.id || data?.id || '');
  }, [data]);

  const orgType = useMemo(() => {
    return String(data?.type || '').toLowerCase();
  }, [data]);

  const isLeverancier = useMemo(() => {
    return orgType === 'leverancier';
  }, [orgType]);

  const typeKey = useMemo(
    () =>
      object.getTypeFromParams(
        'voorzieningen',
        'organisatie',
        null,
        'deelnemers-opties'
      ),
    [object]
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({}); // { orgId: boolean }
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [communities, setCommunities] = useState([]); // [{ id, label, type, checked }]
  const [samenwerkingen, setSamenwerkingen] = useState([]);

  /**
   * Compute a display label for an organisation
   */
  const getOrgLabel = useCallback((org) => {
    return org?.['@self']?.name || org?.naam || String(org?.id || '');
  }, []);

  /**
   * Fetch available organisations and prepare selectable lists
   *
   * Note: We use _source: 'index' instead of 'database' because communities and
   * samenwerkingsverbanden (collaborations) are owned by different organizations/tenants,
   * and we need to access the public index to see all available options across tenants.
   */
  const fetchOrganisations = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      // Leveranciers can only join communities, not samenwerkingsverbanden
      const typesToFetch = isLeverancier
        ? ['Community']
        : ['Samenwerking', 'Community'];

      await object.fetchCollection(
        'voorzieningen',
        'organisatie',
        {
          'type[]': typesToFetch,
          _limit: 300,
          _source: 'index', // Use index to get public organizations from all tenants
        },
        false,
        'deelnemers-opties'
      );

      const collection = object.getCollection(typeKey);
      const results = Array.isArray(collection?.results) ? collection.results : [];

      // Warn if we find organizations without valid IDs
      const orgsWithoutIds = results.filter((o) => {
        const id = o?.id || o?.['@self']?.id;
        return id === undefined || id === null;
      });
      if (orgsWithoutIds.length > 0) {
        console.warn(
          '⚠️ Found',
          orgsWithoutIds.length,
          'organizations without valid IDs:',
          orgsWithoutIds
        );
      }

      // Determine initial selections based on the current organisation's deelnames
      const rawDeelnames = Array.isArray(data?.deelnames) ? data.deelnames : [];

      // Warn if we find invalid deelnames
      const invalidDeelnames = rawDeelnames.filter((d) => {
        const id = typeof d === 'object' ? d?.id || d?.['@self']?.id : d;
        return !id || id === 'undefined' || id === 'null';
      });

      if (invalidDeelnames.length > 0) {
        console.warn(
          '⚠️ Found invalid deelnames in organization data:',
          invalidDeelnames,
          'Full deelnames:',
          data?.deelnames
        );
      }

      const myDeelnamesIds = rawDeelnames
        .map((d) => (typeof d === 'object' ? d?.id || d?.['@self']?.id : d))
        .filter(Boolean)
        .filter((id) => id !== 'undefined' && id !== 'null') // Filter out string literals
        .map(String);

      const items = results
        // Exclude self and organizations without valid IDs
        .filter((o) => {
          const id = o?.id || o?.['@self']?.id;
          return id !== undefined && id !== null && String(id) !== orgId;
        })
        .map((o) => {
          const id = String(o?.id || o?.['@self']?.id || '');
          return {
            id,
            label: getOrgLabel(o),
            type: String(o?.type || '').toLowerCase(),
            checked: myDeelnamesIds.includes(id),
          };
        })
        // Sort alphabetically by label
        .sort((a, b) =>
          a.label.localeCompare(b.label, 'nl', { sensitivity: 'base' })
        );

      const communitiesItems = items.filter((x) => x.type === 'community');
      const samenwerkingenItems = items.filter((x) => x.type === 'samenwerking');

      setCommunities(communitiesItems);
      setSamenwerkingen(samenwerkingenItems);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError('Er is een fout opgetreden bij het laden van organisaties.');
    } finally {
      setLoading(false);
    }
  }, [object, orgId, typeKey, getOrgLabel, isLeverancier]);

  /** Open modal and load data */
  useEffect(() => {
    if (showModal) {
      modalRef?.current?.showModal();
      fetchOrganisations();
    }
  }, [showModal]);

  /** Close handler */
  const handleModalClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleModalClose);
  }, [handleModalClose, modalRef.current]);

  /** Toggle checkbox state with immediate PATCH on the selected organisation */
  const handleToggle = useCallback(
    (group, targetId) => async (nextChecked) => {
      setSaving((prev) => ({ ...prev, [targetId]: true }));

      // Optimistic update UI first
      if (group === 'community') {
        setCommunities((prev) =>
          prev.map((x) => (x.id === targetId ? { ...x, checked: nextChecked } : x))
        );
      } else {
        setSamenwerkingen((prev) =>
          prev.map((x) => (x.id === targetId ? { ...x, checked: nextChecked } : x))
        );
      }

      try {
        // Determine next selection set based on current UI state and the toggle
        const selectedBefore = new Set(
          [...communities, ...samenwerkingen]
            .filter((x) => x.checked)
            .map((x) => String(x.id))
            .filter((id) => id && id !== 'undefined' && id !== 'null') // Ensure valid IDs only
        );
        if (nextChecked) selectedBefore.add(String(targetId));
        else selectedBefore.delete(String(targetId));

        // Patch the current organisation with updated deelnames
        // Only send valid IDs (filter out any undefined/null values)
        const validDeelnames = Array.from(selectedBefore).filter(
          (id) => id && id !== 'undefined' && id !== 'null'
        );
        await object.patchObject('voorzieningen', 'organisatie', orgId, {
          deelnames: validDeelnames,
        });
        onSuccess?.();
      } catch (e) {
        // Revert UI state on error and show error
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Wijzigen van deelnames is mislukt. Probeer het opnieuw.');
        const revert = !nextChecked;
        if (group === 'community') {
          setCommunities((prev) =>
            prev.map((x) => (x.id === targetId ? { ...x, checked: revert } : x))
          );
        } else {
          setSamenwerkingen((prev) =>
            prev.map((x) => (x.id === targetId ? { ...x, checked: revert } : x))
          );
        }
      } finally {
        setSaving((prev) => ({ ...prev, [targetId]: false }));
      }
    },
    [object, orgId, communities, samenwerkingen, onSuccess]
  );

  /** Filtered views */
  const filterText = filter.trim().toLowerCase();
  const filteredCommunities = useMemo(() => {
    if (!filterText) return communities;
    return communities.filter((x) => x.label.toLowerCase().includes(filterText));
  }, [communities, filterText]);
  const filteredSamenwerkingen = useMemo(() => {
    if (!filterText) return samenwerkingen;
    return samenwerkingen.filter((x) => x.label.toLowerCase().includes(filterText));
  }, [samenwerkingen, filterText]);

  return (
    <AcModal
      ref={modalRef}
      id='deelnemers-form-modal'
      title='Deelnames bewerken'
      buttons={[
        {
          label: 'Sluiten',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
          disabled: loading,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {error && (
          <Paragraph className='con-my-account-deelnames-modal__error'>
            {error}
          </Paragraph>
        )}

        <div>
          <input
            type='text'
            placeholder='Filter op naam...'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className='utrecht-textbox con-my-account-deelnames-modal__input'
          />
        </div>

        <div>
          <Heading level={5}>Communities</Heading>
          <AcColumn gap='sm' className='con-my-account-deelnames-modal__column'>
            {loading && (
              <Paragraph className='con-my-account-deelnames-modal__paragraph'>
                Loading...
              </Paragraph>
            )}
            {filteredCommunities.length === 0 && !loading && (
              <Paragraph className='con-my-account-deelnames-modal__paragraph'>
                Geen resultaten
              </Paragraph>
            )}
            {filteredCommunities.map((item) => (
              <AcCheckbox
                key={`community-${item.id}`}
                label={item.label}
                value={item.id}
                checked={item.checked}
                disabled={saving[item.id]}
                onChange={handleToggle('community', item.id)}
              />
            ))}
          </AcColumn>
        </div>

        {!isLeverancier && (
          <div>
            <Heading level={5}>Samenwerkingsverbanden</Heading>
            <AcColumn gap='sm' className='con-my-account-deelnames-modal__column'>
              {loading && (
                <Paragraph className='con-my-account-deelnames-modal__paragraph'>
                  Loading...
                </Paragraph>
              )}
              {filteredSamenwerkingen.length === 0 && !loading && (
                <Paragraph className='con-my-account-deelnames-modal__paragraph'>
                  Geen resultaten
                </Paragraph>
              )}
              {filteredSamenwerkingen.map((item) => (
                <AcCheckbox
                  key={`samenwerking-${item.id}`}
                  label={item.label}
                  value={item.id}
                  checked={item.checked}
                  disabled={saving[item.id]}
                  onChange={handleToggle('samenwerking', item.id)}
                />
              ))}
            </AcColumn>
          </div>
        )}
      </AcFlex>
    </AcModal>
  );
};

export default withStore(observer(AcMyAccountDeelnamesModal));
