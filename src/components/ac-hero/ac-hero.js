import clsx from 'clsx';
import { LABELS, VISUALS } from '@constants';
import { AcCard, AcContainer, AcSection } from '@atoms';
import { AcSearchBox } from '@components';
import { AcLink } from '@molecules';
import { useNavigate } from 'react-router';

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
      style="background-image: url('/home-hero-background.png');"
    >
      <AcContainer>
        <AcCard blue padding='lg'>
          <AcSearchBox
            onSubmitCallback={submitSearch}
            page='home'
            label={LABELS.WHAT_ARE_YOU_LOOKING_FOR}
            title='Open Gemeente, de plek voor alle openbare documenten van Gemeente Tilburg'
          />
        </AcCard>
      </AcContainer>
    </AcSection>
  );
};

export default AcHero;
