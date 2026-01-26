import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router-dom';
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

const AcSearchSort = ({ store: { publications }, type }) => {
  const { setSort, resetSort, get_order } = publications;
  const [searchParams, setSearchParams] = useSearchParams();

  const label = useMemo(() => {
    if (type === 'alt') {
      return <Paragraph>{LABELS.SORT}</Paragraph>;
    }
    return <Heading level={4}>{LABELS.SORT}</Heading>;
  }, [type]);

  const onChangeCallback = (e) => {
    const value = e.target.value.split('|');
    const params = new URLSearchParams(searchParams);

    if (value.length !== 2) {
      resetSort();
      // Remove all _order parameters from URL
      params.delete('_order[_published]');
      params.delete('_order[_name]');
      setSearchParams(params);
      return;
    }

    const [key, order] = value;
    setSort(key, order);

    // Remove any existing _order parameters before setting the new one
    params.delete('_order[_published]');
    params.delete('_order[_name]');

    // Update URL with new _order parameter
    // Metadata properties use _property format (e.g., _name, _published)
    params.set(`_order[_${key}]`, order);
    params.set('_page', '1'); // Reset to first page when sorting changes
    setSearchParams(params);
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
          <SelectOption selected={!get_order || Object.keys(get_order).length === 0} value='default'>
            Meest relevant
          </SelectOption>
          <SelectOption
            selected={get_order?._published === 'asc'}
            value='published|asc'
          >
            Datum - oud naar nieuw
          </SelectOption>
          <SelectOption
            selected={get_order?._published === 'desc'}
            value='published|desc'
          >
            Datum - nieuw naar oud
          </SelectOption>
          <SelectOption selected={get_order?._name === 'asc'} value='name|asc'>
            Naam - A naar Z
          </SelectOption>
          <SelectOption selected={get_order?._name === 'desc'} value='name|desc'>
            Naam - Z naar A
          </SelectOption>
        </Select>
      </AcFlex>
    </FormField>
  );
};

export default withStore(observer(AcSearchSort));
