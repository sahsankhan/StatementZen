class EmailSettingsPage {
  getEmailSettingsSidebarButton() {
    return cy.xpath("//div[contains(@class, 'dx-item-content') and span[normalize-space()='Email Settings']]");
  }

  clickEmailSettingsSidebarButton() {
    this.getEmailSettingsSidebarButton().scrollIntoView().should("be.visible").click({ force: true });
  }

  getEmailTemplatesScreenHeading() {
    return cy.xpath("//div[normalize-space()='Email Templates']");
  }

  getEmailAutomationTab() {
    return cy.get("div.font-light.cursor-pointer.text-gray-400");
  }

  clickEmailAutomationTab() {
    this.getEmailAutomationTab().scrollIntoView().should("be.visible").click({ force: true });
  }

  getUniqueEmailHeading() {
    return cy.xpath("//h5[text()='Your Unique Email Address']");
  }

  getCopyEmailButton() {
    return cy.xpath("//div[contains(@class,'dx-button-content')]/span[text()='Copy']");
  }

  clickCopyEmailButton() {
    this.getCopyEmailButton().scrollIntoView().should("be.visible").click({ force: true });
  }

  getExtractedEmailsSearchInput() {
    return cy.xpath("//input[@placeholder='Search...' and @aria-label='Search in the data grid']");
  }

  searchExtractedEmail(keyword) {
    this.getExtractedEmailsSearchInput().should("be.visible").clear().type(keyword);
  }

  getSearchResultByText(text = "Global Enterprises") {
    return cy.xpath(`//td[contains(., '${text}')]`);
  }

  getReplyToInput() {
    return cy.xpath("(//input[@placeholder='Input your email reply to'])[1]");
  }

  enterReplyToEmail(email) {
    this.getReplyToInput().should("be.visible").clear().type(email);
  }

  getSaveTemplateButton() {
    return cy.xpath("//span[text()='Save Template']");
  }

  clickSaveTemplateButton() {
    this.getSaveTemplateButton().scrollIntoView().should("be.visible").click({ force: true });
  }

  getToastMessageByText(messageText = "Save Successfully") {
    const normalized = messageText.replace(/^["']|["']$/g, "").trim();
    return cy.contains("div.dx-toast-message", normalized, { matchCase: false });
  }

  getEmailCopiedToast() {
    return cy.contains("div.dx-toast-message", "Email address copied to clipboard", { matchCase: false });
  }
}

export default EmailSettingsPage;

