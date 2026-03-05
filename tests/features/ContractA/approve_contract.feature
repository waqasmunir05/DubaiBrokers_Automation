@contractA
Feature: Contract A - Owner Approves Contract with OTP

Background:
  # Login once before running Contract A approval tests
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@approveContract
Scenario: Owner Approves Contract A with OTP
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract


Examples:
  | contractNumber |
  | AUTO_REFERENCE |
