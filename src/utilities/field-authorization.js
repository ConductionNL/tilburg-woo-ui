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
  const userGroups = user?.userGroups || [];

  // Handle object authorization format: { read: [...], create: [...], update: [...] }
  if (typeof authorization !== 'object') {
    return true;
  }

  const readGroups = authorization.read || [];
  const updateGroups = authorization.update || [];
  const createGroups = authorization.create || [];

  // If no read groups are defined, check if user has update/create permissions
  // This allows fields with only update/create authorization to be visible to those who can edit them
  if (!Array.isArray(readGroups) || readGroups.length === 0) {
    // If there are update or create groups, check if user is in those groups
    if (Array.isArray(updateGroups) && updateGroups.length > 0) {
      // Normalize strings to handle potential whitespace/encoding issues
      const normalizedUserGroups = userGroups.map((g) => String(g).trim());
      const hasUpdatePermission = updateGroups.some((group) =>
        normalizedUserGroups.includes(String(group).trim())
      );

      return hasUpdatePermission;
    }
    if (Array.isArray(createGroups) && createGroups.length > 0) {
      // Normalize strings to handle potential whitespace/encoding issues
      const normalizedUserGroups = userGroups.map((g) => String(g).trim());
      const hasCreatePermission = createGroups.some((group) =>
        normalizedUserGroups.includes(String(group).trim())
      );
      return hasCreatePermission;
    }
    // No authorization groups defined at all, deny access
    return false;
  }

  // Check if user has any of the required read groups
  const normalizedUserGroups = userGroups.map((g) => String(g).trim());
  return readGroups.some((group) =>
    normalizedUserGroups.includes(String(group).trim())
  );
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
  const userGroups = user?.userGroups || [];

  // Handle object authorization format: { read: [...], create: [...], update: [...] }
  if (typeof authorization !== 'object') {
    return true;
  }

  const createGroups = authorization.create || [];
  const updateGroups = authorization.update || [];

  // Normalize user groups to handle potential whitespace/encoding issues
  const normalizedUserGroups = userGroups.map((g) => String(g).trim());

  // Determine which groups to check based on operation type
  const relevantGroups = isCreate ? createGroups : updateGroups;

  // If no relevant groups are defined, deny edit access
  if (!Array.isArray(relevantGroups) || relevantGroups.length === 0) {
    return false;
  }

  // Check if user has any of the required groups
  return relevantGroups.some((group) =>
    normalizedUserGroups.includes(String(group).trim())
  );
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
      reason: 'Geen leesrechten voor dit veld',
    };
  }

  // Check edit permission
  const canEdit = canEditField(user, fieldSchema, isCreate);

  return {
    visible: true,
    editable: canEdit,
    reason: canEdit
      ? null
      : `Geen ${isCreate ? 'aanmaak' : 'bewerk'}rechten voor dit veld`,
  };
};

/**
 * Filters form data to remove fields that the user doesn't have permission to update
 * @param {Object} formData - The form data to filter
 * @param {Object} schema - The full schema object with properties
 * @param {Object} user - User store object
 * @param {boolean} isCreate - Whether this is a create operation
 * @returns {Object} - Filtered form data with unauthorized fields removed
 */
export const filterFormDataByAuthorization = (
  formData,
  schema,
  user,
  isCreate = false
) => {
  if (!schema?.properties || !user) {
    return formData;
  }

  const filteredData = { ...formData };

  // Check each property in the schema
  Object.keys(schema.properties).forEach((fieldName) => {
    const fieldSchema = schema.properties[fieldName];

    // Check if user can edit this field
    const canEdit = canEditField(user, fieldSchema, isCreate);

    // If user cannot edit, remove the field from submit data
    if (!canEdit && fieldName in filteredData) {
      delete filteredData[fieldName];
    }
  });

  return filteredData;
};
