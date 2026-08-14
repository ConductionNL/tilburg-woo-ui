/**
 * Reports a failed fetch at a level that matches what actually happened.
 *
 * A 404 is an answer, not a fault. It turns up routinely when a reference
 * outlives the thing it points at — a user whose active organisation has since
 * been removed, for instance. Logging that as an error makes a healthy
 * application look broken in the console, and buries the failures that do need
 * attention among the ones that do not.
 *
 * The object store tags not-found errors with `isNotFound`, but not every
 * request goes through the store — some components call the API directly and
 * throw a plain axios error. The HTTP status is checked as well, so the
 * classification does not depend on which path the caller happened to take.
 *
 * @param {string} context - What was being fetched, for the log message
 * @param {Error} error - The error thrown by the store or by axios
 * @returns {boolean} True when the cause was a missing object rather than a fault
 */
export const AcLogFetchError = (context, error) => {
  if (error?.isNotFound || error?.response?.status === 404) {
    console.info(`${context}: not found, continuing without it.`);
    return true;
  }

  console.error(`${context}:`, error);
  return false;
};
