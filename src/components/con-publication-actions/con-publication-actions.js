// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { VISUALS } from '@constants';
import { NAVIGATE_TO } from '@constants/routes.constants';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import {
  checkOrganizationPermissions,
  getDisabledActionTooltip,
} from '@utils/organization-permissions';
import { TOOLTIP_ID } from '@src/index.web';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@constants/wizards.constants';

/**
 * Attempts to open a wizard for a create action if available.
 * It infers the schema from `action.schema` or from a key formatted as `create-<schema>`.
 * If a wizard is found and opened, returns true. Otherwise returns false.
 * @param {Object} action - The action object containing schema and/or key
 * @returns {boolean} True if wizard was opened, false otherwise
 */
const attemptWizard = (action) => () => {
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
        window.open(url, '_blank');
        return true;
      }
    }
  }

  return false;
};

/**
 * Reusable Publication Actions Component
 * Shows action buttons for publications when user is authenticated
 *
 * @param {Object} props
 * @param {Object} props.user - User store
 * @param {string} props.id - Publication ID
 * @param {string} props.schemaSlug - Schema slug for beheer navigation
 * @param {string} props.title - Publication title (for accessibility)
 * @param {Object} props.object - Full object data with @self property for organization checks
 * @param {string} props.triggerStyle - Style for trigger button ('buttonSlim', 'button', etc.)
 * @param {string} props.triggerSize - Size for trigger button
 * @param {boolean} props.showViewAction - Whether to show "Bekijken" action (default: true)
 * @param {boolean} props.showEditAction - Whether to show "Bewerken" action (default: true)
 */
const ConPublicationActions = ({
  user,
  id,
  schemaSlug,
  // title,
  object,
  triggerStyle = 'buttonSlim',
  triggerSize,
  showViewAction = true,
  showEditAction = true,
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
            data-tooltip-content={
              !canEdit ? getDisabledActionTooltip('edit', reason) : undefined
            }
          >
            Bewerken
          </ConActionMenu.Button>
        )}

        {/* Additional actions (e.g., related schema create actions) */}
        {additionalActions.map((action, index) => {
          const handleClick = () => {
            const opened = attemptWizard(action);
            if (!opened) {
              action?.onClick?.();
            }
          };

          return (
            <ConActionMenu.Button
              key={index}
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

export default ConPublicationActions;
