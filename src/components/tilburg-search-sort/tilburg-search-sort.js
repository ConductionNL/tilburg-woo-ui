import React from 'react';
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
import { Form } from 'react-router-dom';

const TilburgSearchSort = ({ store: { documents } }) => {
  const { setQueryDate } = documents;

  const setDate = (key, value) => {
    if (!AcValidateDate(value)) {
      setQueryDate(key, null);
      return;
    }
    setQueryDate(key, value);
  };

  return (
    <TilburgFlex className='tilburg-search-filters__sort'>
      <FormField>
        <FormLabel>
          <Heading level={4}>Sorteren</Heading>
        </FormLabel>
        <Select
          defaultValue={documents.search_query['_sort']}
          onChange={(e) => documents.setQuery('_sort', e.target.value)}
        >
          <SelectOption value='relevance'>Meest relevant</SelectOption>
          <SelectOption value='publicatiedatum'>Datum - oud naar nieuw</SelectOption>
          <SelectOption value='publicatiedatum'>Datum - nieuw naar oud</SelectOption>
        </Select>
      </FormField>
    </TilburgFlex>
  );
};

export default withStore(observer(TilburgSearchSort));
