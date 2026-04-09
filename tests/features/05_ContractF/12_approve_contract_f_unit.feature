@contractF @contractFUnit
Feature: Contract F - Open Contract Details for Approval on Unit Property

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  And broker uses Contract F data set key "unit-18327-2019"

@approveContractFUnit
Scenario: Broker opens created Contract F details page for approval handling on Unit property
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And broker enters the created Contract F number
  And broker clicks on Search button to find contract F
  And broker clicks on searched Contract F result
  Then broker should see Contract F details page with seller and buyer approval links
  When broker opens Seller approval link for Contract F
  Then signatory page loads and broker clicks Get Token for Contract F
  And broker should see searched Contract F number on signatory page
  When broker accepts terms and conditions on Contract F signatory page
  And broker submits Contract F approval
  And broker confirms approval on popup for Contract F
  Then broker should see Contract F approval success message "Your request has been accepted successfully. Waiting for other parties to complete their signatures."
  And broker returns to Contract F details tab and verifies seller approval date is today
  When broker opens Buyer approval link for Contract F
  Then signatory page loads and broker clicks Get Token for Contract F
  And broker should see searched Contract F number on signatory page
  When broker accepts terms and conditions on Contract F signatory page
  And broker submits Contract F approval
  And broker confirms approval on popup for Contract F
  Then broker should see Contract F approval success message "Your request has been accepted successfully. All parties have completed their signatures."
  And broker refreshes Contract F details page again
  And broker closes popup message on Contract F details page
  Then broker verifies Contract F number on details page
  And broker should see Required Documents for RT Office section on Contract F details page
  When broker clicks Proceed to upload button on Contract F details page
  Then system should redirect broker to upload documents screen for Contract F
  And broker scans required documents count and locators on upload documents screen for Contract F
  When broker uploads different sample documents and enters titles on upload documents screen for Contract F
  And broker clicks Activate button on upload documents screen for Contract F
  Then upload activation page loads and broker closes popup message for Contract F
