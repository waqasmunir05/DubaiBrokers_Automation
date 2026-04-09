@contractA @database @landContractA
Feature: Contract A - Create New Contract on Land Property

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"

@createContractLand
Scenario: Create New Contract A on a Land Property using Date of Birth verification
  Given broker uses Contract F data set key "land-434-2026"
  And I cancel previous approved Contract F via support API if available
  And I reset contract status for certificate "434" year "2026"
  And I reset Contract F status for certificate "434" year "2026"
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I click on "Create Contract A" in the left panel
  Then I should see owner selection options
  When I select "Owner Person" option
  Then I should see property validation form
  When I enter Certificate Number "434"
  And I select Certificate Year "2026"
  And I select Property Type "Land"
  And I select Owner Verification Type "Date of Birth"
  And I select "Date of Birth" from the list
  Then I should see "Date of Birth" field displayed
  When I enter "Date of Birth" value "01/07/1971"
  And I click on "Save & Close" button
  Then I should see "Property Information" details screen
  When I select "Residential" from Usage dropdown
  And I click on "Save and Continue" button
  Then I should see "Owner Details" details screen
  When I select "Yes" for Green List question
  When I click on the checkbox
  And I click on "I Confirm" button
  And I click on "Save and Continue" button
  Then I should see "Tenancy Information" details screen
  When I click on tenancy confirmation checkbox
  And I click on "Save and Continue" button
  Then I should see "Property Financial Information" details screen
  When I enter Sell Price "100000"
  And I click on "Save and Continue" button
  Then I should see "Commission and Duration" details screen
  When I select Contract Start date 2 days from today
  And I select Contract End date 3 months from start date
  And I select Commission as paid and enter amount "20000"
  And I select NOC from developer as Yes
  And I select Seller covering marketing fee as Yes
  And I select Is Exclusive as No
  And I click on "Save & Close" button
  And I enter notes for testing
  And I click on "Save and Continue" button
  Then I should see preview page with terms and conditions
  When I click on terms and conditions checkbox
  And I click on Submit Contract for Approval button
  Then I should see success message Your contract has been submitted successfully
