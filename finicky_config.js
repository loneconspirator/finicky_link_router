/**
 * Copyright (c) 2025 Mike McCracken
 * MIT License - see LICENSE file in root directory
 */
class FinickyConfig {
  /**
   * Parse a Finicky config string into a JSON-compatible object
   * @param {string} configText - The Finicky config text
   * @returns {Object} A JSON-compatible object
   */
  static parse(configText) {
    // Remove module.exports and trim
    configText = configText.trim().replace(/^\s*module\.exports\s*=\s*/, '');

    try {
      // First pass: Find and replace all RegExp literals
      let index = 0;
      const regexMatches = [];

      // Find all regex patterns
      const regex = /:\s*\/((?:[^/\\]|\\.)+)\/([gimuy]*)/g;
      let match;

      while ((match = regex.exec(configText)) !== null) {
        const [fullMatch, pattern, flags] = match;
        const placeholder = `"__REGEX_${index}__"`;
        regexMatches.push({ pattern, flags });

        // Replace the regex with a placeholder
        configText = configText.slice(0, match.index) + ': ' + placeholder +
                    configText.slice(match.index + fullMatch.length);

        index++;
      }

      // Second pass: Add quotes to unquoted property names
      configText = configText.replace(/(\s*)(\w+)(?=\s*:)/g, '$1"$2"');

      // Third pass: Replace single quotes with double quotes
      configText = configText.replace(/'/g, '"');

      // Fourth pass: Remove trailing commas
      configText = configText
        .replace(/,(\s*})/g, '$1')
        .replace(/,(\s*])/g, '$1');

      console.log('Processed config before regex replacement:', configText);

      // Parse as JSON
      let parsed = JSON.parse(configText);

      // Replace regex placeholders with actual regex objects
      const replacePlaceholders = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
          return obj.map(replacePlaceholders);
        }

        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' && value.startsWith('__REGEX_')) {
            const index = parseInt(value.match(/__REGEX_(\d+)__/)[1]);
            const { pattern, flags } = regexMatches[index];
            result[key] = {
              type: 'regex',
              pattern,
              flags
            };
          } else {
            result[key] = replacePlaceholders(value);
          }
        }
        return result;
      };

      return replacePlaceholders(parsed);
    } catch (error) {
      console.error('Failed to parse Finicky config:', error);
      throw new Error('Invalid Finicky configuration format');
    }
  }

  /**
   * Convert a JSON object back to Finicky config format
   * @param {Object} jsonConfig - The JSON config object
   * @returns {string} Finicky config string
   */
  static toFinickyFormat(jsonConfig) {
    if (!jsonConfig) return 'module.exports = {}';

    const config = this.#convertFromJSON(jsonConfig);
    return "module.exports = " + this.#prettyPrint(config);
  }

  /**
   * Convert a JSON object back to Finicky config format
   * @param {Object} obj - The JSON object
   * @returns {Object} Finicky-compatible object
   */
  static #convertFromJSON(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (obj.type === 'regex') {
      return new RegExp(obj.pattern, obj.flags || '');
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.#convertFromJSON(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.#convertFromJSON(value);
    }
    return result;
  }

  /**
   * Pretty print a Finicky config object
   * @param {Object} obj - The config object
   * @param {number} indent - Current indentation level
   * @returns {string} Formatted config string
   */
  static #prettyPrint(obj, indent = 0) {
    const spaces = '  '.repeat(indent);

    if (obj instanceof RegExp) {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return '[\n' +
        obj.map(item => `${spaces}  ${this.#prettyPrint(item, indent + 1)}`).join(',\n') +
        `\n${spaces}]`;
    }

    if (obj && typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return '{\n' +
        entries.map(([key, value]) =>
          `${spaces}  ${key}: ${this.#prettyPrint(value, indent + 1)}`
        ).join(',\n') +
        `\n${spaces}}`;
    }

    return JSON.stringify(obj);
  }
}

// Export for Node.js if we're not in a browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FinickyConfig };
}
