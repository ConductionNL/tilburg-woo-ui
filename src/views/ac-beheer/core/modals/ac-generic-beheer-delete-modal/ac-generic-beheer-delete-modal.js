// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph, Alert } from '@utrecht/component-library-react/dist/css-module';

/**
 * Generic modal to delete 1 or multiple objects
 * @param {object[]} objects - array of objects with @self metadata
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @param {function} onSuccess - function to call when deletion is successful
 * @returns {React.JSX.Element} - generic delete modal
 */
const ConGenericBeheerDeleteModal = ({
  objects,
  showModal = false,
  onClose,
  onSuccess,
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
    };
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
              { _limit: 100 } // Limit to prevent performance issues
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
  const displayName =
    displayMetadata.schemaTitle || displayMetadata.name || 'object';

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
      title={`${isSingular ? displayName : `${displayName}s`} verwijderen`}
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
                {isSingular
                  ? `dit ${displayName.toLowerCase()}`
                  : `deze ${displayName.toLowerCase()}s`}{' '}
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
          <Alert type='success'>
            <AcFlex spacing='sm'>
              <VISUALS.CHECK />
              <Paragraph>
                {isSingular
                  ? `Dit ${displayName.toLowerCase()} wordt niet gebruikt door andere objecten en kan veilig worden verwijderd.`
                  : `Deze ${displayName.toLowerCase()}s worden niet gebruikt door andere objecten en kunnen veilig worden verwijderd.`}
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
                    {isSingular
                      ? `Dit ${displayName.toLowerCase()} kan niet worden verwijderd omdat het gebruikt wordt door ${totalUsedObjects} ${
                          totalUsedObjects === 1 ? 'ander object' : 'andere objecten'
                        }.`
                      : `Deze ${displayName.toLowerCase()}s kunnen niet worden verwijderd omdat ze gebruikt worden door andere objecten.`}
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
            ? `Je kunt ${
                isSingular
                  ? `dit ${displayName.toLowerCase()}`
                  : `deze ${displayName.toLowerCase()}s`
              } pas verwijderen nadat alle afhankelijkheden zijn weggenomen.`
            : `Weet je zeker dat je ${
                isSingular
                  ? `dit ${displayName.toLowerCase()}`
                  : `deze ${displayName.toLowerCase()}s`
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
            {isSingular ? 'Te verwijderen object:' : 'Te verwijderen objecten:'}
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
