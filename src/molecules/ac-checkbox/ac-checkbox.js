import { useMemo } from 'react';
import {
  FormField,
  Paragraph,
  FormLabel,
  Checkbox,
} from '@utrecht/component-library-react/dist/css-module';
import { BadgeCounter, StatusBadge } from '@utrecht/component-library-react';
import { AcFlex } from '@atoms';

const AcCheckbox = ({ label, value, checked, onChange, count }) => {
  const id = useMemo(() => `${label}_${value}`, [label, value]);

  return (
    <FormField type='checkbox'>
      <Paragraph className='utrecht-form-field__label utrecht-form-field__label--checkbox'>
        <AcFlex justifyContent='between' spacing='sm' alignItems='center'>
          <FormLabel type='checkbox' for={id}>
            <Checkbox
              id={id}
              className='utrecht-form-field__input'
              checked={checked}
              name={label}
              value={value}
              onChange={onChange}
            />
            {label}
          </FormLabel>
          {count !== null && count !== undefined && (
            <BadgeCounter>{count}</BadgeCounter>
          )}
        </AcFlex>
      </Paragraph>
    </FormField>
  );
};

export default AcCheckbox;
