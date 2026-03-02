// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { AcFormField } from '@molecules';
import { smartSplit } from '@src/utilities';

const coerceItems = (items, subtype) => {
  if (!Array.isArray(items)) return items;
  switch (subtype) {
    case 'number':
      return items.map((v) => {
        const n = parseFloat(v);
        return Number.isNaN(n) ? v : n;
      });
    case 'integer':
      return items.map((v) => {
        const n = parseInt(v, 10);
        return Number.isNaN(n) ? v : n;
      });
    case 'boolean':
      return items.map((v) => String(v).trim().toLowerCase() === 'true');
    default:
      return items;
  }
};

const ArrayCommaListField = ({
  path,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  itemsType,
  labelStyle,
}) => {
  const textValue = Array.isArray(value) ? value.join(', ') : '';

  const handleChange = (raw) => {
    const list = smartSplit(raw || '') || [];
    onChange(coerceItems(list, itemsType));
  };

  return (
    <AcFormField
      key={path}
      id={`dynamic-form-field-${path}`}
      label={label}
      type='text'
      inputType='text'
      onChange={handleChange}
      value={textValue}
      placeholder={placeholder || 'waarde1, waarde2'}
      disabled={disabled}
      labelStyle={labelStyle}
    />
  );
};

export default ArrayCommaListField;
