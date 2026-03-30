@sessionToken @sessionTokenDisabled @longRunning
Feature: Session Expiry Disabled Validation

  Background:
    Given I open the DLD login page
    When I select "Username" login option
    And I enter username "majed.1015"
    And I enter password "654321"
    And I click on "Login"
    Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"
    When I land on the dashboard
    And I click on "Contracts" tab
    And I close the popup message

  @sessionTokenDisabledNoExpiryAfter20m
  Scenario: Session does not expire after 20 minutes when expiry setting is disabled
    When broker performs person search in Contract B to refresh session token
    And broker waits 21 minutes for session token validation
    And broker searches Emirates ID in Contract B after idle period
    Then broker should not see session expired popup message
    And broker should still be logged in as "MAJED AHMAD MAJED SAIF ALMHEIRI"
