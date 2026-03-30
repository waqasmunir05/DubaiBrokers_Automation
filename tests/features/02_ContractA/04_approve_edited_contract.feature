@contractA
Feature: Contract A - Approve Edited Contract with OTP

Background:
  # Login once before running Contract A approval tests
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@approveEditedContract
Scenario: Owner Approves Edited Contract A with OTP
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I open the approval link
  Then I verify edited sell price "1250000" on approval page
  And I verify contract dates on approval page
  And I click on terms and conditions checkbox
  And I click on submit button
  And I confirm approval on popup
  Then I should see success message "Your signature request has been accepted successfully"
