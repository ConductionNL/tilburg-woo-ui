import React from 'react';
import {
  FormField,
  FormLabel,
  Heading,
  Paragraph,
  Select,
  SelectOption,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgButton, TilburgCheckbox, TilburgLink } from '@molecules';
import { TilburgFlex } from '@atoms';
import { VISUALS } from '@constants';
import { TilburgModal } from '@components';
import FocusTrap from 'focus-trap-react';

const TilburgSearchFilters = () => {
  const modalRef = React.useRef(null);
  const isMobile = window.innerWidth < 1024;

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

  return (
    <>
      {/*<FocusTrap active={!isMobile}>*/}
      <TilburgFlex column spacing='sm' className='tilburg-search-filters'>
        <TilburgFlex column spacing='sm' className='tilburg-search-filters__wrapper'>
          <Heading level={2}>Filters</Heading>
          <TilburgFlex column spacing='sm' className='tilburg-search-filters__date'>
            <FormField type='select'>
              <FormLabel>
                <Heading level={3}>Publicatiedatum</Heading>
              </FormLabel>
              <Select>
                <SelectOption>Selecteer jaartallen</SelectOption>
                <SelectOption>2024</SelectOption>
                <SelectOption>2023</SelectOption>
              </Select>
            </FormField>
            <FormField type='text'>
              <FormLabel>
                <Heading level={4}>Van (begindatum)</Heading>
              </FormLabel>
              <Textbox />
            </FormField>
            <FormField type='text'>
              <FormLabel>
                <Heading level={4}>Tot (einddatum)</Heading>
              </FormLabel>
              <Textbox />
            </FormField>
          </TilburgFlex>
          <TilburgFlex
            column
            spacing='xs'
            className='tilburg-search-filters__category'
          >
            <TilburgFlex justifyContent={'between'} alignItems={'center'}>
              <Heading level={4}>Categorieën</Heading>
              <TilburgButton onClick={handleOpenModal}>
                <span className='sr-only'>Bekijk de verschillende categorieën</span>
                <VISUALS.QUESTION_MARK />
              </TilburgButton>
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
                    Een formele overeenkomst of afspraak tussen twee of meer
                    partijen.
                  </Paragraph>
                  <Paragraph>
                    <strong>Bestuursstuk</strong>
                    <br />
                    Document dat wordt gebruikt om beleid of richtlijnen vast te
                    leggen.
                  </Paragraph>
                  <Paragraph>
                    <strong>Woo-verzoek</strong>
                    <br />
                    Verzoek bij een overheidsinstantie om informatie op te vragen.
                  </Paragraph>
                  <Paragraph>
                    <strong>Raadstuk</strong>
                    <br />
                    Onderwerpen die worden besproken tijdens een
                    gemeenteraadsvergadering.
                  </Paragraph>
                  <Paragraph>
                    <strong>Organisatiegegevens</strong>
                    <br />
                    <TilburgLink to='/contact'>Die kun je hier vinden</TilburgLink>
                  </Paragraph>
                </TilburgFlex>
              </TilburgModal>
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
      </TilburgFlex>
      {/*</FocusTrap>*/}
    </>
  );
};

export default TilburgSearchFilters;
