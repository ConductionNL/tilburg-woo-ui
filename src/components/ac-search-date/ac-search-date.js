import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { withStore } from '@stores';
import { AcFlex } from '@atoms';
import { AcFormField } from '@molecules';
import { AcValidateDate } from '@utils';

const isValidDate = (date) => {
  const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/;
  return regex.test(date);
};

const AcSearchDate = ({ store: { documents } }) => {
  const { setQueryDate, search_query } = documents;
  const [errors, setErrors] = useState({ after: '', before: '' });

  const setDate = (key, value) => {
    if (!isValidDate(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [key]: 'Ongeldig formaat. Gebruik dd-mm-yyyy.',
      }));
      setQueryDate(key, null);
      return;
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [key]: '',
    }));

    setQueryDate(key, value);
  };

  const handleKeyDown = (key, event) => {
    if (event.key === 'Enter') {
      setDate(key, event.target.value);
    }
  };

  return (
    <AcFlex column spacing='sm' className='ac-search-filters__date'>
      <AcFormField
        id={'date_after'}
        className={errors.after ? 'error-field' : ''}
        defaultValue={search_query['publicationDate[after]']}
        label='Datum vanaf (dd-mm-yyyy)'
        placeholder='dd-mm-yyyy'
        onBlur={(value) => setDate('after', value)}
        onKeyDown={(event) => handleKeyDown('after', event)}
        hasError={!!errors.after}
      />
      {errors.after && <span className='error-message'>{errors.after}</span>}
      <AcFormField
        id={'date_before'}
        className={errors.after ? 'error-field' : ''}
        defaultValue={search_query['publicationDate[before]']}
        label='Datum tot en met (dd-mm-yyyy)'
        placeholder='dd-mm-yyyy'
        onBlur={(value) => setDate('before', value)}
        onKeyDown={(event) => handleKeyDown('before', event)}
        hasError={!!errors.before}
      />
      {errors.before && <span className='error-message'>{errors.before}</span>}
    </AcFlex>
  );
};

export default withStore(observer(AcSearchDate));
