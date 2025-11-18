import React, { memo } from 'react';
import { AcContainer, AcSection, AcColumn, AcGrid } from '@src/atoms';
import { AcTile } from '@src/molecules';
import { DASHBOARD_WIZARDS, getWizardUrl } from '@src/constants/wizards.constants';
import { useLocation } from 'react-router-dom';

/**
 * ConFormApplicatieTypeSelectStage
 *
 * Renders a selection screen for choosing the applicatie form type (eigen/ontbrekend)
 * when `/forms/applicatie` is visited without a `type` query parameter.
 * Uses the same visual style as `con-form-applicatieopbouw-stage.js`.
 */
const ConFormApplicatieTypeSelectStage = memo(() => {
  const location = useLocation();
  const applicatieWizards = Object.values(DASHBOARD_WIZARDS).filter(
    (wizard) => wizard.schema === 'applicatie'
  );

  // Build a URL that preserves current query params while ensuring wizard params take precedence
  const buildUrlWithCurrentParams = (wizard) => {
    const baseUrl = getWizardUrl(wizard);
    if (!baseUrl) return null;

    const [path, queryString] = baseUrl.split('?');
    const mergedParams = new URLSearchParams(queryString || '');

    const currentParams = new URLSearchParams(location.search || '');
    currentParams.forEach((value, key) => {
      if (!mergedParams.has(key)) {
        mergedParams.set(key, value);
      }
    });

    const finalQuery = mergedParams.toString();
    return finalQuery ? `${path}?${finalQuery}` : path;
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <div>
            <h1 className='utrecht-heading-1'>Kies het type applicatie</h1>
            <p className='utrecht-paragraph'>
              Selecteer welk type applicatie u wilt registreren. U kunt een
              applicatie van uw eigen organisatie aanbieden of een ontbrekend
              applicatie melden.
            </p>
          </div>
          <div
            className='ac-register-form-section'
            role='group'
            aria-labelledby='applicatie-type-select-title'
          >
            <h2 id='applicatie-type-select-title' className='sr-only'>
              Applicatie type selectie
            </h2>
            <div className='ac-register-form-checkbox-wrapper'>
              <AcGrid columns={2} gap='xl'>
                {applicatieWizards.map((wizard) => (
                  <AcTile
                    key={wizard.id}
                    icon={wizard.icon}
                    text={wizard.name}
                    to={buildUrlWithCurrentParams(wizard)}
                    color={wizard.color || 'blue'}
                    size='medium'
                    className={'ac-dashboard-wizard-tile'}
                  />
                ))}
              </AcGrid>
            </div>
          </div>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
});

ConFormApplicatieTypeSelectStage.displayName = 'ConFormApplicatieTypeSelectStage';

export default ConFormApplicatieTypeSelectStage;
