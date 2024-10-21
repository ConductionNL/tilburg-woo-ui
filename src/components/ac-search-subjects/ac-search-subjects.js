import { observer } from 'mobx-react-lite';

import { AcCheckbox } from '@molecules';
import { LABELS } from '@constants';
import { withStore } from '@stores';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

const AcSearchSubjects = ({ store: { documents } }) => {
  return (
    <>
      <Heading level={4}>{LABELS.THEMES}</Heading>
      <AcCheckbox label='Campus Wijkevoort' value='Campus Wijkevoort' />
      <AcCheckbox label='Evenementen in Tilburg' value='Evenementen in Tilburg' />
      <AcCheckbox label='Duurzaamheid' value='Duurzaamheid' />
    </>
  );
};

export default withStore(observer(AcSearchSubjects));
