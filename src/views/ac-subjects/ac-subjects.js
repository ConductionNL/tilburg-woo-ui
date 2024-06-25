import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { TilburgSubjects } from '@components';

const AcSubjects = ({ store }) => {
  return (
    <>
      <TilburgSubjects />
    </>
  );
};

export default withStore(observer(AcSubjects));
