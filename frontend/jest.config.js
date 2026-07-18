const { createCjsPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/out-tsc/',
  ],
  // The preset only whitelists @angular; the rest of the ESM-only ecosystem
  // (@jsverse/transloco + its `flat` dep, @ngrx, chart.js) ships fesm2022
  // .mjs that Jest must transform too. Whitelist them by name.
  transformIgnorePatterns: [
    'node_modules/(?!(?:@angular|@jsverse|@ngrx|rxjs|tslib|flat|chart\\.js)/)',
  ],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/index.ts',
    '!src/app/mock/**',
    '!src/app/**/*.routes.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
