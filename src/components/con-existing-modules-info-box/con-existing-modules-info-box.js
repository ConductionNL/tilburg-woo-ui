import React from 'react';
import { Alert } from '@utrecht/component-library-react/dist/css-module';

/**
 * ConExistingModulesInfoBox Component
 * 
 * Displays an Alert box explaining that existing modules/applications
 * cannot be edited in the current stage, along with a list of those modules.
 * Uses the improved design from the main product form with proper Alert styling.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.existingModulesLookup - Lookup object for existing modules (keyed by ID)
 * @param {string} props.configType - Type of configuration (e.g., "licenties", "versies", "referentiecomponenten")
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Additional inline styles
 * @returns {React.Component|null} Alert info box component or null if no existing modules
 */
const ConExistingModulesInfoBox = ({
  existingModulesLookup,
  configType = 'configuratie',
  className = '',
  style = {},
}) => {
  // Don't render if no existing modules
  if (!existingModulesLookup || Object.keys(existingModulesLookup).length === 0) {
    return null;
  }

  const existingModules = Object.values(existingModulesLookup);

  const configMessages = {
    licenties: {
      title: 'Bestaande applicaties uitgesloten',
      description: 'Voor bestaande applicaties kunnen geen licenties worden toegevoegd of aangepast, omdat deze al hun eigen licentie-informatie hebben vastgelegd in de catalogus.',
    },
    versies: {
      title: 'Bestaande applicaties uitgesloten',
      description: 'Voor bestaande applicaties kunnen geen versies worden toegevoegd of aangepast, omdat deze al hun eigen versie-informatie hebben vastgelegd in de catalogus.',
    },
    referentiecomponenten: {
      title: 'Bestaande applicaties uitgesloten',
      description: 'Voor bestaande applicaties kunnen geen referentiecomponenten worden toegevoegd of aangepast, omdat deze al hun eigen referentiecomponenten hebben vastgelegd in de catalogus.',
    },
    standaarden: {
      title: 'Bestaande applicaties uitgesloten',
      description: 'Voor bestaande applicaties kunnen geen standaarden worden toegevoegd of aangepast, omdat deze al hun eigen standaarden hebben vastgelegd in de catalogus.',
    },
  };

  const messages = configMessages[configType] || {
    title: 'Bestaande applicaties uitgesloten',
    description: `Voor bestaande applicaties kunnen geen ${configType} worden toegevoegd of aangepast, omdat deze al hun eigen ${configType}-informatie hebben vastgelegd in de catalogus.`,
  };

  return (
    <Alert
      severity='info'
      className={className}
      style={{
        marginTop: '1.5rem',
        backgroundColor: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '8px',
        ...style,
      }}
    >
      <div>
        <strong>{messages.title}</strong>
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        {messages.description}
      </div>
      <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
        De volgende bestaande applicatie{existingModules.length > 1 ? 's' : ''} worden daarom niet in dit overzicht getoond:
      </div>
      <ul style={{ marginTop: '0.25rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
        {existingModules.map((module) => (
          <li key={module.id}>{module.naam || `Module ${module.id}`}</li>
        ))}
      </ul>
    </Alert>
  );
};

export default ConExistingModulesInfoBox;