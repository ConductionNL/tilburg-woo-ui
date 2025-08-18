/**
 * Utility functions for checking organization-based permissions
 */

/**
 * Checks if a user can edit/publish an object based on organization matching
 * @param {Object} user - User store object
 * @param {Object} object - Object with @self property containing organization info
 * @returns {Object} - { canEdit: boolean, reason: string }
 */
export const checkOrganizationPermissions = (user, object) => {
  // If user is not authenticated, no permissions
  if (!user?.isAuthenticated) {
    return {
      canEdit: false,
      reason: 'Gebruiker is niet ingelogd'
    };
  }

  // Get user's active organization
  const userActiveOrg = user.activeOrganization;
  
  // Get object's organization from @self property
  const objectOrg = object?.['@self']?.organisation || object?.['@self']?.organization;

  // If no active organization for user, deny access
  if (!userActiveOrg) {
    return {
      canEdit: false,
      reason: 'Geen actieve organisatie gevonden voor gebruiker'
    };
  }

  // If no organization info on object, allow (backward compatibility)
  if (!objectOrg) {
    return {
      canEdit: true,
      reason: null
    };
  }

  // Check if organization IDs match
  // Prefer UUID over numeric database ID for external API comparisons
  const userOrgId = userActiveOrg.uuid || userActiveOrg.id;
  
  // Handle both object and string organization IDs
  let objectOrgId;
  if (typeof objectOrg === 'string') {
    // If objectOrg is a string UUID, use it directly
    objectOrgId = objectOrg;
  } else if (typeof objectOrg === 'object' && objectOrg !== null) {
    // If objectOrg is an object, extract id or uuid
    objectOrgId = objectOrg.id || objectOrg.uuid;
  }

  if (userOrgId && objectOrgId && userOrgId === objectOrgId) {
    return {
      canEdit: true,
      reason: null
    };
  }

  // Check if organization names match (fallback)
  const userOrgName = userActiveOrg.name || userActiveOrg.naam;
  
  // Only check name matching if objectOrg is an object
  let objectOrgName;
  if (typeof objectOrg === 'object' && objectOrg !== null) {
    objectOrgName = objectOrg.name || objectOrg.naam;
    
    if (userOrgName && objectOrgName && userOrgName === objectOrgName) {
      return {
        canEdit: true,
        reason: null
      };
    }
  }

  // Organizations don't match
  return {
    canEdit: false,
    reason: `Dit object behoort tot een andere organisatie (${objectOrgName || objectOrgId || 'onbekend'}) dan uw actieve organisatie (${userOrgName || userOrgId || 'onbekend'})`
  };
};

/**
 * Gets tooltip message for disabled actions based on organization permissions
 * @param {string} action - The action being performed ('edit', 'publish', 'depublish')
 * @param {string} reason - The reason from checkOrganizationPermissions
 * @returns {string} - Tooltip message
 */
export const getDisabledActionTooltip = (action, reason) => {
  const actionMap = {
    edit: 'bewerken',
    publish: 'publiceren', 
    depublish: 'depubliceren'
  };

  const actionText = actionMap[action] || action;
  return `U kunt dit object niet ${actionText}: ${reason}`;
};
