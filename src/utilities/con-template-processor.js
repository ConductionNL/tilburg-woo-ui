/**
 * Template Variable Processor
 * 
 * Processes template strings with variables like {{ user.displayName }} or {{ user.organisations.active.name }}
 * and replaces them with actual values from the provided context.
 * 
 * Features:
 * - Nested object access (user.organisations.active.name)
 * - Safe fallbacks for missing values
 * - Extensible variable context
 * - HTML-safe processing
 * - Performance optimized with caching
 * 
 * Usage:
 * const processor = new TemplateProcessor({ user, organization, system });
 * const result = processor.process("Welcome {{ user.displayName }} from {{ user.organisations.active.name }}!");
 */

export class TemplateProcessor {
  constructor(context = {}) {
    this.context = context;
    this.cache = new Map();
  }

  /**
   * Process a template string and replace variables
   * @param {string} template - Template string with {{ variable }} placeholders
   * @param {Object} additionalContext - Additional context variables for this specific processing
   * @returns {string} Processed string with variables replaced
   */
  process(template, additionalContext = {}) {
    if (!template || typeof template !== 'string') {
      return template;
    }

    // Check cache for performance
    const cacheKey = `${template}_${JSON.stringify(additionalContext)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Merge contexts (additionalContext takes precedence)
    const fullContext = { ...this.context, ...additionalContext };

    // Regular expression to match {{ variable.path }} patterns
    const templateRegex = /\{\{\s*([^}]+)\s*\}\}/g;

    const result = template.replace(templateRegex, (match, variablePath) => {
      try {
        // Clean up the variable path
        const cleanPath = variablePath.trim();
        
        // Get the value using nested object access
        const value = this.getNestedValue(fullContext, cleanPath);
        
        // Return the value or the original placeholder if not found
        return value !== undefined && value !== null ? String(value) : match;
      } catch (error) {
        console.warn(`Template processing error for "${variablePath}":`, error);
        return match; // Return original placeholder on error
      }
    });

    // Cache the result for performance
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search in
   * @param {string} path - Dot-separated path (e.g., 'user.organisations.active.name')
   * @returns {*} Value at the path or undefined
   */
  getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) return undefined;
      
      // Handle array access or object property access
      if (Array.isArray(current)) {
        const index = parseInt(key, 10);
        return !isNaN(index) ? current[index] : current[key];
      }
      
      return current[key];
    }, obj);
  }

  /**
   * Update the context (useful for reactive updates)
   * @param {Object} newContext - New context to merge
   */
  updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
    this.clearCache(); // Clear cache when context changes
  }

  /**
   * Clear the processing cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Check if a string contains template variables
   * @param {string} text - Text to check
   * @returns {boolean} True if contains template variables
   */
  static hasTemplateVariables(text) {
    if (!text || typeof text !== 'string') return false;
    return /\{\{\s*[^}]+\s*\}\}/.test(text);
  }

  /**
   * Extract all template variables from a string
   * @param {string} text - Text to analyze
   * @returns {Array<string>} Array of variable paths found
   */
  static extractVariables(text) {
    if (!text || typeof text !== 'string') return [];
    
    const matches = text.match(/\{\{\s*([^}]+)\s*\}\}/g) || [];
    return matches.map(match => match.replace(/\{\{\s*|\s*\}\}/g, '').trim());
  }
}

/**
 * Create a template processor with user and organization context
 * @param {Object} user - User store instance
 * @param {Object} additionalContext - Additional context variables
 * @returns {TemplateProcessor} Configured template processor
 */
export const createUserTemplateProcessor = (user, additionalContext = {}) => {
  const context = {
    user: {
      // Basic user properties
      displayName: user?.userDisplayName || user?.user?.displayName || user?.user?.name || '',
      email: user?.userEmail || user?.user?.email || '',
      phone: user?.userPhone || user?.user?.phone || '',
      fullName: user?.userFullName || user?.user?.fullName || '',
      firstName: user?.user?.firstName || user?.user?.givenName || '',
      lastName: user?.user?.lastName || user?.user?.familyName || '',
      initials: user?.userInitials || '',
      
      // Authentication status
      isAuthenticated: user?.isAuthenticated || false,
      isAdmin: user?.isAdmin || false,
      
      // Groups and roles
      groups: user?.userGroups || [],
      
      // Organizations (using 's' to match API response structure)
      organisations: {
        active: user?.activeOrganization || null,
        all: user?.userOrganizations || [],
        total: user?.totalOrganizations || 0,
      },
      
      // Raw user object for advanced access
      raw: user?.user || null,
    },
    
    // System context
    system: {
      currentDate: new Date().toLocaleDateString('nl-NL'),
      currentTime: new Date().toLocaleTimeString('nl-NL'),
      currentYear: new Date().getFullYear(),
    },
    
    // Merge additional context
    ...additionalContext,
  };

  return new TemplateProcessor(context);
};

/**
 * Process template variables in text with user context
 * @param {string} text - Text to process
 * @param {Object} user - User store instance
 * @param {Object} additionalContext - Additional context variables
 * @returns {string} Processed text
 */
export const processUserTemplate = (text, user, additionalContext = {}) => {
  if (!TemplateProcessor.hasTemplateVariables(text)) {
    return text; // Skip processing if no variables found
  }
  
  const processor = createUserTemplateProcessor(user, additionalContext);
  return processor.process(text);
};

export default TemplateProcessor;
