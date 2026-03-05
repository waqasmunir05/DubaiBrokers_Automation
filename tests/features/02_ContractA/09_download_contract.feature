@downloadContract
Feature: Download Active Contract

Scenario: Download Contract from Active Contract Details
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  Then I should see contract details page
  When I extract and save contract expiry date as pdf password
  And I click on download contract button
  Then I should see download popup
  When I click download button in popup

