import React, { useEffect, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { Paragraph } from '@utrecht/component-library-react/dist/css-module';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../ac-beheer';
import { VISUALS } from '@constants';
import { ConFileDropZone } from './con-file-dropzone';

/**
 * modal to import data from a file
 * @param {object} register - register object
 * @param {object} schema - schema object
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to import data from a file
 */
const AcImportModal = ({
  register,
  schema,
  showModal = false,
  onClose = () => {},
  onSuccess = () => {},
}) => {
  useEffect(() => {
    // if you open the modal without a register or schema, throw an error
    if ((!register || !schema) && showModal) {
      console.error('register and schema are required');
      throw new Error('register and schema are required');
    }
  }, [showModal]);

  const [files, setFiles] = useState([]);

  const modalRef = useRef(null);

  const { makeUploadRequest } = useNextcloudRequests();

  const handleOpenModal = () => modalRef?.current?.showModal();

  const endpoint = `openregister/api/objects/${register}/${schema}/import`;

  const [error, setError] = useState(null);
  const handleImport = async () => {
    try {
      const response = await makeUploadRequest(
        `${BASE_URL}/apps/${endpoint}`,
        file,
        null,
        {
          method: 'POST',
        }
      );

      onSuccess?.();
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  useEffect(() => {
    if (showModal) {
      handleOpenModal();
    }
  }, [showModal]);

  // run the onClose function when the modal is closed
  const handleCloseModal = () => {
    onClose?.();
  };

  // add event listener to the modal when it is closed
  useEffect(() => {
    modalRef?.current?.addEventListener('close', handleCloseModal);
  }, [modalRef.current]);

  const renderImportModal = (
    <AcModal
      ref={modalRef}
      id='import-modal'
      title={`Importeren`}
      buttons={[
        {
          label: 'annuleren',
          icon: <VISUALS.CLOSE />,
          onClick: () => modalRef?.current?.close(),
          buttonType: 'secondary',
        },
      ]}
      disableDefaultButton
    >
      <AcFlex column spacing='sm'>
        <Paragraph>
          Importeer een bestand met de data die je wilt importeren.
        </Paragraph>
        <ConFileDropZone
          files={files}
          onFilesChange={(e) => {
            console.log(e);
            setFiles(e);
          }}
        />
      </AcFlex>
    </AcModal>
  );

  return renderImportModal;
};

export default withStore(observer(AcImportModal));
