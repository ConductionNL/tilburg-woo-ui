import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import { AcLoader } from '@components';
import { withStore } from '@stores';

import AcPublicationWooVerzoek from '@views/ac-publication/ac-publication-woo-verzoek';
import AcPublicationSoftwarecatalogus from '@views/ac-publication/ac-publication-softwarecatalogus';
import AcPublicationFormulier from './ac-publication-formulier';

const AcPublication = ({ store: { publications } }) => {
  const { id } = useParams();
  const {
    fetchPublication,
    resetPublication,
    get_single,
    loading,
    fetchRelations,
    resetRelations,
  } = publications;

  useEffect(() => {
    fetchPublication(id);
    return () => resetPublication();
  }, []);

  useEffect(() => {
    document.title = get_single?.title || 'Open Ac | Publicatie';
  }, [get_single]);

  useEffect(() => {
    get_single?.uri && fetchRelations(get_single.uri);
    return () => resetRelations();
  }, [get_single]);

  if (loading.status || !get_single) {
    return <AcLoader />;
  }

  if (get_single?.catalog?.title === 'Softwarecatalogus') {
    return (
      <AcPublicationSoftwarecatalogus />
    )
  }
  else {
    switch (get_single?.publicationType?.title) {
      case 'Softwarecatalogus':
        return (
          <AcPublicationSoftwarecatalogus />
        )
      case 'Formulier':
        return (
          <AcPublicationFormulier />
        )
      default:
        return (
          <AcPublicationWooVerzoek />
        )
    }
  };
}

export default withStore(observer(AcPublication));
