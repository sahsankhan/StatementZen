// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
require('cypress-xpath');
import '@shelex/cypress-allure-plugin';

// Configure screenshot capture
Cypress.Screenshot.defaults({
  capture: 'viewport'
});

// Attach screenshots to Allure after each test
afterEach(function() {
  const testState = this.currentTest.state;
  const testTitle = this.currentTest.title;
  const testParent = this.currentTest.parent?.title || 'Test';
  
  if (testState === 'failed') {
    // Take screenshot and attach to Allure
    const screenshotName = `${testParent} -- ${testTitle}`;
    cy.screenshot(screenshotName).then(() => {
      cy.task('log', `Screenshot captured for failed test: ${screenshotName}`);
    });
  }
});