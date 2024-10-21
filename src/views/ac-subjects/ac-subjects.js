import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcSubjects as AcSubjectsContainer, AcLoader } from '@components';

const AcSubjects = ({ store: { documents } }) => {
  const { fetchThemes, fetchDocuments, is_loading, all_themes } = documents;

  useEffect(() => {
    fetchThemes();
    fetchDocuments();
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
