import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import APTransactionsPage from "../pageObjects/apTransactionsPage.js";

const apTransactionsPage = new APTransactionsPage();

When("I click on Import AP Transactions button on the left sidebar", () => {
  apTransactionsPage.clickImportApTransactionsNavItem();
});

When("I click on Click to upload section", () => {
  apTransactionsPage.clickUploadSection();
});

When('I upload PDF file {string}', (fileName) => {
  apTransactionsPage.uploadPdfFile(fileName);
});

Then('I should see "{string}" screen', (screenText) => {
  apTransactionsPage
    .getImportScreenHeading(screenText)
    .should("be.visible");
});

When("I click continue button on Import AP Transactions screen", () => {
  apTransactionsPage.clickContinueButton();
});

Then('I should see "{string}" validation message', (message) => {
  apTransactionsPage.getValidationMessage(message).should("be.visible");
});

Then(
  'I should see "Please select a file" validation message',
  () => {
    apTransactionsPage.getValidationMessage("Please select a file").should("be.visible");
  }
);

Then("I should see PDF file uploaded successfully", () => {
  apTransactionsPage.getUploadedFileIndicator().should("be.visible");
});

