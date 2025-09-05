/**
 * shouldShowAanbiederStep
 * Returns whether the Aanbieder step should be shown based on the form type.
 *
 * @param {string} formType
 * @returns {boolean}
 */
export const shouldShowAanbiederStep = (formType) => {
  return formType === 'ontbrekend';
};

/**
 * shouldShowVersiesStep
 * Returns whether the Versies step should be shown based on the product state.
 * On-premise cloud model requires the versions step.
 *
 * @param {Object} product
 * @returns {boolean}
 */
export const shouldShowVersiesStep = (product) => {
  return (
    (product?.cloudDienstverleningsmodel || '') === 'On-premises (self-managed)'
  );
};

/**
 * getAdjustedStepIndex
 * Calculates the physical step index for a given logical step,
 * accounting for optional steps.
 *
 * @param {number} logicalStep
 * @param {string} formType
 * @param {Object} product
 * @returns {number}
 */
export const getAdjustedStepIndex = (logicalStep, formType, product) => {
  let index = logicalStep;
  if (!shouldShowAanbiederStep(formType) && logicalStep > 1) {
    index -= 1;
  }
  if (!shouldShowVersiesStep(product) && logicalStep > 5) {
    index -= 1;
  }
  return index;
};

/**
 * getLogicalStepFromIndex
 * Converts a physical step index to a logical step number,
 * accounting for optional steps.
 *
 * @param {number} stepIndex
 * @param {string} formType
 * @param {Object} product
 * @returns {number}
 */
export const getLogicalStepFromIndex = (stepIndex, formType, product) => {
  let logical = stepIndex;
  if (!shouldShowAanbiederStep(formType) && stepIndex >= 2) {
    logical = stepIndex + 1;
  }
  if (!shouldShowVersiesStep(product)) {
    const versiesPhysicalIndex = getAdjustedStepIndex(5, formType, product);
    if (stepIndex >= versiesPhysicalIndex) {
      logical += 1;
    }
  }
  return logical;
};

/**
 * getStatus
 * Returns the status string for a given step relative to current.
 *
 * @param {number} currentStep
 * @param {number} step
 * @returns {('current'|'not-checked'|'checked')}
 */
export const getStatus = (currentStep, step) => {
  return currentStep === step
    ? 'current'
    : currentStep < step
    ? 'not-checked'
    : 'checked';
};

/**
 * getStatusMultiStep
 * Returns the status for a group of steps spanning firstStep..lastStep.
 *
 * @param {number} currentStep
 * @param {number} step
 * @param {number} firstStep
 * @param {number} lastStep
 * @returns {('current'|'not-checked'|'checked')}
 */
export const getStatusMultiStep = (currentStep, step, firstStep, lastStep) => {
  if (currentStep >= firstStep && currentStep <= lastStep) {
    return 'current';
  } else if (currentStep < step) {
    return 'not-checked';
  } else if (currentStep > step) {
    return 'checked';
  }
};

/**
 * currentStepName
 * Returns the localized label for the current step index.
 *
 * @param {number} stepIndex
 * @param {string} formType
 * @param {Object} product
 * @param {boolean} isMultiApplicatie
 * @returns {string}
 */
export const currentStepName = (stepIndex, formType, product, isMultiApplicatie) => {
  const logicalStep = getLogicalStepFromIndex(stepIndex, formType, product);
  switch (logicalStep) {
    case 0:
      return 'Productopbouw';
    case 1:
      return 'Productinformatie';
    case 2:
      if (shouldShowAanbiederStep(formType)) {
        return 'Aanbieder informatie';
      }
    // fallthrough
    case 3:
      return isMultiApplicatie ? 'Applicaties' : 'Applicatie';
    case 4:
      return 'Licentie';
    case 5:
      return shouldShowVersiesStep(product) ? 'Versies' : 'Referentiecomponenten';
    case 6:
      return 'Referentiecomponenten';
    case 7:
      return 'Standaarden';
    case 8:
      return 'Koppelingen';
    case 9:
      return 'Diensten';
    case 10:
      return 'Controleer uw gegevens';
  }
};

/**
 * getNextStepIndex
 * Computes the next physical step index from the current, accounting for
 * optional steps and single/multi applicatie mode.
 *
 * @param {number} stepIndex
 * @param {string} formType
 * @param {Object} product
 * @param {boolean} isMultiApplicatie
 * @returns {number}
 */
export const getNextStepIndex = (
  stepIndex,
  formType,
  product,
  isMultiApplicatie
) => {
  const logical = getLogicalStepFromIndex(stepIndex, formType, product);
  if (!isMultiApplicatie) {
    if (logical === 1) {
      if (shouldShowAanbiederStep(formType)) {
        return stepIndex + 1;
      }
      return getAdjustedStepIndex(4, formType, product);
    }
    if (logical === 2) {
      return getAdjustedStepIndex(4, formType, product);
    }
  }
  if (!shouldShowVersiesStep(product) && logical === 4) {
    return getAdjustedStepIndex(6, formType, product);
  }
  return stepIndex + 1;
};

/**
 * getPrevStepIndex
 * Computes the previous physical step index from the current, accounting for
 * optional steps and single/multi applicatie mode.
 *
 * @param {number} stepIndex
 * @param {string} formType
 * @param {Object} product
 * @param {boolean} isMultiApplicatie
 * @returns {number}
 */
export const getPrevStepIndex = (
  stepIndex,
  formType,
  product,
  isMultiApplicatie
) => {
  const logical = getLogicalStepFromIndex(stepIndex, formType, product);
  if (!isMultiApplicatie && logical === 4) {
    return getAdjustedStepIndex(1, formType, product);
  }
  if (!shouldShowVersiesStep(product) && logical === 6) {
    return getAdjustedStepIndex(4, formType, product);
  }
  return stepIndex - 1;
};
