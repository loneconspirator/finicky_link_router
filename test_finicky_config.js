const { FinickyConfig } = require('./finicky_config.js');

// Sample Finicky config to test with
const testConfig = `{
  defaultBrowser: "Arc",
  handlers: [
    {
      match: /^https?:\\/\\/([^\\/]*\\.)?asana\\.com\\/.*$/,
      browser: "Google Chrome"
    },
    {
      match: /^https?:\\/\\/[^\\/]*\\.github\\.com\\/.*$/,
      browser: "Brave Browser"
    }
  ]
}`;

console.log('Original config:');
console.log(testConfig);
console.log('\nParsing config...');

const parsed = FinickyConfig.parse(testConfig);
console.log('\nParsed JSON:');
console.log(JSON.stringify(parsed, null, 2));

console.log('\nConverting back to Finicky format...');
const backToFinicky = FinickyConfig.toFinickyFormat(parsed);
console.log('\nFinicky format:');
console.log(backToFinicky);
