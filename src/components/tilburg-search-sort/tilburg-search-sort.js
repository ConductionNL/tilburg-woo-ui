import { observer } from 'mobx-react-lite';

import { withStore } from '@stores';
import { TilburgFlex } from '@atoms';
import { AcValidateDate } from '@utils';

import {
  Heading,
  FormField,
  FormLabel,
  Select,
  SelectOption,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgSearchSort = ({ store: { documents } }) => {
  return (
    <FormField type='select'>
      <FormLabel>
        <Heading level={4}>Sorteren</Heading>
      </FormLabel>
      <Select>
        <SelectOption value='relevance'>Meest relevant</SelectOption>
        <SelectOption value='publicatiedatum'>Datum - oud naar nieuw</SelectOption>
        <SelectOption value='publicatiedatum'>Datum - nieuw naar oud</SelectOption>
      </Select>
    </FormField>
  );
};

export default withStore(observer(TilburgSearchSort));
