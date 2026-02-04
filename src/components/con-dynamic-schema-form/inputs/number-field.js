// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { AcFormField } from '@molecules';

const NumberField = ({
  path,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  schema,
  integer = false,
  validation,
  labelStyle,
}) => {
  const inputProps = {};
  if (schema?.minimum != null)
    inputProps.min = schema.exclusiveMinimum ? undefined : schema.minimum;
  if (schema?.maximum != null)
    inputProps.max = schema.exclusiveMaximum ? undefined : schema.maximum;
  if (schema?.multipleOf != null) inputProps.step = schema.multipleOf;
  if (integer) inputProps.step = 1;

  const handleChange = (raw) => {
    const str = raw === '' ? '' : String(raw);
    // Allow empty, otherwise cast to number
    const next = str === '' ? '' : integer ? parseInt(str, 10) : parseFloat(str);
    onChange(Number.isNaN(next) ? str : next);
  };

  return (
    <AcFormField
      key={path}
      id={`dynamic-form-field-${path}`}
      label={label}
      type='text'
      inputType='number'
      onChange={handleChange}
      value={value ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      hasError={validation?.hasError}
      labelStyle={labelStyle}
      {...inputProps}
    />
  );
};

export default NumberField;
