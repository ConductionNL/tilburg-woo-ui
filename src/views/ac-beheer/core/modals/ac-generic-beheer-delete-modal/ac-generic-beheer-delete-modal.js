import React, { useEffect, useRef, useState, useCallback } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';

/**
 * Generic modal to delete 1 or multiple objects.
 * For applicatie (module), dienst and koppeling, shows custom copy that refers to
 * "gemeenten of samenwerkingen" / "onderstaande gemeenten en/of samenwerkingen" instead of generic "andere objecten".
 * Entity type is determined by the beheerType prop (from the beheer page), since schema.title from the API may be the object name, not the type.
 * @param {object[]} objects - array of objects with @self metadata
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @param {function} onSuccess - function to call when deletion is successful
 * @param {string} [beheerType] - beheer page type (e.g. 'applicaties', 'diensten', 'koppelingen') to show custom copy
 * @returns {React.JSX.Element} - generic delete modal
 */
const ConGenericBeheerDeleteModal = ({
  objects,
  showModal = false,
  onClose,
  onSuccess,
  beheerType,
  store: { object },
}) => {
  const modalRef = useRef(null);

  const handleOpenModal = () => modalRef?.current?.showModal();

  // Extract metadata from the first object for display purposes only
  const getDisplayMetadata = () => {
    if (!objects || objects.length === 0) return null;

    const firstObject = objects[0];
    const metadata = firstObject['@self'];

    if (!metadata) {
      console.error('Object missing @self metadata:', firstObject);
      return null;
    }

    return {
      name: metadata.name,
      schemaTitle: metadata.schema?.title,
      schema: metadata.schema,
    };
  };

  /**
   * Returns entity type labels from the beheer page type so custom copy can be shown (schema from API may contain object name, not type).
   * @param {string} [type] - beheer page type from modal props
   * @returns {{ singular: string, plural: string } | null}
   */
  const getEntityTypeLabelFromBeheerType = (type) => {
    if (!type) return null;
    const t = String(type).toLowerCase();
    if (t === 'applicaties')
      return { singular: 'applicatie', plural: 'applicaties' };
    if (t === 'diensten') return { singular: 'dienst', plural: 'diensten' };
    if (t === 'koppeling' || t === 'koppelingen')
      return { singular: 'koppeling', plural: 'koppelingen' };
    return null;
  };

  /**
   * Formats object names for the delete message: singular returns "name", plural returns "A", "B" en "C".
   * @param {object[]} objs - objects with @self or naam/name/id
   * @param {boolean} isSingular
   * @returns {string}
   */
  const formatNamesForMessage = (objs, isSingular) => {
    const getName = (obj) =>
      obj['@self']?.name ?? obj.naam ?? obj.name ?? obj.id ?? '';
    const names = objs.map((o) => String(getName(o)).trim() || 'Onbekend');
    if (isSingular) return `"${names[0]}"`;
    if (names.length === 2) return `"${names[0]}" en "${names[1]}"`;
    const quoted = names.map((n) => `"${n}"`);
    return quoted.slice(0, -1).join(', ') + ' en ' + quoted[quoted.length - 1];
  };

  const displayMetadata = getDisplayMetadata();

  // State for usage checking
  const [usageChecking, setUsageChecking] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [usageError, setUsageError] = useState(null);
  const [usageCheckComplete, setUsageCheckComplete] = useState(false);

  // State for delete operation
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if objects are used by other objects
  const checkObjectUsage = useCallback(async () => {
    if (!objects || objects.length === 0) return;

    setUsageChecking(true);
    setUsageError(null);
    setUsageData(null);
    setUsageCheckComplete(false);

    try {
      // For multiple objects, we'll check each one individually
      const usageResults = await Promise.allSettled(
        objects.map(async (obj) => {
          const metadata = obj['@self'];
          if (!metadata) {
            console.warn('Object missing @self metadata:', obj);
            return { objectId: obj.id, used: [], error: 'Missing metadata' };
          }

          try {
            // Use object store's fetchRelatedData method for consistency
            await object.fetchRelatedData(
              metadata.register,
              metadata.schema,
              obj.id,
              'used',
              { _limit: 100, _published: 'false' } // Limit to prevent performance issues
            );

            // Get the related data from the store
            const type = `${metadata.register}_${metadata.schema}`;
            const relatedData = object.getRelatedData(type, 'used');
            const usedObjects = relatedData?.results || [];

            return {
              objectId: obj.id,
              objectName: metadata.name || obj.naam || obj.name || obj.id,
              used: usedObjects,
              error: null,
            };
          } catch (err) {
            console.error(`❌ Failed to check usage for ${obj.id}:`, err);
            return {
              objectId: obj.id,
              objectName: metadata.name || obj.naam || obj.name || obj.id,
              used: [],
              error: err.message,
            };
          }
        })
      );

      // Process results
      const processedResults = usageResults.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            objectId: 'unknown',
            objectName: 'Unknown',
            used: [],
            error: result.reason?.message || 'Unknown error',
          };
        }
      });

      setUsageData(processedResults);
    } catch (err) {
      console.error('❌ Failed to check object usage:', err);
      setUsageError(
        err.message ||
          'Er is een fout opgetreden bij het controleren van object gebruik'
      );
    } finally {
      setUsageChecking(false);
      setUsageCheckComplete(true);
    }
  }, [objects, object]);

  // Ensure we only check once per modal open
  const hasCheckedRef = useRef(false);

  // Check usage when modal opens (once per open)
  useEffect(() => {
    if (!showModal) return;
    if (hasCheckedRef.current) return;
    if (!objects || objects.length === 0) return;

    hasCheckedRef.current = true;
    checkObjectUsage();
  }, [showModal]);

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent double-clicks

    setIsDeleting(true);

    try {
      const results = await object.massDeleteObjects(objects);

      if (results.successful.length > 0) {
        // Close modal first to prevent state conflicts
        modalRef?.current?.close();

        // Call onSuccess after a small delay to ensure modal is closed
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      }
    } catch (err) {
      console.error('❌ Failed to delete objects:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  const handleCloseModal = useCallback(() => {
    // Reset usage check state when modal closes
    setUsageChecking(false);
    setUsageData(null);
    setUsageError(null);
    setUsageCheckComplete(false);

    // Reset delete state
    setIsDeleting(false);

    // Allow usage check to run again on next open
    hasCheckedRef.current = false;

    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const modal = modalRef?.current;
    if (!modal) return;

    modal.addEventListener('close', handleCloseModal);

    // Cleanup function to remove event listener
    return () => {
      modal.removeEventListener('close', handleCloseModal);
    };
  }, [handleCloseModal]);

  // Early return if no metadata or objects
  if (!displayMetadata || !objects || objects.length === 0) {
    return null;
  }

  const objectCount = objects.length;
  const isSingular = objectCount === 1;
  // Normalize display name to a safe string and precompute lowercase variant to avoid runtime errors
  const normalizeDisplayName = (value, fallback = 'object') => {
    if (typeof value === 'string' && value.trim()) return value;
    if (value == null) return fallback;
    const stringValue = value.toString?.();
    return typeof stringValue === 'string' && stringValue.trim()
      ? stringValue
      : fallback;
  };

  const displayName = normalizeDisplayName(
    displayMetadata.schemaTitle ?? displayMetadata.name,
    'object'
  );
  const displayNameLower = displayName.toLowerCase();

  const entityTypeLabel = getEntityTypeLabelFromBeheerType(beheerType);
  const formattedNames = formatNamesForMessage(objects, isSingular);

  // Helper functions for usage data
  const hasUsageData = usageData && usageData.length > 0;
  const hasUsedObjects =
    hasUsageData &&
    usageData.some((result) => result.used && result.used.length > 0);
  const totalUsedObjects = hasUsageData
    ? usageData.reduce((total, result) => total + (result.used?.length || 0), 0)
    : 0;
  const shouldDisableDelete =
    usageChecking || isDeleting || (usageCheckComplete && hasUsedObjects);

  const renderDeleteModal = (
    <AcModal
      ref={modalRef}
      id='generic-delete-modal'
      title={`${entityTypeLabel ? (isSingular ? entityTypeLabel.singular : entityTypeLabel.plural) : (isSingular ? displayName : `${displayName}s`)} verwijderen`}
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
          disabled: isDeleting,
        },
        {
          label: usageChecking
            ? 'Controleren...'
            : isDeleting
            ? 'Verwijderen...'
            : 'Verwijderen',
          icon:
            usageChecking || isDeleting ? <VISUALS.SPINNER /> : <VISUALS.TRASHCAN />,
          onClick: handleDelete,
          disabled: shouldDisableDelete,
          loading: usageChecking || isDeleting,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {/* Loading State */}
        {usageChecking && (
          <Alert type='info'>
            <AcFlex spacing='sm'>
              <VISUALS.SPINNER />
              <Paragraph>
                Controleren of{' '}
                {entityTypeLabel
                  ? isSingular
                    ? `deze ${entityTypeLabel.singular}`
                    : `deze ${entityTypeLabel.plural}`
                  : isSingular
                  ? `dit ${displayNameLower}`
                  : `deze ${displayNameLower}s`}{' '}
                wordt gebruikt door andere objecten...
              </Paragraph>
            </AcFlex>
          </Alert>
        )}

        {/* Error State */}
        {usageError && (
          <Alert type='error'>
            <AcFlex spacing='sm'>
              <VISUALS.CIRCLE_EXCLAMATION />
              <Paragraph>{usageError}</Paragraph>
            </AcFlex>
          </Alert>
        )}

        {/* Usage Results - No Dependencies (Success) */}
        {usageCheckComplete && !usageError && !hasUsedObjects && (
          <Alert type='ok'>
            <AcFlex spacing='sm'>
              <VISUALS.CHECK
                style={{ minWidth: 'fit-content', marginTop: '0.25rem' }}
              />
              <Paragraph>
                {entityTypeLabel
                  ? isSingular
                    ? `De ${entityTypeLabel.singular} ${formattedNames} wordt niet gebruikt door gemeenten of samenwerkingen en kan veilig worden verwijderd.`
                    : `De ${entityTypeLabel.plural} ${formattedNames} worden niet gebruikt door gemeenten of samenwerkingen en kunnen veilig worden verwijderd.`
                  : isSingular
                  ? `Dit ${displayNameLower} wordt niet gebruikt door andere objecten en kan veilig worden verwijderd.`
                  : `Deze ${displayNameLower}s worden niet gebruikt door andere objecten en kunnen veilig worden verwijderd.`}
              </Paragraph>
            </AcFlex>
          </Alert>
        )}

        {/* Usage Results - Has Dependencies (Red) */}
        {usageCheckComplete && !usageError && hasUsedObjects && (
          <Alert type='error'>
            <AcFlex column spacing='sm'>
              <AcFlex spacing='sm'>
                <VISUALS.CIRCLE_EXCLAMATION />
                <Paragraph>
                  <strong>
                    {entityTypeLabel
                      ? isSingular
                        ? `De ${entityTypeLabel.singular} ${formattedNames} wordt gebruikt door onderstaande gemeenten en/of samenwerkingen en kan niet worden verwijderd.`
                        : `De ${entityTypeLabel.plural} ${formattedNames} worden gebruikt door onderstaande gemeenten en/of samenwerkingen en kunnen niet worden verwijderd.`
                      : isSingular
                      ? `Dit ${displayNameLower} kan niet worden verwijderd omdat het gebruikt wordt door ${totalUsedObjects} ${
                          totalUsedObjects === 1 ? 'ander object' : 'andere objecten'
                        }.`
                      : `Deze ${displayNameLower}s kunnen niet worden verwijderd omdat ze gebruikt worden door andere objecten.`}
                  </strong>
                </Paragraph>
              </AcFlex>

              {/* List of dependent objects */}
              {usageData.map((result, index) => {
                if (!result.used || result.used.length === 0) return null;

                return (
                  <div key={result.objectId || index} style={{ marginLeft: '1rem' }}>
                    <Paragraph style={{ fontWeight: '600', margin: '0.5rem 0' }}>
                      {result.objectName} wordt gebruikt door:
                    </Paragraph>
                    {result.used.slice(0, 10).map((usedObj, usedIndex) => (
                      <Paragraph
                        key={usedObj.id || usedIndex}
                        style={{ marginLeft: '1rem', fontSize: '0.9rem' }}
                      >
                        •{' '}
                        {usedObj['@self']?.name ||
                          usedObj.naam ||
                          usedObj.name ||
                          usedObj.id}{' '}
                        ({usedObj['@self']?.schema?.title || 'Onbekend type'})
                      </Paragraph>
                    ))}
                    {result.used.length > 10 && (
                      <Paragraph
                        style={{
                          marginLeft: '1rem',
                          fontSize: '0.9rem',
                          fontStyle: 'italic',
                        }}
                      >
                        ... en nog {result.used.length - 10} andere objecten
                      </Paragraph>
                    )}
                  </div>
                );
              })}
            </AcFlex>
          </Alert>
        )}

        {/* Always show confirmation text and object list */}
        <Paragraph>
          {usageCheckComplete && hasUsedObjects
            ? entityTypeLabel
              ? `Je kunt ${
                  isSingular ? `deze ${entityTypeLabel.singular} ${formattedNames}` : `deze ${entityTypeLabel.plural}`
                } pas verwijderen nadat alle afhankelijkheden zijn weggenomen.`
              : `Je kunt ${
                  isSingular ? `dit ${displayNameLower}` : `deze ${displayNameLower}s`
                } pas verwijderen nadat alle afhankelijkheden zijn weggenomen.`
            : entityTypeLabel
            ? `Weet je zeker dat je ${
                isSingular ? `de ${entityTypeLabel.singular} ${formattedNames}` : `deze ${entityTypeLabel.plural}`
              } wilt verwijderen?`
            : `Weet je zeker dat je ${
                isSingular ? `dit ${displayNameLower}` : `deze ${displayNameLower}s`
              } wilt verwijderen?`}
        </Paragraph>

        {/* Show objects being deleted - always visible */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
          }}
        >
          <Paragraph style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            {entityTypeLabel
              ? isSingular
                ? `Te verwijderen ${entityTypeLabel.singular}:`
                : `Te verwijderen ${entityTypeLabel.plural}:`
              : isSingular ? 'Te verwijderen object:' : 'Te verwijderen objecten:'}
          </Paragraph>
          {objects.map((obj) => (
            <Paragraph key={obj.id} style={{ marginLeft: '1rem' }}>
              • {obj['@self']?.name || obj.naam || obj.name || obj.id}
            </Paragraph>
          ))}
        </div>
      </AcFlex>
    </AcModal>
  );

  return renderDeleteModal;
};

export default withStore(observer(ConGenericBeheerDeleteModal));
