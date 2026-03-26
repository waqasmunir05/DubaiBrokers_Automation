@contractB
Feature: Contract B - Owner Approves Contract with OTP

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@approveContractB
Scenario: Owner Approves Contract B with OTP
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And broker enters the created Contract B number
  And broker clicks on Search button to find contract B
  And broker clicks on searched Contract B result
  And broker opens Contract B approval link
  And broker accepts terms and conditions on Contract B approval page
  And broker submits Contract B approval
  And broker confirms approval on popup for Contract B
  Then broker should see Contract B approval success message "Your signature request has been accepted successfully"
