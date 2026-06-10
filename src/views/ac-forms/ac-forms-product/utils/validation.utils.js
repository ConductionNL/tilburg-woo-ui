import { getLogicalStepFromIndex } from './steps.utils';
import { validateWebsite } from '@views/ac-forms/validation/form-validations';

/**
 * getNewModulesFromProduct
 * Returns only newly created module objects from the product's modules array.
 *
 * @param {Object} product
 * @returns {Array}
 */
export const getNewModulesFromProduct = (product) => {
  const modules = product?.modules || [];
  return modules.filter((module) => typeof module === 'object');
};

/**
 * getDisabledStatus
 * Returns whether the Next button should be disabled for the current step.
 * Matches the existing validation rules used in the wizard.
 *
 * @param {number} currentStep
 * @param {Object} product
 * @param {Object} dienstenFormState
 * @param {boolean} isMultiApplicatie
 * @param {string} formType
 * @param {string} aanbiederkeuze - Choice between 'bestaand' or 'nieuw' for aanbieder
 * @returns {boolean}
 */
export const getDisabledStatus = (
  currentStep,
  product,
  dienstenFormState,
  isMultiApplicatie,
  formType,
  aanbiederkeuze = 'bestaand'
) => {
  const logicalStep = getLogicalStepFromIndex(currentStep, formType, product);

  if (logicalStep === 0) {
    return false;
  }
  if (logicalStep === 1) {
    const requiredFields = ['naam', 'website'];
    const missingFields = requiredFields.filter(
      (field) => !product[field] || !String(product[field]).trim()
    );

    if (product.website && String(product.website).trim()) {
      const website = String(product.website).trim();
      if (!validateWebsite(website)) {
        return true;
      }
    }
    return missingFields.length > 0;
  }

  // Aanbieder informatie step (logical step 2) - only for 'ontbrekend' type
  if (logicalStep === 2) {
    // If user selected "bestaand", check if aanbieder is selected
    if (aanbiederkeuze === 'bestaand') {
      return !product.aanbieder || !String(product.aanbieder).trim();
    }

    // If user selected "nieuw", check if all required fields are filled
    const requiredNewOrgFields = [
      'aanbiederNaam',
      'aanbiederType',
      'aanbiederWebsite',
    ];
    const missingNewOrgFields = requiredNewOrgFields.filter(
      (field) => !product[field] || !String(product[field]).trim()
    );

    // Validate aanbiederWebsite format if provided
    if (product.aanbiederWebsite && String(product.aanbiederWebsite).trim()) {
      const website = String(product.aanbiederWebsite).trim();
      if (!validateWebsite(website)) {
        return true;
      }
    }

    return missingNewOrgFields.length > 0;
  }

  if (logicalStep === 3) {
    const totalModules = product.modules?.length || 0;
    if (totalModules === 0) {
      return true;
    }
    const newModules = getNewModulesFromProduct(product);
    const hasIncompleteNewModules = newModules.some((module) => {
      return (
        !module.naam ||
        !String(module.naam).trim() ||
        !module.beschrijvingKort ||
        !String(module.beschrijvingKort).trim()
      );
    });
    return hasIncompleteNewModules;
  }

  if (logicalStep === 4) {
    const newModules = getNewModulesFromProduct(product);
    const hasIncompleteLicenses = newModules.some((module) => {
      const licenseType = module.licentietype || module.licentieType;
      if (!licenseType || !String(licenseType).trim()) {
        return true;
      }
      if (
        licenseType === 'Open source' &&
        (!module.licentie || !String(module.licentie).trim())
      ) {
        return true;
      }
      return false;
    });
    return hasIncompleteLicenses;
  }

  // Versies step: require non-empty versienummer for each new module and each versie row
  if (logicalStep === 5) {
    const newModules = getNewModulesFromProduct(product);
    const hasEmptyVersion = newModules.some((module) => {
      const versies = Array.isArray(module.moduleVersies)
        ? module.moduleVersies
        : [];
      if (versies.length === 0) return true; // at least one versie required
      return versies.some(
        (v) => v?.versie == null || String(v.versie).trim() === ''
      );
    });
    return hasEmptyVersion;
  }

  if (logicalStep === 9) {
    const { rows, selectedApplication, selectedDienstByRow } = dienstenFormState;
    if (rows.length === 0) {
      return false;
    }
    const hasIncompleteDiensten = rows.some((rowId) => {
      const appId = selectedApplication[rowId];
      const dienstVal = selectedDienstByRow[rowId];
      const hasAnyData = appId != null || dienstVal != null;
      const hasAllData = appId != null && dienstVal != null;
      return hasAnyData && !hasAllData;
    });
    return hasIncompleteDiensten;
  }

  return false;
};

/**
 * getDisabledTooltip
 * Returns the multiline tooltip text explaining why Next is disabled.
 * Mirrors the existing messages used in the wizard.
 *
 * @param {number} currentStep
 * @param {Object} product
 * @param {Object} dienstenFormState
 * @param {boolean} isMultiApplicatie
 * @param {string} formType
 * @param {string} aanbiederkeuze - Choice between 'bestaand' or 'nieuw' for aanbieder
 * @returns {string}
 */
export const getDisabledTooltip = (
  currentStep,
  product,
  dienstenFormState,
  isMultiApplicatie,
  formType,
  aanbiederkeuze = 'bestaand'
) => {
  const logicalStep = getLogicalStepFromIndex(currentStep, formType, product);

  if (logicalStep === 1) {
    const messages = [];
    if (!product.naam || !String(product.naam).trim()) {
      messages.push('Productnaam is verplicht');
    }
    if (!product.website || !String(product.website).trim()) {
      messages.push('Website is verplicht');
    }
    if (product.website && String(product.website).trim()) {
      const website = String(product.website).trim();
      if (!validateWebsite(website)) {
        messages.push(
          'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)'
        );
      }
    }
    return messages.join('\n');
  }

  // Aanbieder informatie step (logical step 2) - only for 'ontbrekend' type
  if (logicalStep === 2) {
    const messages = [];

    // If user selected "bestaand", check if aanbieder is selected
    if (aanbiederkeuze === 'bestaand') {
      if (!product.aanbieder || !String(product.aanbieder).trim()) {
        messages.push('Selecteer een bestaande organisatie');
      }
      return messages.join('\n');
    }

    // If user selected "nieuw", check if all required fields are filled
    if (!product.aanbiederNaam || !String(product.aanbiederNaam).trim()) {
      messages.push('Organisatienaam is verplicht');
    }
    if (!product.aanbiederType || !String(product.aanbiederType).trim()) {
      messages.push('Organisatietype is verplicht');
    }
    if (!product.aanbiederWebsite || !String(product.aanbiederWebsite).trim()) {
      messages.push('Website is verplicht');
    }

    // Validate website format if provided
    if (product.aanbiederWebsite && String(product.aanbiederWebsite).trim()) {
      const website = String(product.aanbiederWebsite).trim();
      if (!validateWebsite(website)) {
        messages.push(
          'Website heeft een ongeldig formaat (bijv. conduction.nl, www.conduction.nl of https://conduction.nl)'
        );
      }
    }

    return messages.join('\n');
  }

  if (logicalStep === 3) {
    const messages = [];
    const totalModules = product.modules?.length || 0;
    if (totalModules === 0) {
      messages.push(
        'Een product moet bestaan uit minimaal één applicatie (nieuwe of bestaande)'
      );
      return messages.join('\n');
    }
    const newModules = getNewModulesFromProduct(product);
    const incompleteModules = [];
    newModules.forEach((module, index) => {
      const missingFields = [];
      if (!module.naam || !String(module.naam).trim()) {
        missingFields.push('naam');
      }
      if (!module.beschrijvingKort || !String(module.beschrijvingKort).trim()) {
        missingFields.push('beschrijving');
      }
      if (missingFields.length > 0) {
        const moduleName =
          module.naam && String(module.naam).trim()
            ? String(module.naam).trim()
            : `Nieuwe applicatie ${index + 1}`;
        incompleteModules.push(
          `${moduleName}: ${missingFields.join(', ')} ontbreekt`
        );
      }
    });
    if (incompleteModules.length > 0) {
      messages.push(
        'Alle nieuwe applicaties moeten een naam en beschrijving hebben:'
      );
      messages.push(...incompleteModules);
    }
    return messages.join('\n');
  }

  if (logicalStep === 4) {
    const messages = [];
    const newModules = getNewModulesFromProduct(product);
    const incompleteLicenses = [];
    newModules.forEach((module, index) => {
      const licenseType = module.licentietype || module.licentieType;
      const moduleName =
        module.naam && String(module.naam).trim()
          ? String(module.naam).trim()
          : `Nieuwe applicatie ${index + 1}`;
      if (!licenseType || !String(licenseType).trim()) {
        incompleteLicenses.push(`${moduleName}: licentie type is verplicht`);
      } else if (
        licenseType === 'Open Source' &&
        (!module.licentie || !String(module.licentie).trim())
      ) {
        incompleteLicenses.push(
          `${moduleName}: specifieke licentie is verplicht bij Open Source`
        );
      }
    });
    if (incompleteLicenses.length > 0) {
      messages.push(
        'Alle nieuwe applicaties hebben volledige licentie-informatie nodig:'
      );
      messages.push(...incompleteLicenses);
    }
    return messages.join('\n');
  }

  if (logicalStep === 5) {
    const messages = [];
    const newModules = getNewModulesFromProduct(product);
    const incomplete = [];
    newModules.forEach((module, index) => {
      const versies = Array.isArray(module.moduleVersies)
        ? module.moduleVersies
        : [];
      const hasMissing =
        versies.length === 0 ||
        versies.some((v) => v?.versie == null || String(v.versie).trim() === '');
      if (hasMissing) {
        const moduleName =
          module.naam && String(module.naam).trim()
            ? String(module.naam).trim()
            : `Nieuwe applicatie ${index + 1}`;
        incomplete.push(moduleName);
      }
    });
    if (incomplete.length > 0) {
      messages.push('Versienummer is verplicht voor alle nieuwe applicaties.');
    }
    return messages.join('\n');
  }

  if (logicalStep === 9) {
    const { rows, selectedApplication, selectedDienstByRow } = dienstenFormState;
    const messages = [];
    rows.forEach((rowId, index) => {
      const appId = selectedApplication[rowId];
      const dienstVal = selectedDienstByRow[rowId];
      const missingFields = [];
      if (appId == null) missingFields.push('Applicatie');
      if (dienstVal == null) missingFields.push('Dienst Type');
      if (missingFields.length > 0) {
        messages.push(`Rij ${index + 1}: ${missingFields.join(', ')} ontbreekt`);
      }
    });
    return messages.join('\n');
  }

  return '';
};
