import { useMemo } from 'react';
import clsx from 'clsx';
import {
  Heading,
  Textbox,
  PrimaryActionButton,
  SecondaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { LABELS, VISUALS } from '@constants';

export const TilburgSearchbox = ({
  homepage,
  searchpage,
  small,
  label,
  spacing,
  mobileFiltersOpen,
  toggleMobileFilters,
}) => {
  const _CLASSES = clsx('tilburg-searchbox', {
    'tilburg-searchbox--home': homepage,
    'tilburg-searchbox--search': searchpage,
    'tilburg-searchbox--small': small,
    'tilburg-searchbox--spacing': spacing,
  });

  const renderHeading = useMemo(() => {
    return label && <Heading level={2}>{label}</Heading>;
  }, [label]);

  const submitCallback = (e) => {
    console.log(e);
    e.preventDefault();
  };

  const handleMobileFilters = () => {
    console.log('handleMobileFilters');
    toggleMobileFilters();
    console.log(mobileFiltersOpen);
  };

  return (
    <form className={_CLASSES} onSubmit={submitCallback}>
      {renderHeading}

      <div class='tilburg-searchbox__search'>
        <Textbox placeholder={LABELS.ENTER_QUERY} />
        <PrimaryActionButton type='submit'>
          <VISUALS.SEARCH />
          {LABELS.SEARCH}
        </PrimaryActionButton>
      </div>

      {searchpage && (
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
