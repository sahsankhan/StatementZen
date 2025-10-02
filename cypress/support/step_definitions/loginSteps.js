import { Given, Then, When } from "@badeball/cypress-cucumber-preprocessor";
import LoginPage from "../pageObjects/loginPage";

const login = new LoginPage();


Given("I am on the login page", () => {
  cy.visit("https://statementzen.com/sign-in/", { failOnStatusCode: false, timeout: 20000 });
  login.getSignInHeader().should("be.visible");
});

When("I click on the second Deny button", () => {
  login.getDenyButton().click();
});

When("I enters email {string}", (email) => {
  cy.wait(5000);
  login.enterEmail(email || Cypress.env('validEmail'));
});


When("I click on {string} button", (buttonText) => {
  login.getButtonByText(buttonText).click();
  cy.wait(5000);
});

When("I enter OTP code", () => {
  cy.task("getOtpFromGmail").then((otp) => {
    cy.log(`OTP fetched: ${otp}`);
    login.getOtpInput().type(otp);
  });
});

When("I enter wrong OTP code", () => {
  login.getOtpInput().type("123456");
});

Then("I should see {string} heading", (headingText) => {
  login.getHeadingByText(headingText).should("be.visible");
});

When("I click the {string} button from the menu", (linkText) => {
  login.getLinkByText(linkText).click();
});

Then("I should see Sign in Page", () => {
  login.getSignInHeader().should("be.visible");
});

Then("I should see {string} message", (messageText) => {
  login.getMessageByText(messageText).should("be.visible");
});