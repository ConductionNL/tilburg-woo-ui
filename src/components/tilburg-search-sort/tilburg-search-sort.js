import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

import {
  Heading,
  FormField,
  FormLabel,
  Select,
  SelectOption,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgFlex } from '@atoms';

const TilburgSearchSort = ({ store: { documents }, type }) => {
  const label = useMemo(() => {
    if (type === 'alt') {
      return <Paragraph>Sorteren</Paragraph>;
    }
    return <Heading level={4}>Sorteren</Heading>;
  }, [type]);

  return (
    <FormField type='select'>
      <TilburgFlex
        column={type !== 'alt'}
        alignItems={type === 'alt' ? 'center' : null}
        spacing={type === 'alt' ? 'sm' : null}
      >
        <FormLabel>{label}</FormLabel>
        <Select>
          <SelectOption value='relevance'>Meest relevant</SelectOption>
          <SelectOption value='publicatiedatum'>Datum - oud naar nieuw</SelectOption>
          <SelectOption value='publicatiedatum'>Datum - nieuw naar oud</SelectOption>
        </Select>
      </TilburgFlex>
    </FormField>
  );
};

export default withStore(observer(TilburgSearchSort));
