class ERPIntegrationPage {
  
  // Dashboard elements
  getLaunchStatementZenButton() {
    // Use XPath to find link containing "Launch Statement Zen App"
    return cy.xpath("//a[contains(normalize-space(.), 'Launch Statement Zen App')]");
  }

  getButtonByText(buttonText) {
    // Dynamically locate a button using the provided text
    return cy.xpath(`//button[normalize-space(text())='${buttonText}']`);
  }

  getScreenHeading(screenText) {
    // XPath for exact match of the screen heading text
    return cy.xpath(`//h1[normalize-space(text())='${screenText}']`);
  }

  
  // Highlight screen heading
  getHeadingByText(text) {
    return cy.xpath(`//h2[normalize-space(text())='${text}']`);
  }

  // Settings button on left sidebar
  getSettingsButton() {
    return cy.xpath("//button[contains(@class, 'settings') or normalize-space(.)='Settings']");
  }

  // Alternative: Search for settings link/button
  getSettingsLink() {
    return cy.contains('Settings', { matchCase: false });
  }

  // ERP Integration screen heading
  getErpIntegrationHeading() {
    return cy.contains('ERP Integration', { matchCase: false });
  }

  // Connect to Xero button - selector for use in cy.origin()
  getConnectToXeroButtonSelector() {
    return "div[class*='erp-xero-btn']";
  }

  // Connect to Xero button - Cypress command for non-origin context
  getConnectToXeroButton() {
    return cy.get(this.getConnectToXeroButtonSelector()).first();
  }

  // Xero access screen - verify Statement Zen wants access text
  getStatementZenWantsAccess() {
    return cy.contains('Statement Zen', { matchCase: false });
  }


  // Generic heading locator
  getHeading(text) {
    return cy.xpath(`//h1[contains(text(), '${text}')] | //h2[contains(text(), '${text}')] | //h3[contains(text(), '${text}')]`);
  }

  // Generic element by text
  getElementByText(text) {
    return cy.contains(text, { matchCase: false });
  }

  // Generic modal heading
  getModalHeading(text) {
    return cy.xpath(`//*[contains(@class, 'modal') or contains(@class, 'dialog')]//*[contains(text(), '${text}')]`);
  }

  // Screen verification methods - return selector strings for use in cy.origin()
  getHighlightScreenSelector() {
    return {
      urlPattern: 'app.statementzen.com',
      bodyCheck: () => cy.get('body').should('be.visible')
    };
  }

  getErpIntegrationScreenSelector() {
    return {
      urlPattern: 'app.statementzen.com',
      textToContain: 'ERP Integration'
    };
  }

  getStatementZenWantsAccessScreenSelector() {
    return {
      urlPattern: 'login.xero.com',
      textToContain: 'Statement Zen',
      textElement: () => cy.contains('Statement Zen', { matchCase: false })
    };
  }

  getProtectXeroAccountScreenSelector() {
    return {
      urlPattern: 'login.xero.com',
      textToContain: 'Protect your Xero account'
    };
  }

  getSettingsElement() {
    return cy.contains('Settings', { matchCase: false });
  }

  // Xero login page elements - return XPath selector strings for use in cy.origin()
  getEmailFieldSelector() {
    // XPath selector for email field - try multiple strategies
    return "//input[@id='xl-form-email'] | //input[@name='Username' or @name='username' or @name='email'] | //input[@type='email'] | //input[contains(@placeholder, 'email') or contains(@placeholder, 'Email') or contains(@placeholder, 'username') or contains(@placeholder, 'Username')]";
  }

  getPasswordFieldSelector() {
    // XPath selector for password field - try multiple strategies
    return "//input[@id='xl-form-password'] | //input[@name='Password' or @name='password'] | //input[@type='password'] | //input[contains(@placeholder, 'password') or contains(@placeholder, 'Password')]";
  }

  getFieldSelectorByName(fieldName) {
    // Remove quotes if present (Cucumber may pass with or without quotes)
    const cleanFieldName = fieldName.replace(/^["']|["']$/g, '').toLowerCase();
    
    if (cleanFieldName === 'email') {
      return this.getEmailFieldSelector();
    } else if (cleanFieldName === 'password') {
      return this.getPasswordFieldSelector();
    } else {
      // Generic fallback using XPath
      const fieldNameTitle = cleanFieldName.charAt(0).toUpperCase() + cleanFieldName.slice(1);
      return `//input[@name='${cleanFieldName}' or @name='${fieldNameTitle}'] | //input[@id='${cleanFieldName}'] | //input[contains(@placeholder, '${cleanFieldName}') or contains(@placeholder, '${fieldNameTitle}')]`;
    }
  }

  // Cypress commands for non-origin context
  getEmailField() {
    return cy.get(this.getEmailFieldSelector(), { timeout: 10000 }).first();
  }

  getPasswordField() {
    return cy.get(this.getPasswordFieldSelector(), { timeout: 10000 }).first();
  }

  getCompanyDropdown() {
    // Button containing span text 'Select another organisation'
    return cy.xpath("//button[.//span[normalize-space(text())='Select another organisation']]");
  }
  
  getCompanyOption(companyName) {
    // Dynamically find the company option by name
    return cy.xpath(`//span[normalize-space(text())='${companyName}']`);
  }

  // Methods that return XPath selector strings for use in cy.origin()
  getButtonByTextSelector(buttonText) {
    return `//button[normalize-space(text())='${buttonText.replace(/^["']|["']$/g, '')}']`;
  }

  getScreenHeadingSelector(screenText) {
    const text = screenText.replace(/^["']|["']$/g, '');
    return `//h1[normalize-space(text())='${text}'] | //h2[normalize-space(text())='${text}'] | //div[normalize-space(text())='${text}']`;
  }

  getCompanyDropdownSelector() {
    return "//button[.//span[normalize-space(text())='Select another organisation']]";
  }

  getCompanyOptionSelector(companyName) {
    return `//span[normalize-space(text())='${companyName.replace(/^["']|["']$/g, '')}']`;
  }
  
}

export default ERPIntegrationPage;
