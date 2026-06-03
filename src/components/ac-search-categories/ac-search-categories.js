import React, { useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { AcButton, AcCheckbox, AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcModal } from '@components';
import { AcFlex } from '@atoms';
import { withStore } from '@stores';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';

import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

const AcSearchCategories = ({ store: { publications } }) => {
  const modalRef = useRef(null);
  const handleOpenModal = () => modalRef?.current?.showModal();

  const { all_categories, category_checked, toggleSearchArrayValue } = publications;

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
          <strong>Raadsstuk</strong>
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
      <AcFlex justifyContent={'between'} alignItems={'center'}>
        <Heading level={4}>{LABELS.CATEGORIES}</Heading>
        {renderModal}
      </AcFlex>
      <AcButton
        onClick={handleOpenModal}
        icon={
          AcCheckIfSpecificHostname() ? (
            <VISUALS.QUESTION_MARK_VNG />
          ) : (
            <VISUALS.QUESTION_MARK />
          )
        }
        sr={LABELS.CATEGORIES_EXPLAIN}
      >
        <span>{LABELS.ABOUT_CATEGORIES}</span>
      </AcButton>
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
