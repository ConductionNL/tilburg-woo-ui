import React from 'react';
import { observer } from 'mobx-react-lite';

import { withStore } from '@stores';
import { TilburgFlex } from '@atoms';
import { AcValidateDate } from '@utils';
import { TilburgFormField } from '@molecules';

const TilburgSearchDate = ({ store: { documents } }) => {
  const { setQueryDate } = documents;

  const setDate = (key, value) => {
    if (!AcValidateDate(value)) {
      setQueryDate(key, null);
      return;
    }
    setQueryDate(key, value);
  };

  return (
    <TilburgFlex column spacing='sm' className='tilburg-search-filters__date'>
      <TilburgFormField
        id={'date_after'}
        defaultValue={documents.search_query['publicationDate[after]']}
        label='Datum vanaf (dd-mm-yyyy)'
        placeholder='dd-mm-yyyy'
        onBlur={(value) => setDate('after', value)}
      />
      <TilburgFormField
        id={'date_before'}
        defaultValue={documents.search_query['publicationDate[before]']}
        label='Datum tot en met (dd-mm-yyyy)'
        placeholder='dd-mm-yyyy'
        onBlur={(value) => setDate('before', value)}
      />
    </TilburgFlex>
  );
};

export default withStore(observer(TilburgSearchDate));
