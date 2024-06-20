import React, { useEffect } from 'react';
import FocusLock from 'react-focus-lock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { TilburgFlex } from '@atoms';
import { LABELS, VISUALS } from '@constants';
import { TilburgModal, TilburgSearchCategories } from '@components';
import { withStore } from '@stores';
import {
  TilburgButton,
  TilburgCheckbox,
  TilburgLink,
  TilburgFormField,
  TilburgSelect,
} from '@molecules';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

const TilburgSearchFilters = ({ store: { documents } }) => {
  const overlayRef = React.useRef(null);
  const wrapperRef = React.useRef(null);

  const { all_categories, toggleMobileFilters, mobileFiltersOpen } = documents;

  const handleCloseFilters = () => {
    toggleMobileFilters();
  };

  React.useEffect(() => {
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

  React.useEffect(() => {
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
          <TilburgFlex column spacing='sm' className='tilburg-search-filters__date'>
            <TilburgSelect
              label='Publicatiedatum'
              defaultOption='Selecteer jaartallen'
              options={['2023', '2024']}
            />
            <TilburgFormField label='Van (begindatum)' />
            <TilburgFormField label='Tot (einddatum)' />
          </TilburgFlex>
          {all_categories?.length > 0 && (
            <TilburgFlex
              column
              spacing='xs'
              className='tilburg-search-filters__category'
            >
              <TilburgSearchCategories categories={all_categories} />
            </TilburgFlex>
          )}
          <TilburgFlex
            column
            spacing='xs'
            className='tilburg-search-filters__subjects'
          >
            <Heading level={4}>Onderwerpen</Heading>
            <TilburgCheckbox label='Campus Wijkevoort' />
            <TilburgCheckbox label='Evenementen in Tilburg' />
            <TilburgCheckbox label='Duurzaamheid' />
          </TilburgFlex>
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
            Bekijk 5.724 resultaten
          </TilburgButton>
        </TilburgFlex>
      </TilburgFlex>
    </FocusLock>
  );
};

export default withStore(observer(TilburgSearchFilters));
