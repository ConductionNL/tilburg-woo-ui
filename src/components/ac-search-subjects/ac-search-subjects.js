import { observer } from 'mobx-react-lite';

import { AcCheckbox } from '@molecules';
import { LABELS } from '@constants';
import { withStore } from '@stores';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { useEffect } from 'react';

const AcSearchSubjects = ({ store: { documents } }) => {
  const { all_themes, fetchThemes, theme_checked, toggleSearchArrayValue } =
    documents;

  useEffect(() => {
    fetchThemes();
  }, []);

  return (
    <>
      <Heading level={4}>{LABELS.THEMES}</Heading>

      {all_themes.map((theme) => (
        <AcCheckbox
          key={theme.value}
          label={theme.title}
          value={theme.value}
          checked={theme_checked(theme.id)}
          onChange={() => toggleSearchArrayValue('themes', theme.id)}
        />
      ))}
    </>
  );
};

export default withStore(observer(AcSearchSubjects));
