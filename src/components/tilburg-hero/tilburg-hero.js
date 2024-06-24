import clsx from 'clsx';
import { LABELS, VISUALS } from '@constants';
import { TilburgCard, TilburgContainer, TilburgSection } from '@atoms';
import { TilburgSearchbox } from '@components';
import { TilburgLink } from '@molecules';
import { useNavigate } from 'react-router';

const TilburgHero = () => {
  const _CLASSES = clsx('tilburg-hero');
  const navigate = useNavigate();

  const submitSearch = (query) => {
    navigate(`/zoeken/${query}`);
  };

  return (
    <TilburgSection
      className={_CLASSES}
      style="background-image: url('/home-hero-background.png');"
    >
      <TilburgContainer>
        <TilburgCard blue padding='lg'>
          <TilburgSearchbox
            onSubmitCallback={submitSearch}
            page='home'
            label={LABELS.WHAT_ARE_YOU_LOOKING_FOR}
          />
          <TilburgLink href='/zoeken'>
            {LABELS.SEARCH_EXTENSIVE}
            <VISUALS.ARROW_RIGHT />
          </TilburgLink>
        </TilburgCard>
      </TilburgContainer>
    </TilburgSection>
  );
};

export default TilburgHero;
