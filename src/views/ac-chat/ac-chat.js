/**
 * Chat View
 * 
 * Main chat interface with conversations sidebar, dossiers section, and chat area
 * Layout inspired by the search page with left sidebar and main content area
 * 
 * @category Views
 * @package TilburgWooUI
 */

import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcContainer, AcCard } from '@atoms';
import { LABELS } from '@constants';
import { ConChatSidebar, ConChatArea, ConChatDossiers } from './components';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

/**
 * Chat View Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.store - MobX store
 * @returns {JSX.Element} Chat view
 */
const AcChat = ({ store: { chat, user } }) => {
  const { 
    fetchConversations, 
    fetchDossiers, 
    isChatFeatureEnabled,
    error,
  } = chat;

  useEffect(() => {
    // Load conversations and dossiers when component mounts
    fetchConversations();
    fetchDossiers();
  }, []);

  // If chat is not enabled, show message
  if (!isChatFeatureEnabled) {
    return (
      <AcContainer spacing='lg' margin='xl'>
        <AcCard padding='lg'>
          <Heading level={2}>Chat functionaliteit niet beschikbaar</Heading>
          <p>
            De chat functionaliteit is momenteel niet ingeschakeld. 
            Neem contact op met de beheerder voor meer informatie.
          </p>
        </AcCard>
      </AcContainer>
    );
  }

  return (
    <>
      <AcContainer spacing='lg'>
        <AcCard blue padding='md'>
          <Heading level={1}>Chat met Open Registers</Heading>
          <p>
            Stel vragen over data en bestanden in open registers en krijg direct antwoord.
          </p>
        </AcCard>
      </AcContainer>

      <AcContainer spacing='sm' margin='xl'>
        <div className='ac-chat-layout'>
          {/* Main chat area comes first in DOM for better accessibility */}
          <div className='ac-chat-layout__main'>
            {error && (
              <AcCard padding='md' className='ac-chat-error'>
                <p style={{ color: 'var(--color-error, #d32f2f)' }}>{error}</p>
              </AcCard>
            )}
            <ConChatArea store={{ chat, user }} />
          </div>

          {/* Sidebar with conversations and dossiers */}
          <div className='ac-chat-layout__sidebar'>
            <ConChatSidebar store={{ chat, user }} />
            <ConChatDossiers store={{ chat, user }} />
          </div>
        </div>
      </AcContainer>
    </>
  );
};

export default withStore(observer(AcChat));

