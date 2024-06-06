import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import {
  TilburgAbout,
  TilburgHero,
  TilburgIntro,
  TilburgSubjects,
} from '@components';

const AcHome = ({ store }) => {
  return (
    <>
      <TilburgIntro />
      <TilburgHero />
      <TilburgSubjects />
      <TilburgAbout />
    </>
  );
};

export default withStore(observer(AcHome));
