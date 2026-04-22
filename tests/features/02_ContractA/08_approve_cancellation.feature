@contractA
Feature: Contract A - Approve Contract Cancellation

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"

@approveCancellation
Scenario: Owner Approves Contract Cancellation with OTP
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I open the approval link
  And I click on submit button for cancellation
  And I confirm cancellation approval on popup
  Then I should see success message "Contract cancelation has been done successfully"
