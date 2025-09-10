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
 * Modal to manage deelnames (participations) for the active organisation.
 * - Fetches organisations of type Samenwerking and Community
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

  const typeKey = useMemo(
    () =>
      object.getTypeFromParams(
        'voorzieningen',
        'organisatie',
        null,
        'deelname-opties'
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
   */
  const fetchOrganisations = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      await object.fetchCollection(
        'voorzieningen',
        'organisatie',
        { 'type[]': ['samenwerking', 'community'], _limit: 300 },
        false,
        'deelname-opties'
      );

      const collection = object.getCollection(typeKey);
      const results = Array.isArray(collection?.results) ? collection.results : [];

      const items = results
        // Exclude self
        .filter((o) => String(o?.id) !== orgId)
        .map((o) => {
          const deelnameIds = Array.isArray(o?.deelnames)
            ? o.deelnames
                .map((d) => (typeof d === 'object' ? d?.id || d?.['@self']?.id : d))
                .filter(Boolean)
                .map(String)
            : [];
          const checked = deelnameIds.includes(orgId);
          return {
            id: String(o.id),
            label: getOrgLabel(o),
            type: String(o?.type || '').toLowerCase(),
            checked,
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
  }, [object, orgId, typeKey, getOrgLabel]);

  /** Open modal and load data */
  useEffect(() => {
    if (showModal) {
      modalRef?.current?.showModal();
      fetchOrganisations();
    }
  }, [showModal, fetchOrganisations]);

  /** Close handler */
  const handleModalClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleModalClose);
  }, [handleModalClose, modalRef.current]);

  /** Ensure we have the latest target org, return its deelnames as string IDs */
  const getTargetOrgDeelnames = useCallback(
    async (targetId) => {
      // Try get from store first
      const type = object.getTypeFromParams(
        'voorzieningen',
        'organisatie',
        targetId,
        null
      );
      let target = object.getObject(type, targetId);
      if (!target) {
        try {
          await object.fetchObject('voorzieningen', 'organisatie', targetId);
          target = object.getObject(type, targetId);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(
            'Kon organisatie niet ophalen, ga door met lege deelnames',
            e
          );
        }
      }
      const arr = Array.isArray(target?.deelnames) ? target.deelnames : [];
      return arr
        .map((d) => (typeof d === 'object' ? d?.id || d?.['@self']?.id : d))
        .filter(Boolean)
        .map(String);
    },
    [object]
  );

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
        const current = await getTargetOrgDeelnames(targetId);
        const setIds = new Set(current);
        const myId = String(orgId);
        if (nextChecked) setIds.add(myId);
        else setIds.delete(myId);

        await object.patchObject('voorzieningen', 'organisatie', targetId, {
          deelnames: Array.from(setIds).map(String),
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
    [getTargetOrgDeelnames, object, orgId]
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
      id='deelnames-form-modal'
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
          <Paragraph style={{ color: '#a00', margin: 0 }}>{error}</Paragraph>
        )}

        <div>
          <input
            type='text'
            placeholder='Filter op naam...'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className='utrecht-textbox'
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <Heading level={5}>Communities</Heading>
          <AcColumn
            gap='sm'
            style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}
          >
            {loading && <Paragraph style={{ margin: 0 }}>Loading...</Paragraph>}
            {filteredCommunities.length === 0 && !loading && (
              <Paragraph style={{ margin: 0 }}>Geen resultaten</Paragraph>
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

        <div>
          <Heading level={5}>Samenwerkingsverbanden</Heading>
          <AcColumn
            gap='sm'
            style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}
          >
            {loading && <Paragraph style={{ margin: 0 }}>Loading...</Paragraph>}
            {filteredSamenwerkingen.length === 0 && !loading && (
              <Paragraph style={{ margin: 0 }}>Geen resultaten</Paragraph>
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
      </AcFlex>
    </AcModal>
  );
};

export default withStore(observer(AcMyAccountDeelnamesModal));
