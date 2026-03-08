module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|nativewind|lottie-react-native)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Use the React Native build of firebase/auth so getReactNativePersistence is available in jest
    '^firebase/auth$': '<rootDir>/node_modules/@firebase/auth/dist/rn/index.js',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        configFile: false,
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: false }]],
        plugins: [],
      },
    ],
  },
};
