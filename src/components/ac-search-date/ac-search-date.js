import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex } from '@atoms';
import { AcFormField, AcButton } from '@molecules';
import { LABELS } from '@constants';
import { SecondaryActionButton } from '@utrecht/component-library-react';

const AcSearchDate = ({ store: { publications } }) => {
  const { setQueryDate, search_query } = publications;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize dates from URL params
  useEffect(() => {
    if (search_query?.published?.after) {
      setStartDate(
        new Date(search_query.published.after).toISOString().split('T')[0]
      );
    }
    if (search_query?.published?.before) {
      setEndDate(
        new Date(search_query.published.before).toISOString().split('T')[0]
      );
    }
  }, []);

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const applyDateFilter = () => {
    if (startDate) {
      setQueryDate('after', new Date(startDate).toISOString());
    } else {
      setQueryDate('after', null);
    }

    if (endDate) {
      setQueryDate('before', new Date(endDate).toISOString());
    } else {
      setQueryDate('before', null);
    }
  };

  return (
    <AcFlex column spacing='sm' className='ac-search-filters__date'>
      <AcFormField
        id='date_after'
        label='Datum vanaf (dd-mm-jjjj)'
        type='date'
        value={startDate}
        onChange={handleStartDateChange}
        max={endDate || undefined}
      />

      <AcFormField
        id='date_before'
        label='Datum tot en met (dd-mm-jjjj)'
        type='date'
        value={endDate}
        onChange={handleEndDateChange}
        min={startDate || undefined}
      />

      <SecondaryActionButton onClick={applyDateFilter}>
        {LABELS.SEARCH_DATE_FILTER}
      </SecondaryActionButton>
    </AcFlex>
  );
};

export default withStore(observer(AcSearchDate));
