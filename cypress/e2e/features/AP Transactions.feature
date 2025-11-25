Feature: AP Transactions Feature

 Scenario: AP Transaction - user should see upload file validation message
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Import AP Transactions button on the left sidebar
    Then I should see "Upload data from your AP Transactions to Statementzen" screen
    # When I click on Click to upload section
    # And I upload PDF file "VENDOR_Ben Tayato Co"
    # # Then I should see PDF file uploaded successfully

 Scenario: AP Transaction - user should see upload file validation message
    Given I am on the login page
    And I enters email "automationtesting077@gmail.com"
    And I click on "Send One Time Code" button
    And I enter OTP code
    And I click on "Verify One Time Code" button
    Then I should see "My Account" heading
    When I click on "LAUNCH STATEMENT ZEN APP" button on Dashboard
    Then I should see "Highlight" screen
    When I click on Import AP Transactions button on the left sidebar
    Then I should see "Upload data from your AP Transactions to Statementzen" screen
    When I click continue button on Import AP Transactions screen
    Then I should see "Please select a file" validation message

