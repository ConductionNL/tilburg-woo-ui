/**
 * Utility functions for checking organization-based permissions
 */

import { isUUID } from '@src/utilities/con-resolve-uuids-in-text';

/**
 * Resolves a UUID to a name from cache synchronously (read-only)
 * Does NOT trigger background fetches to prevent infinite loops during render
 * @param {string} uuid - The UUID to resolve
 * @param {Object} objectStore - The object store with names cache
 * @returns {string|null} - The resolved name or null if not in cache
 */
const resolveUUIDFromCache = (uuid, objectStore) => {
  if (!uuid || !objectStore?.namesCache || !isUUID(uuid)) return null;

  // Check if the name is in the cache (synchronous read-only check)
  const cached = objectStore.namesCache[uuid];
  if (cached) {
    const age = Date.now() - cached.timestamp;
    const maxAge = objectStore.namesCacheConfig?.maxAge || 600000; // 10 minutes default
    if (age < maxAge && cached.name) return cached.name;
  }

  //   objectStore.getNamesForSingleId?.(uuid).catch(() => {});
  // Don't trigger background fetches here - this is called during render
  // Background fetches should be triggered elsewhere (e.g., in useEffect)
  return null;
};

/**
 * Checks if a user can edit/publish an object based on organization matching
 * @param {Object} user - User store object
 * @param {Object} object - Object with @self property containing organization info
 * @param {Object} objectStore - Object store for resolving UUIDs to names (optional, will use global if not provided)
 * @returns {Object} - { canEdit: boolean, reason: string }
 */
export const checkOrganizationPermissions = (user, object, objectStore = null) => {
  // If objectStore not provided, try to get it from global
  objectStore = objectStore || window?.app?.store?.object;

  // If user is not authenticated, no permissions
  if (!user?.isAuthenticated) {
    return { canEdit: false, reason: 'Gebruiker is niet ingelogd' };
  }

  // Get user's active organization
  const userActiveOrg = user.activeOrganization;

  // Get object's organization from @self property
  const objectOrg =
    object?.['@self']?.organisation || object?.['@self']?.organization;

  // If no active organization for user, deny access
  if (!userActiveOrg) {
    return {
      canEdit: false,
      reason: 'Geen actieve organisatie gevonden voor gebruiker',
    };
  }

  // If no organization info on object, allow (backward compatibility)
  if (!objectOrg) {
    return { canEdit: true, reason: null };
  }

  // Prefer UUID over numeric database ID for external API comparisons
  const userOrgId = userActiveOrg.uuid || userActiveOrg.id;

  // Handle both object and string organization IDs
  const objectOrgId =
    typeof objectOrg === 'string' ? objectOrg : objectOrg?.id || objectOrg?.uuid;

  // Check if organization IDs match
  if (userOrgId && objectOrgId && userOrgId === objectOrgId) {
    return { canEdit: true, reason: null };
  }

  // Check if organization names match (fallback)
  const userOrgName = userActiveOrg.name || userActiveOrg.naam;
  const objectOrgName = objectOrg?.name || objectOrg?.naam;

  if (userOrgName && objectOrgName && userOrgName === objectOrgName) {
    return { canEdit: true, reason: null };
  }

  // Try to resolve UUIDs to names from cache for better error messages
  const resolvedObjectOrgName =
    objectOrgName || resolveUUIDFromCache(objectOrgId, objectStore);
  const resolvedUserOrgName =
    userOrgName || resolveUUIDFromCache(userOrgId, objectStore);

  // Organizations don't match - return permission denied with reason
  return {
    canEdit: false,
    reason: `Dit object behoort tot een andere organisatie (${
      resolvedObjectOrgName || objectOrgId || 'onbekend'
    }) dan uw actieve organisatie (${
      resolvedUserOrgName || userOrgId || 'onbekend'
    })`,
  };
};

/**
 * Gets tooltip message for disabled actions based on organization permissions
 * @param {string} action - The action being performed ('edit', 'publish', 'depublish', 'delete')
 * @param {string} reason - The reason from checkOrganizationPermissions
 * @returns {string} - Tooltip message
 */
export const getDisabledActionTooltip = (action, reason) => {
  const actionMap = {
    edit: 'bewerken',
    publish: 'publiceren',
    depublish: 'depubliceren',
    delete: 'verwijderen',
  };

  const actionText = actionMap[action] || action;
  return `U kunt dit object niet ${actionText}: ${reason}`;
};
