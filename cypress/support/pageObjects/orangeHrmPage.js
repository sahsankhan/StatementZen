class OrangeHrmPage {

	visit(url) {
		cy.visit(url, { failOnStatusCode: false });
	}

	getUsernameInput() {
		return cy.get('input[name="username"], input#username, input[type="email"], input[name="email"], input[name="login_id"], input#login_id');
	}

	getPasswordInput() {
		return cy.get('input[name="password"], input#password, input[type="password"], input[name="passwd"]');
	}

	clickLogin() {
		return cy.get('button[type="submit"], input[type="submit"], button:contains("Login"), button:contains("Sign in"), button:contains("Log in"), button:contains("Next")').click({ force: true });
	}

	getHeading(text) {
		return cy.contains(text, { matchCase: false });
	}
}

export default OrangeHrmPage;


