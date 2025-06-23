import React, { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex } from '@atoms';
import useNextcloudRequests from '@src/hooks/con-nextcloud-requests';
import { BASE_URL } from '../ac-beheer';
import { VISUALS } from '@constants';
import { ConFileDropZone } from '../import-modal/con-file-dropzone';
import ConTable from '../con-table';
import { AcButton } from '@src/molecules';
import SpinLoader from '@src/components/con-spin-loader/con-spin-loader';
import CreatableSelect from 'react-select/creatable';
import { Heading } from '@amsterdam/design-system-react';
import ConConfirmFileDeletionModal from './con-confirm-file-deletion-modal';
import ConActionMenu from '../con-action-menu';
import ConPublishDepublishFileModal from './con-publish-depublish-file-modal';

// create select funcs
const createOption = (label) => ({
  label,
  value: label,
});

/**
 * modal to upload files to an object
 * @param {object} register - register id/slug
 * @param {object} schema - schema id/slug
 * @param {string} id - id of the object
 * @param {function} onSuccess - function to call when adding files is successful
 * @returns {React.JSX.Element} - component to add files to a register/schema
 */
const ConObjectUploadFiles = ({ register, schema, id, onSuccess = () => {} }) => {
  useEffect(() => {
    // if you open the modal without a register or schema, throw an error
    if (!register || !schema || !id) {
      console.error('register, schema and id are required');
      throw new Error('register, schema and id are required');
    }
  }, [register, schema, id]);

  const [files, setFiles] = useState([]);
  const [onlineFiles, setOnlineFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [labelOptions, setLabelOptions] = useState([createOption('Geen label')]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [showModal, setShowModal] = useState('');
  const [singleSelectedFile, setSingleSelectedFile] = useState(null);

  const { makeMultipartUploadRequest, makeRequest } = useNextcloudRequests();

  const fetchOnlineFiles = async () => {
    try {
      setLoading(true);

      const response = await makeRequest(
        `${BASE_URL}/apps/openregister/api/objects/${register}/${schema}/${id}/files`
      );

      setOnlineFiles(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async () => {
    const response = await makeRequest(`${BASE_URL}/apps/openregister/api/tags`);

    setLabelOptions((prevLabelOptions) =>
      response.data
        .filter(
          (label) => !prevLabelOptions.some((option) => option.value === label.value)
        )
        .map(createOption)
    );
  };

  useEffect(() => {
    fetchOnlineFiles();
    fetchLabels();
  }, [register, schema, id]);

  const updateFileStatus = (file, status) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) => {
        if (f.id === file.id) {
          f.status = status;
        }
        return f;
      })
    );
  };

  const [error, setError] = useState(null);

  const uploadFile = async (file) => {
    try {
      setUploadLoading(true);
      updateFileStatus(file, 'loading');

      const response = await makeMultipartUploadRequest(
        `${BASE_URL}/apps/openregister/api/objects/${register}/${schema}/${id}/filesMultipart`,
        file,
        file.labels,
        file.share,
        null,
        null
      );

      // if upload is successful, remove the file from the list and refetch the online files
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== file.id));
      fetchOnlineFiles();

      onSuccess?.();
    } catch (err) {
      console.log('updating status to error');
      updateFileStatus(file, 'error');
      console.error(err);
      setError(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFilesChange = (newFiles) => {
    // Filter out files that are already uploading or have been uploaded
    const uniqueFiles = newFiles.filter((newFile) => {
      const isAlreadyUploading = files.some(
        (existingFile) =>
          existingFile.id === newFile.id || existingFile.hash === newFile.hash
      );
      return !isAlreadyUploading;
    });

    // Add more custom data to the new file
    uniqueFiles.map((file) => {
      file.isNew = true; // identifier to know that this file is local and not uploaded
      file.labels = selectedLabels.map((label) => label.value);
      file.share = false;
    });

    if (uniqueFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...uniqueFiles]);
      uniqueFiles.forEach((file) => {
        uploadFile(file);
      });
    }
  };

  const handleCreate = (inputValue) => {
    const newOption = createOption(inputValue);
    setLabelOptions((prev) => [...prev, newOption]);
    setSelectedLabels((prev) => [...prev, newOption]);
  };

  return (
    <>
      <AcFlex column spacing='sm'>
        <Heading level={4}>Bestanden toevoegen</Heading>
        <CreatableSelect
          placeholder='Labels toevoegen of aanmaken'
          isMulti
          isClearable
          onChange={(newValue) => setSelectedLabels(newValue)}
          onCreateOption={
            selectedLabels?.[0]?.value === 'Geen label' ? undefined : handleCreate
          }
          options={labelOptions.map((option) => ({
            ...option,
            isDisabled:
              option.value === 'Geen label' &&
              selectedLabels?.length &&
              selectedLabels[0].value !== 'Geen label',
          }))}
          value={selectedLabels}
          isValidNewOption={(inputValue) =>
            selectedLabels?.[0]?.value !== 'Geen label' &&
            inputValue !== '' &&
            inputValue.toLowerCase() !== 'geen label'
          }
        />

        <ConFileDropZone
          disabled={!selectedLabels.length || uploadLoading}
          files={files}
          onFilesChange={handleFilesChange}
          multiple
        />

        <ConTable
          loading={loading && files.length === 0}
          data={[
            ...files
              .filter((f) => ['pending', 'loading', 'error'].includes(f.status))
              .map((f) => ({
                // map the file since file objects in javascript are not serializable (god dammit javascript...)
                ...f,
                size: f.size || 0,
                title: f.name || '',
                type: f.type || '',
              })),
            ...(onlineFiles?.results || []),
          ]}
          tableHeaders={[
            {
              id: 'title',
              label: 'Titel',
              key: '',
              customContent: (row) => {
                return <div>{row.title || '-'}</div>;
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;
                const aTitle = a.title || '';
                const bTitle = b.title || '';
                return direction
                  ? aTitle.localeCompare(bTitle)
                  : bTitle.localeCompare(aTitle);
              },
            },
            {
              id: 'labels',
              label: 'Labels',
              key: 'labels',
            },
            // {
            //   id: 'type',
            //   label: 'Type',
            //   key: 'type',
            // },
            // {
            //   id: 'size',
            //   label: 'Grootte',
            //   key: 'size',
            //   customContent: (row) => {
            //     // format the size to a single human readable format
            //     const size = row.size;
            //     const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            //     let formattedSize = size;
            //     let unitIndex = 0;

            //     while (formattedSize >= 1024 && unitIndex < units.length - 1) {
            //       formattedSize /= 1024;
            //       unitIndex++;
            //     }
            //     // return a div with the formatted size and the unit and no wrapping
            //     return (
            //       <div style={{ whiteSpace: 'nowrap' }}>{`${
            //         Math.round(formattedSize * 100) / 100
            //       } ${units[unitIndex]}`}</div>
            //     );
            //   },
            //   doNotTruncate: true,
            // },
            {
              id: 'status',
              label: 'Status',
              key: 'status',
              customContent: (row) => {
                if (!row.isNew) return <VISUALS.CHECK style={{ color: 'green' }} />;
                switch (row.status) {
                  case 'pending':
                    return <SpinLoader />;
                  case 'loading':
                    return <SpinLoader />;
                  case 'success':
                    return <VISUALS.CHECK style={{ color: 'green' }} />;
                  case 'error':
                    return <VISUALS.CIRCLE_EXCLAMATION style={{ color: 'red' }} />;
                  default:
                    return <div>{row.status || '-'}</div>;
                }
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;

                // add support for sorting on online files
                if (!a.isNew) a.status = 'success';
                if (!b.isNew) b.status = 'success';

                const statusPriority = {
                  success: 1,
                  error: 2,
                  uploading: 3,
                  pending: 4,
                };

                const getPriority = (status) => statusPriority[status] || 5;

                const priorityA = getPriority(a.status);
                const priorityB = getPriority(b.status);

                return direction ? priorityA - priorityB : priorityB - priorityA;
              },
            },
            {
              id: 'published',
              label: 'Is gepubliceerd',
              key: '',
              customContent: (row) => {
                if (row.isNew) return null;
                if (row['@self']?.published) return <VISUALS.CHECK style={{ color: 'green' }} />;
                return <VISUALS.CIRCLE_EXCLAMATION style={{ color: 'orange' }} />;
              },
              sortComparator: (a, b, direction) => {
                if (direction === null) return 0;

                const publishedA = a['@self']?.published;
                const publishedB = b['@self']?.published;

                // Handle cases where one or both values are null
                if (publishedA === null && publishedB === null) return 0;
                if (publishedA === null) return direction ? 1 : -1;
                if (publishedB === null) return direction ? -1 : 1;

                // Compare dates
                const dateA = new Date(publishedA);
                const dateB = new Date(publishedB);

                return direction ? dateA - dateB : dateB - dateA;
              },
            },
            {
              id: 'actions',
              label: 'Acties',
              key: '',
              customContent: (row) => {
                if (row.isNew) return null;
                return (
                  <ConActionMenu>
                    <ConActionMenu.Trigger
                      icon={<VISUALS.ELLIPSIS />}
                      buttonType='secondary'
                      style='buttonSlim'
                    >
                      Acties
                    </ConActionMenu.Trigger>

                    <ConActionMenu.Menu position='right'>
                      {!row.published && (
                        <ConActionMenu.Button
                          icon={<VISUALS.PAPER_PLANE />}
                          onClick={() => {
                            setSingleSelectedFile(row);
                            setShowModal('publish');
                          }}
                        >
                          Publiceren
                        </ConActionMenu.Button>
                      )}

                      {row.published && (
                        <ConActionMenu.Button
                          icon={<VISUALS.PAPER_PLANE />}
                          onClick={() => {
                            setSingleSelectedFile(row);
                            setShowModal('depublish');
                          }}
                        >
                          Depubliceren
                        </ConActionMenu.Button>
                      )}

                      <ConActionMenu.Button
                        icon={<VISUALS.TRASHCAN />}
                        onClick={() => {
                          setSingleSelectedFile(row);
                          setShowModal('delete');
                        }}
                      >
                        Verwijderen
                      </ConActionMenu.Button>
                    </ConActionMenu.Menu>
                  </ConActionMenu>
                );
              },
            },
          ]}
          truncateLines={1}
          removeOverflowWrapper
          showSortButtons
        />
      </AcFlex>

      <ConConfirmFileDeletionModal
        register={register}
        schema={schema}
        id={id}
        file={singleSelectedFile}
        showModal={showModal === 'delete'}
        onClose={() => setShowModal('')}
        onSuccess={() => {
          fetchOnlineFiles();
          setSingleSelectedFile(null);
        }}
      />

      <ConPublishDepublishFileModal
        register={register}
        schema={schema}
        id={id}
        file={singleSelectedFile}
        showModal={showModal === 'publish' || showModal === 'depublish'}
        publish={showModal === 'publish'}
        onClose={() => setShowModal('')}
        onSuccess={() => {
          fetchOnlineFiles();
          setSingleSelectedFile(null);
        }}
      />
    </>
  );
};

export default withStore(observer(ConObjectUploadFiles));
