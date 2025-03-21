import { observer } from 'mobx-react-lite';

import { AcCheckbox } from '@molecules';
import { LABELS } from '@constants';
import { withStore } from '@stores';

import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { useEffect, useMemo } from 'react';

const AcSearchThemes = ({ store: { publications, themes } }) => {
  const { theme_checked, toggleSearchArrayValue, themeFacets } = publications;
  const { all_themes, fetchThemes } = themes;

  const combinedThemes = useMemo(() => {
    return all_themes?.map((theme) => ({
      ...theme,
      count: themeFacets?.find((facet) => facet.id === theme.id)?.count,
    }));
  }, [all_themes, themeFacets]);

  useEffect(() => {
    fetchThemes();
  }, []);

  return (
    <>
      <Heading level={4}>{LABELS.THEMES_BUTTON}</Heading>
      {JSON.stringify(themeFacets)}

      {combinedThemes?.map((theme) => (
        <AcCheckbox
          key={theme.value}
          label={theme.title}
          value={theme.value}
          checked={theme_checked(theme.id)}
          count={themeFacets?.find((facet) => facet.id === theme.id)?.count || '0'}
          onChange={() => toggleSearchArrayValue('themes', theme.id)}
        />
      ))}
    </>
  );
};

export default withStore(observer(AcSearchThemes));
