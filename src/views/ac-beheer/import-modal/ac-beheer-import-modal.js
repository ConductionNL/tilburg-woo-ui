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
import { Heading } from '@amsterdam/design-system-react';
import ConTable from '../con-table';

/**
 * modal to import data from a file
 * @param {object} register - register object
 * @param {object} schema - schema object
 * @param {boolean} showModal - boolean to check if the modal is shown
 * @param {function} onClose - function to call when the modal is closed
 * @returns {React.JSX.Element} - modal to import data from a file
 */
const AcBeheerImportModal = ({
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
        <Paragraph>Importeer bestanden naar {schema}</Paragraph>

        <ConFileDropZone
          files={files}
          onFilesChange={(e) => {
            console.log(e);
            setFiles(e);
          }}
        />

        {files.length > 0 && (
          <AcFlex column spacing='sm'>
            <ConTable
              tableHeaders={[
                {
                  id: 'filename',
                  label: 'Bestand',
                  key: 'name',
                  customContent: (row) => {
                    // truncate length of the filename to 20 characters
                    const truncatedName =
                      row.name.length > 20
                        ? row.name.slice(0, 20) + '...'
                        : row.name;
                    return truncatedName
                  },
                },
                {
                  id: 'type',
                  label: 'Type',
                  key: 'type',
                },
                {
                  id: 'size',
                  label: 'Grootte',
                  key: 'size',
                  customContent: (row) => {
                    // format the size to a single human readable format
                    const size = row.size;
                    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
                    let formattedSize = size;
                    let unitIndex = 0;

                    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
                      formattedSize /= 1024;
                      unitIndex++;
                    }
                    // return a div with the formatted size and the unit and no wrapping
                    return (
                      <div style={{ whiteSpace: 'nowrap' }}>{`${
                        Math.round(formattedSize * 100) / 100
                      } ${units[unitIndex]}`}</div>
                    );
                  },
                  doNotTruncate: true,
                },
                {
                  id: 'status',
                  label: 'Status',
                  key: 'status',
                },
              ]}
              data={files.map((file) => ({
                name: file.name,
                size: file.size,
                status: file.status,
                type: file.type,
              }))}
              truncateLines={1}
              removeOverflowWrapper
              showSortButtons
            />
          </AcFlex>
        )}
      </AcFlex>
    </AcModal>
  );

  return renderImportModal;
};

export default withStore(observer(AcBeheerImportModal));
