/**
 * Utility functions for checking field-level authorization based on user groups
 */

/**
 * Checks if a user can read a field based on authorization rules
 * @param {Object} user - User store object
 * @param {Object} fieldSchema - Field schema with authorization property
 * @returns {boolean} - Whether the user can read/view the field
 */
export const canReadField = (user, fieldSchema) => {
  // If user is not authenticated, no field access
  if (!user?.isAuthenticated) {
    return false;
  }

  // If no authorization is defined, allow read access
  const authorization = fieldSchema?.authorization;
  if (!authorization) {
    return true;
  }

  // Get user's groups
  const userGroups = user.userGroups || [];

  // Handle object authorization format: { read: [...], create: [...], update: [...] }
  if (typeof authorization !== 'object') {
    return true;
  }

  const readGroups = authorization.read || [];
  
  // If no read groups are defined, deny access
  if (!Array.isArray(readGroups) || readGroups.length === 0) {
    return false;
  }
  
  // Check if user has any of the required read groups
  return readGroups.some(group => userGroups.includes(group));
};

/**
 * Checks if a user can edit a field based on authorization rules
 * @param {Object} user - User store object
 * @param {Object} fieldSchema - Field schema with authorization property
 * @param {boolean} isCreate - Whether this is a create operation (true) or update (false)
 * @returns {boolean} - Whether the user can edit the field
 */
export const canEditField = (user, fieldSchema, isCreate = false) => {
  // If user is not authenticated, no edit access
  if (!user?.isAuthenticated) {
    return false;
  }

  // If no authorization is defined, allow edit access
  const authorization = fieldSchema?.authorization;
  if (!authorization) {
    return true;
  }

  // Get user's groups
  const userGroups = user.userGroups || [];

  // Handle object authorization format: { read: [...], create: [...], update: [...] }
  if (typeof authorization !== 'object') {
    return true;
  }

  const createGroups = authorization.create || [];
  const updateGroups = authorization.update || [];
  
  // Determine which groups to check based on operation type
  const relevantGroups = isCreate ? createGroups : updateGroups;
  
  // If no relevant groups are defined, deny edit access
  if (!Array.isArray(relevantGroups) || relevantGroups.length === 0) {
    return false;
  }
  
  // Check if user has any of the required groups
  return relevantGroups.some(group => userGroups.includes(group));
};

/**
 * Gets the visibility and editability state for a field
 * @param {Object} user - User store object
 * @param {Object} fieldSchema - Field schema with authorization property
 * @param {boolean} isCreate - Whether this is a create operation
 * @returns {Object} - { visible: boolean, editable: boolean, reason: string }
 */
export const getFieldAuthorizationState = (user, fieldSchema, isCreate = false) => {
  // Check read permission first
  const canRead = canReadField(user, fieldSchema);
  
  if (!canRead) {
    return {
      visible: false,
      editable: false,
      reason: 'Geen leesrechten voor dit veld'
    };
  }

  // Check edit permission
  const canEdit = canEditField(user, fieldSchema, isCreate);
  
  return {
    visible: true,
    editable: canEdit,
    reason: canEdit ? null : `Geen ${isCreate ? 'aanmaak' : 'bewerk'}rechten voor dit veld`
  };
};

/**
 * Debug function to log authorization details for a field
 * @param {Object} user - User store object
 * @param {Object} fieldSchema - Field schema with authorization property
 * @param {string} fieldName - Name of the field for logging
 * @param {boolean} isCreate - Whether this is a create operation
 */
export const debugFieldAuthorization = (user, fieldSchema, fieldName, isCreate = false) => {
  const userGroups = user?.userGroups || [];
  const authorization = fieldSchema?.authorization;
  
  console.log(`Field Authorization Debug - ${fieldName}:`, {
    userGroups,
    authorization,
    isCreate,
    canRead: canReadField(user, fieldSchema),
    canEdit: canEditField(user, fieldSchema, isCreate),
    authState: getFieldAuthorizationState(user, fieldSchema, isCreate)
  });
};
