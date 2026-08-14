/**
 * Generate steps from a declarative configuration array, to be used with the `ProcessSteps` component from `@gemeente-denhaag/process-steps`.
 *
 * This function provides a declarative way to define wizard steps, automatically handling
 * step markers, status calculation, multi-step groups, and label management. It solves
 * common issues like label pollution from non-navigable steps and eliminates boilerplate
 * code for status calculation.
 *
 * ## How It Works
 *
 * The function processes a configuration array and:
 * 1. Automatically generates step markers using `stepper.defineStep()` internally
 * 2. Calculates status for each step based on the current step (`current`, `checked`, `not-checked`)
 * 3. Handles multi-step groups with proper status calculation
 * 4. Only creates labels for navigable steps (prevents label pollution)
 * 5. Supports conditional steps via `condition` property
 * 6. Auto-generates labels from titles if `stepLabel` is not provided
 *
 * ## Step Configuration Schema
 *
 * Each step object in the `stepsConfig` array supports:
 * - `title` (required): Display title for the step
 * - `stepLabel` (optional): Label for the step (auto-generated from title if not provided)
 * - `isNavigable` (optional, default: `true`): **Only applies to multi-step groups.** When `false`,
 *   no label is created for the group step itself, preventing `getLabelFromStep()` from returning it.
 *   Sub-steps within the group are always navigable regardless of this setting.
 *   Single steps (without substeps) are always navigable and ignore this property.
 * - `substeps` (optional): Array of sub-step objects with the same schema. Creates a multi-step group.
 * - `condition` (optional): Boolean or function - only include step if condition is true.
 *   Functions are called during generation to evaluate the condition.
 *
 * Sub-steps support the same properties (title, stepLabel, condition) but not `isNavigable` or `substeps`.
 *
 * ## Return Value
 *
 * Returns an array of processed step objects. Each object contains:
 * - `id`: Unique identifier (e.g., `'applicatie-step'`, `'informatie-substep'`)
 * - `marker`: Step number for this step (used for navigation and status calculation)
 * - `status`: Current status (`'current'`, `'checked'`, or `'not-checked'`)
 * - `title`: Display title for the step
 * - `steps`: (Only for multi-step groups) Array of sub-step objects with the same structure
 *
 * ## Flavors
 *
 * The function uses two flavors internally:
 * - Main flavor (default: `'process-steps'`): For navigable steps that can be jumped to
 * - Status flavor (default: `'process-steps-status'`): For tracking status ranges in multi-step groups
 *
 * These can be customized via the `options` parameter.
 *
 * @param {Object} stepper - Stepper instance from `useStepper()` hook
 * @param {Array<Object>} stepsConfig - Array of step configuration objects
 * @param {string} stepsConfig[].title - Display title for the step (required)
 * @param {string} [stepsConfig[].stepLabel] - Label for the step (auto-generated from title if not provided)
 * @param {boolean|Function} [stepsConfig[].condition] - Only include step if condition is true
 * @param {boolean} [stepsConfig[].isNavigable=true] - Whether the group step can be navigated to (only applies to multi-step groups; single steps are always navigable)
 * @param {Array<Object>} [stepsConfig[].substeps] - Array of sub-step objects (creates multi-step group)
 * @param {string} substeps[].title - Display title for the sub-step (required)
 * @param {string} [substeps[].stepLabel] - Label for the sub-step (auto-generated from title if not provided)
 * @param {boolean|Function} [substeps[].condition] - Only include sub-step if condition is true
 * @param {Object} [options] - Configuration options
 * @param {string} [options.flavor='process-steps'] - Flavor for navigable steps
 * @param {string} [options.statusFlavor] - Flavor for status tracking steps (defaults to `${flavor}-status`)
 * @returns {Array<Object>} Array of processed step objects
 * @returns {string} return[].id - Unique identifier for the step
 * @returns {number} return[].marker - Step number (used for navigation)
 * @returns {string} return[].status - Current status ('current' | 'checked' | 'not-checked')
 * @returns {string} return[].title - Display title
 * @returns {Array<Object>} [return[].steps] - Sub-steps (only for multi-step groups)
 *
 * @example
 * // Basic usage with single steps (always navigable, isNavigable property is ignored)
 * const stepsConfig = [
 *   { title: 'Applicatie', stepLabel: 'applicatie' },
 *   { title: 'Controleren', stepLabel: 'controleren' },
 * ];
 * const processSteps = generateSteps(stepper, stepsConfig);
 * // Returns: [
 * //   { id: 'applicatie-step', marker: 1, status: 'current', title: 'Applicatie' },
 * //   { id: 'controleren-step', marker: 2, status: 'not-checked', title: 'Controleren' }
 * // ]
 *
 * @example
 * // Multi-step group with conditional sub-steps
 * const stepsConfig = [
 *   {
 *     title: 'Gebruik configuratie',
 *     isNavigable: false, // Prevents label pollution
 *     substeps: [
 *       { title: 'Gebruikinformatie', stepLabel: 'informatie' },
 *       { title: 'Referentiecomponenten', stepLabel: 'referentiecomponenten' },
 *       {
 *         title: 'Deelnemers',
 *         stepLabel: 'deelnemers',
 *         condition: needsDeelnemersStep // Only include if true
 *       },
 *     ],
 *   },
 * ];
 * const processSteps = generateSteps(stepper, stepsConfig);
 *
 * @example
 * // Custom flavors
 * const stepsConfig = [
 *   { title: 'Step 1', stepLabel: 'step1' },
 *   { title: 'Step 2', stepLabel: 'step2' },
 * ];
 * const steps = generateSteps(stepper, stepsConfig, {
 *   flavor: 'custom-flavor',
 *   statusFlavor: 'custom-status'
 * });
 */
export const generateSteps = (stepper, stepsConfig, options = {}) => {
  const { flavor = 'process-steps', statusFlavor = `${flavor}-status` } = options;

  // Access stepper internals
  const countRef = stepper._countRef;
  const labelIndexRef = stepper._labelIndexRef;
  const defineStep = stepper.defineStep;
  const currentStepValue = stepper.getCurrentStep();

  // Reset step definitions for the flavors we'll use to prevent conflicts
  // when generateSteps is called multiple times (e.g., when currentStep changes)
  countRef.current[flavor] = 0;
  countRef.current[statusFlavor] = 0;

  // Helper to auto-generate label from title
  const generateLabel = (title) => {
    return title
      .toLowerCase() // lowercase the title
      .replace(/[^a-z0-9\s]/g, '') // remove non-alphanumeric characters (keep spaces)
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-') // collapse multiple consecutive hyphens into one
      .replace(/^-|-$/g, ''); // remove leading/trailing hyphens
  };

  // Collect labels we'll create to remove them from the index before regenerating
  // Also check for duplicate labels and throw an error if found
  const labelsToCreate = new Set();
  const labelSources = new Map(); // Track where each label comes from for error messages
  
  const collectLabels = (config) => {
    config.forEach((stepConfig, stepIndex) => {
      const condition =
        typeof stepConfig.condition === 'function'
          ? stepConfig.condition()
          : stepConfig.condition;
      if (condition === false) return;

      const stepLabel = stepConfig?.stepLabel || generateLabel(stepConfig.title);
      const stepLabelSource = stepConfig?.stepLabel 
        ? `explicitly defined as '${stepConfig.stepLabel}'`
        : `auto-generated from title '${stepConfig.title}'`;
      
      if (stepConfig.substeps && stepConfig.substeps.length > 0) {
        // Group step label only if navigable
        if (stepConfig.isNavigable !== false) {
          if (labelsToCreate.has(stepLabel)) {
            const existingSource = labelSources.get(stepLabel);
            throw new Error(
              `Stepper: Duplicate label '${stepLabel}' detected. ` +
              `It is used in step ${stepIndex + 1} (${stepLabelSource}) ` +
              `and was already used in ${existingSource}. ` +
              `All step labels must be unique.`
            );
          }
          labelsToCreate.add(stepLabel);
          labelSources.set(stepLabel, `step ${stepIndex + 1} (${stepLabelSource})`);
        }
        // Sub-step labels are always created
        stepConfig.substeps.forEach((subStepConfig, subStepIndex) => {
          const subCondition =
            typeof subStepConfig.condition === 'function'
              ? subStepConfig.condition()
              : subStepConfig.condition;
          if (subCondition === false) return;
          const subStepLabel =
            subStepConfig.stepLabel || generateLabel(subStepConfig.title);
          const subStepLabelSource = subStepConfig?.stepLabel
            ? `explicitly defined as '${subStepConfig.stepLabel}'`
            : `auto-generated from title '${subStepConfig.title}'`;
          
          if (labelsToCreate.has(subStepLabel)) {
            const existingSource = labelSources.get(subStepLabel);
            throw new Error(
              `Stepper: Duplicate label '${subStepLabel}' detected. ` +
              `It is used in step ${stepIndex + 1}, sub-step ${subStepIndex + 1} (${subStepLabelSource}) ` +
              `and was already used in ${existingSource}. ` +
              `All step labels must be unique.`
            );
          }
          labelsToCreate.add(subStepLabel);
          labelSources.set(subStepLabel, `step ${stepIndex + 1}, sub-step ${subStepIndex + 1} (${subStepLabelSource})`);
        });
      } else {
        // Single steps are always navigable
        if (labelsToCreate.has(stepLabel)) {
          const existingSource = labelSources.get(stepLabel);
          throw new Error(
            `Stepper: Duplicate label '${stepLabel}' detected. ` +
            `It is used in step ${stepIndex + 1} (${stepLabelSource}) ` +
            `and was already used in ${existingSource}. ` +
            `All step labels must be unique.`
          );
        }
        labelsToCreate.add(stepLabel);
        labelSources.set(stepLabel, `step ${stepIndex + 1} (${stepLabelSource})`);
      }
    });
  };

  collectLabels(stepsConfig);

  // Remove labels we're about to recreate to prevent "already defined" errors
  labelsToCreate.forEach((label) => {
    delete labelIndexRef.current[label];
  });

  // Helper to calculate status
  const calculateStatus = (stepNumber) => {
    if (currentStepValue === stepNumber) return 'current';
    if (currentStepValue < stepNumber) return 'not-checked';
    return 'checked';
  };

  // Helper to calculate multi-step status
  const calculateMultiStatus = (firstStep, lastStep) => {
    if (currentStepValue >= firstStep && currentStepValue <= lastStep)
      return 'current';
    if (currentStepValue < firstStep) return 'not-checked';
    return 'checked';
  };

  const result = [];

  // Process each step configuration
  stepsConfig.forEach((stepConfig) => {
    // Check condition
    const condition =
      typeof stepConfig.condition === 'function'
        ? stepConfig.condition()
        : stepConfig.condition;
    if (condition === false) return; // Skip this step

    const stepLabel = stepConfig?.stepLabel || generateLabel(stepConfig.title);
    // isNavigable only applies to multi-step groups; single steps are always navigable
    const isNavigable = stepConfig?.isNavigable !== false; // Default to true

    // If step has sub-steps, handle as multi-step group
    if (stepConfig.substeps && stepConfig.substeps.length > 0) {
      // If parent step is navigable, define it first to get its own marker
      let parentMarker = null;
      if (isNavigable) {
        parentMarker = defineStep(flavor, stepLabel);
      }
      
      // Process sub-steps
      const processedSubSteps = [];
      stepConfig.substeps.forEach((subStepConfig) => {
        const subCondition =
          typeof subStepConfig.condition === 'function'
            ? subStepConfig.condition()
            : subStepConfig.condition;
        if (subCondition === false) return; // Skip this sub-step

        const subStepLabel =
          subStepConfig.stepLabel || generateLabel(subStepConfig.title);
        const marker = defineStep(flavor, subStepLabel);

        processedSubSteps.push({
          id: `${subStepLabel}-substep`,
          marker,
          status: calculateStatus(marker),
          title: subStepConfig.title,
        });
      });

      // Skip if no sub-steps were processed
      if (processedSubSteps.length === 0) return;

      // Calculate group status
      // If parent is navigable, include it in the status range (parent marker to last sub-step)
      // Otherwise, use sub-steps' markers only
      const firstMarker = isNavigable && parentMarker !== null ? parentMarker : processedSubSteps[0].marker;
      const lastSubStepMarker =
        processedSubSteps[processedSubSteps.length - 1].marker;
      const groupStatus = calculateMultiStatus(
        firstMarker,
        lastSubStepMarker
      );

      // Add group step
      if (isNavigable) {
        // Use parent's own marker (created via defineStep above)
        result.push({
          id: `${stepLabel}-step`,
          marker: parentMarker,
          status: groupStatus,
          title: stepConfig.title,
          steps: processedSubSteps,
          isNavigable: true,
        });
      } else {
        // If not navigable, don't create a label (prevents label pollution)
        // Use first sub-step marker for visual grouping only
        result.push({
          id: `${stepLabel}-step`,
          marker: processedSubSteps[0].marker,
          status: groupStatus,
          title: stepConfig.title,
          steps: processedSubSteps,
          isNavigable: false,
        });
      }
    } else {
      // Single step (no sub-steps) - always navigable, ignore isNavigable property
      const marker = defineStep(flavor, stepLabel);
      result.push({
        id: `${stepLabel}-step`,
        marker,
        status: calculateStatus(marker),
        title: stepConfig.title,
      });
    }
  });

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    const prefersDark =
      window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;

    const styles = prefersDark
      ? {
          // Dark mode styles
          header:
            'font-weight: bold; font-size: 16px; color: #6bb6ff; background: #1a1a2e; padding: 8px; border-radius: 4px; border: 1px solid #2d3748;',
          section:
            'font-weight: bold; font-size: 14px; color: #e2e8f0; margin-top: 8px;',
          label: 'color: #48bb78; font-weight: bold;',
          marker: 'color: #fc8181; font-weight: bold;',
          status: 'color: #f6ad55; font-weight: bold;',
          navigable: 'color: #63b3ed;',
          nonNavigable: 'color: #a0aec0; font-style: italic;',
          group: 'color: #b794f4; font-weight: bold;',
          info: 'color: #cbd5e0;',
        }
      : {
          // Light mode styles
          header:
            'font-weight: bold; font-size: 16px; color: #2563eb; background: #eff6ff; padding: 8px; border-radius: 4px; border: 1px solid #bfdbfe;',
          section:
            'font-weight: bold; font-size: 14px; color: #1e293b; margin-top: 8px;',
          label: 'color: #059669; font-weight: bold;',
          marker: 'color: #dc2626; font-weight: bold;',
          status: 'color: #d97706; font-weight: bold;',
          navigable: 'color: #0284c7;',
          nonNavigable: 'color: #64748b; font-style: italic;',
          group: 'color: #7c3aed; font-weight: bold;',
          info: 'color: #475569;',
        };

    console.group(`%c🔷 Stepper.generateSteps() - Step Definitions`, styles.header);

    // Log current step and flavors
    console.info(
      `%cCurrent Step: %c${currentStepValue}%c | Flavor: %c${flavor}%c | Status Flavor: %c${statusFlavor}`,
      styles.info,
      styles.marker,
      styles.info,
      styles.label,
      styles.info,
      styles.label
    );

    // Log all labels and their mappings
    const labelsForFlavor = Object.entries(labelIndexRef.current)
      .filter(([, step]) => {
        // Check if this label maps to a step in our result
        return result.some(
          (r) =>
            r.marker === step || (r.steps && r.steps.some((s) => s.marker === step))
        );
      })
      .map(([label, step]) => ({ label, step }));

    if (labelsForFlavor.length > 0) {
      console.group(`%c📋 Labels & Mappings`, styles.section);
      labelsForFlavor.forEach(({ label, step }) => {
        const stepInfo = result.find(
          (r) =>
            r.marker === step || (r.steps && r.steps.some((s) => s.marker === step))
        );
        const isSubStep = stepInfo?.steps?.some((s) => s.marker === step);

        console.info(
          `  %c${label}%c → Step %c${step}%c ${isSubStep ? '(sub-step)' : ''}`,
          styles.label,
          styles.info,
          styles.marker,
          styles.info
        );
      });

      console.groupEnd();
    }

    // Log all steps with details
    console.group(`%c📊 Generated Steps`, styles.section);
    result.forEach((step, index) => {
      // For group steps, use the stored isNavigable property
      // For single steps, check if they have a label (they're always navigable)
      const isNavigable =
        step.steps !== undefined
          ? step.isNavigable !== false
          : labelsForFlavor.some((l) => l.step === step.marker);
      const navigableText = isNavigable ? '%c[navigable]' : '%c[non-navigable]';
      const navigableStyle = isNavigable ? styles.navigable : styles.nonNavigable;

      if (step.steps) {
        // Multi-step group

        console.group(
          `%c${index + 1}. %c${step.title}%c %c${navigableText}%c | Marker: %c${
            step.marker
          }%c | Status: %c${step.status} | Group`,
          styles.marker,
          styles.group,
          styles.info,
          navigableStyle,
          styles.info,
          styles.marker,
          styles.info,
          styles.status,
          styles.info
        );
        step.steps.forEach((subStep, subIndex) => {
          const subStepLabel = labelsForFlavor.find(
            (l) => l.step === subStep.marker
          );
          console.info(
            `  %c${subIndex + 1}.%c %c${subStep.title}%c | Marker: %c${
              subStep.marker
            }%c | Status: %c${subStep.status}%c | Label: %c${
              subStepLabel?.label || 'none'
            }%c`,
            styles.marker,
            styles.info,
            styles.info,
            styles.info,
            styles.marker,
            styles.info,
            styles.status,
            styles.info,
            subStepLabel ? styles.label : styles.nonNavigable,
            styles.info
          );
        });

        console.groupEnd();
      } else {
        // Single step
        const stepLabel = labelsForFlavor.find((l) => l.step === step.marker);

        console.info(
          `%c${index + 1}.%c %c${step.title}%c %c${navigableText}%c | Marker: %c${
            step.marker
          }%c | Status: %c${step.status}%c | Label: %c${stepLabel?.label || 'none'}`,
          styles.marker,
          styles.info,
          styles.info,
          styles.info,
          navigableStyle,
          styles.info,
          styles.marker,
          styles.info,
          styles.status,
          styles.info,
          stepLabel ? styles.label : styles.nonNavigable,
          styles.info
        );
      }
    });
    console.groupEnd();

    // Log summary
    const totalSteps = result.length;
    const totalSubSteps = result.reduce(
      (sum, step) => sum + (step.steps?.length || 0),
      0
    );
    // Count navigable steps correctly: group steps use isNavigable property, single steps are always navigable
    const navigableCount = result.filter((step) => {
      if (step.steps !== undefined) {
        // Group step - check isNavigable property
        return step.isNavigable !== false;
      } else {
        // Single step - always navigable (they always have labels)
        return true;
      }
    }).length;
    const nonNavigableCount = totalSteps - navigableCount;

    console.info(
      `%c📈 Summary: %c${totalSteps}%c steps (%c${navigableCount}%c navigable, %c${nonNavigableCount}%c non-navigable), %c${totalSubSteps}%c sub-steps`,
      styles.section,
      styles.marker,
      styles.info,
      styles.navigable,
      styles.info,
      styles.nonNavigable,
      styles.info,
      styles.marker,
      styles.info
    );

    console.groupEnd();
  }

  return result;
};
