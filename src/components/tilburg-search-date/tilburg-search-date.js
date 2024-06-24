import React from 'react';
import { observer } from 'mobx-react-lite';

import { withStore } from '@stores';
import { TilburgFlex } from '@atoms';
import { TilburgFormField, TilburgSelect } from '@molecules';
import { LABELS } from '@constants';
import { AcValidateDate } from '@utils';

const TilburgSearchDate = ({ store: { documents } }) => {
  const { setQueryYear, setQueryDate } = documents;

  const setDate = (key, value) => {
    if (!AcValidateDate(value)) {
      setQueryDate(key, null);
      return;
    }
    setQueryDate(key, value);
  };

  return (
    <TilburgFlex column spacing='sm' className='tilburg-search-filters__date'>
      <TilburgSelect
        label={LABELS.DATE_PUBLICATION}
        defaultOption={LABELS.SELECT_YEARS}
        options={['2023', '2024']}
        onChange={(e) => {
          setQueryYear(parseInt(e.target.value, 10));
        }}
      />
      <TilburgFormField
        label='Vanaf (dd-mm-yyyy)'
        onBlur={(value) => setDate('after', value)}
      />
      <TilburgFormField
        label='Tot en met (dd-mm-yyyy)'
        onBlur={(value) => setDate('before', value)}
      />
    </TilburgFlex>
  );
};

export default withStore(observer(TilburgSearchDate));
