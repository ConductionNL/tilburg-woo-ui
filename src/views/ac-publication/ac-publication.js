import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { AcLoader } from '@components';
import { withStore } from '@stores';
import { getTitle } from '@services/con-get-title';

import AcPublicationWooVerzoek from '@views/ac-publication/ac-publication-woo-verzoek';
import AcPublicationSoftwarecatalogus from '@views/ac-publication/ac-publication-softwarecatalogus';
import AcPublicationDefault from '@views/ac-publication/ac-publication-default';
import AcPublicationOrganisation from '@views/ac-publication/ac-publication-organisation';
import AcPublicationFormulier from './ac-publication-formulier';
import AcPublicationProduct from './ac-publication-product';
import AcPublicationModule from './ac-publication-module';

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

  // Add a state to track if all initial data is loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  useEffect(() => {
    fetchPublications();
    fetchPublication(id);
    return () => resetPublication();
  }, [id, fetchPublication, fetchPublications, resetPublication]);

  useEffect(() => {
    document.title =
      get_single?.title ??
      get_single?.titel ??
      get_single?.name ??
      get_single?.naam ??
      `${getTitle()} | Publicatie`;
  }, [get_single]);

  useEffect(() => {
    if (get_single?.uri) {
      fetchRelations(get_single.uri);
    }
    return () => resetRelations();
  }, [get_single?.uri, fetchRelations, resetRelations]);

  useEffect(() => {
    if (get_single?.id) {
      fetchAttachments(get_single.id);
    }
    return () => resetAttachments();
  }, [get_single?.id, fetchAttachments, resetAttachments]);

  // Only set initialDataLoaded when ALL required data is available
  useEffect(() => {
    if (get_single && all_attachments && !loading.status) {
      setInitialDataLoaded(true);
    }
  }, [get_single, all_attachments, loading.status]);

  if (!initialDataLoaded) {
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
        if (get_single?.['@self']?.schema?.slug === 'organisatie') {
          return <AcPublicationOrganisation />;
        }
        if (get_single?.['@self']?.schema?.slug === 'product') {
          return <AcPublicationProduct />;
        }
        if (get_single?.['@self']?.schema?.slug === 'module') {
          return <AcPublicationModule />;
        }
        return <AcPublicationDefault schema={schema} />;
    }
  }
});

export default withStore(AcPublication);
