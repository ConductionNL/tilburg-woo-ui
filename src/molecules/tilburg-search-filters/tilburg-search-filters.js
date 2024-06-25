import React, { useEffect, useRef } from 'react';

import { observer } from 'mobx-react-lite';
import FocusLock from 'react-focus-lock';
import clsx from 'clsx';

import { TilburgSearchCategories } from '@components';
import { LABELS, VISUALS } from '@constants';
import { TilburgFlex } from '@atoms';
import { withStore } from '@stores';
import { TilburgButton, TilburgFormField, TilburgSelect } from '@molecules';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { TilburgSearchDate } from '@components';

const TilburgSearchFilters = ({ store: { documents } }) => {
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

  const _CLASSES = clsx('tilburg-search-filters', {
    open: mobileFiltersOpen,
  });

  return (
    <FocusLock disabled={!mobileFiltersOpen} returnFocus={true}>
      <TilburgFlex
        id='filters'
        column
        spacing='sm'
        className={_CLASSES}
        aria-labbeledby='filters-toggle'
        ref={overlayRef}
      >
        <TilburgFlex
          column
          spacing='sm'
          className='tilburg-search-filters__wrapper'
          ref={wrapperRef}
        >
          <TilburgFlex
            justifyContent='between'
            alignItems='center'
            className='tilburg-search-filters__header'
          >
            <Heading level={2}>Filters</Heading>
            <TilburgButton animate onClick={handleCloseFilters}>
              <VISUALS.CLOSE />
              {LABELS.CLOSE}
            </TilburgButton>
          </TilburgFlex>
          <TilburgSearchDate />
          {all_categories?.length > 0 && (
            <TilburgFlex
              column
              spacing='xs'
              className='tilburg-search-filters__category'
            >
              <TilburgSearchCategories categories={all_categories} />
            </TilburgFlex>
          )}
        </TilburgFlex>
        {mobileFiltersOpen && (
          <div
            style='position: absolute; inset: 0; z-index: 1;'
            aria-hidden='true'
            onClick={handleCloseFilters}
          />
        )}
        <TilburgFlex className='tilburg-search-filters__button'>
          <TilburgButton style='button' onClick={handleCloseFilters}>
            Bekijk resultaten
          </TilburgButton>
        </TilburgFlex>
      </TilburgFlex>
    </FocusLock>
  );
};

export default withStore(observer(TilburgSearchFilters));
