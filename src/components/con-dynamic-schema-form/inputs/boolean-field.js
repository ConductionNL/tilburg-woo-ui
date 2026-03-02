import React from 'react';
import { AcCheckbox } from '@molecules';

const BooleanField = ({ id, label, value, onChange, disabled }) => {
  return (
    <AcCheckbox
      id={id}
      label={label}
      checked={!!value}
      onChange={(v) => onChange(!!v)}
      disabled={disabled}
    />
  );
};

export default BooleanField;

