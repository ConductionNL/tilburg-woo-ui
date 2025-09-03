import React, { useEffect, useState, useRef, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex } from '@atoms';
import { VISUALS } from '@constants';
import { ConFileDropZone } from '@views/ac-beheer/shared/components/import-modal/con-file-dropzone';
import ConTable from '@views/ac-beheer/shared/components/con-table';
import SpinLoader from '@src/components/con-spin-loader/con-spin-loader';
import ReactSelect from 'react-select';
import { Heading } from '@amsterdam/design-system-react';
import ConConfirmFileDeletionModal from '@views/ac-beheer/shared/components/con-object-upload-files/con-confirm-file-deletion-modal';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import ConPublishDepublishFileModal from '@views/ac-beheer/shared/components/con-object-upload-files/con-publish-depublish-file-modal';

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
const ConObjectUploadFiles = ({
  register,
  schema,
  id,
  allowedTags = [],
  onSuccess = () => {},
  store: { object },
}) => {
  useEffect(() => {
    // if you open the modal without a register or schema, throw an error
    if (!register || !schema || !id) {
      console.error('register, schema and id are required');
      throw new Error('register, schema and id are required');
    }
  }, [register, schema, id]);

  const [files, setFiles] = useState([]);
  const [onlineFiles, setOnlineFiles] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [labelOptions, setLabelOptions] = useState([createOption('Geen label')]);
  const [selectedLabels, setSelectedLabels] = useState([createOption('Geen label')]);
  const [showModal, setShowModal] = useState('');
  const [singleSelectedFile, setSingleSelectedFile] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const tableRef = useRef();

  const objectStore = object;

  const [deletingFiles, setDeletingFiles] = useState(new Set());
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const [publishingFiles, setPublishingFiles] = useState(new Set());
  const [depublishingFiles, setDepublishingFiles] = useState(new Set());

  const fetchOnlineFiles = async () => {
    try {
      await objectStore.fetchObjectFiles(register, schema, id, {
        _limit: 500,
        _page: 1,
      });
      const type = `${register}_${schema}`;
      const filesData = objectStore.getRelatedData(type, 'files');
      setOnlineFiles(filesData);
    } catch (error) {
      console.error(error);
    }
  };

  // Initialize label options from allowedTags (schema configuration)
  useEffect(() => {
    const base = [createOption('Geen label')];
    const allowed = Array.isArray(allowedTags) ? allowedTags : [];
    const opts = [
      ...base,
      ...allowed
        .map((value) => value?.value ?? value)
        .filter((v) => v && v !== 'Geen label')
        .map((value) => createOption(value)),
    ];
    setLabelOptions(opts);
    // Keep 'Geen label' as default selection
    setSelectedLabels([base[0]]);
  }, [allowedTags]);

  useEffect(() => {
    fetchOnlineFiles();
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
        await objectStore.deleteObjectFile(register, schema, id, file.title);
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
        await objectStore.publishObjectFile(register, schema, id, file.title);
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
        await objectStore.depublishObjectFile(register, schema, id, file.title);
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
      updateFileStatus(file, 'loading');

      // Add to uploading files set
      setUploadingFiles((prev) => new Set([...prev, file.id]));

      await objectStore.uploadObjectFile(
        register,
        schema,
        id,
        file,
        file.labels,
        file.share
      );

      // Show success state briefly before removing
      updateFileStatus(file, 'success');

      return {
        success: true,
        file: file,
      };
    } catch (err) {
      updateFileStatus(file, 'error');
      console.error(err);
      return {
        success: false,
        file: file,
      };
    } finally {
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

      setUploadLoading(true);
      Promise.allSettled(uniqueFiles.map((file) => uploadFile(file)))
        .then(async (results) => {
          await fetchOnlineFiles();

          // Only remove files that were successfully uploaded
          //
          // due to there being no common identifiers between local and online files, we can only use the fact that the request succeeded to know we can delete it
          // preferably we would check the ID or hash, but those are not the same for local and online files
          const successfulFileIds = results
            .filter(
              (result) => result.status === 'fulfilled' && result.value?.success
            )
            .map((result) => result.value.file.id);

          setFiles((prevFiles) =>
            prevFiles.filter((f) => !successfulFileIds.includes(f.id))
          );

          onSuccess?.();
        })
        .finally(() => {
          setUploadLoading(false);
        });
    }
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
      .filter((f) => ['pending', 'loading', 'error', 'success'].includes(f.status))
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
        <ReactSelect
          placeholder='Labels toevoegen of aanmaken'
          isMulti
          isClearable
          onChange={(newValue) => setSelectedLabels(newValue)}
          options={labelOptions.map((option) => ({
            ...option,
            isDisabled:
              option.value === 'Geen label' &&
              selectedLabels?.length &&
              selectedLabels[0].value !== 'Geen label',
          }))}
          value={selectedLabels}
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
                icon={<VISUALS.SPINNER />}
                onClick={refetchFiles}
                disabled={isLoading}
              >
                Vernieuwen
              </ConActionMenu.Button>

              <ConActionMenu.Divider />

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
