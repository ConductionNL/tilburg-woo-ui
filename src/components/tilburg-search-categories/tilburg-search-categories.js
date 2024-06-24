import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { TilburgButton, TilburgCheckbox, TilburgLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { TilburgModal } from '@components';
import { TilburgFlex } from '@atoms';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgSearchCategories = ({ store: { documents } }) => {
  const modalRef = useRef(null);
  const handleOpenModal = () => {
    modalRef?.current?.showModal();
  };

  const { all_categories, category_checked, toggleSearchArrayValue } = documents;

  const renderModal = (
    <TilburgModal ref={modalRef} id='categories-modal' title='Categorieën'>
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

  return (
    <>
      <TilburgFlex justifyContent={'between'} alignItems={'center'}>
        <Heading level={4}>{LABELS.CATEGORIES}</Heading>
        <TilburgButton onClick={handleOpenModal} sr={LABELS.CATEGORIES_EXPLAIN}>
          <VISUALS.QUESTION_MARK />
        </TilburgButton>
        {renderModal}
      </TilburgFlex>
      {all_categories?.map((category, index) => (
        <TilburgCheckbox
          key={index}
          label={category._id}
          count={category.count}
          value={category._id}
          checked={category_checked(category._id)}
          onChange={() => toggleSearchArrayValue('categorie', category._id)}
        />
      ))}
    </>
  );
};

export default withStore(observer(TilburgSearchCategories));
