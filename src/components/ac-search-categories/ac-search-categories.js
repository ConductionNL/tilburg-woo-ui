import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { AcButton, AcCheckbox, AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { withStore } from '@stores';

import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

const AcSearchCategories = ({ store: { documents } }) => {
  const modalRef = useRef(null);
  const handleOpenModal = () => modalRef?.current?.showModal();

  const { all_categories, category_checked, toggleSearchArrayValue } = documents;

  const renderModal = (
    <AcModal ref={modalRef} id='categories-modal' title='Categorieën'>
      <AcFlex column spacing='sm'>
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
          <AcLink to='/contact'>Die kun je hier vinden</AcLink>
        </Paragraph>
      </AcFlex>
    </AcModal>
  );

  return (
    <>
      {JSON.stringify(documents.search_query.categories)}
      <AcFlex justifyContent={'between'} alignItems={'center'}>
        <Heading level={4}>{LABELS.CATEGORIES}</Heading>
        <AcButton onClick={handleOpenModal} sr={LABELS.CATEGORIES_EXPLAIN}>
          <VISUALS.QUESTION_MARK />
        </AcButton>
        {renderModal}
      </AcFlex>
      {all_categories?.map((category, index) => (
        <AcCheckbox
          key={index}
          label={category._id}
          count={category.count}
          value={category._id}
          checked={category_checked(category._id)}
          onChange={() => toggleSearchArrayValue('category', category._id)}
        />
      ))}
    </>
  );
};

export default withStore(observer(AcSearchCategories));
