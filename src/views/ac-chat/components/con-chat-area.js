/**
 * Chat Area Component
 * 
 * Main chat interface where messages are displayed and sent
 * Similar to the main content area in search view
 * 
 * @category Components
 * @package TilburgWooUI
 */

import { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { AcCard, AcFlex } from '@atoms';
import { Heading, Textarea } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';

/**
 * Format timestamp for message display
 * 
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Chat Message Component - ChatGPT style
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object
 * @returns {JSX.Element} Message component
 */
const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`con-chat-message ${isUser ? 'user' : 'assistant'}`}>
      {isUser ? (
        // User message: light gray bubble on right
        <>
          <span className='con-chat-message-sender'>
            U
          </span>
          <div className='con-chat-message-bubble'>
            <div className='con-chat-message-content'>
              {message.content}
            </div>
          </div>
          <span className='con-chat-message-time'>
            {formatTime(message.timestamp)}
          </span>
        </>
      ) : (
        // Assistant message: plain text on left
        <>
          <div className='con-chat-message-sender'>
            Assistent
          </div>
          <div className='con-chat-message-bubble'>
            <div className='con-chat-message-content'>
              {message.content}
            </div>
          </div>
          <span className='con-chat-message-time'>
            {formatTime(message.timestamp)}
          </span>
        </>
      )}
    </div>
  );
};

/**
 * Chat Area Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.store - Store object with chat and user
 * @returns {JSX.Element} Chat area
 */
const ConChatArea = observer(({ store }) => {
  const { chat } = store;
  const { 
    messages, 
    activeConversation,
    activeConversationId,
    sendMessage,
    isSendingMessage,
    createConversation,
  } = chat;

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) {
      return;
    }

    // If no active conversation, create one first
    if (!activeConversationId) {
      await createConversation();
    }

    try {
      await sendMessage(inputMessage);
      setInputMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <AcCard padding='md' className='con-chat-area'>
      <AcFlex column spacing='md' className='con-chat-area-container'>
        {/* Chat header */}
        <div className='con-chat-area-header'>
          <Heading level={2}>
            {activeConversation ? activeConversation.title : 'Start een nieuwe conversatie'}
          </Heading>
          {activeConversation && (
            <p className='con-chat-conversation-info'>
              {messages.length} bericht{messages.length !== 1 ? 'en' : ''}
            </p>
          )}
        </div>

        {/* Messages area */}
        <div className='con-chat-messages-container'>
          {messages.length === 0 ? (
            <div className='con-chat-empty-state'>
              <VISUALS.CONTACT style={{ width: '64px', height: '64px', opacity: 0.3 }} />
              <p>
                Nog geen berichten in deze conversatie.
                <br />
                Stel een vraag om te beginnen!
              </p>
            </div>
          ) : (
            <div className='con-chat-messages'>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ChatGPT-style input area */}
        <div className='con-chat-input-container'>
          <div className='con-chat-input-wrapper'>
            <div className='con-chat-textarea-wrapper'>
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder='Stel een vraag over open registers...'
                disabled={isSendingMessage}
                rows={1}
                className='con-chat-textarea'
              />
              <button
                type='button'
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSendingMessage}
                aria-label='Verstuur bericht'
                className='con-chat-send-button'
              >
                <VISUALS.PAPER_PLANE />
              </button>
            </div>
            <p className='con-chat-input-hint'>
              Druk op Enter om te verzenden, Shift+Enter voor een nieuwe regel
            </p>
          </div>
        </div>
      </AcFlex>
    </AcCard>
  );
});

export default ConChatArea;

