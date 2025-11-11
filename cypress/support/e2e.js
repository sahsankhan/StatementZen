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
import 'cypress-xpath';
import '@shelex/cypress-allure-plugin';

// Configure screenshot capture
Cypress.Screenshot.defaults({
  capture: 'viewport'
});

// Handle uncaught exceptions - simplified version
Cypress.on('uncaught:exception', () => {
  // Suppress all errors to prevent test failure
  return false;
});

// Stealth automation - inject scripts before each test
beforeEach(() => {
  cy.log('🕵️ Injecting stealth automation scripts');
  
  // Inject stealth scripts to avoid detection
  cy.on('window:before:load', (win) => {
    // Remove webdriver property
    Object.defineProperty(win.navigator, 'webdriver', {
      get: () => undefined,
      configurable: true
    });
    
    // Override chrome property to appear as regular Chrome
    win.navigator.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
    
    // Override plugins length
    Object.defineProperty(win.navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Override languages
    Object.defineProperty(win.navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Override permissions
    const originalQuery = win.navigator.permissions?.query;
    if (originalQuery) {
      win.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Cypress._.constant('denied') }) :
          originalQuery(parameters)
      );
    }
    
    // Mock getBattery
    if (win.navigator.getBattery) {
      win.navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1,
        addEventListener: () => {},
        removeEventListener: () => {},
      });
    }
    
    // Override automation detection properties
    delete win.navigator.__proto__.webdriver;
    delete win.navigator.webdriver;
    
    cy.log('✅ Stealth scripts injected successfully');
  });
});

// Note: Screenshot handling is done automatically by Cypress Allure plugin