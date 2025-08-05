// eslint-disable-next-line import/no-unresolved
import React, { useEffect, useRef } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';

import { VISUALS } from '@constants';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';

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

  const handleDelete = async () => {
    try {
      const results = await object.massDeleteObjects(objects);

      if (results.successful.length > 0) {
        onSuccess?.();
        modalRef?.current?.close();
      }
    } catch (err) {
      console.error('Error deleting objects:', err);
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

  const renderDeleteModal = (
    <AcModal
      ref={modalRef}
      id='generic-delete-modal'
      title={`${isSingular ? displayName : `${displayName}s`} verwijderen`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
        {
          label: 'verwijderen',
          icon: <VISUALS.TRASHCAN />,
          onClick: handleDelete,
        },
      ]}
      buttonPosition='end'
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        Weet je zeker dat je deze {isSingular ? displayName : `${displayName}s`} wilt
        verwijderen?
        {objects.map((object) => (
          <Paragraph key={object.id}>
            {object['@self']?.name || object.naam || object.name || object.id}
          </Paragraph>
        ))}
      </AcFlex>
    </AcModal>
  );

  return renderDeleteModal;
};

export default withStore(observer(ConGenericBeheerDeleteModal));
