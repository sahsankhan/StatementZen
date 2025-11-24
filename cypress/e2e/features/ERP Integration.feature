Feature: ERP Integration Feature

  Scenario: Complete ERP Integration Flow - Login and Xero Connection
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Settings button on the left sidebar
    Then I should see "ERP Integration" screen
    When I click Connect to Xero button on ERP screen
    And I perform Xero login
    And I click on Not now button
    Then I should see "StatementZen wants access" screen
    When I click on Select Organization Dropdown
    And I select "new organization" from dropdown
    And I click on Allow access button
    Then I should see Xero Connected

    When I click on disconnect Xero button
    And I click on disconnect "new organization" button
    Then I should see Disconnect confirmation modal
    When I click on Confirm button on modal
    Then I should see connect button on "new organization" card

    When I click on Xero disconnect button
    Then I should see Xero connect button


  Scenario: Complete ERP Integration Flow - Statement Zen and Quickbooks Connection
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Settings button on the left sidebar
    Then I should see "ERP Integration" screen
    When I click Connect to Quickbooks button on ERP screen
    And I perform Quickbooks login
    And I select firm on Quickbook
    Then I should see Quickbook Connected

  Scenario: Complete ERP Integration Flow - Statement Zen and Quickbooks Connection
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Settings button on the left sidebar
    Then I should see "ERP Integration" screen
    When I click Disconnect to Quickbooks button on ERP screen
    Then i Should see Disconnect confirmation modal
    When I click on Confirm button on diconnect modal
    Then I should see Success message
    And I should see Quickbook disconnect button
   

