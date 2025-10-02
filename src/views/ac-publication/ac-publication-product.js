import React, { useCallback, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcContainer } from '@atoms';
import { AcLoader } from '@components';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import AcPublicationProductContent from './ac-publication-product-content';

/**
 * Product Details Page (simplified for fixed type)
 * - Fixed config for producten; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const AcPublicationProduct = ({
  store: { publications, user },
  //   schema,
}) => {
  const { id } = useParams();
  const {
    get_single,
    loading,
    // attachmentPagination,
    // setAttachmentsPage,
    // getFilteredAttachments,
    // attachments,
  } = publications;
  const navigate = useNavigate();

  const data = get_single || null;

  // Use the same related actions hook as beheer pages
  

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Generate action menu items
  

  return (
    <AcContainer margin='xl'>
      {loading.status && <AcLoader />}
      {!loading.status && !data && <Heading>Er is een fout opgetreden</Heading>}
      {!loading.status && data && (
        <>
          <AcPublicationProductContent
            loading={loading.status}
            data={data}
            userStore={user}
            id={id}
            canEdit={false}
            actionMenuProps={{
              handleDelete,
            }}
          />
        </>
      )}

      <AcGenericBeheerDeleteModal
        objects={data ? [data] : []}
        showModal={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => navigate('/zoeken')}
      />
    </AcContainer>
  );
};

export default withStore(observer(AcPublicationProduct));
