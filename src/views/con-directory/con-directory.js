import { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcLoader } from '@components';
import { AcContainer, AcSection } from '@atoms';
import ConTable from '@views/ac-beheer/con-table';
import { commongroundApiUrl } from '@config';

const ConDirectory = ({ store: { publications, themes } }) => {
  const { fetchPublications, is_loading, getSearchPageURL } = publications;
  const { fetchThemes, all_themes } = themes;
  const [directories, setDirectories] = useState([]);
  const [isLoadingDirectories, setIsLoadingDirectories] = useState(false);

  useEffect(() => {
    fetchThemes();
    fetchPublications();
  }, []);

  const fetchDirectories = async () => {
    setIsLoadingDirectories(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/directory`
      );
      const data = await response.json();
      setDirectories(data.results || []);
    } catch (error) {
      console.error('Error fetching directories:', error);
    } finally {
      setIsLoadingDirectories(false);
    }
  };

  useEffect(() => {
    fetchDirectories();
  }, []);

  if (is_loading || isLoadingDirectories) {
    return <AcLoader />;
  }

  // Define table headers - make sure these match the actual property names in your data
  const tableHeaders = [
    {
      id: 'title',
      label: 'Titel',
      key: 'title',
    },
    {
      id: 'status',
      label: 'Status',
      key: 'status',
      customContent: (row) => row.status || 'N/A',
    },
    {
      id: 'version',
      label: 'Versie',
      key: 'version',
    },
    {
      id: 'schemaCount',
      label: "Aantal schema's",
      key: 'schemaCount',
      customContent: (row) => row.schemas.length || 'N/A',
    },
  ];

  return (
    <AcSection spacing>
      <AcContainer>
        <ConTable
          data={directories}
          tableHeaders={tableHeaders}
          showSortButtons={true}
          truncateLines={2}
          loading={false}
        />
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(ConDirectory));
