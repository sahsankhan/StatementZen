import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import LoginPage from "../pageObjects/loginPage.js";
import ERPIntegrationPage from "../pageObjects/erpIntegrationPage.js";

const login = new LoginPage();
const erpPage = new ERPIntegrationPage();
const INTUIT_ORIGIN = "https://accounts.intuit.com";

const restoreQuickBooksSession = () =>
  cy.readFile("auth.json", { log: false }).then((storageState) => {
    if (!storageState) {
      throw new Error(
        "auth.json was not found. Run `npm run manual-login` first to capture the QuickBooks session."
      );
    }

    const cookies =
      storageState.cookies?.filter((cookie) =>
        cookie.domain?.includes("intuit.com")
      ) ?? [];

    const localStorageEntries =
      storageState.origins
        ?.filter((entry) => entry.origin?.includes("intuit.com"))
        ?.flatMap((entry) => entry.localStorage ?? []) ?? [];

    cy.log(
      `Restoring QuickBooks session (${cookies.length} cookies, ${localStorageEntries.length} localStorage items)`
    );

    return cy.origin(
      INTUIT_ORIGIN,
      { args: { cookies, localStorageEntries } },
      ({ cookies, localStorageEntries }) => {
        cookies.forEach((cookie) => {
          cy.setCookie(cookie.name, cookie.value, {
            domain: cookie.domain,
            path: cookie.path || "/",
            expiry:
              typeof cookie.expires === "number" && cookie.expires > 0
                ? Math.floor(cookie.expires)
                : undefined,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
          });
        });

        if (localStorageEntries.length) {
          cy.window().then((win) => {
            localStorageEntries.forEach(({ name, value }) => {
              win.localStorage.setItem(name, value);
            });
          });
        }

        cy.reload();

        cy.contains("Let's get you in to Quickbooks", {
          timeout: 20000,
          matchCase: false,
        }).should("be.visible");
      }
    );
  });

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

When("I click on ERP Integration button on the left sidebar", () => {
  erpPage
    .getSettingsButton()
    .should("be.visible")
    .click({ force: true });
});

When("I click Connect to Xero button on ERP screen", () => {
  cy.get('div[class*="erp-xero-btn"]', { timeout: 15000 })
    .should("be.visible")
    .click({ force: true });
});

When("I click Connect to Quickbooks button on ERP screen", () => {
  cy.log("Step 1: Triggering QuickBooks connection flow");
  cy.get('div[class*="erp-quickbooks-btn"]', { timeout: 15000 })
    .should("be.visible")
    .click({ force: true });

  cy.log("Step 2: Restoring QuickBooks session inside Intuit origin");
  cy.origin(INTUIT_ORIGIN, () => {
    cy.log("Waiting for Intuit login page to load...");
    cy.contains("Sign in", { timeout: 20000, matchCase: false }).should(
      "be.visible"
    );
  });

  restoreQuickBooksSession();

  cy.log("Step 3: Refreshing QuickBooks page to apply session");
  cy.origin(INTUIT_ORIGIN, () => {
    cy.reload();

    cy.contains("Let's get you in to Quickbooks", {
      timeout: 20000,
      matchCase: false,
    }).should("be.visible");
  });

  cy.wait(4000);
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
  cy.origin(INTUIT_ORIGIN, () => {
    cy.log("Selecting saved QuickBooks account");
    cy.get('div[data-testid="AccountChoiceIdentifier_0"]', {
      timeout: 20000,
    })
      .should("be.visible")
      .click({ force: true });

    cy.log("Verifying password verification header");
    cy.get("h1#passwordVerificationHeader", { timeout: 20000 }).should(
      "be.visible"
    );

    cy.log("Entering saved QuickBooks password");
    cy.get('input[data-testid="currentPasswordInput"]', { timeout: 20000 })
      .should("be.visible")
      .clear()
      .type("iZmY4gm:M.aR!B8", { log: false });

    cy.log("Continuing with password verification");
    cy.get('button[data-testid="passwordVerificationContinueButton"]', {
      timeout: 20000,
    })
      .should("be.enabled")
      .click({ force: true });
  });

});

When("I select firm on Quickbook", () => {
  cy.origin("https://appcenter.intuit.com", () => {
    cy.contains("div", "Please select your company", {
      timeout: 25000,
      matchCase: false,
    }).should("be.visible");

    cy.get('input[data-testid="__textField"]', { timeout: 20000 })
      .should("be.visible")
      .click({ force: true });

    cy.get("#idsDropdownTypeahead1-item-0", { timeout: 20000 })
      .should("be.visible")
      .click({ force: true });

    cy.get("button.btn-next", { timeout: 20000 })
      .should("be.enabled")
      .click({ force: true });

    cy.contains("span", "Connect", {
      timeout: 20000,
      matchCase: false,
    })
      .parents("button")
      .should("be.enabled")
      .click({ force: true });
  });
});

Then("I should see Quickbook Connected", () => {
  cy.get('dx-button[aria-label="Disconnect"] .dx-button-text', {
    timeout: 25000,
  }).should("be.visible");
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

When("I click Disconnect to Quickbooks button on ERP screen", () => {
  cy.contains("span", "Disconnect", { timeout: 15000, matchCase: false })
    .should("be.visible")
    .click({ force: true });
});

Then("i Should see Disconnect confirmation modal", () => {
  cy.contains("label", "Are you sure you want to disconnect?", {
    timeout: 15000,
    matchCase: false,
  }).should("be.visible");
});

When("I click on Confirm button on modal", () => {
  cy.contains("span", "Confirm", { timeout: 15000, matchCase: false })
    .should("be.visible")
    .click({ force: true });
});

When("I click on Confirm button on diconnect modal", () => {
  cy.contains("span", "Confirm", { timeout: 15000, matchCase: false })
    .should("be.visible")
    .click({ force: true });
});

Then("I should see Success message", () => {
  cy.contains("label", "SUCCESS", { timeout: 15000, matchCase: false }).should(
    "be.visible"
  );
});

Then("I should see Quickbook disconnect button", () => {
  cy.get("div.erp-quickbooks-btn", { timeout: 20000 }).should("be.visible");
});
