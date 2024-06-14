import { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Heading,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';

export const TilburgSearchbox = ({
  page,
  small,
  label,
  spacing,
  toggleMobileFilters,
  onSubmitCallback,
  onChangeCallback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const renderHeading = useMemo(() => {
    return label && <Heading level={2}>{label}</Heading>;
  }, [label]);

  const submitCallback = (e) => {
    e.preventDefault();

    if (!(onSubmitCallback instanceof Function)) {
      return;
    }

    onSubmitCallback(searchQuery);
  };

  const changeCallback = (e) => {
    setSearchQuery(e.target.value);
    // onChangeCallback(e.target.value);
  };

  const handleMobileFilters = () => {
    toggleMobileFilters();
  };

  const _CLASSES = clsx('tilburg-searchbox', page && `tilburg-searchbox--${page}`, {
    'tilburg-searchbox--small': small,
    'tilburg-searchbox--spacing': spacing,
  });

  return (
    <form className={_CLASSES} onSubmit={submitCallback}>
      {renderHeading}

      <div class='tilburg-searchbox__search'>
        <Textbox placeholder={LABELS.ENTER_QUERY} onChange={changeCallback} />
        <PrimaryActionButton type='submit'>
          <VISUALS.SEARCH />
          {LABELS.SEARCH}
        </PrimaryActionButton>
      </div>

      {page === 'search' && (
        <div class='tilburg-searchbox__actions'>
          <SecondaryActionButton
            id='filters-toggle'
            onClick={handleMobileFilters}
            aria-expanded='false'
            aria-haspopup='true'
            aria-controls='filters'
          >
            <VISUALS.FILTER />
            {LABELS.FILTER}
          </SecondaryActionButton>
        </div>
      )}
    </form>
  );
};

export default TilburgSearchbox;
