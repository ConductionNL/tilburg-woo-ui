import React from 'react';
import FocusTrap from 'focus-trap-react';
import clsx from 'clsx';

import { TilburgFlex } from '@atoms';
import { LABELS, VISUALS } from '@constants';
import { TilburgModal } from '@components';
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

const TilburgSearchFilters = ({ mobileFiltersOpen, toggleMobileFilters }) => {
  const modalRef = React.useRef(null);

  const handleCloseFilters = () => {
    toggleMobileFilters();
  };

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
    <TilburgFlex
      id='filters'
      column
      spacing='sm'
      className={_CLASSES}
      aria-labbeledby='filters-toggle'
    >
      <TilburgFlex column spacing='sm' className='tilburg-search-filters__wrapper'>
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
          <TilburgCheckbox label='Convenant' />
          <TilburgCheckbox label='Bestuursstuk' />
          <TilburgCheckbox label='Woo-verzoek' />
          <TilburgCheckbox label='Raadstuk' />
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
      <TilburgFlex className='tilburg-search-filters__button'>
        <TilburgButton style='button' onClick={handleCloseFilters}>
          Bekijk 5.724 resultaten
        </TilburgButton>
      </TilburgFlex>
    </TilburgFlex>
  );
};

export default TilburgSearchFilters;
