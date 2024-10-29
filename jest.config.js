module.exports = {
  setupFiles: [
    "jest-localstorage-mock"
  ],
  setupFilesAfterEnv: [
    "jest-extended"
  ],
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  testMatch: [
    "**/tests/**/*.test.js",   
    "**/tests/**/*_spec.js"
  ],
  roots: [
    "<rootDir>/tests"           
  ]
};
