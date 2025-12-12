/**
 * Chat Sidebar Component
 * 
 * Displays list of conversations with ability to create new ones
 * Similar to the filters sidebar in search view
 * 
 * @category Components
 * @package TilburgWooUI
 */

import { observer } from 'mobx-react-lite';
import { AcCard, AcFlex } from '@atoms';
import { Button, Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';

/**
 * Format date for display
 * 
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Vandaag';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Gisteren';
  } else {
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short',
    });
  }
};

/**
 * Chat Sidebar Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.store - Store object with chat and user
 * @returns {JSX.Element} Chat sidebar
 */
const ConChatSidebar = observer(({ store }) => {
  const { chat } = store;
  const { 
    conversations, 
    activeConversationId, 
    createConversation,
    selectConversation,
    deleteConversation,
    isLoading,
  } = chat;

  const handleNewConversation = async () => {
    await createConversation();
  };

  const handleSelectConversation = (conversationId) => {
    selectConversation(conversationId);
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    
    if (window.confirm('Weet je zeker dat je deze conversatie wilt verwijderen?')) {
      await deleteConversation(conversationId);
    }
  };

  return (
    <AcCard padding='md' className='con-chat-sidebar'>
      <AcFlex column spacing='md'>
        <AcFlex justifyContent='between' alignItems='center'>
          <Heading level={3}>Conversaties</Heading>
          <Button 
            appearance='primary-action-button'
            onClick={handleNewConversation}
            disabled={isLoading}
            aria-label='Nieuwe conversatie starten'
          >
            <AcFlex alignItems='center' spacing='xs'>
              <VISUALS.PLUS style={{ width: '20px', height: '20px' }} />
              <span>Nieuw</span>
            </AcFlex>
          </Button>
        </AcFlex>

        <div className='con-chat-conversations-list'>
          {conversations.length === 0 ? (
            <p className='con-chat-no-conversations'>
              Nog geen conversaties. Start een nieuwe conversatie om te beginnen.
            </p>
          ) : (
            <ul className='con-chat-conversations'>
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className={`con-chat-conversation-item ${
                    activeConversationId === conversation.id ? 'active' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                  role='button'
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectConversation(conversation.id);
                    }
                  }}
                >
                  <AcFlex column spacing='xs' className='con-chat-conversation-content'>
                    <div className='con-chat-conversation-title'>
                      {conversation.title}
                    </div>
                    <AcFlex justifyContent='between' alignItems='center'>
                      <span className='con-chat-conversation-date'>
                        {formatDate(conversation.updatedAt)}
                      </span>
                      <span className='con-chat-conversation-count'>
                        {conversation.messageCount} berichten
                      </span>
                    </AcFlex>
                  </AcFlex>
                  <button
                    className='con-chat-conversation-delete'
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    aria-label={`Verwijder conversatie ${conversation.title}`}
                    title='Verwijder conversatie'
                  >
                    <VISUALS.TRASHCAN style={{ width: '18px', height: '18px' }} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AcFlex>
    </AcCard>
  );
});

export default ConChatSidebar;

