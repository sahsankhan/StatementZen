Feature: Email

Scenario: Email - user should be able to save email template
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Email Settings button on the left sidebar
    Then I should see Email Templates screen
    When I enter Email "test@yopmail.com" in reply to field
    And I click on Save Template button
    Then I should see "Save Successfully" save validation message

    Scenario: Email - user should be able to copy email
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Email Settings button on the left sidebar
    Then I should see Email Templates screen
    When I click on Email Automation tab
    Then I should see Your Unique Email Address heading
    And I click on Copy Email button
    # Then I should see Email copied to clipboard validation message



Scenario: Email - user should be able to search extracted emails
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Email Settings button on the left sidebar
    Then I should see Email Templates screen
    When I click on Email Automation tab
    Then I should see Your Unique Email Address heading
    When I search "global" in extracted emails search box
    Then I should see "Global Enterprises" in search results