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

  const getHeroImage = () => {
    switch (hostname) {
      case 'vng.opencatalogi.nl':
        return 'https://vng.nl/sites/default/files/styles/16_9_xl/public/2023-12/dso.jpg?itok=PVFVJNmT';
      case 'open-dimpact.accept.commonground.nu':
        return 'https://www.dimpact.nl/wp-content/uploads/2024/02/Headerafbeelding-over-ons.jpg.webp';
      case 'open-rotterdam.accept.commonground.nu':
        return 'https://www.rotterdam.nl/_next/image?url=https%3A%2F%2Fbackend-dvg.rotterdam.nl%2Fsites%2Fdefault%2Ffiles%2Fstyles%2Fhero_large%2Fpublic%2F2022-12%2F22500-Arnoud-Verhey_0.jpg%3Fh%3D940640a5%26itok%3Dl9pnN9Gq&w=1920&q=75';
      case 'localhost':
        return 'https://www.dimpact.nl/wp-content/uploads/2024/02/Headerafbeelding-over-ons.jpg.webp';
      default:
        return '/home-hero-background.png';
    }
  }

  return (
    <AcSection
      className={_CLASSES}
      style={`background-image: url('${getHeroImage()}');`}
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
