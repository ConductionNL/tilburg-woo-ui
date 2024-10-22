import { useEffect, useRef } from 'react';

import { observer } from 'mobx-react-lite';
import FocusLock from 'react-focus-lock';
import clsx from 'clsx';

import { AcFlex } from '@atoms';
import { withStore } from '@stores';
import { AcButton } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcSearchCategories, AcSearchDate, AcSearchSubjects } from '@components';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import AcSearchSort from '@components/ac-search-sort/ac-search-sort';

const AcSearchFilters = ({ store: { documents } }) => {
  const overlayRef = useRef(null);
  const wrapperRef = useRef(null);

  const { all_categories, toggleMobileFilters, mobileFiltersOpen } = documents;

  const handleCloseFilters = () => {
    toggleMobileFilters();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      handleCloseFilters();
    };

    if (mobileFiltersOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const handleBackdropClick = (event) => {
      if (event.target === overlayRef.current) {
        handleCloseFilters();
      }
    };

    if (mobileFiltersOpen) {
      document.addEventListener('click', handleBackdropClick);
    }

    return () => {
      document.removeEventListener('click', handleBackdropClick);
    };
  }, [mobileFiltersOpen]);

  const _CLASSES = clsx('ac-search-filters', {
    open: mobileFiltersOpen,
  });

  return (
    <FocusLock disabled={!mobileFiltersOpen} returnFocus={true}>
      <AcFlex
        id='filters'
        column
        spacing='sm'
        className={_CLASSES}
        aria-labelledby='filters-toggle'
        ref={overlayRef}
      >
        <AcFlex
          column
          spacing='sm'
          className='ac-search-filters__wrapper'
          ref={wrapperRef}
        >
          <AcFlex
            justifyContent='between'
            alignItems='center'
            className='ac-search-filters__header'
          >
            <Heading level={2}>Filters</Heading>
            <AcButton animate onClick={handleCloseFilters}>
              <VISUALS.CLOSE />
              {LABELS.CLOSE}
            </AcButton>
          </AcFlex>
          {mobileFiltersOpen && (
            <AcFlex column spacing='xs' className='ac-search-filters__sort'>
              <AcSearchSort />
            </AcFlex>
          )}
          <AcSearchDate />
          {all_categories?.length > 0 && (
            <AcFlex column spacing='xs' className='ac-search-filters__category'>
              <AcSearchCategories categories={all_categories} />
            </AcFlex>
          )}
          <AcFlex column spacing='xs' className='ac-search-filters__subjects'>
            <AcSearchSubjects />
          </AcFlex>
        </AcFlex>
        {mobileFiltersOpen && (
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 1 }}
            aria-hidden='true'
            onClick={handleCloseFilters}
          />
        )}
        <AcFlex className='ac-search-filters__button'>
          <AcButton style='button' onClick={handleCloseFilters}>
            {LABELS.VIEW_RESULTS}
          </AcButton>
        </AcFlex>
      </AcFlex>
    </FocusLock>
  );
};

export default withStore(observer(AcSearchFilters));
