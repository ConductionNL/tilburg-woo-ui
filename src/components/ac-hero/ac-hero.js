import clsx from 'clsx';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcContainer, AcSection } from '@atoms';
import { AcSearchBox } from '@components';
import { AcLink } from '@molecules';
import { useNavigate } from 'react-router';

const hostname = window.location.hostname;

const AcHero = () => {
  const _CLASSES = clsx('ac-hero');
  const navigate = useNavigate();

  const submitSearch = (query) => {
    if (!query) {
      navigate('/zoeken');
      return;
    }
    navigate(`/zoeken?_search=${query}`);
  };

  return (
    <AcSection
      className={_CLASSES}
      style={`background-image: url('${
        hostname === 'vng.opencatalogi.nl'
          ? 'https://vng.nl/sites/default/files/styles/16_9_xl/public/2023-12/dso.jpg?itok=PVFVJNmT'
          : '/home-hero-background.png'
      }');`}
    >
      <AcContainer>
        <AcCard blue padding='lg'>
          <AcSearchBox
            onSubmitCallback={submitSearch}
            page='home'
            label={LABELS.WHAT_ARE_YOU_LOOKING_FOR}
          />
          <AcLink href='/zoeken'>
            {LABELS.SEARCH_EXTENSIVE}
            <VISUALS.ARROW_RIGHT />
          </AcLink>
        </AcCard>
      </AcContainer>
    </AcSection>
  );
};

export default AcHero;
