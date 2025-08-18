import React from 'react';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';
import { VISUALS } from '@constants';

/**
 * Reusable Details Actions Menu Component
 * 
 * @param {Object} props
 * @param {Object} props.user - User store object
 * @param {string} props.id - Object ID
 * @param {string} props.schemaSlug - Schema slug for edit URL
 * @param {string} props.title - Object title
 * @param {boolean} props.published - Whether object is published
 * @param {string} props.triggerStyle - Style for trigger button ('button', 'buttonSlim')
 * @param {boolean} props.showViewAction - Whether to show "Bekijken" action
 * @param {boolean} props.showEditAction - Whether to show "Bewerken" action  
 * @param {boolean} props.showPublishActions - Whether to show publish/depublish actions
 * @param {Array} props.uniqueActions - Array of unique actions specific to this object type
 * @param {Array} props.relatedActions - Array of related schema "toevoegen" actions
 * @param {function} props.onPublish - Callback for publish action
 * @param {function} props.onDepublish - Callback for depublish action
 * @param {function} props.onEdit - Callback for edit action
 */
const ConDetailsActionsMenu = ({
  user,
  id,
  schemaSlug,
  title,
  published,
  triggerStyle = 'button',
  showViewAction = true,
  showEditAction = true,
  showPublishActions = true,
  uniqueActions = [],
  relatedActions = [],
  onPublish,
  onDepublish,
  onEdit,
}) => {
  // Don't render if user is not authenticated
  if (!user?.isAuthenticated) {
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
    } else {
      console.log('Publish action for:', id);
    }
  };

  const handleDepublish = () => {
    if (onDepublish) {
      onDepublish(id);
    } else {
      console.log('Depublish action for:', id);
    }
  };

  return (
    <ConActionMenu>
      <ConActionMenu.Trigger 
        icon={<VISUALS.ELLIPSIS />} 
        buttonType={triggerStyle === 'buttonSlim' ? 'secondary' : 'primary'}
        style={triggerStyle}
      >
        Acties
      </ConActionMenu.Trigger>

      <ConActionMenu.Menu position='right'>
        {/* Standard actions */}
        {showViewAction && (
          <ConActionMenu.Button
            icon={<VISUALS.EYE />}
            onClick={handleView}
          >
            Bekijken
          </ConActionMenu.Button>
        )}

        {showEditAction && (
          <ConActionMenu.Button
            icon={<VISUALS.PENCIL />}
            onClick={handleEdit}
          >
            Bewerken
          </ConActionMenu.Button>
        )}

        {/* Publish/Depublish actions */}
        {showPublishActions && !published && (
          <ConActionMenu.Button
            icon={<VISUALS.PUBLISH />}
            onClick={handlePublish}
          >
            Publiceren
          </ConActionMenu.Button>
        )}

        {showPublishActions && published && (
          <ConActionMenu.Button
            icon={<VISUALS.PUBLISH_OFF />}
            onClick={handleDepublish}
          >
            Depubliceren
          </ConActionMenu.Button>
        )}

        {/* Unique actions (type-specific) */}
        {uniqueActions.map((action) => (
          <ConActionMenu.Button
            key={action.key || action.label}
            icon={
              React.isValidElement(action.icon) ? (
                action.icon
              ) : action.icon ? (
                <action.icon />
              ) : null
            }
            onClick={() => {
              if (typeof action.onClick === 'function') {
                action.onClick();
              }
            }}
          >
            {action.label}
          </ConActionMenu.Button>
        ))}

        {/* Divider before related actions */}
        {relatedActions.length > 0 && <ConActionMenu.Divider />}

        {/* Related schema actions */}
        {relatedActions.map((action) => (
          <ConActionMenu.Button
            key={action.key || action.label}
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

export default ConDetailsActionsMenu;
