import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  const [selectedRows, setSelectedRows] = useState([]);
  const tableRef = useRef();

  const { makeMultipartUploadRequest, makeRequest } = useNextcloudRequests();

  const [deletingFiles, setDeletingFiles] = useState(new Set());
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const [publishingFiles, setPublishingFiles] = useState(new Set());
  const [depublishingFiles, setDepublishingFiles] = useState(new Set());

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

  const handleDeleteMultiple = async () => {
    if (selectedRows.length === 0) return;

    // Filter out files that are still uploading (isNew files)
    const filesToDelete = selectedRows.filter((file) => !file.isNew);

    if (filesToDelete.length === 0) {
      console.warn(
        'No files available for deletion (all selected files are still uploading)'
      );
      return;
    }

    try {
      // Track which files are being deleted
      const fileIds = filesToDelete.map((file) => file.title);
      setDeletingFiles(new Set(fileIds));

      // Delete files one by one using the same pattern as the existing delete function
      for (const file of filesToDelete) {
        const endpoint = `openregister/api/objects/${register}/${schema}/${id}/files/${file.title}`;

        const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
          method: 'DELETE',
        });

        if (response.status !== 200) {
          throw new Error(
            `Failed to delete file ${file.title}: ${response.statusText}`
          );
        }
      }

      // Reset selection and refresh files
      tableRef.current?.resetSelectedRows();
      fetchOnlineFiles();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting files:', error);
    } finally {
      setDeletingFiles(new Set());
    }
  };

  const handlePublishMultiple = async () => {
    if (selectedRows.length === 0) return;

    // Filter out files that are still uploading (isNew files) and only get unpublished files
    const filesToPublish = selectedRows.filter(
      (file) => !file.isNew && !file.published
    );

    if (filesToPublish.length === 0) {
      console.warn(
        'No files available for publishing (all selected files are either uploading or already published)'
      );
      return;
    }

    try {
      // Track which files are being published
      const fileIds = filesToPublish.map((file) => file.title);
      setPublishingFiles(new Set(fileIds));

      // Publish files one by one using the same pattern as the existing publish function
      for (const file of filesToPublish) {
        const endpoint = `openregister/api/objects/${register}/${schema}/${id}/files/${file.title}/publish`;

        const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
          method: 'POST',
        });

        if (response.status !== 200) {
          throw new Error(
            `Failed to publish file ${file.title}: ${response.statusText}`
          );
        }
      }

      // Reset selection and refresh files
      tableRef.current?.resetSelectedRows();
      fetchOnlineFiles();
      onSuccess?.();
    } catch (error) {
      console.error('Error publishing files:', error);
    } finally {
      setPublishingFiles(new Set());
    }
  };

  const handleDepublishMultiple = async () => {
    if (selectedRows.length === 0) return;

    // Filter out files that are still uploading (isNew files) and only get published files
    const filesToDepublish = selectedRows.filter(
      (file) => !file.isNew && file.published
    );

    if (filesToDepublish.length === 0) {
      console.warn(
        'No files available for depublishing (all selected files are either uploading or not published)'
      );
      return;
    }

    try {
      // Track which files are being depublished
      const fileIds = filesToDepublish.map((file) => file.title);
      setDepublishingFiles(new Set(fileIds));

      // Depublish files one by one using the same pattern as the existing depublish function
      for (const file of filesToDepublish) {
        const endpoint = `openregister/api/objects/${register}/${schema}/${id}/files/${file.title}/depublish`;

        const response = await makeRequest(`${BASE_URL}/apps/${endpoint}`, null, {
          method: 'POST',
        });

        if (response.status !== 200) {
          throw new Error(
            `Failed to depublish file ${file.title}: ${response.statusText}`
          );
        }
      }

      // Reset selection and refresh files
      tableRef.current?.resetSelectedRows();
      fetchOnlineFiles();
      onSuccess?.();
    } catch (error) {
      console.error('Error depublishing files:', error);
    } finally {
      setDepublishingFiles(new Set());
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploadLoading(true);
      updateFileStatus(file, 'loading');

      // Add to uploading files set
      setUploadingFiles((prev) => new Set([...prev, file.id]));

      const response = await makeMultipartUploadRequest(
        `${BASE_URL}/apps/openregister/api/objects/${register}/${schema}/${id}/filesMultipart`,
        file,
        file.labels,
        file.share,
        null,
        null
      );

      // Show success state briefly before removing
      updateFileStatus(file, 'success');
      // setTimeout(() => {
      //   // if upload is successful, remove the file from the list and refetch the online files
      //   setFiles((prevFiles) => prevFiles.filter((f) => f.id !== file.id));
      //   fetchOnlineFiles();
      // }, 1000); // Show checkmark for 1 second

      onSuccess?.();
    } catch (err) {
      console.log('updating status to error');
      updateFileStatus(file, 'error');
      console.error(err);
      setError(err);
    } finally {
      setUploadLoading(false);
      // Remove from uploading files set
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
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

  // Helper functions to calculate counts for action buttons
  const getPublishableFilesCount = () => {
    return selectedRows.filter((file) => !file.isNew && !file.published).length;
  };

  const getDepublishableFilesCount = () => {
    return selectedRows.filter((file) => !file.isNew && file.published).length;
  };

  const getDeletableFilesCount = () => {
    return selectedRows.filter((file) => !file.isNew).length;
  };

  // Helper function to get plural form
  const getPluralForm = (count) => {
    return count > 1 ? 'en' : '';
  };

  // Memoize the table data to prevent unnecessary re-renders
  const tableData = useMemo(() => {
    const localFiles = files
      .filter((f) => ['pending', 'loading', 'error'].includes(f.status))
      .map((f) => ({
        // map the file since file objects in javascript are not serializable (god dammit javascript...)
        ...f,
        size: f.size || 0,
        title: f.name || '',
        type: f.type || '',
      }));

    const onlineFilesData = onlineFiles?.results || [];

    return [...localFiles, ...onlineFilesData];
  }, [files, onlineFiles]);

  // Update the title column to show loading states
  const getTitleContent = (row) => {
    const isUploading = uploadingFiles.has(row.id);
    const isDeleting = deletingFiles.has(row.title);
    const isPublishing = publishingFiles.has(row.title);
    const isDepublishing = depublishingFiles.has(row.title);
    const isSuccess = row.status === 'success';
    const isError = row.status === 'error';

    return (
      <div className='ac-beheer-organisaties-name-container'>
        <div className='ac-beheer-organisaties-name-container__icon'>
          {isUploading && <SpinLoader />}
          {isDeleting && <SpinLoader />}
          {isPublishing && <SpinLoader />}
          {isDepublishing && <SpinLoader />}
          {isSuccess && <VISUALS.CHECK style={{ color: 'green' }} />}
          {isError && <VISUALS.CIRCLE_EXCLAMATION style={{ color: 'red' }} />}
          {!isUploading &&
            !isDeleting &&
            !isPublishing &&
            !isDepublishing &&
            !isSuccess &&
            !isError &&
            !row.isNew &&
            (row.published ? (
              <VISUALS.CIRCLE_CHECK className='ac-beheer-publish-icon__check' />
            ) : (
              <VISUALS.CIRCLE_EXCLAMATION className='ac-beheer-publish-icon__exclamation' />
            ))}
        </div>
        <div className='ac-beheer-organisaties-name-container__name'>
          {row.title || '-'}
        </div>
      </div>
    );
  };

  // Update the actions column to disable actions for files being processed
  const getActionsContent = (row) => {
    if (
      row.isNew ||
      deletingFiles.has(row.title) ||
      publishingFiles.has(row.title) ||
      depublishingFiles.has(row.title)
    )
      return null;

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
              icon={<VISUALS.PUBLISH />}
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
              icon={<VISUALS.PUBLISH_OFF />}
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
  };

  // Update the table headers to remove status column and use new title content
  const tableHeaders = [
    {
      id: 'title',
      label: 'Titel',
      key: '',
      customContent: getTitleContent,
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
    {
      id: 'actions',
      label: 'Acties',
      key: '',
      customContent: getActionsContent,
    },
  ];

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

        <AcFlex justifyContent='end'>
          <ConActionMenu>
            <ConActionMenu.Trigger
              icon={<VISUALS.ELLIPSIS />}
              buttonType='primary'
              style='buttonSlim'
              disabled={selectedRows.length === 0}
            >
              Acties {selectedRows.length > 0 && `(${selectedRows.length})`}
            </ConActionMenu.Trigger>

            <ConActionMenu.Menu position='right'>
              <ConActionMenu.Button
                icon={<VISUALS.TRASHCAN />}
                onClick={handleDeleteMultiple}
                disabled={getDeletableFilesCount() === 0}
              >
                Verwijder {getDeletableFilesCount()} bestand
                {getPluralForm(getDeletableFilesCount())}
              </ConActionMenu.Button>

              <ConActionMenu.Button
                icon={<VISUALS.PUBLISH />}
                onClick={handlePublishMultiple}
                disabled={getPublishableFilesCount() === 0}
              >
                Publiceer {getPublishableFilesCount()} bestand
                {getPluralForm(getPublishableFilesCount())}
              </ConActionMenu.Button>

              <ConActionMenu.Button
                icon={<VISUALS.PUBLISH_OFF />}
                onClick={handleDepublishMultiple}
                disabled={getDepublishableFilesCount() === 0}
              >
                Depubliceer {getDepublishableFilesCount()} bestand
                {getPluralForm(getDepublishableFilesCount())}
              </ConActionMenu.Button>
            </ConActionMenu.Menu>
          </ConActionMenu>
        </AcFlex>

        <ConTable
          ref={tableRef}
          loading={false}
          data={tableData}
          tableHeaders={tableHeaders}
          renderSelectRowButtons={true}
          getSelectedRows={setSelectedRows}
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
