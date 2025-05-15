import { useMemo, useState } from 'react';
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
import { Label } from '@amsterdam/design-system-react';
import { AcFlex } from '@atoms';

export const AcSearchBox = ({
  page,
  small,
  title,
  label,
  spacing,
  defaultValue,
  onSubmitCallback,
  store: { publications },
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { mobileFiltersOpen, toggleMobileFilters } = publications;

  const renderHeading = useMemo(() => {
    return title && <Heading level={1}>{title}</Heading>;
  }, [title]);

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
