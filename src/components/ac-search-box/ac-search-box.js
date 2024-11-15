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

export const AcSearchBox = ({
  page,
  small,
  label,
  spacing,
  defaultValue,
  onSubmitCallback,
  store: { publications },
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { mobileFiltersOpen, toggleMobileFilters } = publications;

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

  const _CLASSES = clsx('ac-search-box', page && `ac-search-box--${page}`, {
    'ac-search-box--small': small,
    'ac-search-box--spacing': spacing,
  });

  return (
    <>
      <form className={_CLASSES} onSubmit={submitCallback}>
        {renderHeading}

        <div className='ac-search-box__search'>
          <Textbox
            placeholder={LABELS.ENTER_QUERY}
            onChange={changeCallback}
            defaultValue={defaultValue}
          />
          <PrimaryActionButton type='submit'>
            <VISUALS.SEARCH />
            <span>{LABELS.SEARCH}</span>
          </PrimaryActionButton>
        </div>
      </form>

      {page === 'search' && (
        <div className='ac-search-box__actions'>
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

export default withStore(observer(AcSearchBox));
