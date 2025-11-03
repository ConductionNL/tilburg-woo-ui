import React, { useEffect, useState, useCallback, useRef } from 'react';
import RelatedTabs from './con-related-tabs';
import ConLogoPreview from '../ac-register/con-logo-preview';
import AcGenericBeheerDeleteModal from '../ac-beheer/core/modals/ac-generic-beheer-delete-modal/ac-generic-beheer-delete-modal';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { AcContainer, AcFlex } from '@atoms';
import { AcLoader } from '@components';
import { withStore } from '@stores';
import { Heading, Link } from '@utrecht/component-library-react/dist/css-module';
import { commongroundApiUrl } from '@config';

// Markdown Editor
import remarkDefinitionList, { defListHastHandlers } from 'remark-definition-list';
import { remarkMark } from 'remark-mark-highlight';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkEmoji from 'remark-emoji';
import remarkSupersub from 'remark-supersub';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize from 'rehype-sanitize';
import { getTabHeaderIcon, getTabHeaderName } from '@src/utilities';

const AcPublication = ({ store: { publications, object, user } }) => {
  const { id } = useParams();
  const { get_single, loading, attachments } = publications;

  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Tabs
  const [uses, setUses] = useState([]);
  const [used, setUsed] = useState([]);
  const [usesLoading, setUsesLoading] = useState(false);
  const [usedLoading, setUsedLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Track which IDs we've already fetched to prevent duplicate calls
  const fetchedIds = useRef(new Set());

  const fetchUses = useCallback(async () => {
    if (!id) return;
    setUsesLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/uses?_extend[]=@self.schema`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching uses:', response.statusText);
        return;
      }
      const data = await response.json();
      setUses(data.results);
    } catch (error) {
      console.error('Error fetching uses:', error);
    } finally {
      setUsesLoading(false);
    }
  }, []);

  const fetchUsed = useCallback(async () => {
    if (!id) return;
    setUsedLoading(true);
    try {
      const response = await fetch(
        `${commongroundApiUrl()}/opencatalogi/api/publications/${id}/used?_extend[]=@self.schema`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error('Error fetching used:', response.statusText);
        return;
      }
      const data = await response.json();
      setUsed(data.results);
    } catch (error) {
      console.error('Error fetching used:', error);
    } finally {
      setUsedLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch when the ID in the URL changes and we haven't fetched for this ID before
    if (!id || fetchedIds.current.has(id)) {
      return;
    }

    // Mark this ID as fetched
    fetchedIds.current.add(id);

    fetchUses();
    fetchUsed();
  }, [id, fetchUses, fetchUsed]);

  // Loading
  if (loading.status || !get_single || !attachments) {
    return <AcLoader />;
  }

  return (
    <>
      <AcContainer margin='xl'>
        <AcFlex column spacing='sm'>
          <AcFlex spacing='sm' justifyContent='between' alignItems='center'>
            <Heading level={4} className='con-product-publication--header-container'>
              <div className='con-beheer-details--header-container'>
                {get_single?.['@self']?.image || get_single?.logo && (
                  <ConLogoPreview
                    className='con-beheer-details--logo-container'
                    logoUrl={
                      get_single?.['@self']?.image || get_single?.logo
                    }
                  />
                )}

                <Heading className='con-beheer-details--title'>
                  {get_single?.['@self']?.name ||
                    get_single?.id ||
                    get_single?.name ||
                    'Organisatie'}
                </Heading>
              </div>
            </Heading>

            <AcFlex
              justifyContent='between'
              alignItems='center'
              spacing='sm'
              className='con-product-publication--header-actions'
            >
              <Heading className='con-product-publication--header-type'>
                {(() => {
                  const Icon = getTabHeaderIcon(get_single?.['@self'].schema.slug);
                  return <Icon />;
                })()}
                {getTabHeaderName(get_single?.['@self'].schema.slug, true)}
              </Heading>
            </AcFlex>
          </AcFlex>
          <AcFlex spacing='sm' justifyContent='between'>
            <AcFlex column spacing='md' style={{ flex: 3 }}>
              {!!get_single?.['@self']?.summary && (
                <div>{get_single?.['@self']?.summary}</div>
              )}

              {!!get_single?.beschrijvingLang && (
                <MDEditor.Markdown
                  wrapperElement={{
                    'data-color-mode': 'light',
                  }}
                  source={get_single?.beschrijvingLang}
                  remarkPlugins={[
                    [remarkGfm, { singleTilde: false }],
                    remarkDefinitionList,
                    remarkEmoji,
                    remarkSupersub,
                    remarkMark,
                  ]}
                  rehypePlugins={[
                    rehypeSlug,
                    [rehypeSanitize],
                    [remarkRehype, { handlers: { ...defListHastHandlers } }],
                  ]}
                />
              )}
            </AcFlex>
            {(get_single?.['e-mailadres'] ||
              get_single?.telefoonnummer ||
              get_single?.website) && (
              <AcFlex column spacing='sm' style={{ flex: 1 }}>
                <div className='ac-register-review__section'>
                  <div style={{ marginTop: '12px' }}>
                    {get_single?.['e-mailadres'] && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Email: </strong>
                        <Link href={`mailto:${get_single['e-mailadres']}`}>
                          {get_single['e-mailadres']}
                        </Link>
                      </div>
                    )}
                    {get_single?.telefoonnummer && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Telefoon: </strong>
                        <Link
                          href={`tel:${get_single.telefoonnummer.replace(
                            /\s/g,
                            ''
                          )}`}
                        >
                          {get_single.telefoonnummer}
                        </Link>
                      </div>
                    )}
                    {get_single?.website && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Website: </strong>
                        <Link
                          href={
                            get_single.website.startsWith('http')
                              ? get_single.website
                              : `https://${get_single.website}`
                          }
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {get_single.website}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </AcFlex>
            )}
          </AcFlex>

          <AcGenericBeheerDeleteModal
            objects={get_single ? [get_single] : []}
            showModal={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={() => navigate('/zoeken')}
          />

          <RelatedTabs
            id={id}
            uses={uses}
            used={used}
            usesLoading={usesLoading}
            usedLoading={usedLoading}
            tabIndex={tabIndex}
            setTabIndex={setTabIndex}
            object={object}
            navigateTo='publication'
            user={user}
          />
        </AcFlex>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcPublication));
