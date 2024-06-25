import { Heading, Paragraph, StatusBadge } from '@utrecht/component-library-react';
import { VISUALS } from '@constants';
import { TilburgCard, TilburgFlex } from '@atoms';
import { TilburgLink } from '@molecules';

const TilburgSearchResult = ({ skeleton, title, content, date, category, _id }) => {
  return (
    <TilburgCard searchResult padding='md' skeleton={skeleton}>
      <Heading level={3}>{title}</Heading>
      <Paragraph>{content}</Paragraph>
      <TilburgFlex justifyContent='between' className='meta'>
        <TilburgFlex alignItems='center' spacing='sm'>
          <StatusBadge>Wonen</StatusBadge>
          <VISUALS.ELLIPSE />
          <Paragraph small>{date}</Paragraph>
          <VISUALS.ELLIPSE />
          <Paragraph small>{category}</Paragraph>
        </TilburgFlex>
        <TilburgLink to={`/publicatie/${_id}`}>
          <span class='sr-only'>Lees meer over {title}</span>
          <VISUALS.ARROW_RIGHT />
        </TilburgLink>
      </TilburgFlex>
    </TilburgCard>
  );
};

export default TilburgSearchResult;
