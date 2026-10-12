const js = require('@eslint/js'), globals = require('globals');
module.exports = [
  js.configs.recommended,
  { files: ['**/game.js','**/intro.js','**/i18n.js','**/config.js','**/maps*.js','**/version.js','**/sw.js','**/lang/*.js','**/hist/**/*.js'], languageOptions: { sourceType: 'script', ecmaVersion: 2022, globals: { ...globals.browser, ...globals.serviceworker, I18N: 'readonly', C2_HTR: 'readonly', C2_PHOTOS: 'readonly' } }, rules: { 'no-useless-assignment': 'warn', 'no-useless-escape': 'warn', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }] } },
  { files: ['tools/**/*.js','tests/**/*.js','server/**/*.js','eslint.config.js'], languageOptions: { sourceType: 'commonjs', ecmaVersion: 2022, globals: { ...globals.node, ...globals.browser, __C2: 'readonly' } }, rules: { 'no-useless-assignment': 'warn', 'no-useless-escape': 'warn', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }] } },
  { files: ['cloudflare/**/*.js'], languageOptions: { sourceType: 'module', ecmaVersion: 2022, globals: { ...globals.serviceworker } }, rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }] } },
  { ignores: ['node_modules/**','www/**','cloudflare/node_modules/**','android/**','ios/**','dist/**','music_out/**'] }
];
