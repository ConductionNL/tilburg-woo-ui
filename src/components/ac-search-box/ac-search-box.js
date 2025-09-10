import { useMemo, useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  Heading,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
  FormLabel,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex } from '@atoms';

export const AcSearchBox = ({
  page,
  small,
  title,
  label,
  spacing,
  defaultValue,
  onSubmitCallback,
  disableAutoSearch = false,
  store: { publications },
}) => {
  const [searchQuery, setSearchQuery] = useState(defaultValue || '');
  const debounceTimer = useRef(null);
  const isFirstRender = useRef(true);

  const { mobileFiltersOpen, toggleMobileFilters } = publications;

  // Debounced search effect - triggers search 500ms after user stops typing
  // Only runs if disableAutoSearch is false
  useEffect(() => {
    // Skip if auto search is disabled
    if (disableAutoSearch) {
      return;
    }

    // Skip debounced search on initial render OR if searchQuery matches defaultValue
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Don't trigger search if the value is still the same as defaultValue
    // This prevents triggering search when component initializes with URL parameters
    if (searchQuery === (defaultValue || '')) {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (onSubmitCallback instanceof Function) {
        onSubmitCallback(searchQuery);
      }
    }, 750); // 750ms delay

    // Cleanup timeout on component unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, defaultValue, disableAutoSearch]); // Added disableAutoSearch to dependencies

  const renderHeading = useMemo(() => {
    return title && <Heading level={1}>{title}</Heading>;
  }, [title]);

  const submitCallback = (e) => {
    e.preventDefault();

    // Clear debounce timer since user clicked search button
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

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
        {renderHeading && (
          <div className='ac-search-box__title-wrapper'>{renderHeading}</div>
        )}

        <AcFlex column spacing='sm'>
          <FormLabel>{label}</FormLabel>
          <div className='ac-search-box__search'>
            <Textbox
              placeholder={LABELS.ENTER_QUERY}
              onChange={changeCallback}
              defaultValue={defaultValue}
            />
            <PrimaryActionButton type='submit'>
              <VISUALS.SEARCH className='ac-search-box__search-icon' />
              <span>{LABELS.SEARCH}</span>
            </PrimaryActionButton>
          </div>
        </AcFlex>
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
