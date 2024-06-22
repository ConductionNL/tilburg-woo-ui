import React from 'react';
import { observer } from 'mobx-react-lite';

import { withStore } from '@stores';
import { TilburgFlex } from '@atoms';
import { TilburgFormField, TilburgSelect } from '@molecules';

const TilburgSearchDate = ({ store: { documents } }) => {
  const { setQueryYear } = documents;

  return (
    <TilburgFlex column spacing='sm' className='tilburg-search-filters__date'>
      <TilburgSelect
        label='Publicatiedatum'
        defaultOption='Selecteer jaartallen'
        options={['2023', '2024']}
        onChange={(e) => {
          setQueryYear(parseInt(e.target.value, 10));
        }}
      />
      <TilburgFormField label='Van (begindatum)' />
      <TilburgFormField label='Tot (einddatum)' />
    </TilburgFlex>
  );
};

export default withStore(observer(TilburgSearchDate));
