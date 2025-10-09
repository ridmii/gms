const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", 
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    supportFile: "cypress/support/e2e.js",
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
});