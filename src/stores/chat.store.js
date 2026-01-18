/**
 * Chat Store
 * 
 * Manages chat functionality business logic including:
 * - Chat conversations management
 * - Message history
 * - Dossiers organization
 * - Communication with LLM endpoint
 * 
 * @category Stores
 * @package TilburgWooUI
 */

// Imports => MOBX
import { observable, computed, makeObservable, action, runInAction } from 'mobx';
import { getCookie } from '@utils';

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available for chat store');
  containerConfig = null;
}

/**
 * Get the chat endpoint URL from configuration
 * 
 * @returns {string|null} Chat endpoint URL or null if not configured
 */
const getChatEndpoint = () => {
  if (containerConfig && containerConfig.getChatEndpoint) {
    return containerConfig.getChatEndpoint();
  }
  return null;
};

/**
 * Check if chat is enabled
 * 
 * @returns {boolean} True if chat is enabled and endpoint is configured
 */
const isChatEnabled = () => {
  if (containerConfig && containerConfig.isChatEnabled) {
    return containerConfig.isChatEnabled();
  }
  return false;
};

/**
 * Get authentication headers for chat API requests
 * 
 * @returns {Object} Headers object with authentication
 */
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Referer: window.location.origin + '/chat',
  };

  // Try Bearer token first (from cookies)
  const accessToken = getCookie('nextcloud_access_token');
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }

  // Fallback to basic auth (from user store)
  try {
    if (
      window.app &&
      window.app.store &&
      window.app.store.user &&
      window.app.store.user.basicAuthCredentials
    ) {
      const basicAuth = window.app.store.user.basicAuthCredentials;
      if (basicAuth && basicAuth.username && basicAuth.password) {
        const credentials = btoa(`${basicAuth.username}:${basicAuth.password}`);
        headers.Authorization = `Basic ${credentials}`;
      }
    }
  } catch (error) {
    console.warn('Failed to get basic auth credentials for chat:', error);
  }

  return headers;
};

/**
 * Chat Store Class
 * 
 * Manages chat state and interactions with LLM endpoint
 */
export class ChatStore {
  /**
   * Constructor
   * 
   * @param {Object} store - Main store instance
   */
  constructor(store) {
    makeObservable(this);
    this.store = store;
  }

  /**
   * List of all conversations
   * 
   * @type {Array<Object>}
   */
  @observable
  conversations = [];

  /**
   * Currently active conversation ID
   * 
   * @type {string|null}
   */
  @observable
  activeConversationId = null;

  /**
   * Messages in the current conversation
   * 
   * @type {Array<Object>}
   */
  @observable
  messages = [];

  /**
   * List of dossiers (file/data collections)
   * 
   * @type {Array<Object>}
   */
  @observable
  dossiers = [];

  /**
   * Loading state for chat operations
   * 
   * @type {boolean}
   */
  @observable
  isLoading = false;

  /**
   * Loading state for sending messages
   * 
   * @type {boolean}
   */
  @observable
  isSendingMessage = false;

  /**
   * Error message if any
   * 
   * @type {string|null}
   */
  @observable
  error = null;

  /**
   * Get the currently active conversation
   * 
   * @returns {Object|null} Active conversation or null
   */
  @computed
  get activeConversation() {
    if (!this.activeConversationId) {
      return null;
    }
    return this.conversations.find((conv) => conv.id === this.activeConversationId);
  }

  /**
   * Check if chat feature is enabled
   * 
   * @returns {boolean} True if chat is enabled
   */
  @computed
  get isChatFeatureEnabled() {
    return isChatEnabled();
  }

  /**
   * Get chat endpoint URL
   * 
   * @returns {string|null} Chat endpoint URL
   */
  @computed
  get chatEndpoint() {
    return getChatEndpoint();
  }

  /**
   * Create a new conversation
   * 
   * @param {string} title - Conversation title
   * @returns {Promise<Object>} Created conversation object
   */
  @action
  createConversation = async (title = 'Nieuwe conversatie') => {
    try {
      this.isLoading = true;
      this.error = null;

      // Generate a temporary ID for the new conversation
      const tempId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newConversation = {
        id: tempId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
      };

      runInAction(() => {
        this.conversations.unshift(newConversation);
        this.activeConversationId = tempId;
        this.messages = [];
        this.isLoading = false;
      });

      return newConversation;
    } catch (error) {
      runInAction(() => {
        this.error = 'Kon geen nieuwe conversatie aanmaken';
        this.isLoading = false;
      });
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  /**
   * Load all conversations
   * 
   * @returns {Promise<void>}
   */
  @action
  fetchConversations = async () => {
    try {
      this.isLoading = true;
      this.error = null;

      // Placeholder: Will be implemented when LLM API documentation is provided
      // For now, load from local storage or use mock data
      const storedConversations = localStorage.getItem('chat_conversations');
      
      runInAction(() => {
        if (storedConversations) {
          this.conversations = JSON.parse(storedConversations);
        }
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Kon conversaties niet laden';
        this.isLoading = false;
      });
      console.error('Error fetching conversations:', error);
    }
  };

  /**
   * Select a conversation
   * 
   * @param {string} conversationId - ID of conversation to select
   * @returns {Promise<void>}
   */
  @action
  selectConversation = async (conversationId) => {
    try {
      this.isLoading = true;
      this.error = null;
      this.activeConversationId = conversationId;

      // Load messages for this conversation
      await this.loadMessages(conversationId);

      runInAction(() => {
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Kon conversatie niet laden';
        this.isLoading = false;
      });
      console.error('Error selecting conversation:', error);
    }
  };

  /**
   * Load messages for a conversation
   * 
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<void>}
   */
  @action
  loadMessages = async (conversationId) => {
    try {
      // Placeholder: Will be implemented when LLM API documentation is provided
      // For now, load from local storage
      const storedMessages = localStorage.getItem(`chat_messages_${conversationId}`);
      
      runInAction(() => {
        if (storedMessages) {
          this.messages = JSON.parse(storedMessages);
        } else {
          this.messages = [];
        }
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      runInAction(() => {
        this.messages = [];
      });
    }
  };

  /**
   * Send a message to the LLM
   * 
   * @param {string} content - Message content
   * @returns {Promise<Object>} Response message
   */
  @action
  sendMessage = async (content) => {
    if (!content || content.trim() === '') {
      return;
    }

    try {
      this.isSendingMessage = true;
      this.error = null;

      // Create user message
      const userMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      // Add user message to messages
      runInAction(() => {
        this.messages.push(userMessage);
      });

      // Save to local storage (temporary until API is implemented)
      this.saveMessagesToLocalStorage();

      // Placeholder: Will be replaced with actual LLM API call
      // For now, create a mock assistant response
      const assistantMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: 'Dit is een tijdelijke response. De LLM API integratie wordt later toegevoegd.',
        timestamp: new Date().toISOString(),
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      runInAction(() => {
        this.messages.push(assistantMessage);
        this.isSendingMessage = false;
      });

      // Update conversation
      this.updateConversation();

      // Save to local storage
      this.saveMessagesToLocalStorage();

      return assistantMessage;
    } catch (error) {
      runInAction(() => {
        this.error = 'Kon bericht niet verzenden';
        this.isSendingMessage = false;
      });
      console.error('Error sending message:', error);
      throw error;
    }
  };

  /**
   * Delete a conversation
   * 
   * @param {string} conversationId - ID of conversation to delete
   * @returns {Promise<void>}
   */
  @action
  deleteConversation = async (conversationId) => {
    try {
      this.isLoading = true;
      this.error = null;

      runInAction(() => {
        this.conversations = this.conversations.filter((conv) => conv.id !== conversationId);
        
        // If we deleted the active conversation, clear it
        if (this.activeConversationId === conversationId) {
          this.activeConversationId = null;
          this.messages = [];
        }

        this.isLoading = false;
      });

      // Remove from local storage
      localStorage.removeItem(`chat_messages_${conversationId}`);
      this.saveConversationsToLocalStorage();
    } catch (error) {
      runInAction(() => {
        this.error = 'Kon conversatie niet verwijderen';
        this.isLoading = false;
      });
      console.error('Error deleting conversation:', error);
    }
  };

  /**
   * Update conversation metadata
   * 
   * @returns {void}
   */
  @action
  updateConversation = () => {
    if (!this.activeConversationId) {
      return;
    }

    const conversation = this.conversations.find(
      (conv) => conv.id === this.activeConversationId
    );

    if (conversation) {
      conversation.updatedAt = new Date().toISOString();
      conversation.messageCount = this.messages.length;

      // Update title from first message if it's still default
      if (conversation.title === 'Nieuwe conversatie' && this.messages.length > 0) {
        const firstUserMessage = this.messages.find((msg) => msg.role === 'user');
        if (firstUserMessage) {
          conversation.title = firstUserMessage.content.substring(0, 50) + 
            (firstUserMessage.content.length > 50 ? '...' : '');
        }
      }

      this.saveConversationsToLocalStorage();
    }
  };

  /**
   * Save conversations to local storage
   * 
   * @returns {void}
   */
  saveConversationsToLocalStorage = () => {
    try {
      localStorage.setItem('chat_conversations', JSON.stringify(this.conversations));
    } catch (error) {
      console.error('Error saving conversations to local storage:', error);
    }
  };

  /**
   * Save messages to local storage
   * 
   * @returns {void}
   */
  saveMessagesToLocalStorage = () => {
    if (!this.activeConversationId) {
      return;
    }

    try {
      localStorage.setItem(
        `chat_messages_${this.activeConversationId}`,
        JSON.stringify(this.messages)
      );
    } catch (error) {
      console.error('Error saving messages to local storage:', error);
    }
  };

  /**
   * Load dossiers (file collections)
   * 
   * @returns {Promise<void>}
   */
  @action
  fetchDossiers = async () => {
    try {
      this.isLoading = true;
      this.error = null;

      // Placeholder: Will be implemented when requirements are provided
      runInAction(() => {
        this.dossiers = [];
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = 'Kon dossiers niet laden';
        this.isLoading = false;
      });
      console.error('Error fetching dossiers:', error);
    }
  };

  /**
   * Clear all errors
   * 
   * @returns {void}
   */
  @action
  clearError = () => {
    this.error = null;
  };

  /**
   * Reset the chat store
   * 
   * @returns {void}
   */
  @action
  reset = () => {
    this.conversations = [];
    this.activeConversationId = null;
    this.messages = [];
    this.dossiers = [];
    this.isLoading = false;
    this.isSendingMessage = false;
    this.error = null;
  };
}

export default ChatStore;

