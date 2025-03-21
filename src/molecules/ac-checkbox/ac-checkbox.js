import { useMemo } from 'react';
import {
  FormField,
  Paragraph,
  FormLabel,
  Checkbox,
} from '@utrecht/component-library-react/dist/css-module';

const AcCheckbox = ({ label, value, checked, onChange }) => {
  const id = useMemo(() => `${label}_${value}`, [label, value]);

  const onChangeHandler = (e) => {
    if (onChange instanceof Function) onChange(e.target.checked);
  };

  return (
    <FormField type='checkbox'>
      <Paragraph className='utrecht-form-field__label utrecht-form-field__label--checkbox'>
        <FormLabel type='checkbox' for={id}>
          <Checkbox
            id={id}
            className='utrecht-form-field__input'
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
