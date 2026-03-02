// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

/**
 * Generic modal to publish or depublish one or multiple objects
 * - Uses ObjectStore mass operations under the hood
 * @param {object[]} objects - Array of objects with @self metadata
 * @param {boolean} publish - When true publish, otherwise depublish
 * @param {boolean} showModal - Whether the modal is shown
 * @param {function} onClose - Callback when modal closes
 * @param {function} onSuccess - Callback when operation has at least one success
 * @param {{ object: import('@src/stores/object.store').ObjectStore }} store - MobX store injection
 * @returns {React.JSX.Element|null}
 */
const ConGenericBeheerPublishDepublishModal = ({
  objects,
  publish = true,
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

    if (!metadata) return null;

    return {
      name: metadata.name,
      schemaTitle: metadata.schema?.title,
    };
  };

  const displayMetadata = getDisplayMetadata();

  // State for publish/depublish operation
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (isProcessing) return; // Prevent double-clicks

    setIsProcessing(true);

    try {
      console.info(
        `🚀 ${publish ? 'Publishing' : 'Depublishing'} objects:`,
        objects.map((obj) => obj.id)
      );

      const results = publish
        ? await object.massPublishObjects(objects)
        : await object.massDepublishObjects(objects);

      if (results.successful.length > 0) {
        console.info(
          `✅ Successfully ${publish ? 'published' : 'depublished'} ${
            results.successful.length
          } objects`
        );

        // Close modal first to prevent state conflicts
        modalRef?.current?.close();

        // Call onSuccess after a small delay to ensure modal is closed
        setTimeout(() => {
          onSuccess?.();
        }, 100);
      }
    } catch (err) {
      console.error(
        `❌ Failed to ${publish ? 'publish' : 'depublish'} objects:`,
        err
      );
      // TODO: add user-facing error handling if required by UX guidelines
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  const handleCloseModal = useCallback(() => {
    // Reset processing state when modal closes
    setIsProcessing(false);

    onClose?.();
  }, [onClose]);

  useEffect(() => {
    const modal = modalRef?.current;
    if (modal) {
      modal.addEventListener('close', handleCloseModal);

      // Cleanup function to remove event listener
      return () => {
        modal.removeEventListener('close', handleCloseModal);
      };
    }
  }, [modalRef.current, handleCloseModal]);

  // Early return if no metadata or objects
  if (!displayMetadata || !objects || objects.length === 0) {
    return null;
  }

  const objectCount = objects.length;
  const isSingular = objectCount === 1;
  const displayName =
    displayMetadata.schemaTitle || displayMetadata.name || 'object';

  const renderModal = (
    <AcModal
      ref={modalRef}
      id={`generic-${publish ? 'publish' : 'depublish'}-modal`}
      title={`${isSingular ? displayName : `${displayName}s`} ${
        publish ? 'publiceren' : 'depubliceren'
      }`}
      buttons={[
        {
          label: 'Annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
          disabled: isProcessing,
        },
        {
          label: isProcessing
            ? publish
              ? 'Publiceren...'
              : 'Depubliceren...'
            : publish
            ? 'Publiceren'
            : 'Depubliceren',
          icon: isProcessing ? (
            <VISUALS.SPINNER />
          ) : publish ? (
            <VISUALS.PUBLISH className='ac-publish-depublish-icon' />
          ) : (
            <VISUALS.PUBLISH_OFF className='ac-publish-depublish-icon' />
          ),
          onClick: handleConfirm,
          disabled: isProcessing,
          loading: isProcessing,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        {/* Always show confirmation text and object list */}
        Weet je zeker dat je deze {isSingular
          ? displayName
          : `${displayName}s`} wilt {publish ? 'publiceren' : 'depubliceren'}?
        {/* Show objects being published/depublished */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            marginTop: '1rem',
          }}
        >
          <Paragraph style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            {isSingular
              ? `Te ${publish ? 'publiceren' : 'depubliceren'} object:`
              : `Te ${publish ? 'publiceren' : 'depubliceren'} objecten:`}
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

  return renderModal;
};

export default withStore(observer(ConGenericBeheerPublishDepublishModal));
