describe('Debug LoginYopmail Automation', () => {
  it('executes LoginYopmail BDD steps with debugging', () => {
    cy.visit('https://statementzen.com/sign-in/');
    cy.wait(3000); // Wait for page to fully load
    cy.screenshot('01-login-page-loaded');
    
    // Debug: Log all input fields on the page
    cy.get('input').then(($inputs) => {
      cy.log('Found ' + $inputs.length + ' input fields');
      $inputs.each((index, input) => {
        cy.log('Input ' + index + ': type=' + input.type + ', name=' + input.name + ', placeholder=' + input.placeholder + ', id=' + input.id);
      });
    });
    // Step: Given I am on the login page https://statementzen.com/sign-in/
    cy.visit('https://statementzen.com/sign-in/', { failOnStatusCode: false });
    cy.wait(3000);
    cy.screenshot('02-login-page');
    // Step: And I enters email "statement.aktest2@yopmail.com" in email field
    cy.log('Looking for email input field...');
    
    // Try multiple selectors for email field
    cy.get('body').then(($body) => {
      if ($body.find('input[name="email"]').length > 0) {
        cy.log('Found input[name="email"]');
        cy.get('input[name="email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[type="email"]').length > 0) {
        cy.log('Found input[type="email"]');
        cy.get('input[type="email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[placeholder*="email"]').length > 0) {
        cy.log('Found input[placeholder*="email"]');
        cy.get('input[placeholder*="email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[placeholder*="Email"]').length > 0) {
        cy.log('Found input[placeholder*="Email"]');
        cy.get('input[placeholder*="Email"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[name="login_id"]').length > 0) {
        cy.log('Found input[name="login_id"]');
        cy.get('input[name="login_id"]').type('statement.aktest2@yopmail.com');
      } else if ($body.find('input[id="login_id"]').length > 0) {
        cy.log('Found input[id="login_id"]');
        cy.get('input[id="login_id"]').type('statement.aktest2@yopmail.com');
      } else {
        cy.log('No email field found, trying generic input');
        cy.get('input').first().type('statement.aktest2@yopmail.com');
      }
    });
    cy.wait(2000);
    cy.screenshot('03-email-entered');
    // Step: And I click on "Send One Time Code" button
    cy.log('Looking for Send One Time Code button...');
    
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Send One Time Code")').length > 0) {
        cy.log('Found button:contains("Send One Time Code")');
        cy.get('button:contains("Send One Time Code")').click();
      } else if ($body.find('input[value*="Send One Time Code"]').length > 0) {
        cy.log('Found input[value*="Send One Time Code"]');
        cy.get('input[value*="Send One Time Code"]').click();
      } else if ($body.find('button[type="submit"]').length > 0) {
        cy.log('Found button[type="submit"]');
        cy.get('button[type="submit"]').click();
      } else {
        cy.log('No Send OTP button found, trying generic button');
        cy.get('button').first().click();
      }
    });
    cy.wait(3000);
    cy.screenshot('04-otp-sent');
    // Step: And I visit https://yopmail.com/en/
    cy.visit('https://yopmail.com/en/', { failOnStatusCode: false });
    cy.wait(3000);
    cy.screenshot('05-yopmail-loaded');
    // Step: And I enter email "statement.aktest2@yopmail.com" in email field
    cy.log('Looking for yopmail email input...');
    cy.get('input[name="login"], input[placeholder*="email"], input[type="text"]').type('statement.aktest2@yopmail.com');
    cy.wait(1000);
    cy.screenshot('06-yopmail-email-entered');
    // And I click on "Verify One Time Code" button - No automation mapping found
    // Then I should see "My Account" heading - No automation mapping found
  });
});