@contractF
@fromSearch
@disabled
Feature: Contract F - Run from Contract A search

Scenario: Start Contract F flow from saved Contract A search
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And broker enters the saved Contract A number for Contract F
  And I click on Search button to find contract
  And I click on searched contract result
  And broker clicks on Create Unified Sale Contract (F)
  And broker selects Contract B for Unified Sale Contract (F)
  And broker enters the saved Contract B number in Contract F prompt
  And broker clicks Proceed in Contract F prompt
  Then broker should see Contract F creation form
  And broker clicks Save and Continue in Contract F form
  Then broker should see Owner 1 on Contract F owner details page
  And broker captures owner name on Contract F owner details page
  When broker clicks Save and Continue in Contract F form
  Then broker should see Buyer 1 on Contract F buyer details page
  When broker clicks Save and Continue in Contract F form
  Then broker should see Buyer's Share on Contract F page
  When broker clicks Save and Continue in Contract F form
  Then broker should see Tenancy Information on Contract F page
  When broker clicks Save and Continue in Contract F form
  Then broker should see Financial Information on Contract F page
  And broker enters sell price 780000 on Contract F financial page
  And broker enters deposit amount 78000 on Contract F financial page
  And broker selects saved owner name in Cheque Deposit Holder on Contract F financial page
  And broker selects Confiscation of security deposit as Yes on Contract F financial page
  And broker selects Yes for mortgage on Contract F financial page
  When broker clicks Save and Continue in Contract F form
  Then broker should see Payment Plan on Contract F page
  And broker selects Remaining amount will be paid on transaction date as Yes on Contract F payment plan page
  And broker enters random cheque number on Contract F payment plan page
  And broker selects cheque date 10 days from today on Contract F payment plan page
  And broker selects Abudhabi Islamic Bank as bank name on Contract F payment plan page
  When broker clicks Save and Continue in Contract F form
  Then broker should see Contract Information on Contract F page
  And broker selects Contract Start date 5 days from today on Contract F Contract Information page
  And broker selects Contract End Date 2 months from Start Date on Contract F Contract Information page
  When broker clicks Save and Continue in Contract F form
  Then broker should see Seller Broker and Buyer Broker commission page on Contract F
  When broker clicks Save and Continue in Contract F form
  Then broker should see DLD Registration Fees page on Contract F
  When broker clicks Save and Continue in Contract F form
  Then broker should see Notes page on Contract F
  When broker clicks Save and Continue in Contract F form
  Then broker should see Additional Terms and Conditions page on Contract F
  And broker clicks Add button on Additional Terms and Conditions page on Contract F
  And broker enters random meaningful English text on Additional Terms and Conditions page on Contract F
  And broker enters random meaningful Arabic text on Additional Terms and Conditions page on Contract F
  When broker clicks Save and Continue in Contract F form
  Then broker should see Contract F preview page
  And broker should see entered sell price deposit and contract end date on Contract F preview page
  When broker accepts the terms and conditions on Contract F preview page
  And broker clicks Submit Contract for Approval on Contract F preview page
  Then broker should see Contract F submitted successfully message
  And broker stores active Contract F number for reuse
  And broker pauses on Contract F final flow for observation
