import React, { useCallback, useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader, ConDetailsActionsMenu } from '@components';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
// Removed direct modal imports; modals are now loaded via BeheerModalFactory for consistency
import { useRelatedCreateActions } from '@views/ac-beheer/core/hooks/use-related-create-actions';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import ConProductDetailsPageContent from '../ac-beheer/domains/ac-product/con-product-details-page-conten';
import { VISUALS } from '@src/constants';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';

/**
 * Product Details Page (simplified for fixed type)
 * - Fixed config for producten; no dynamic type switching
 * - Fetches object, schema and related data (uses/used/files)
 * - Renders Files tab and dynamic Uses/Used tabs
 * - Supports unique action menu items and edit/delete via external modals
 */
const AcPublicationProduct = ({
  store: { publications, object, user },
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
  const openDynamicCreate = useCallback(
    (targetType, preSelected, metadata = {}) => {
      // For publication pages, we'll navigate to the beheer page with modal open
      // TODO: Handle outgoing relationship metadata in beheer page URL params
      if (metadata.isOutgoing) {
        // handle outgoing relationship metadata
      }
      navigate(`/beheer/${targetType}?showCreateModal=true&productId=${id}`);
    },
    [navigate, id]
  );

  const { makeActionsForContext } = useRelatedCreateActions({
    object,
    user,
    schemaRef: data?.['@self']?.schema?.slug,
    currentType: data?.['@self']?.schema?.slug, // Use schema slug as current type
    openDynamicCreate,
    currentObject: data, // Pass current object for organization permission checks
    currentObjectRegister: 'voorzieningen', // Pass current object register (for publication pages)
    currentObjectSchema: data?.['@self']?.schema?.slug, // Pass current object schema
  });

  // Generate action menu items
  const [actionMenuItems, setActionMenuItems] = useState([]);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Open delete modal from actions menu
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Generate action menu items
  useEffect(() => {
    if (!get_single?.['@self']?.schema?.slug || !id) return;

    const items = makeActionsForContext(id).map(
      ({ key, label, onClick, schema, icon }) => ({
        key,
        label,
        onClick,
        schema,
        icon,
      })
    );

    setActionMenuItems(items);
  }, [data?.['@self']?.schema?.slug, id, makeActionsForContext]);

  return (
    <AcContainer margin='xl'>
      {loading.status && <AcLoader />}
      {!loading.status && !data && <Heading>Er is een fout opgetreden</Heading>}
      {!loading.status && data && (
        <>
          <AcFlex justifyContent='end'>
            <ConDetailsActionsMenu
              user={user}
              id={id}
              schemaSlug={data?.['@self']?.schema?.slug}
              title={data['@self']?.name || data.id}
              published={data?.['@self']?.published}
              object={data}
              showViewAction={false}
              showEditAction={true}
              showPublishActions={true}
              uniqueActions={[
                {
                  key: 'delete',
                  label: 'Verwijderen',
                  icon: VISUALS.TRASHCAN,
                  onClick: handleDelete,
                },
              ]}
              relatedActions={actionMenuItems}
              onEdit={() => {
                const schemaSlug = data?.['@self']?.schema?.slug;
                if (schemaSlug) {
                  const wizards = Object.values(DASHBOARD_WIZARDS);
                  const wizard = wizards.find((w) => w.schema === schemaSlug);

                  if (wizard) {
                    const baseUrl = getWizardUrl(wizard);
                    const url = new URL(baseUrl, window.location.origin);
                    url.searchParams.set('id', id);
                    navigate(url.pathname + url.search);
                    return;
                  }
                }
                // Fallback to beheer legacy edit page in new tab
                const beheerUrl = `/beheer/${schemaSlug}/${id}`;
                window.open(beheerUrl, '_blank');
              }}
            />
          </AcFlex>

          <ConProductDetailsPageContent
            loading={loading.status}
            data={data}
            userStore={user}
            id={id}
            actionMenuItems={actionMenuItems}
            handleDelete={handleDelete}
            canEdit={false}
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
