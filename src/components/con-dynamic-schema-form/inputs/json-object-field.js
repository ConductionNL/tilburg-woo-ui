// eslint-disable-next-line import/no-unresolved
import React from 'react';
import { AcFormField } from '@molecules';

/**
 * Renders an object-without-properties as a JSON textarea.
 * - Stringifies value
 * - Parses back to object on change (invalid JSON keeps last valid and emits raw string internally)
 */
const JsonObjectField = ({
  value,
  onChange,
  placeholder,
  label,
  path,
  disabled,
}) => {
  const [text, setText] = React.useState(() => {
    try {
      return value != null ? JSON.stringify(value, null, 2) : '';
    } catch (_) {
      return '';
    }
  });

  React.useEffect(() => {
    try {
      const v = value != null ? JSON.stringify(value, null, 2) : '';
      if (v !== text) setText(v);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch (_) {
      // Do not propagate until valid JSON
    }
  }, [value]);

  const handleChange = (newText) => {
    setText(newText);
    try {
      const parsed = newText ? JSON.parse(newText) : null;
      onChange(parsed);
    } catch (_) {
      // Do not propagate until valid JSON
    }
  };

  return (
    <AcFormField
      key={path}
      inputType='textarea'
      label={label}
      value={text}
      onChange={handleChange}
      placeholder={placeholder || '{ }'}
      disabled={disabled}
    />
  );
};

export default JsonObjectField;

