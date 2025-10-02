class LoginPage {

  getSignInHeader() {
    return cy.xpath("//h2/span[contains(normalize-space(.), 'Sign in')]");
  }
  
  enterEmail(useremail) {
    cy.get('input[placeholder="Enter your username or e-mail"]', { timeout: 20000 }).clear().type(useremail);
  }

  getHeadingByText(text) {
    return cy.xpath(`//h2[normalize-space(text())='${text}']`);
  }

    getButtonByText(text) {
    return cy.xpath(`//button[normalize-space(text())='${text}']`);
  }

    getDenyButton() {
    return cy.xpath("(//button[normalize-space(text())='Deny'])[2]");
  }

    getOtpInput() {
    return cy.get("input#otp-code");
  }

    getLinkByText(text) {
    return cy.xpath(`//a[normalize-space(text())='${text}']`);
  }
  
    getMessageByText(text) {
    return cy.xpath(`//span[normalize-space(text())='${text}']`);
  }

}

export default LoginPage;