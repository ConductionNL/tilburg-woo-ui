import { useState, useRef, useCallback } from 'react';
import { generateSteps } from './con-stepper-step-generator';
import { addStepperClickHandlers } from './con-stepper-click-handlers';

/**
 * ## useStepper hook   
 *
 * _This hook is used to track the current step and the number of steps taken._
 *
 * ---
 *
 * The useStepper hook is a simple but versatile tool for wizards to make step based functionality easier to manage.
 * It automatically triggers re-renders when the current step changes.
 *
 * ### flavors *
 * A flavor is a unique identifier for a step.
 * You would use this in different parts of the code where you make use of the stepper.
 * e.g. in the process steps component, you would use the flavor to indicate this is for the process steps.
 * It helps make sure that the count is always correct, starting from 1 for each flavor.
 *
 * _This is required for the stepper to work correctly._
 *
 * ### Current Step
 * The stepper also contains a internal currentStep counter that starts from 1.
 * This is used to track the current step.
 * You can use the next() and previous() methods to increment and decrement the currentStep counter.
 * The currentStep counter will always start from 1,
 * but is futher not modified in any way aside from the next and previous methods.
 *
 * ### Labels
 * The defineStep method also allows you to define a label for a step.
 * This label is a global label and NOT flavor specific despite how it may seem, therefore it must also be unique.
 * This is useful for when you want to show a certain element only when a certain step is active.
 * e.g. Only show a button when the applicatie step is active.
 *
 * When using Label functions (e.g. getStepFromLabel), the label itself needs to be defined before using it!
 *
 * ___Use this sparingly and wisely!___
 *
 * ### Methods:
 *
 * - defineStep(flavor, label = null) -> number: Increments and returns the step count for the given flavor. Optionally associates a label with the current step.
 * - getHighestStep(flavor) -> number: Returns the highest step number for the given flavor.
 * - getStepFromLabel(label) -> number | null: Returns the step number associated with the provided label, or null if not found.
 * - getLabelFromStep(step) -> string | null: Returns the label associated with the provided step, or null if not found.
 * - next() -> void: Increments the internal currentStep counter by one. This will always start from 1!!
 * - previous() -> void: Decrements the internal currentStep counter by one.
 * - getCurrentStep() -> number: Returns the current value of currentStep.
 * - resetCurrentStep() -> void: Resets the internal currentStep counter to 1.
 * - resetStepDefinitions(flavor) -> void: Resets the step definitions for a given flavor. Also resets global label index.
 * - resetAll() -> void: Resets the current step, step definitions and label index.
 *
 * ---
 *
 * Basic usage:
 * @example
 * ```
 * const stepper = useStepper();
 *
 * stepper.defineStep('flavor1'); // 1
 * stepper.defineStep('flavor1'); // 2
 * stepper.defineStep('flavor1'); // 3
 * stepper.defineStep('differentFlavor'); // 1
 * stepper.defineStep('differentFlavor'); // 2
 * stepper.defineStep('differentFlavor'); // 3
 * ```
 *
 * current step usage:
 * @example
 * ```
 * stepper.getCurrentStep(); // 1
 * stepper.next(); // 2
 * stepper.next(); // 3
 * stepper.getCurrentStep(); // 3
 * stepper.previous(); // 2
 * stepper.previous(); // 1
 * stepper.getCurrentStep(); // 1
 *
 * return (
 *   <AcFlex>
 *     <AcButton onClick={() => stepper.previous()}>Previous</AcButton>
 *     {stepper.getCurrentStep()}
 *     <AcButton onClick={() => stepper.next()}>Next</AcButton>
 *   </AcFlex>
 * )
 * ```
 *
 * label usage:
 * @example
 * ```jsx
 * stepper.defineStep('flavor1', 'aanbiederStep'); // 1
 * stepper.defineStep('flavor1', 'applicatieStep'); // 2
 * stepper.defineStep('flavor1', 'informatieStep'); // 3
 *
 * // no need to worry about step order anymore
 * const getStepName = (step) => {
 *   const stepLabel = stepper.getLabelFromStep(step);
 *   switch (stepLabel) {
 *     case 'aanbiederStep':
 *       return 'Aanbieder';
 *     case 'applicatieStep':
 *       return 'Applicatie';
 *     case 'informatieStep':
 *       return 'Informatie';
 *     default:
 *       return '';
 * }
 *
 * return (
 *   <div>
 *     <h3>{getStepName(stepper.getCurrentStep())}</h3>
 *
 *     // This button will now only be shown when the applicatieStep (step 2) is active
 *     {stepper.getStepFromLabel('applicatieStep') === stepper.getCurrentStep() && (
 *       <AcButton>Kan de applicatie niet vinden</AcButton>
 *     )}
 *   </div>
 * )
 * ```
 */
const useStepper = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const countRef = useRef({});
  const labelIndexRef = useRef({});

  /**
   * Define a step for a given flavor.
   *
   * @param {string} flavor - The flavor to define the step for.
   * @param {string | null} label - The label to associate with the step. (MUST BE UNIQUE)
   * @returns {number} The step number.
   */
  const defineStep = useCallback((flavor, label = null) => {
    if (!flavor) {
      throw new Error('Stepper: Flavor is required');
    }

    if (label && labelIndexRef.current[label]) {
      throw new Error(`Stepper: Label ${label} already defined`);
    }

    if (!countRef.current[flavor]) {
      countRef.current[flavor] = 0;
    }

    countRef.current[flavor]++;

    if (label) {
      labelIndexRef.current[label] = countRef.current[flavor];
    }

    return countRef.current[flavor];
  }, []);

  /**
   * Reset the step definitions for a given flavor.
   * @param {string} flavor - The flavor to reset the step definitions for.
   * @returns {void}
   */
  const resetStepDefinitions = useCallback((flavor) => {
    countRef.current[flavor] = 0;
    labelIndexRef.current = {};
  }, []);

  /**
   * Get the step for a given label.
   * @param {string} label - The label to get the step for.
   * @returns {number | null} The step number, or null if the label is not found.
   */
  const getStepFromLabel = useCallback((label) => {
    return labelIndexRef.current[label] || null;
  }, []);

  /**
   * Get the label for a given step.
   * @param {number} step - The step to get the label for.
   * @returns {string | null} The label, or null if the step is not found.
   */
  const getLabelFromStep = useCallback((step) => {
    return (
      Object.keys(labelIndexRef.current).find(
        (key) => labelIndexRef.current[key] === step
      ) || null
    );
  }, []);

  /**
   * Get the highest step for a given flavor.
   * @param {string} flavor - The flavor to get the highest step for.
   * @returns {number} The highest step number.
   */
  const getHighestStep = useCallback((flavor) => {
    return countRef.current[flavor] || 0;
  }, []);

  /**
   * Increment the current step by one.
   * @returns {void}
   */
  const next = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  /**
   * Decrement the current step by one.
   * @returns {void}
   */
  const previous = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  /**
   * Set the current step.
   * @param {number} step - The step to set the current step to.
   * @returns {void}
   */
  const setCurrentStepValue = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  /**
   * Set the current step by label. If the label is not found, the current step will not be changed and an error will be put in the console
   * @param {string} label - The label to set the current step to.
   * @returns {void}
   */
  const setCurrentStepByLabel = useCallback((label) => {
    const step = labelIndexRef.current[label];
    if (step) {
      setCurrentStep(step);
    } else {
      console.error(
        `Stepper: Label ${label} not found`,
        'This is a catastrophic error and should not happen if you setup the stepper correctly'
      );
    }
  }, []);

  /**
   * Get the current step.
   * @returns {number} The current step.
   */
  const getCurrentStep = useCallback(() => {
    return currentStep;
  }, [currentStep]);

  /**
   * Reset the current step to the first step.
   * @returns {void}
   */
  const resetCurrentStep = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const resetAll = useCallback(() => {
    setCurrentStep(1);
    countRef.current = {};
    labelIndexRef.current = {};
  }, []);

  return {
    defineStep,
    resetStepDefinitions,
    getStepFromLabel,
    getLabelFromStep,
    getHighestStep,
    next,
    previous,
    setCurrentStep: setCurrentStepValue,
    setCurrentStepByLabel,
    getCurrentStep,
    resetCurrentStep,
    resetAll,
    _countRef: countRef,
    _labelIndexRef: labelIndexRef,
  };
};


export {
    generateSteps,
    addStepperClickHandlers
};

export default useStepper;
