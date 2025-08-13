/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  testEnvironment: "node",

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  transform: {
    "^.+\\.(t|j)sx?$": ["babel-jest", {}],
  },

  transformIgnorePatterns: ["/node_modules/"],

  testMatch: ["<rootDir>/src/test/**/*.ts", "<rootDir>/src/test/**/*.tsx"],
};
