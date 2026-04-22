@contractA
Feature: Contract A - Extend Contract Request

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"

@extendContract
Scenario: Broker Requests Contract Extension
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I click on contract to view details
  And I click on extend action icon
  And I select new Contract End date 4 months from today
  And I click on Continue button for extension
  Then I should see extension request success message
