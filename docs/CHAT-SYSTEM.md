# Chat Functionaliteit

Deze documentatie beschrijft het chat systeem geïmplementeerd in de Tilburg WOO UI applicatie.

## Overzicht

Het chat systeem biedt gebruikers de mogelijkheid om te chatten met data en bestanden in open registers via een LLM (Large Language Model) endpoint. De functionaliteit wordt alleen geactiveerd wanneer een chat endpoint is geconfigureerd.

## Feature Toggle

De chat functionaliteit is **disabled by default**. Het wordt automatisch ingeschakeld wanneer de `CHAT_ENDPOINT` omgevingsvariabele een geldige URL bevat.

```yaml
# Helm values.yaml
env:
  CHAT_ENDPOINT: ""  # Leeg = chat uitgeschakeld
  # CHAT_ENDPOINT: "https://api.example.com/chat"  # URL = chat ingeschakeld
```

## Architectuur

### Store (MobX State Management)

**Bestand**: `src/stores/chat.store.js`

De `ChatStore` beheert alle chat-gerelateerde state en business logic:

#### Observables
- `conversations`: Array van alle chat conversaties
- `activeConversationId`: ID van de actieve conversatie
- `messages`: Berichten in de huidige conversatie
- `dossiers`: Beschikbare dossiers (file collections)
- `isLoading`: Laadstatus voor algemene operaties
- `isSendingMessage`: Laadstatus voor het verzenden van berichten
- `error`: Error bericht indien van toepassing

#### Computed Values
- `activeConversation`: Geeft de actieve conversatie object terug
- `isChatFeatureEnabled`: Boolean die aangeeft of chat is ingeschakeld
- `chatEndpoint`: URL van de LLM endpoint

#### Actions
- `createConversation(title)`: Maak een nieuwe conversatie aan
- `fetchConversations()`: Laad alle conversaties
- `selectConversation(conversationId)`: Selecteer een conversatie
- `loadMessages(conversationId)`: Laad berichten voor een conversatie
- `sendMessage(content)`: Verstuur een bericht naar de LLM
- `deleteConversation(conversationId)`: Verwijder een conversatie
- `fetchDossiers()`: Laad beschikbare dossiers
- `clearError()`: Wis error state
- `reset()`: Reset de gehele store

### Views & Components

#### Main View: `src/views/ac-chat/ac-chat.js`

De hoofd chat view met een layout vergelijkbaar met de zoekpagina:
- Linker sidebar: Conversaties lijst en dossiers sectie
- Rechter main area: Chat interface met berichten en input

#### Components

**1. ConChatSidebar** (`src/views/ac-chat/components/con-chat-sidebar.js`)
- Toont lijst van conversaties
- "Nieuwe conversatie" knop
- Selecteer/verwijder conversaties
- Toont metadata (datum, aantal berichten)

**2. ConChatArea** (`src/views/ac-chat/components/con-chat-area.js`)
- Hoofdchat interface
- Berichtengeschiedenis weergave
- Tekstinvoer met auto-resize
- Verstuur knop met loading state
- Enter om te verzenden, Shift+Enter voor nieuwe regel

**3. ConChatDossiers** (`src/views/ac-chat/components/con-chat-dossiers.js`)
- Toont beschikbare dossiers
- Informatie over data toegang
- Placeholder voor toekomstige dossier functionaliteit

### Routing

**Route**: `/chat`

Gedefinieerd in `src/constants/routes.constants.js`:
```javascript
CHAT: {
  id: AcUUID(),
  name: 'Chat',
  label: 'Chat',
  path: PATHS.CHAT,
  title: `${getTitle()} | Chat`,
  component: AcChat,
}
```

### Navigatie

De chat knop verschijnt **alleen** in de hoofdnavigatie wanneer `CHAT_ENDPOINT` is geconfigureerd.

**Bestand**: `src/components/ac-navigation/ac-navigation.js`

De conditie controleert:
```javascript
const isChatEnabled = chat?.isChatFeatureEnabled || false;
```

### Styling

**Bestand**: `src/styles/views/_ac-chat.scss`

Layout volgt het patroon van de zoekpagina:
- Responsive grid layout (sidebar rechts op desktop)
- Mobile-first aanpak
- Geoptimaliseerd voor accessibiliteit
- Gebruikt NLDS design tokens

#### Key CSS Classes

- `.ac-chat-layout`: Hoofd layout container
- `.ac-chat-layout__main`: Chat gebied
- `.ac-chat-layout__sidebar`: Sidebar met conversaties en dossiers
- `.con-chat-sidebar`: Conversaties lijst styling
- `.con-chat-area`: Hoofd chat interface
- `.con-chat-message`: Individueel bericht styling
- `.con-chat-dossiers`: Dossiers sectie styling

## Configuratie

### Environment Variables

#### Ontwikkeling (docker-compose.dev.yml)
```yaml
services:
  app:
    environment:
      - CHAT_ENDPOINT=https://your-llm-api.example.com/chat
```

#### Productie (Helm values.yaml)
```yaml
env:
  CHAT_ENDPOINT: "https://prod-llm-api.example.com/chat"
```

### Generated Constants

Het systeem genereert automatisch helper functies in `src/constants/container.constants.js`:

```javascript
// Chat helper functies
export const getChatEndpoint = () => CONTAINER_CONFIG.CHAT_ENDPOINT;
export const isChatEnabled = () => {
  return CONTAINER_CONFIG.CHAT_ENDPOINT && 
         CONTAINER_CONFIG.CHAT_ENDPOINT.trim() !== '';
};
```

## Data Opslag

### Tijdelijke Implementatie

Momenteel gebruikt het systeem **localStorage** voor data persistentie:
- `chat_conversations`: Array van alle conversaties
- `chat_messages_{conversationId}`: Berichten per conversatie

### Toekomstige Implementatie

De volgende stap is integratie met de LLM API endpoint:

#### API Call Placeholder
In `chat.store.js`, de `sendMessage` methode bevat een placeholder:
```javascript
// Placeholder: Wordt vervangen met daadwerkelijke LLM API call
// Voor nu, maak een mock assistant response
```

#### Verwachte API Integratie
De implementatie voorziet in:
1. **Authentication headers**: Bearer token of Basic Auth
2. **Request format**: JSON met user message
3. **Response handling**: LLM response parsing
4. **Error handling**: Network en API errors

## LLM API Integratie

### Vereisten (Te Implementeren)

Wanneer je de LLM API documentatie ontvangt, implementeer je:

1. **API Client** in `src/api/chat.api.js`:
```javascript
export const sendChatMessage = async (conversationId, message) => {
  // API call implementatie
};
```

2. **Update Chat Store**:
- Vervang mock response met daadwerkelijke API call
- Implementeer streaming responses (indien ondersteund)
- Voeg error handling toe voor API specifieke errors

3. **Dossiers Functionaliteit**:
- API calls voor beschikbare dossiers
- Dossier selectie logica
- Context doorgave aan LLM

## Gebruiksscenario's

### Scenario 1: Chat is Uitgeschakeld
```yaml
env:
  CHAT_ENDPOINT: ""
```
- Chat knop verschijnt **niet** in navigatie
- Route `/chat` is toegankelijk maar toont disabled bericht
- Geen overhead in de applicatie

### Scenario 2: Chat is Ingeschakeld
```yaml
env:
  CHAT_ENDPOINT: "https://api.example.com/chat"
```
- Chat knop verschijnt in hoofdnavigatie
- Gebruikers kunnen conversaties aanmaken
- Berichten worden verzonden naar LLM endpoint
- Volledige chat functionaliteit beschikbaar

## Accessibiliteit

Het chat systeem volgt WCAG 2.1 AA richtlijnen:

- **Keyboard Navigation**: Volledige keyboard support
- **Screen Readers**: ARIA labels en live regions
- **Focus Management**: Duidelijke focus indicators
- **Color Contrast**: Voldoet aan WCAG contrast ratio's
- **Semantic HTML**: Gebruik van nav, button, list elementen

### Toegankelijkheidsfeatures
- `aria-label` op interactieve elementen
- `aria-live="polite"` voor status updates
- `role="button"` op clickable elementen
- Tab order optimalisatie
- Skip links support

## Testing

### Testen tijdens Ontwikkeling

1. **Chat Uitgeschakeld**:
```bash
# docker-compose.dev.yml - verwijder of comment CHAT_ENDPOINT
docker-compose -f docker-compose.dev.yml up
```
Verwacht: Geen chat knop in navigatie

2. **Chat Ingeschakeld**:
```bash
# docker-compose.dev.yml - voeg CHAT_ENDPOINT toe
CHAT_ENDPOINT=https://test-api.example.com/chat
docker-compose -f docker-compose.dev.yml up
```
Verwacht: Chat knop zichtbaar, chat interface toegankelijk

### Functionaliteit Testen

- ✅ Nieuwe conversatie aanmaken
- ✅ Conversaties lijst weergave
- ✅ Conversatie selecteren
- ✅ Bericht verzenden (mock response)
- ✅ Conversatie verwijderen
- ✅ LocalStorage persistentie
- ⏳ LLM API integratie (nog te implementeren)
- ⏳ Dossiers functionaliteit (nog te implementeren)

## Toekomstige Uitbreidingen

### Prioriteit 1: LLM API Integratie
- [ ] Implementeer API client
- [ ] Vervang mock responses
- [ ] Error handling
- [ ] Retry logica

### Prioriteit 2: Dossiers Functionaliteit
- [ ] Dossiers API integratie
- [ ] Dossier selectie UI
- [ ] Context doorgave aan LLM

### Prioriteit 3: Advanced Features
- [ ] Markdown ondersteuning in berichten
- [ ] Code syntax highlighting
- [ ] Bestand uploads
- [ ] Export conversaties
- [ ] Zoeken in conversaties
- [ ] Conversatie tags/labels

### Prioriteit 4: UX Verbeteringen
- [ ] Typing indicators
- [ ] Message reactions
- [ ] Conversatie delen
- [ ] Favorites/bookmarks
- [ ] Dark mode support

## Troubleshooting

### Chat knop verschijnt niet

**Probleem**: Chat knop is niet zichtbaar in navigatie

**Oplossing**:
1. Check of `CHAT_ENDPOINT` is geconfigureerd
2. Regenereer container constants: `node scripts/generate-container-constants.js`
3. Herstart de applicatie
4. Check browser console voor errors

### Berichten worden niet opgeslagen

**Probleem**: Berichten verdwijnen na refresh

**Oplossing**:
1. Check browser localStorage in DevTools
2. Verify dat `saveMessagesToLocalStorage()` wordt aangeroepen
3. Check voor localStorage quota errors

### Chat route toont foutmelding

**Probleem**: `/chat` route toont error

**Oplossing**:
1. Verify dat `AcChat` component correct is geïmporteerd in `src/views/index.js`
2. Check dat route is toegevoegd aan `src/constants/routes.constants.js`
3. Check browser console voor import errors

## Conclusie

Het chat systeem is volledig geïmplementeerd met:
- ✅ Environment-based feature toggle (CHAT_ENDPOINT)
- ✅ MobX state management
- ✅ Responsive UI componenten
- ✅ Routing en navigatie integratie
- ✅ LocalStorage persistentie
- ✅ Accessibility compliant
- ⏳ LLM API integratie (wacht op documentatie)

De architectuur is voorbereid voor eenvoudige integratie met de daadwerkelijke LLM API wanneer de documentatie beschikbaar komt.

