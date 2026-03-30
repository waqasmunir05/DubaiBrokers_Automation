@sessionToken @longRunning
Feature: Session Token Validation

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

  @sessionTokenSliding10m
  Scenario: Session remains active when user performs action before 10 minutes
    When broker performs person search in Contract B to refresh session token
    And broker waits 9 minutes for session token validation
    And broker performs person search in Contract B to refresh session token
    Then broker should still be logged in as "MAJED AHMAD MAJED SAIF ALMHEIRI"
    When broker waits 9 minutes for session token validation
    And broker performs person search in Contract B to refresh session token
    Then broker should still be logged in as "MAJED AHMAD MAJED SAIF ALMHEIRI"

  @sessionTokenMax20m
  Scenario: Session expires after maximum 20 minutes even with no further activity
    When broker performs person search in Contract B to refresh session token
    And broker waits 21 minutes for session token validation
    And broker searches Emirates ID in Contract B after idle period
    Then broker should be redirected to login page due to session timeout

  @sessionTokenSlidingRenewalMax20m
  Scenario: Session expires after 20 minutes even with sliding renewal
    When broker performs person search in Contract B to refresh session token
    And broker waits 9 minutes for session token validation
    And broker performs person search in Contract B to refresh session token
    Then broker should still be logged in as "MAJED AHMAD MAJED SAIF ALMHEIRI"
    When broker waits 9 minutes for session token validation
    And broker performs person search in Contract B to refresh session token
    Then broker should still be logged in as "MAJED AHMAD MAJED SAIF ALMHEIRI"
    When broker waits 3 minutes for session token validation
    And broker searches Emirates ID in Contract B after idle period
    Then broker should be redirected to login page due to session timeout
