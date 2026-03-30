@rejectCancelContract @database
Feature: Contract A - Reject Contract Cancellation

Background:
  # Reset contract status in database before creating new contract
  Given I reset contract status for certificate "18327" year "2019"
  # Login once before running Contract A tests
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@rejectCancellation
Scenario: Create, Approve, Cancel Contract and Reject Cancellation Approval
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I click on "Create Contract A" in the left panel
  Then I should see owner selection options
  When I select "Owner Person" option
  Then I should see property validation form
  When I enter Certificate Number "18327"
  And I select Certificate Year "2019"
  And I select Property Type "Unit"
  And I select Owner Verification Type "Passport"
  And I select "Passport" from the list
  Then I should see passport field displayed
  When I enter Passport "382239911"
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
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I click on "Cancel" button
  And I click on "Yes / نعم" button
  Then I should see success message "Request has been sent successfully"
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I open the approval link
  And I click on decline button
  And I confirm rejection on popup
