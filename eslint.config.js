const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  // Ignore build artifacts and generated files
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'firebase-export-*/**/*',
      'emulator-data/**/*',
      '.firebase/**/*',
      '*.min.js',
      'dist/**/*',
      'out/**/*',
      '.vercel/**/*',
      'coverage/**/*',
      // Additional patterns
      'build/**/*',
      'public/build/**/*',
      '.turbo/**/*',
      '.swc/**/*',
      '**/*.d.ts',
      'stories/**/*',
    ]
  },
  
  // Extend existing .eslintrc.json configuration
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('plugin:react/recommended'),
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends('prettier'),
  
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Migrate custom rules from .eslintrc.json
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      
      // Allow CommonJS requires in config files
      '@typescript-eslint/no-require-imports': 'off',
      
      // Make strict rules warnings instead of errors for now
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      
      // Disable prop-types for TypeScript files since TypeScript provides type checking
      'react/prop-types': 'off',
    },
  },
  
  // Disable prop-types for TypeScript components
  {
    files: ['**/*.tsx'],
    rules: {
      'react/prop-types': 'off',
    },
  },
  
  // Specific rules for config files
  {
    files: ['*.config.js', '*.config.ts', 'scripts/**/*.js', 'functions/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]; 