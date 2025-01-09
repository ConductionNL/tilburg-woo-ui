import React, { useState } from 'react';
import { VISUALS, LABELS, LABELS_DYNAMIC } from '@constants';
import {
  FormLabel,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { AcFlex } from '@atoms';

const AcSearchFilter = ({
  placeholder = 'Waar ben je naar op zoek?',
  onSearch,
  initialValue = '',
  label = 'Zoek in begrippen',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [resultCount, setResultCount] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setCurrentSearchTerm(searchTerm);
    const count = onSearch(searchTerm);
    setResultCount(count);
  };

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentSearchTerm('');
    setResultCount(null);
    onSearch('');
  };

  return (
    <div className='ac-search-filter'>
      <form onSubmit={handleSubmit}>
        <FormLabel htmlFor='ac-search-filter-input'>{label}</FormLabel>
        <AcFlex alignItems='center' spacing='xs'>
          <Textbox
            id='ac-search-filter-input'
            type='search'
            value={searchTerm}
            onChange={handleChange}
            placeholder={placeholder}
          />
          <PrimaryActionButton type='submit'>
            <VISUALS.SEARCH />
            <span className='sr-only'>Zoek</span>
          </PrimaryActionButton>
        </AcFlex>
      </form>

      {currentSearchTerm && (
        <div className='ac-search-filter__results'>
          Gezocht op: <strong>{currentSearchTerm}</strong> ({resultCount}{' '}
          {LABELS_DYNAMIC.RESULTS(resultCount).toLowerCase()})
          <br />
          <button onClick={clearSearch}>Wis zoekopdracht</button>
        </div>
      )}
    </div>
  );
};

export default AcSearchFilter;
