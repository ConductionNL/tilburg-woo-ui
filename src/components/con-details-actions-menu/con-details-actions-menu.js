import React, { useMemo } from 'react';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import { VISUALS } from '@constants';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@constants/wizards.constants';
import { useNavigate } from 'react-router';

/**
 * Reusable Details Actions Menu Component
 *
 * @param {Object} props
 * @param {Object} props.user - User store object
 * @param {string} props.id - Object ID
 * @param {string} props.schemaSlug - Schema slug for edit URL
 * @param {string} props.title - Object title
 * @param {boolean} props.published - Whether object is published
 * @param {Object} props.object - Full object data with @self property for organization checks
 * @param {string} props.triggerStyle - Style for trigger button ('button', 'buttonSlim')
 * @param {boolean} props.showViewAction - Whether to show "Bekijken" action
 * @param {boolean} props.showEditAction - Whether to show "Bewerken" action
 * @param {boolean} props.showPublishActions - Whether to show publish/depublish actions
 * @param {Array} props.uniqueActions - Array of unique actions specific to this object type (currently commented out)
 * @param {Array} props.relatedActions - Array of related schema "toevoegen" actions (currently commented out)
 * @param {function} props.onPublish - Callback for publish action
 * @param {function} props.onDepublish - Callback for depublish action
 * @param {function} props.onEdit - Callback for edit action
 * @param {function} props.onDelete - Callback for delete action
 */
const ConDetailsActionsMenu = ({
  user,
  id,
  schemaSlug,
  // title,
  published,
  object,
  triggerStyle = 'button',
  showViewAction = true,
  showEditAction = true,
  showPublishActions = true,
  uniqueActions = [],
  relatedActions = [],
  onPublish,
  onDepublish,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  // Check organization permissions for edit and publish actions
  // Memoize to prevent infinite loops when cache updates trigger re-renders
  // Only depend on the actual organization IDs, not the cache state
  const userOrgId = user?.activeOrganization?.uuid || user?.activeOrganization?.id;
  const objectOrgId =
    typeof (object?.['@self']?.organisation || object?.['@self']?.organization) ===
    'string'
      ? object?.['@self']?.organisation || object?.['@self']?.organization
      : object?.['@self']?.organisation?.id ||
        object?.['@self']?.organisation?.uuid ||
        object?.['@self']?.organization?.id ||
        object?.['@self']?.organization?.uuid;

  const { canEdit, reason } = useMemo(
    () => checkOrganizationPermissions(user, object),
    // Only recalculate when actual organization IDs change, not when cache updates
    [user?.isAuthenticated, userOrgId, objectOrgId]
  );

  // Don't render if user is not authenticated
  if (!user?.isAuthenticated) {
    return null;
  }

  // Check if there are any actions to show for non-owners
  // Non-owners can still see uniqueActions (dienst, gebruik, koppeling buttons)
  const hasUniqueActions = uniqueActions.length > 0;

  // Don't render if user can't edit AND there are no unique actions to show
  if (!canEdit && !hasUniqueActions) {
    return null;
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else if (schemaSlug) {
      // Default edit action - open beheer edit page
      const beheerUrl = `/beheer/${schemaSlug}/${id}`;
      window.open(beheerUrl, '_blank');
    }
  };

  const handleView = () => {
    // Default view action - open publication page
    const publicationUrl = `/publicatie/${id}`;
    window.open(publicationUrl, '_blank');
  };

  const handlePublish = () => {
    if (onPublish) {
      onPublish(id);
    }
  };

  const handleDepublish = () => {
    if (onDepublish) {
      onDepublish(id);
    }
  };

  /**
   * Attempts to open a wizard for a create action if available.
   * It infers the schema from `action.schema` or from a key formatted as `create-<schema>`.
   * If a wizard is found and opened, returns true. Otherwise returns false.
   * @param {Object} action - The action object containing schema and/or key
   * @returns {boolean} True if wizard was opened, false otherwise
   */
  const attemptWizard = (action) => {
    const schemaFromKey =
      typeof action?.key === 'string' && action.key.startsWith('create-')
        ? action.key.replace('create-', '')
        : null;
    const schema = action?.schema || schemaFromKey;

    if (schema) {
      const wizards = Object.values(DASHBOARD_WIZARDS);
      const wizard = wizards.find((w) => w.schema === schema);
      const areThereMultipleOptions =
        wizards.filter((w) => w.schema === schema).length > 1;
      if (wizard) {
        const url = getWizardUrl(wizard, !areThereMultipleOptions);
        if (url) {
          navigate(url);
          return true;
        }
      }
    }

    return false;
  };

  return (
    <ConActionMenu>
      <ConActionMenu.Trigger
        icon={canEdit ? <VISUALS.GEAR /> : <VISUALS.PLUS />}
        buttonType={triggerStyle === 'buttonSlim' ? 'secondary' : 'primary'}
        style={triggerStyle}
      ></ConActionMenu.Trigger>

      <ConActionMenu.Menu position='right'>
        {canEdit && (
          <>
            {/* Standard actions */}
            {showViewAction && (
              <ConActionMenu.Button icon={<VISUALS.EYE />} onClick={handleView}>
                Bekijken
              </ConActionMenu.Button>
            )}

            {showEditAction && (
              <ConActionMenu.Button
                icon={<VISUALS.PENCIL />}
                onClick={canEdit ? handleEdit : undefined}
                disabled={!canEdit}
                data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
                data-tooltip-content={
                  !canEdit ? getDisabledActionTooltip('edit', reason) : undefined
                }
              >
                Bewerken
              </ConActionMenu.Button>
            )}

            {/* Publish/Depublish actions */}
            {showPublishActions && !published && (
              <ConActionMenu.Button
                icon={<VISUALS.PUBLISH />}
                onClick={canEdit ? handlePublish : undefined}
                disabled={!canEdit}
                data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
                data-tooltip-content={
                  !canEdit ? getDisabledActionTooltip('publish', reason) : undefined
                }
              >
                Publiceren
              </ConActionMenu.Button>
            )}

            {showPublishActions && published && (
              <ConActionMenu.Button
                icon={<VISUALS.PUBLISH_OFF />}
                onClick={canEdit ? handleDepublish : undefined}
                disabled={!canEdit}
                data-tooltip-id={!canEdit ? TOOLTIP_ID : undefined}
                data-tooltip-content={
                  !canEdit
                    ? getDisabledActionTooltip('depublish', reason)
                    : undefined
                }
              >
                Depubliceren
              </ConActionMenu.Button>
            )}

            {/* Delete action */}
            {onDelete && (
              <ConActionMenu.Button icon={<VISUALS.TRASHCAN />} onClick={onDelete}>
                Verwijderen
              </ConActionMenu.Button>
            )}
          </>
        )}
        {/* Unique actions (type-specific) */}
        {/* Only show divider if there are unique actions AND there were standard actions above */}
        {uniqueActions.length > 0 && canEdit && <ConActionMenu.Divider />}
        {uniqueActions.map((action) => {
          // Handle grouped actions (sub-menus)
          if (action.type === 'group') {
            return (
              <ConActionMenu.SubMenu
                key={action.groupKey}
                label={action.label}
                icon={action.icon}
                position='left'
                disabled={
                  action.disabled ||
                  action.children.every((child) => child?.disabled ?? false)
                }
              >
                {action.children.map((childAction) => (
                  <ConActionMenu.Button
                    key={childAction.key}
                    onClick={childAction.onClick}
                    disabled={childAction.disabled}
                    data-tooltip-id={childAction.tooltipId}
                    data-tooltip-content={childAction.tooltipContent}
                  >
                    {childAction.label}
                  </ConActionMenu.Button>
                ))}
              </ConActionMenu.SubMenu>
            );
          }

          // Handle regular actions
          // Apply permission check for destructive actions (delete)
          const isDestructiveAction =
            action.key === 'delete' ||
            action.label?.toLowerCase().includes('verwijder');
          const actionDisabled = isDestructiveAction && !canEdit;

          // Hide delete actions if user cannot edit
          if (isDestructiveAction && !canEdit) {
            return null;
          }

          return (
            <ConActionMenu.Button
              key={action.key || action.label}
              icon={
                React.isValidElement(action.icon) ? (
                  action.icon
                ) : action.icon ? (
                  <action.icon />
                ) : null
              }
              onClick={
                actionDisabled
                  ? undefined
                  : () => {
                      if (typeof action.onClick === 'function') {
                        action.onClick();
                      }
                    }
              }
              disabled={actionDisabled}
              data-tooltip-id={actionDisabled ? TOOLTIP_ID : undefined}
              data-tooltip-content={
                actionDisabled
                  ? getDisabledActionTooltip('delete', reason)
                  : undefined
              }
            >
              {action.label}
            </ConActionMenu.Button>
          );
        })}

        {/* Divider before related actions - show if there are any standard actions above */}
        {relatedActions.length > 0 && canEdit && <ConActionMenu.Divider />}

        {/* Related schema actions - shown for both owners and non-owners */}
        {relatedActions.map((action) => {
          const handleClick = () => {
            // If the action has its own onClick handler, use it directly
            // This allows the hook to handle wizard navigation with custom params
            if (action?.onClick) {
              action.onClick();
              return;
            }

            // Fallback to attemptWizard for actions without onClick
            const opened = attemptWizard(action);
            if (opened) return;
          };

          return (
            <ConActionMenu.Button
              key={action.key || action.label}
              icon={action.icon || <VISUALS.PLUS />}
              onClick={handleClick}
            >
              {action.label}
            </ConActionMenu.Button>
          );
        })}
      </ConActionMenu.Menu>
    </ConActionMenu>
  );
};

export default ConDetailsActionsMenu;
