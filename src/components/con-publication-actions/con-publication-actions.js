// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { VISUALS } from '@constants';
import { NAVIGATE_TO } from '@constants/routes.constants';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import { checkOrganizationPermissions, getDisabledActionTooltip } from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';

/**
 * Reusable Publication Actions Component
 * Shows action buttons for publications when user is authenticated
 * 
 * @param {Object} props
 * @param {Object} props.user - User store
 * @param {string} props.id - Publication ID
 * @param {string} props.schemaSlug - Schema slug for beheer navigation
 * @param {string} props.title - Publication title (for accessibility)
 * @param {boolean} props.published - Publication status
 * @param {Object} props.object - Full object data with @self property for organization checks
 * @param {string} props.triggerStyle - Style for trigger button ('buttonSlim', 'button', etc.)
 * @param {string} props.triggerSize - Size for trigger button
 * @param {boolean} props.showViewAction - Whether to show "Bekijken" action (default: true)
 * @param {boolean} props.showEditAction - Whether to show "Bewerken" action (default: true)
 * @param {boolean} props.showPublishActions - Whether to show publish/depublish actions (default: false)
 * @param {function} props.onPublish - Callback for publish action
 * @param {function} props.onDepublish - Callback for depublish action
 */
const ConPublicationActions = ({
  user,
  id,
  schemaSlug,
  // title,
  published,
  object,
  triggerStyle = 'buttonSlim',
  triggerSize,
  showViewAction = true,
  showEditAction = true,
  showPublishActions = false,
  onPublish,
  onDepublish,
  additionalActions = [], // Array of { label, onClick, icon } objects
}) => {
  // Don't render if user is not authenticated or no schema slug
  if (!user?.isAuthenticated || !schemaSlug) {
    return null;
  }

  // Check organization permissions for edit and publish actions
  const { canEdit, reason } = checkOrganizationPermissions(user, object);

  const beheerUrl = `/beheer/${schemaSlug}/${id}`;

  return (
    <ConActionMenu>
      <ConActionMenu.Trigger 
        icon={<VISUALS.ELLIPSIS />} 
        buttonType='secondary' 
        style={triggerStyle}
        size={triggerSize}
      >
        Acties
      </ConActionMenu.Trigger>
      <ConActionMenu.Menu position='right'>
        {showViewAction && (
          <ConActionMenu.Button
            icon={<VISUALS.EYE />}
            onClick={() => window.open(NAVIGATE_TO.PUBLICATION(id), '_blank')}
          >
            Bekijken
          </ConActionMenu.Button>
        )}
        
        {showEditAction && (
          <ConActionMenu.Button
            icon={<VISUALS.PENCIL />}
            onClick={canEdit ? () => window.open(beheerUrl, '_blank') : undefined}
            disabled={!canEdit}
            data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
            data-tooltip-content={!canEdit ? getDisabledActionTooltip('edit', reason) : undefined}
          >
            Bewerken
          </ConActionMenu.Button>
        )}
        
        {showPublishActions && !published && (
          <ConActionMenu.Button
            icon={<VISUALS.PUBLISH />}
            onClick={canEdit ? () => {
              if (onPublish) {
                onPublish(id);
              } else {
                // Default publish action - could open a modal or make an API call
              }
            } : undefined}
            disabled={!canEdit}
            data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
            data-tooltip-content={!canEdit ? getDisabledActionTooltip('publish', reason) : undefined}
          >
            Publiceren
          </ConActionMenu.Button>
        )}
        
        {showPublishActions && published && (
          <ConActionMenu.Button
            icon={<VISUALS.PUBLISH_OFF />}
            onClick={canEdit ? () => {
              if (onDepublish) {
                onDepublish(id);
              } else {
                // Default depublish action - could open a modal or make an API call
              }
            } : undefined}
            disabled={!canEdit}
            data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
            data-tooltip-content={!canEdit ? getDisabledActionTooltip('depublish', reason) : undefined}
          >
            Depubliceren
          </ConActionMenu.Button>
        )}

        {/* Additional actions (e.g., related schema actions) */}
        {additionalActions.map((action, index) => (
          <ConActionMenu.Button
            key={index}
            icon={action.icon || <VISUALS.PLUS />}
            onClick={action.onClick}
          >
            {action.label}
          </ConActionMenu.Button>
        ))}
      </ConActionMenu.Menu>
    </ConActionMenu>
  );
};

export default ConPublicationActions;
