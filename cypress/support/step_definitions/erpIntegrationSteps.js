import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import LoginPage from "../pageObjects/loginPage.js";
import ERPIntegrationPage from "../pageObjects/erpIntegrationPage.js";

const login = new LoginPage();
const erpPage = new ERPIntegrationPage();

// Dashboard steps
When("I click on {string} button on Dashboard", (buttonText) => {
  cy.wait(5000); // Wait for page to fully load
  if (buttonText.includes("LAUNCH STATEMENT ZEN APP")) {
    cy.log('Looking for LAUNCH button');
    cy.contains('a', 'Launch Statement Zen App', { matchCase: false })
      .should('be.visible')
      .click({ force: true });
    cy.wait(5000);
  } else {
    erpPage.getButtonByText(buttonText).should('be.visible').click({ force: true });
    cy.wait(2000);
  }
});


When("I click on {string} button on Xero login page", (buttonText) => {
  const targetLabel = /not now/i.test(buttonText) ? 'Not now' : 
                      /allow access/i.test(buttonText) ? 'Allow access' : buttonText;

  cy.log(`Clicking Xero button: ${targetLabel}`);
  cy.wait(2000);

  cy.origin('https://login.xero.com', { args: { targetLabel } }, ({ targetLabel }) => {
    cy.contains('button', targetLabel, { matchCase: false, timeout: 15000 })
      .should('be.visible')
      .click({ force: true });
  });

  cy.wait(3000); // Wait for action to complete
});


Then("I should see {string} Modal", (screenText) => {
  // Simplified version without cy.origin since chromeWebSecurity is disabled
  cy.wait(2000);
  cy.log(`Verifying modal: ${screenText}`);
  cy.contains(screenText, { timeout: 15000, matchCase: false }).should('be.visible');
});


When("I click on Company dropdown", () => {
  cy.wait(3000); // Wait for dropdown to be ready
  cy.log('Clicking on Company dropdown (Xero)');
  cy.origin('https://login.xero.com', () => {
    cy.contains('button', 'Select another organisation', { matchCase: false })
      .should('be.visible')
      .click({ force: true });
    cy.wait(2000);
  });
});

When("I select {string} from the dropdown", (companyName) => {
  cy.wait(2000); // Wait for dropdown options to appear
  cy.log(`Selecting company: ${companyName} (Xero)`);
  cy.origin('https://login.xero.com', { args: { companyName } }, ({ companyName }) => {
    cy.contains('span, div, button, a', companyName, { matchCase: false })
      .should('be.visible')
      .click({ force: true });
    cy.wait(3000);
  });
});


Then("I should see {string} screen", (screenText) => {
  // Simplified version without cy.origin since chromeWebSecurity is disabled
  cy.wait(2000);
  cy.log(`Verifying screen: ${screenText}`);
  cy.contains(screenText, { timeout: 15000, matchCase: false }).should('be.visible');
});

When("I click on Settings button on the left sidebar", () => {
  cy.get('i[class*="dx-icon-settings"]', { timeout: 15000 })
    .should("be.visible")
    .dblclick({ force: true });
});

When("I click Connect to Xero button on ERP screen", () => {
  cy.get('div[class*="erp-xero-btn"]', { timeout: 15000 })
    .should("be.visible")
    .click({ force: true });
});

When("I click Connect to Quickbooks button on ERP screen", () => {
  cy.log('Step 1: Clicking QuickBooks Connect button');

  // Click the QuickBooks connect button
  cy.get('div[class*="erp-quickbooks-btn"]', { timeout: 15000 })
    .should("be.visible")
    .click({ force: true });

  cy.wait(4000); // Wait for redirect to QuickBooks

  cy.log('Step 2: Switching to QuickBooks domain and setting cookies');

  // Use cy.origin to interact with the QuickBooks domain
  cy.origin('https://quickbooks.intuit.com', () => {
    cy.fixture('cookies.json').then((cookies) => {
      cy.log(`Setting ${cookies.length} cookies on Intuit domain`);

      cookies.forEach((cookie) => {
        cy.setCookie(cookie.name, cookie.value, {
          domain: cookie.domain,
          path: cookie.path || '/',
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          expiry: Math.floor(cookie.expirationDate)
        });
      });

      cy.log('✅ Cookies set successfully');
      cy.reload();
      cy.wait(3000);

      // Optional: confirm login success
      cy.get('body').then(($body) => {
        if ($body.text().includes('Dashboard')) {
          cy.log('✅ QuickBooks session restored without OTP');
        } else {
          cy.log('⚠️ Session not restored — cookies may have expired');
        }
      });
    });
  });
});


When("I perform Xero login", () => {
  // Add delays to appear more human-like and avoid rate limiting
  cy.wait(2000);
  cy.get('#xl-form-email', { timeout: 15000 }).type('ahsankhanbscs01@gmail.com', { delay: 100 });
  cy.get('#xl-form-password').type('Ahsankhan1', { delay: 100 });
  cy.contains('button', 'Log in', { timeout: 15000 }).click();
  // Wait for navigation to complete
  cy.wait(5000);
});

  When("I perform Quickbooks login", () => {
  // Add delays to appear more human-like and avoid rate limiting
  cy.wait(2000);
  cy.get('input#iux-identifier-first-international-email-user-id-input', { timeout: 15000 }).type('automationtesting077@gmail.com', { delay: 100 });
  cy.wait(1000);
  cy.contains('button', 'Sign in', { timeout: 15000 }).click();
  cy.wait(10000);
  cy.get('input#iux-password-confirmation-password').type('Test123@', { delay: 100 });
  cy.wait(1000);
  cy.contains('button', 'Continue', { timeout: 15000 }).click();
  // Wait for navigation to complete
  cy.wait(25000);
});


///////////////////

When("I click on Not now button", () => {
  cy.wait(3000);
  cy.log('Checking for Not now button (MFA setup screen)');
  
  // Check if the MFA "Not now" button exists, if yes, click it
  cy.get('body').then(($body) => {
    if ($body.find("button[data-automationid='mfa-notnow']").length > 0) {
      cy.log('MFA setup screen detected - clicking Not now button');
      cy.xpath("//button[@data-automationid='mfa-notnow']")
        .should('be.visible')
        .click({ force: true });
      cy.wait(3000);
    } else {
      cy.log('MFA setup screen not present - skipping Not now button');
    }
  });
  
  cy.wait(2000);
});

Then("I should see StatementZen wants access screen", () => {
  cy.wait(3000);
  cy.log('Verifying StatementZen wants access screen');
  cy.xpath("//div[@class='xui-text-align-center' and contains(., 'Statement Zen')]")
    .should('be.visible');
});

When("I click on Select Organization Dropdown", () => {
  cy.wait(3000);
  cy.log('Clicking on Select Organization dropdown');
  cy.xpath("//button[.//span[normalize-space()='Select another organisation']]")
    .should('be.visible')
    .click({ force: true });
  cy.wait(2000);
});

When("I select {string} from dropdown", (organizationName) => {
  cy.wait(2000);
  cy.log(`Selecting organization: ${organizationName}`);
  cy.xpath(`//span[normalize-space()='${organizationName}']`)
    .should('be.visible')
    .click({ force: true });
  cy.wait(3000);
});

When("I click on Allow access button", () => {
  cy.wait(3000);
  cy.log('Clicking on Allow access button');
  cy.xpath("//button[@id='approveButton']")
    .should('be.visible')
    .click({ force: true });
  cy.wait(5000);
});

Then("I should see Xero Connected", () => {
  cy.wait(3000);
  cy.log('Verifying Xero Connected status');
  cy.xpath("//p[normalize-space()='Connected']")
    .should('be.visible');
});

When("I click on disconnect Xero button", () => {
  cy.wait(3000);
  cy.log('Clicking on disconnect Xero button');
  cy.xpath("//span[normalize-space()='Disconnect']")
    .should('be.visible')
    .click({ force: true });
  cy.wait(3000);
});

When("I click on disconnect {string} button", (organizationName) => {
  cy.wait(3000);
  cy.log(`Clicking on disconnect button for organization: ${organizationName}`);
  cy.xpath(`//h6[normalize-space()='${organizationName}']/following::dx-button[@aria-label='Disconnect'][1]`)
    .should('be.visible')
    .click({ force: true });
  cy.wait(3000);
});

Then("I should see Disconnect confirmation modal", () => {
  cy.wait(3000);
  cy.log('Verifying Disconnect confirmation modal');
  cy.xpath("//p[normalize-space()='Are you sure you want to disconnect?']")
    .should('be.visible');
});

When("I click on Confirm button on modal", () => {
  cy.wait(2000);
  cy.log('Clicking on Confirm button on modal');
  cy.xpath("//span[normalize-space()='Confirm']")
    .should('be.visible')
    .click({ force: true });
  cy.wait(3000);
});

Then("I should see connect button on {string} card", (organizationName) => {
  cy.wait(10000);
  cy.log(`Verifying connect button on ${organizationName} card`);
  cy.xpath(`//h6[normalize-space()='${organizationName}']/following::dx-button[@aria-label='Connect'][1]`)
    .should('be.visible');
});

When("I click on Xero disconnect button", () => {
  cy.wait(3000);
  cy.log('Clicking on main Xero disconnect button');
  cy.xpath("//img[@alt='XERO']/ancestor::div[contains(@class,'group')]//dx-button[@aria-label='Disconnect']//span[normalize-space()='Disconnect']")
    .should('be.visible')
    .click({ force: true });
  cy.wait(3000);
});

Then("I should see Xero connect button", () => {
  cy.wait(10000);
  cy.log('Verifying Xero connect button');
  cy.xpath("//img[@alt='XERO']/ancestor::div[contains(@class,'group')]//div[contains(@class,'erp-xero-btn')]")
    .should('be.visible');
});
