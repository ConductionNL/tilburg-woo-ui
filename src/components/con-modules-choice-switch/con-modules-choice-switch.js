import React from 'react';
import { AcCheckbox } from '@src/molecules';

/**
 * ConModulesChoiceSwitch Component
 * 
 * Displays a choice between "same for all applications" vs "per application different"
 * configuration. Only shown when there are multiple new applications to configure.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isMultiNewApplicatie - Whether there are multiple new applications
 * @param {boolean} props.sameForAll - Current state of "same for all" choice
 * @param {Function} props.onSameForAllChange - Callback when same for all state changes
 * @param {string} props.configType - Type of configuration (e.g., "licentie", "versie", "referentiecomponenten")
 * @param {string} [props.questionText] - Custom question text (optional)
 * @param {string} [props.sameForAllLabel] - Custom label for "same for all" option
 * @param {string} [props.perAppLabel] - Custom label for "per application" option
 * @param {string} [props.className] - Additional CSS class
 * @param {Object} [props.style] - Additional inline styles
 * @returns {React.Component|null} Choice switch component or null if not multi-application
 */
const ConModulesChoiceSwitch = ({
  isMultiNewApplicatie,
  sameForAll,
  onSameForAllChange,
  configType = 'informatie',
  questionText,
  sameForAllLabel = 'Ja, voor alle applicaties hetzelfde',
  perAppLabel = 'Nee, per applicatie verschillend',
  className = 'ac-register-form-checkbox-wrapper',
  style = { marginBottom: '1rem' },
}) => {
  // Don't render if not multiple applications
  if (!isMultiNewApplicatie) {
    return null;
  }

  const defaultQuestionText = questionText || 
    `Geldt dezelfde ${configType}-informatie voor alle nieuwe applicaties?`;

  return (
    <div className={className} style={style}>
      <p>{defaultQuestionText}</p>
      <AcCheckbox
        label={sameForAllLabel}
        value='same'
        checked={sameForAll}
        onChange={() => onSameForAllChange(true)}
      />
      <AcCheckbox
        label={perAppLabel}
        value='per-app'
        checked={!sameForAll}
        onChange={() => onSameForAllChange(false)}
      />
    </div>
  );
};

export default ConModulesChoiceSwitch;
