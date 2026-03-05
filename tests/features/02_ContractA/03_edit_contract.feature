@contractA
Feature: Contract A - Edit Contract with OTP Approval

Background:
  # Login once before running Contract A edit tests
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@editContract
Scenario: Broker Edits Contract A and Owner Approves with OTP
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I click on contract to view details
  And I click on edit action icon
  And I click on Save and Continue button
  And I land on Seller details page
  And I click on I confirm checkbox
  And I click on I confirm button
  And I click on Save and Continue button
  Then I should see "Tenancy Information" details screen
  And I click on Save and Continue button
  Then I should see "Property Financial Information" details screen
  And I modify sell price to "1250000"
  And I click on Save and Continue button
  Then I should see "Commission and Duration" details screen
  And I select Contract Start date 2 days from today
  And I select Contract End date 3 months from start date
  And I click on Save and Continue button
  And I enter notes for testing
  And I click on Save and Continue button
  Then I should see preview page with terms and conditions
  And I click on terms and conditions checkbox
  And I click on Submit Contract for Approval button
  Then I should see success message Your contract has been submitted successfully
