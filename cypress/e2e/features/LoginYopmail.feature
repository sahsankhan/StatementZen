Feature: LoginYopmail

  Scenario: User should be able to Login using Yopmail
    Given I am on the login page https://statementzen.com/sign-in/
    And I enters email "statement.aktest2@yopmail.com" in email field
    And I click on "Send One Time Code" button
    And I visit https://yopmail.com/en/ 
    And I enter email "statement.aktest2@yopmail.com" in email field
    And I click next button
    Then I should see One Time Code
    When I copy OTP code
    And paste OTP code in OTP field on statementzen login page
