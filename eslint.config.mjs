import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      '.next*/**',
      '.next-build/**',
      '.next-dev/**',
      '.next-prod/**',
      '.next-web/**',
      'node_modules/**',
      '.edge-profile/**',
      '.chrome-profile/**',
      '.chrome-poppins-check/**',
      '.chrome-section-check/**',
      '.chrome-crud-check/**',
      '.chrome-auth-check/**',
      '.chrome-modules-check/**',
      '.chrome-separation-check/**',
    ],
  },
  ...nextVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
    },
  },
];

export default eslintConfig;
