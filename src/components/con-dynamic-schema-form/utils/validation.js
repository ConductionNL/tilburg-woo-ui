// Generic validation helpers for ConDynamicSchemaForm
import { validateByFormat } from './format-validators';

export const validateString = (value, schema, customErrorMessage) => {
  const errors = [];
  if (schema?.minLength != null && typeof value === 'string') {
    if ((value || '').length < schema.minLength)
      errors.push(`Minimaal ${schema.minLength} tekens`);
  }
  if (schema?.maxLength != null && typeof value === 'string') {
    if ((value || '').length > schema.maxLength)
      errors.push(customErrorMessage || `Maximaal ${schema.maxLength} tekens`);
  }
  if (schema?.pattern && typeof value === 'string') {
    try {
      const re = new RegExp(schema.pattern);
      if (value && !re.test(value))
        errors.push(customErrorMessage || 'Ongeldig patroon');
    } catch (_) {
      // ignore invalid pattern
    }
  }
  if (schema?.format && !validateByFormat(schema.format, value)) {
    errors.push(customErrorMessage || 'Ongeldige waarde voor format');
  }
  return errors;
};

export const validateNumber = (value, schema) => {
  const errors = [];
  if (value === undefined || value === null || value === '') return errors;
  const num = Number(value);
  if (Number.isNaN(num)) {
    errors.push('Moet een getal zijn');
    return errors;
  }
  if (schema?.minimum != null) {
    if (schema.exclusiveMinimum ? !(num > schema.minimum) : num < schema.minimum) {
      errors.push(
        `Minimaal ${schema.exclusiveMinimum ? '>' : '≥'} ${schema.minimum}`
      );
    }
  }
  if (schema?.maximum != null) {
    if (schema.exclusiveMaximum ? !(num < schema.maximum) : num > schema.maximum) {
      errors.push(
        `Maximaal ${schema.exclusiveMaximum ? '<' : '≤'} ${schema.maximum}`
      );
    }
  }
  if (schema?.multipleOf != null) {
    const multiple = Number(schema.multipleOf);
    if (
      multiple > 0 &&
      Math.abs(num / multiple - Math.round(num / multiple)) > 1e-9
    ) {
      errors.push(`Moet een veelvoud zijn van ${multiple}`);
    }
  }
  return errors;
};

export const validateArray = (value, schema) => {
  const errors = [];
  if (!Array.isArray(value)) return errors;
  if (schema?.minItems != null && value.length < schema.minItems) {
    errors.push(`Minimaal ${schema.minItems} items`);
  }
  if (schema?.maxItems != null && value.length > schema.maxItems) {
    errors.push(`Maximaal ${schema.maxItems} items`);
  }
  return errors;
};
