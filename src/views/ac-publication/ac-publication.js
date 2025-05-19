import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { AcLoader } from '@components';
import { withStore } from '@stores';

import AcPublicationWooVerzoek from '@views/ac-publication/ac-publication-woo-verzoek';
import AcPublicationSoftwarecatalogus from '@views/ac-publication/ac-publication-softwarecatalogus';
import AcPublicationDefault from '@views/ac-publication/ac-publication-default';
import AcPublicationFormulier from './ac-publication-formulier';

const AcPublication = observer(({ store: { publications } }) => {
  const { id } = useParams();
  const {
    fetchPublication,
    resetPublication,
    get_single,
    loading,
    fetchRelations,
    resetRelations,
    fetchAttachments,
    resetAttachments,
    all_attachments,
    all_publications,
    fetchPublications,
  } = publications;

  const currentPublicationFromList = all_publications.find(
    (publication) => publication.id === id
  );
  const schema = currentPublicationFromList?.['@self']?.schema;

  useEffect(() => {
    fetchPublications();
    fetchPublication(id);
    return () => resetPublication();
  }, []);

  useEffect(() => {
    document.title = get_single?.title || 'Open Tilburg | Publicatie';
  }, [get_single]);

  useEffect(() => {
    get_single?.uri && fetchRelations(get_single.uri);
    return () => resetRelations();
  }, [get_single]);

  // useEffect(() => {
  //   get_single?.id && fetchAttachments(get_single.id);
  //   return () => resetAttachments();
  // }, [get_single]);

  if (loading.status || !get_single || !all_attachments) {
    return <AcLoader />;
  }

  if (get_single?.catalog?.title === 'Softwarecatalogus') {
    return <AcPublicationSoftwarecatalogus />;
  } else {
    switch (get_single?.publicationType?.title) {
      case 'Softwarecatalogus':
        return <AcPublicationSoftwarecatalogus />;
      case 'Formulier':
        return <AcPublicationFormulier />;
      case 'Woo verzoek/besluit':
      case 'Woo-verzoeken en -besluiten':
        return <AcPublicationWooVerzoek />;
      default:
        return <AcPublicationDefault schema={schema} />;
    }
  }
});

export default withStore(AcPublication);
