// Compute default value for a schema property when formData has no value
export const getDefaultValue = (schema) => {
  if (schema?.default !== undefined) return schema.default;
  // Lightweight sensible defaults
  switch (schema?.type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return undefined;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return schema?.properties ? {} : null;
    default:
      return undefined;
  }
};

