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

const AcSearchCategories = ({ store: { publications } }) => {
  const modalRef = useRef(null);
  const handleOpenModal = () => modalRef?.current?.showModal();

  const { all_categories, category_checked, toggleSearchArrayValue } = publications;

  const renderModal = (
    <AcModal ref={modalRef} id='categories-modal' title='Categorieën'>
      <AcFlex column spacing='sm'>
        <Paragraph>
          <strong>Bestuursstukken</strong>
          <br />
          Dit zijn documenten die beslissingen en beleidsregels van de overheid
          bevatten. Ze geven inzicht in hoe de overheid werkt en welke keuzes er
          worden gemaakt.
        </Paragraph>
        <Paragraph>
          <strong>Raadsstukken</strong>
          <br />
          Dit zijn notulen en documenten van gemeenteraadsvergaderingen. Ze laten
          zien wat er besproken en besloten is tijdens deze vergaderingen.
        </Paragraph>
        <Paragraph>
          <strong>Jaarplannen en verslagen</strong>
          <br />
          Dit zijn overzichten van geplande activiteiten en behaalde resultaten van
          een jaar. Ze geven een beeld van de doelen en prestaties van de gemeente.
        </Paragraph>
        <Paragraph>
          <strong>Woo-dossiers</strong>
          <br />
          Dit zijn documenten die openbaar worden gemaakt op basis van Woo-verzoeken.
          Ze bevatten informatie die door inwoners is opgevraagd.
        </Paragraph>
        <Paragraph>
          <strong>Organisatie- en bereikbaarheidsinformatie</strong>
          <br />
          Dit is informatie over de structuur en contactgegevens van een organisatie.
          Het helpt inwoners om te weten wie ze kunnen benaderen voor bepaalde zaken.
        </Paragraph>
        <Paragraph>
          <strong>Convenanten</strong>
          <br />
          Dit zijn afspraken en overeenkomsten tussen verschillende partijen. Ze
          leggen vast wat de betrokken partijen van elkaar verwachten.
        </Paragraph>
        <Paragraph>
          <strong>Beschikkingen</strong>
          <br />
          Dit zijn officiële besluiten van de gemeente over specifieke zaken. Ze
          geven aan wat er wel of niet mag gebeuren in bepaalde situaties.
        </Paragraph>
        <Paragraph>
          <strong>Adviezen van adviescolleges</strong>
          <br />
          Dit zijn aanbevelingen van adviesorganen over beleidsvoorstellen. Ze helpen
          de gemeente om weloverwogen beslissingen te nemen.
        </Paragraph>
        <Paragraph>
          <strong>Klachten</strong>
          <br />
          Dit zijn documenten met klachten van inwoners en de afhandeling daarvan. Ze
          laten zien hoe de gemeente omgaat met ontevredenheid van inwoners.
        </Paragraph>
        <Paragraph>
          <strong>Onderzoeksrapporten</strong>
          <br />
          Dit zijn verslagen van onderzoeken uitgevoerd door of voor de gemeente. Ze
          bieden gedetailleerde informatie over specifieke onderwerpen.
        </Paragraph>
        <Paragraph>
          <strong>Wet- en regelgeving</strong>
          <br />
          Dit zijn ontwerpen en definitieve versies van wetten en regels. Ze bepalen
          wat er in een land of regio wel en niet mag.
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
      <AcButton onClick={handleOpenModal} sr={LABELS.CATEGORIES_EXPLAIN}>
        <VISUALS.QUESTION_MARK /> <span>{LABELS.ABOUT_CATEGORIES}</span>
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
