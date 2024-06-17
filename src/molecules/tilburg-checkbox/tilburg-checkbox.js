import {
  FormField,
  Paragraph,
  FormLabel,
  Checkbox,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgCheckbox = ({ label, value, checked, onChange }) => {
  return (
    <FormField type='checkbox'>
      <Paragraph className='utrecht-form-field__label utrecht-form-field__label--checkbox'>
        <FormLabel type='checkbox'>
          <Checkbox
            className='utrecht-form-field__input'
            checked={checked}
            name={label}
            value={value}
            onChange={onChange}
          />
          {label}
        </FormLabel>
      </Paragraph>
    </FormField>
  );
};

export default TilburgCheckbox;
