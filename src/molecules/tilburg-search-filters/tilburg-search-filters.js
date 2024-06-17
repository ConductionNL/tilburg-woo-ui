import React from 'react';
import FocusLock from 'react-focus-lock';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import { TilburgFlex } from '@atoms';
import { LABELS, VISUALS } from '@constants';
import { TilburgModal } from '@components';
import { withStore } from '@stores';
import {
  TilburgButton,
  TilburgCheckbox,
  TilburgLink,
  TilburgFormField,
  TilburgSelect,
} from '@molecules';

import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgSearchFilters = ({
  store: { documents },
  mobileFiltersOpen,
  toggleMobileFilters,
}) => {
  const modalRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const wrapperRef = React.useRef(null);

  const { all_categories, toggleSearchArrayValue, category_checked } = documents;

  const handleCloseFilters = () => {
    toggleMobileFilters();
  };

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseFilters();
      }
    };

    console.log(wrapperRef.current);

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
      } else {
        console.log(event.target, overlayRef.current);
      }
    };

    if (mobileFiltersOpen) {
      document.addEventListener('click', handleBackdropClick);
    }

    return () => {
      document.removeEventListener('click', handleBackdropClick);
    };
  }, [mobileFiltersOpen]);

  const handleOpenModal = () => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  const handleCloseModal = () => {
    if (modalRef.current) {
      modalRef.current.close();
    }
  };

  const renderModal = (
    <TilburgModal
      ref={modalRef}
      id='categories-modal'
      title='Categorieën'
      onClose={handleCloseModal}
    >
      <TilburgFlex column spacing='sm'>
        <Paragraph>
          <strong>Convenant</strong>
          <br />
          Een formele overeenkomst of afspraak tussen twee of meer partijen.
        </Paragraph>
        <Paragraph>
          <strong>Bestuursstuk</strong>
          <br />
          Document dat wordt gebruikt om beleid of richtlijnen vast te leggen.
        </Paragraph>
        <Paragraph>
          <strong>Woo-verzoek</strong>
          <br />
          Verzoek bij een overheidsinstantie om informatie op te vragen.
        </Paragraph>
        <Paragraph>
          <strong>Raadstuk</strong>
          <br />
          Onderwerpen die worden besproken tijdens een gemeenteraadsvergadering.
        </Paragraph>
        <Paragraph>
          <strong>Organisatiegegevens</strong>
          <br />
          <TilburgLink to='/contact'>Die kun je hier vinden</TilburgLink>
        </Paragraph>
      </TilburgFlex>
    </TilburgModal>
  );

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
          <TilburgFlex
            column
            spacing='xs'
            className='tilburg-search-filters__category'
          >
            <TilburgFlex justifyContent={'between'} alignItems={'center'}>
              <Heading level={4}>{LABELS.CATEGORIES}</Heading>
              <TilburgButton
                onClick={handleOpenModal}
                sr='Bekijk de verschillende categorieën'
              >
                <VISUALS.QUESTION_MARK />
              </TilburgButton>
              {renderModal}
            </TilburgFlex>
            {all_categories.map((category, index) => (
              <TilburgCheckbox
                key={index}
                label={category._id}
                count={category.count}
                value={category._id}
                checked={category_checked(category._id)}
                onChange={() => toggleSearchArrayValue('categorie', category._id)}
              />
            ))}
          </TilburgFlex>
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
        <div
          style='position: absolute; background: red; inset: 0; z-index: 1;'
          aria-hidden='true'
          onClick={handleCloseFilters}
        ></div>
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
