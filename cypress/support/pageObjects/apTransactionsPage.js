class APTransactionsPage {
  getImportApTransactionsNavItem() {
    return cy.xpath("//div[contains(@class,'dx-treeview-item')]//span[normalize-space()='Import AP Transactions']");
  }

  clickImportApTransactionsNavItem() {
    this.getImportApTransactionsNavItem().should('be.visible').click({ force: true });
  }

  getImportScreenHeading(text) {
    const normalized = text.replace(/^["']|["']$/g, '');
    return cy.xpath(`//h4[normalize-space()='${normalized}']`);
  }

  clickUploadSection() {
    cy.xpath("//label[normalize-space()='Click to Upload']").scrollIntoView().click({ force: true });
  }

  getFileInput() {
    return cy.get("input[type='file']").first();
  }

  getContinueButton() {
    return cy.xpath("//span[normalize-space()='Continue']").first();
  }

  clickContinueButton() {
    this.getContinueButton().scrollIntoView().should('be.visible').click({ force: true });
  }

  uploadPdfFile(fileName) {
    const normalized = fileName.replace(/^["']|["']$/g, '').trim();
    const pdfName = normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized}.pdf`;
    const absolutePath = pdfName === "VENDOR_Ben Tayato Co.pdf"
      ? "C:/Users/zubai/OneDrive/Desktop/SZEN automation/StatementZen/VENDOR_Ben Tayato Co.pdf"
      : `cypress/fixtures/${pdfName}`;

    this.getFileInput().selectFile(absolutePath, { force: true });
    cy.focused().type("{enter}", { force: true });
  }

  getValidationMessage(expectedText = "Please select a file") {
    const sanitized = expectedText.replace(/^["']|["']$/g, '');
    return cy.xpath(
      `//div[contains(@class,'dx-toast-message') and contains(normalize-space(), '${sanitized}')]`
    );
  }

  getUploadedFileIndicator() {
    return cy.xpath("//p[normalize-space()='VENDOR_Ben Tayato Co.pdf']");
  }
}

export default APTransactionsPage;

