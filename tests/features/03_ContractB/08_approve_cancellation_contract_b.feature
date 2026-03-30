@contractB
Feature: Contract B - Approve Cancellation Request

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@approveCancelContractB
Scenario: Owner approves Contract B cancellation request
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And broker enters the created Contract B number
  And broker clicks on Search button to find contract B
  And broker clicks on searched Contract B result
  And broker opens Contract B approval link
  And broker clicks Yes to approve Contract B cancellation
  And broker confirms Yes on Contract B cancellation popup
  Then broker should see Contract B cancellation approval success message
  When broker clicks Contracts tab after cancellation approval
  And broker searches Contract B again after cancellation approval
  And broker should see Contract B search results after cancellation approval
  Then broker should see Contract B status as Cancelled after cancellation approval
