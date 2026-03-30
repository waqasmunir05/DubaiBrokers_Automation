@contractB
Feature: Contract B - Cancel Contract Request

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@cancelContractB
Scenario: User cancels newly approved Contract B
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And broker enters the created Contract B number
  And broker clicks on Search button to find contract B
  And broker clicks on searched Contract B result
  And broker opens searched Contract B details for cancellation
  And broker clicks Contract B cancel button
  And broker confirms Contract B cancellation popup with Yes
  Then broker should see Contract B cancellation pending success message
