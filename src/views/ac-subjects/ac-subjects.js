import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcSubjects as AcSubjectsContainer, AcLoader } from '@components';

const AcSubjects = ({ store: { publications, themes } }) => {
  const { fetchPublications, is_loading } = publications;
  const { fetchThemes, all_themes } = themes;

  useEffect(() => {
    fetchThemes();
    fetchPublications();
  }, []);

  if (is_loading) {
    return <AcLoader />;
  }

  return (
    <>
      <AcSubjectsContainer
        heading='Onderwerpen'
        paragraph='Hier vind je de onderwerpen die benoemd worden in de publicaties.'
        subjects={all_themes}
      />
    </>
  );
};

export default withStore(observer(AcSubjects));
