/**
 * ## Stepper class
 *
 * _This class is used to track the current step and the number of steps taken._
 *
 * ---
 *
 * The Stepper class is a simple but versatile tool for wizards to make step based functionality easier to manage.
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
 * This is useful for when you want to show a certain element only when a certain step is active.
 * e.g. Only show a button when the applicatie step is active.
 * 
 * ___Use this sparingly and wisely!___
 *
 * ### Methods:
 *
 * - defineStep(flavor, label = null) -> number: Increments and returns the step count for the given flavor. Optionally associates a label with the current step.
 * - getStepFromLabel(label) -> number | null: Returns the step number associated with the provided label, or null if not found.
 * - next() -> void: Increments the internal currentStep counter by one. This will always start from 1!!
 * - previous() -> void: Decrements the internal currentStep counter by one.
 * - getCurrentStep() -> number: Returns the current value of currentStep.
 * 
 * ---
 *
 * Basic usage:
 * @example
 * ```
 * const stepper = new Stepper();
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
 * stepper.defineStep('flavor1'); // 1
 * stepper.defineStep('flavor1', 'applicatieStep'); // 2
 * stepper.defineStep('flavor1'); // 3
 *
 * // This button will now only be shown when the applicatieStep (step 2) is active
 * return (
 *   {stepper.getStepFromLabel('applicatieStep') === stepper.getCurrentStep() && (
 *     <AcButton>Kan de applicatie niet vinden</AcButton>
 *   )}
 * )
 * ```
 */
class Stepper {
  constructor() {
    this.count = {};
    this.labelIndex = {};
    this.currentStep = 1;
  }

  defineStep(flavor, label = null) {
    if (!flavor) {
      throw new Error('Stepper: Flavor is required');
    }

    if (!this.count[flavor]) {
      this.count[flavor] = 0;
    }

    this.count[flavor]++;

    if (label) {
      this.labelIndex[label] = this.count[flavor];
    }

    return this.count[flavor];
  }

  getStepFromLabel(label) {
    return this.labelIndex[label] || null;
  }

  next() {
    this.currentStep++;
  }
  previous() {
    this.currentStep--;
  }

  getCurrentStep() {
    return this.currentStep;
  }
}

export default Stepper;
