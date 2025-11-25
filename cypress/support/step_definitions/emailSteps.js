import { When, Then } from "@badeball/cypress-cucumber-preprocessor";
import EmailSettingsPage from "../pageObjects/emailSettingsPage";

const emailSettingsPage = new EmailSettingsPage();

When("I click on Email Settings button on the left sidebar", () => {
  emailSettingsPage.clickEmailSettingsSidebarButton();
});

When("I click on Email Automation tab", () => {
  emailSettingsPage.clickEmailAutomationTab();
});

Then("I should see Email Templates screen", () => {
  emailSettingsPage.getEmailTemplatesScreenHeading().should("be.visible");
});

Then("I should see Your Unique Email Address heading", () => {
  emailSettingsPage.getUniqueEmailHeading().should("be.visible");
});

When('I enter Email {string} in reply to field', (email) => {
  const randomFourDigits = Math.floor(1000 + Math.random() * 9000);
  const [localPart, domainPart = ""] = email.split("@");
  const uniqueEmail =
    localPart && domainPart
      ? `${localPart}${randomFourDigits}@${domainPart}`
      : `${email}${randomFourDigits}`;

  cy.log(`Generated reply-to email: ${uniqueEmail}`);
  emailSettingsPage.enterReplyToEmail(uniqueEmail);
});

When("I click on Save Template button", () => {
  emailSettingsPage.clickSaveTemplateButton();
});

When("I click on Copy Email button", () => {
  emailSettingsPage.clickCopyEmailButton();
});

Then('I should see "{string}" save validation message', (messageText) => {
  emailSettingsPage.getToastMessageByText(messageText).should("be.visible");
});

Then("I should see {string} in search results", (resultText) => {
  emailSettingsPage.getSearchResultByText(resultText).should("be.visible");
});

Then("I should see Email copied to clipboard validation message", () => {
  emailSettingsPage.getEmailCopiedToast().should("be.visible");
});

Then('I should see "Save Successfully" save validation message', () => {
  emailSettingsPage.getToastMessageByText("Save Successfully").should("be.visible");
});

When("I search {string} in extracted emails search box", (searchTerm) => {
  emailSettingsPage.searchExtractedEmail(searchTerm);
});

