@contractA
Feature: Contract A - Cancel Contract Request

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"

@cancelContract
Scenario: Broker Requests Contract Cancellation
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I click on contract to view details
  And I wait for cancel button to appear
  And I click on cancel action icon
  And I confirm cancellation on popup
  Then I should see cancellation request success message
