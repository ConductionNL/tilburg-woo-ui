import { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Heading,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';

export const TilburgSearchBox = ({
  page,
  small,
  label,
  spacing,
  defaultValue,
  onSubmitCallback,
  store: { documents },
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { mobileFiltersOpen, toggleMobileFilters } = documents;

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
    <>
      <form className={_CLASSES} onSubmit={submitCallback}>
        {renderHeading}

        <div className='tilburg-searchbox__search'>
          <Textbox
            placeholder={LABELS.ENTER_QUERY}
            onChange={changeCallback}
            defaultValue={defaultValue}
          />
          <PrimaryActionButton type='submit'>
            <VISUALS.SEARCH />
            {LABELS.SEARCH}
          </PrimaryActionButton>
        </div>
      </form>

      {page === 'search' && (
        <div className='tilburg-searchbox__actions'>
          <SecondaryActionButton
            id='filters-toggle'
            onClick={handleMobileFilters}
            aria-expanded={mobileFiltersOpen}
            aria-haspopup='true'
            aria-controls='filters'
          >
            <VISUALS.FILTER />
            {LABELS.FILTER}
          </SecondaryActionButton>
        </div>
      )}
    </>
  );
};

export default withStore(observer(TilburgSearchBox));
