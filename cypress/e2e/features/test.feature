Feature: Test Feature

  Scenario: Login to HRM
    Given I visit login page "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login"
    When I enter username "Admin"
    And I enter password "admin123"
    And I click on login button
    Then I should see "Dashboard" heading
  