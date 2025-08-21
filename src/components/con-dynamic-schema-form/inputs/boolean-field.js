import React from 'react';
import { AcCheckbox } from '@molecules';

const BooleanField = ({ label, value, onChange, disabled }) => {
  return (
    <AcCheckbox
      label={label}
      checked={!!value}
      onChange={(v) => onChange(!!v)}
      disabled={disabled}
    />
  );
};

export default BooleanField;

