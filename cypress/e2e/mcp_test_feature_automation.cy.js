describe('MCP Automated BDD Test', () => {
  it('executes test.feature steps dynamically via MCP server', () => {
    cy.visit('https://support.orangehrm.com/portal/en/signin', { failOnStatusCode: false });
    cy.get('input[name="username"], input[placeholder*="username"], input[placeholder*="Username"], input[type="email"]').type('Admin');
    cy.get('input[name="password"], input[type="password"]').type('admin123');
    cy.get('button[type="submit"], button:contains("Login"), button:contains("Sign in"), input[type="submit"], button:contains("Log in")').click();
    cy.contains('Dashboard', { matchCase: false }).should('be.visible');
  });
});










