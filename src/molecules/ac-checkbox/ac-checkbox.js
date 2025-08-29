import { useMemo } from 'react';
import {
  FormField,
  Paragraph,
  FormLabel,
  Checkbox,
} from '@utrecht/component-library-react/dist/css-module';

const AcCheckbox = ({ label, value, checked, onChange, className, id }) => {
  const memoizedId = useMemo(() => `${label}_${value}`, [label, value]);
  const _id = id || memoizedId;

  const onChangeHandler = (e) => {
    if (onChange instanceof Function) onChange(e.target.checked);
  };

  return (
    <FormField type='checkbox' className={className}>
      <Paragraph className='utrecht-form-field__label utrecht-form-field__label--checkbox'>
        <FormLabel type='checkbox' for={_id}>
          <Checkbox
            id={_id}
            className={`utrecht-form-field__input ${className || ''}`}
            checked={checked}
            name={label}
            value={value}
            onChange={onChangeHandler}
          />
          {label}
        </FormLabel>
      </Paragraph>
    </FormField>
  );
};

export default AcCheckbox;
