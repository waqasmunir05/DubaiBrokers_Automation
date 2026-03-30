@contractB
Feature: Contract B - Edit Contract

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@editContractB
Scenario: Broker edits Contract B and submits for approval
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And broker enters the created Contract B number
  And broker clicks on Search button to find contract B
  And broker clicks on searched Contract B result
  And broker clicks edit action icon in contract B
  Then broker should see Contract B edit form
  And broker selects who will represent as Buyer in contract B edit
  And broker confirms broker declaration in contract B edit
  And broker clicks Verify Buyer in contract B edit
  And broker clicks searched buyer result in contract B edit popup
  And broker enters same mobile and email as create contract B in edit
  And broker clicks Save and Continue in contract B form
  Then broker should see Property Information screen in contract B edit
  And broker changes property type from Unit to Villa in contract B edit
  And broker changes rental status from Rented to Vacant in contract B edit
  And broker clicks Save and Continue in contract B form
  Then broker should see Property Financial Information screen in contract B edit
  And broker updates budget to "800000" in contract B edit
  And broker clicks Save and Continue in contract B form
  Then broker should see Buyers Share page in contract B edit
  And broker clicks Save and Continue on Buyers Share page in contract B
  Then broker should see Commission and Duration screen in contract B
  And broker selects Contract Start Date 15 days from today in contract B
  And broker selects Contract End Date 3 months from Contract Start Date in contract B edit
  And broker edits commission amount to "25000" in contract B edit
  And broker clicks Save and Continue in contract B form
  Then broker should see Notes page in contract B
  And broker enters meaningful notes in contract B
  And broker clicks Save and Continue on Notes page in contract B
  Then broker should see Contract Preview page in contract B
  And broker clicks contract preview checkbox in contract B edit
  And broker clicks Submit Contract for Approval in contract B
  Then broker should see Contract submitted successfully in contract B
