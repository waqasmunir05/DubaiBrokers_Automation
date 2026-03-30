@contractB
Feature: Contract B - Extend Contract Request

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@extendContractB
Scenario: Broker Requests Contract B Extension
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And broker enters the created Contract B number
  And broker clicks on Search button to find contract B
  And broker clicks on searched Contract B result
  And broker clicks on contract to view details in contract B
  And broker clicks on extend action icon in contract B
  And broker selects new Contract B End date 3 months from today
  And broker clicks on Continue button for Contract B extension
  Then broker should see Contract B extension request success message
