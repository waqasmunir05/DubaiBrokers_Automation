@contractA
Feature: Contract A - Approve Contract Extension

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"

@approveExtension
Scenario: Owner Approves Contract Extension with OTP
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I open the approval link
  And I click on terms and conditions checkbox
  And I click on submit button
  And I confirm approval on popup
  Then I should see success message "Your signature request has been accepted successfully"
