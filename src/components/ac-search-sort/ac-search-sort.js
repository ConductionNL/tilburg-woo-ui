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
import { AcFlex } from '@atoms';
import { LABELS } from '@constants';

const AcSearchSort = ({ store: { documents }, type }) => {
  const { setSort, resetSort, get_order } = documents;

  const label = useMemo(() => {
    if (type === 'alt') {
      return <Paragraph>{LABELS.SORT}</Paragraph>;
    }
    return <Heading level={4}>{LABELS.SORT}</Heading>;
  }, [type]);

  const onChangeCallback = (e) => {
    const value = e.target.value.split('|');
    if (value.length !== 2) {
      resetSort();
      return;
    }

    setSort(...value);
  };

  return (
    <FormField type='select' className='ac-search-sort'>
      <AcFlex
        column={type !== 'alt'}
        alignItems={type === 'alt' ? 'center' : null}
        spacing={type === 'alt' ? 'sm' : null}
      >
        <FormLabel for='sorting'>{label}</FormLabel>
        <Select id='sorting' onChange={onChangeCallback}>
          <SelectOption value='default'>Meest relevant</SelectOption>
          <SelectOption
            selected={get_order?.publicationDate === 'asc'}
            value='publicationDate|asc'
          >
            Datum - oud naar nieuw
          </SelectOption>
          <SelectOption
            selected={get_order?.publicationDate === 'desc'}
            value='publicationDate|desc'
          >
            Datum - nieuw naar oud
          </SelectOption>
        </Select>
      </AcFlex>
    </FormField>
  );
};

export default withStore(observer(AcSearchSort));
