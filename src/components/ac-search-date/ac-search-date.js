import React from 'react';
import { observer } from 'mobx-react-lite';

import { withStore } from '@stores';
import { AcFlex } from '@atoms';
import { AcValidateDate } from '@utils';
import { AcFormField } from '@molecules';

const AcSearchDate = ({ store: { documents } }) => {
  const { setQueryDate, search_query } = documents;

  const setDate = (key, value) => {
    if (!AcValidateDate(value)) {
      setQueryDate(key, null);
      return;
    }
    setQueryDate(key, value);
  };

  return (
    <AcFlex column spacing='sm' className='ac-search-filters__date'>
      <AcFormField
        id={'date_after'}
        defaultValue={search_query['publicationDate[after]']}
        label='Datum vanaf (dd-mm-yyyy)'
        placeholder='dd-mm-yyyy'
        onBlur={(value) => setDate('after', value)}
      />
      <AcFormField
        id={'date_before'}
        defaultValue={search_query['publicationDate[before]']}
        label='Datum tot en met (dd-mm-yyyy)'
        placeholder='dd-mm-yyyy'
        onBlur={(value) => setDate('before', value)}
      />
    </AcFlex>
  );
};

export default withStore(observer(AcSearchDate));
