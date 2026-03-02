import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
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
import AcPublicationKoppeling from './ac-publication-koppeling';
import AcPublicationGebruik from './ac-publication-gebruik';
import AcPublicationDienst from './ac-publication-dienst';
import AcPublicationContactperson from './ac-publication-contactperson';
import AcPublicationModuleVersie from './ac-publication-moduleversie';
import { AcContainer, AcFlex } from '@src/atoms';
import { AcButton } from '@molecules';
import { VISUALS } from '@constants';
// import ConGlossaryHighlight from '@components/con-glossary-highlight/con-glossary-highlight';

const AcPublication = observer(({ store: { publications } }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    fetchPublication,
    resetPublication,
    get_single,
    loading,
    get_error,
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
    // Only fetch attachments for schemas that actually use them
    // Skip for Organisation/Product/Module/Koppeling/Gebruik/Dienst as they don't display attachments
    const schemaSlug = get_single?.['@self']?.schema?.slug;
    const shouldFetchAttachments =
      schemaSlug &&
      ![
        'organisatie',
        'product',
        'module',
        'koppeling',
        'gebruik',
        'dienst',
      ].includes(schemaSlug);

    if (get_single?.id && shouldFetchAttachments) {
      fetchAttachments(get_single.id);
    }
    return () => resetAttachments();
  }, [
    get_single?.id,
    get_single?.['@self']?.schema?.slug,
    fetchAttachments,
    resetAttachments,
  ]);

  // Only set initialDataLoaded when ALL required data is available
  useEffect(() => {
    const schemaSlug = get_single?.['@self']?.schema?.slug;
    const needsAttachments =
      schemaSlug &&
      ![
        'organisatie',
        'product',
        'module',
        'koppeling',
        'gebruik',
        'dienst',
      ].includes(schemaSlug);

    // For schemas that don't need attachments, only wait for get_single and loading to complete
    // For schemas that do need attachments, also wait for all_attachments
    const dataReady = needsAttachments
      ? get_single && all_attachments && !loading.status
      : get_single && !loading.status;

    if (dataReady) {
      setInitialDataLoaded(true);
    }
  }, [get_single, all_attachments, loading.status]);

  // Show error state immediately if fetching the publication failed
  if (get_error) {
    return (
      <AcContainer compact margin='xl' className='ac-publication-container'>
        <AcFlex column spacing='lg'>
          <h2 style={{ margin: 0 }}>Kon publicatie niet laden</h2>

          <p style={{ fontWeight: 500, color: 'black' }}>
            Er ging iets mis bij het laden van deze publicatie. Dit kan komen doordat
            de publicatie niet (meer) bestaat of door een tijdelijke storing. Probeer
            het later opnieuw of ga terug naar de vorige pagina.
          </p>

          <small>
            {get_error.status ? `Foutcode ${get_error.status}` : 'Onbekende fout'}
            {get_error.message ? `: ${get_error.message}` : ''}
          </small>

          <div>
            <AcButton
              style='button'
              buttonType='primary'
              onClick={() => navigate(-1)}
            >
              <VISUALS.ARROW_LEFT className='ac-button__icon' /> Ga terug
            </AcButton>
          </div>
        </AcFlex>
      </AcContainer>
    );
  }

  if (!initialDataLoaded) {
    return <AcLoader />;
  }

  if (get_single?.catalog?.title === 'Softwarecatalogus') {
    return <AcPublicationSoftwarecatalogus />;
  } else {
    const publicationType = get_single?.['@self']?.schema?.slug.toLowerCase();
    switch (get_single?.publicationType?.title) {
      case 'Softwarecatalogus':
        return <AcPublicationSoftwarecatalogus />;
      case 'Formulier':
        return <AcPublicationFormulier />;
      case 'Woo verzoek/besluit':
      case 'Woo-verzoeken en -besluiten':
        return <AcPublicationWooVerzoek />;
      default:
        if (publicationType === 'organisatie') {
          return <AcPublicationOrganisation />;
        }
        if (publicationType === 'suite') {
          return <AcPublicationProduct />;
        }
        if (publicationType === 'module') {
          return <AcPublicationModule />;
        }
        if (publicationType === 'moduleversie') {
          return <AcPublicationModuleVersie />;
        }
        if (publicationType === 'koppeling') {
          return <AcPublicationKoppeling />;
        }
        if (publicationType === 'gebruik') {
          return <AcPublicationGebruik />;
        }
        if (publicationType === 'dienst') {
          return <AcPublicationDienst />;
        }
        if (publicationType === 'contactpersoon') {
          return <AcPublicationContactperson />;
        }
        return <AcPublicationDefault schema={schema} />;
    }
  }
});

export default withStore(AcPublication);
