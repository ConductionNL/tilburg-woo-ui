import { observer } from 'mobx-react-lite';

import { TilburgCheckbox } from '@molecules';
import { LABELS } from '@constants';
import { withStore } from '@stores';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

const TilburgSearchSubjects = ({ store: { documents } }) => {
  return (
    <>
      <Heading level={4}>{LABELS.SUBJECTS}</Heading>
      <TilburgCheckbox label='Campus Wijkevoort' value='Campus Wijkevoort' />
      <TilburgCheckbox
        label='Evenementen in Tilburg'
        value='Evenementen in Tilburg'
      />
      <TilburgCheckbox label='Duurzaamheid' value='Duurzaamheid' />
    </>
  );
};

export default withStore(observer(TilburgSearchSubjects));
