Feature: Login Feature

  Scenario: User should be able to Login with valid credentials
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading

  Scenario: User should not be able to Login with invalid OTP code
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter wrong OTP code
    And I click on "Verify One Time Code" button
    Then I should see 'Invalid or expired One-Time Code. Please try again.' message

  Scenario: User should not be able to Login with invalid email
    Given I am on the login page
    And I enters email "test@gmail.co"
    And I click on "Send One Time Code" button
    Then I should see 'User does not exist. Please register first.' message

  Scenario: User should be able to logout
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click the "Logout" button from the menu
    Then I should see Sign in Page