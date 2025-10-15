import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import OrangeHrmPage from "../pageObjects/orangeHrmPage";

const page = new OrangeHrmPage();

Given("I visit login page {string}", (arg1) => {
	page.visit(arg1);
});

When("I enter username {string}", (arg1) => {
	// Zoho auth is hosted on accounts.zoho.com – handle cross-origin
	cy.url().then((url) => {
		if (/accounts\.zoho\.(com|eu|in)/i.test(url)) {
			cy.origin(new URL(url).origin, { args: { username: arg1 } }, ({ username }) => {
				cy.get('#login_id, [name="login_id"], input[type="email"], [name="email"]').should('be.visible').clear().type(username);
				cy.get('#nextbtn, button[type="submit"], button:contains("Next")').click({ force: true });
			});
		} else {
			// If not yet redirected, try typing directly on current origin
			page.getUsernameInput().clear().type(arg1);
		}
	});
});

When("I enter password {string}", (arg1) => {
	cy.url().then((url) => {
		if (/accounts\.zoho\.(com|eu|in)/i.test(url)) {
			cy.origin(new URL(url).origin, { args: { password: arg1 } }, ({ password }) => {
				cy.get('#password, [name="password"], input[type="password"]').should('be.visible').clear().type(password);
			});
		} else {
			page.getPasswordInput().should('be.visible').clear().type(arg1);
		}
	});
});

When("I click on login button", () => {
	cy.url().then((url) => {
		if (/accounts\.zoho\.(com|eu|in)/i.test(url)) {
			cy.origin(new URL(url).origin, () => {
				cy.get('#nextbtn, button[type="submit"], button:contains("Sign in"), button:contains("Log in"), button:contains("Login")').click({ force: true });
			});
		} else {
			page.clickLogin();
		}
	});
});

Then("I should see {string} heading", (arg1) => {
	page.getHeading(arg1).should('be.visible');
});


