describe('Fixed LoginYopmail Automation', () => {
  it('executes LoginYopmail BDD steps with element coverage fixes', () => {
    cy.visit('https://statementzen.com/sign-in/');
    cy.wait(3000); // Wait for page to fully load
    cy.screenshot('01-login-page-loaded');
    // Step: Given I am on the login page https://statementzen.com/sign-in/
    cy.visit('https://statementzen.com/sign-in/', { failOnStatusCode: false });
    cy.wait(3000);
    cy.screenshot('02-login-page');
    // Step: And I enters email "statement.aktest2@yopmail.com" in email field
    cy.log('Looking for email input field...');
    
    // Wait for page to be fully interactive
    cy.get('body').should('be.visible');
    cy.wait(1000);
    
    // Try to find and interact with email field, handling coverage issues
    cy.get('input[type="email"], input[name="email"], input[id="otp-email"]').should('be.visible').then(($input) => {
      // Scroll element into view
      cy.get('input[type="email"], input[name="email"], input[id="otp-email"]').scrollIntoView();
      cy.wait(500);
      
      // Clear any existing content and type email
      cy.get('input[type="email"], input[name="email"], input[id="otp-email"]').clear().type('statement.aktest2@yopmail.com', { force: true });
    });
    cy.wait(2000);
    cy.screenshot('03-email-entered');
    // Step: And I click on "Send One Time Code" button
    cy.log('Looking for Send One Time Code button...');
    
    // Wait for button to be visible and clickable
    cy.get('button, input[type="submit"]').contains('Send One Time Code').should('be.visible').then(($button) => {
      // Scroll button into view
      cy.get('button, input[type="submit"]').contains('Send One Time Code').scrollIntoView();
      cy.wait(500);
      
      // Click with force to handle coverage issues
      cy.get('button, input[type="submit"]').contains('Send One Time Code').click({ force: true });
    });
    cy.wait(3000);
    cy.screenshot('04-otp-sent');
    // Step: And I visit https://yopmail.com/en/
    cy.visit('https://yopmail.com/en/', { failOnStatusCode: false });
    cy.wait(3000);
    cy.screenshot('05-yopmail-loaded');
    // Step: And I enter email "statement.aktest2@yopmail.com" in email field
    cy.log('Looking for yopmail email input...');
    cy.get('input[name="login"], input[placeholder*="email"], input[type="text"]').scrollIntoView();
    cy.wait(500);
    cy.get('input[name="login"], input[placeholder*="email"], input[type="text"]').type('statement.aktest2@yopmail.com', { force: true });
    cy.wait(1000);
    cy.screenshot('06-yopmail-email-entered');
    // And I click on "Verify One Time Code" button - No automation mapping found
    // Then I should see "My Account" heading - No automation mapping found
  });
});