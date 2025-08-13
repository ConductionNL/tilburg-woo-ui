// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useRef } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';

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

  const handleConfirm = async () => {
    try {
      const results = publish
        ? await object.massPublishObjects(objects)
        : await object.massDepublishObjects(objects);

      if (results.successful.length > 0) {
        onSuccess?.();
        modalRef?.current?.close();
      }
    } catch (err) {
      // TODO: add user-facing error handling if required by UX guidelines
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  const handleCloseModal = () => {
    onClose?.();
  };

  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleCloseModal);
  }, [modalRef.current]);

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
        },
        {
          label: publish ? 'Publiceren' : 'Depubliceren',
          icon: publish ? (
            <VISUALS.PUBLISH className='ac-publish-depublish-icon' />
          ) : (
            <VISUALS.PUBLISH_OFF className='ac-publish-depublish-icon' />
          ),
          onClick: handleConfirm,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze {isSingular ? displayName : `${displayName}s`} wilt{' '}
        {publish ? 'publiceren' : 'depubliceren'}?
        {objects.map((obj) => (
          <div key={obj.id} className='utrecht-paragraph'>
            {obj['@self']?.name || obj.naam || obj.name || obj.id}
          </div>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderModal;
};

export default withStore(observer(ConGenericBeheerPublishDepublishModal));
