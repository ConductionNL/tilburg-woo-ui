import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { withStore } from '@stores';
import { AcFlex } from '@atoms';
import { DateInput } from '@amsterdam/design-system-react';
import { Heading4 } from '@utrecht/component-library-react';

const isValidDate = (date) => {
  const testedDate = new Date(date);
  return testedDate instanceof Date && !isNaN(testedDate);
};

const AcSearchDate = ({ store: { publications } }) => {
  const { setQueryDate, search_query } = publications;
  const [errors, setErrors] = useState({ after: '', before: '' });

  const setDate = (key, value) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [key]: '',
    }));

    if (value !== '' && isValidDate(value)) {
      const dateParts = value.split('-');
      const dateObject = new Date(+dateParts[0], dateParts[1] - 1, +dateParts[2]);
      const ISODate = dateObject.toISOString();

      setQueryDate(key, ISODate);
    }

    if (value === '') {
      setQueryDate(key, null);
    }
  };

  const handleKeyDown = (key, event) => {
    if (event.key === 'Enter') {
      setDate(key, event.target.value);
    }
  };

  const defaultValue = (isoDate) => {
    if (!isoDate) return;
    const date = new Date(isoDate);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (day < 10) {
      day = '0' + day;
    }
    if (month < 10) {
      month = '0' + month;
    }
    return day + '-' + month + '-' + year;
  };

  return (
    <AcFlex column spacing='sm' className='ac-search-filters__date'>
      <div className='ac-search-filters__date-item-container'>
        <Heading4>Datum vanaf (dd-mm-yyyy)</Heading4>
        <DateInput
          id={'date_after'}
          invalid={!!errors.after}
          defaultValue={defaultValue(search_query?.published?.after)}
          onBlur={(event) => setDate('after', event.target.value)}
          onKeyDown={(event) => handleKeyDown('after', event)}
        />
      </div>
      <div className='ac-search-filters__date-item-container'>
        <Heading4>Datum tot en met (dd-mm-yyyy)</Heading4>
        <DateInput
          id={'date_before'}
          invalid={!!errors.before}
          defaultValue={defaultValue(search_query?.published?.before)}
          onBlur={(event) => setDate('before', event.target.value)}
          onKeyDown={(event) => handleKeyDown('before', event)}
        />
      </div>
    </AcFlex>
  );
};

export default withStore(observer(AcSearchDate));
