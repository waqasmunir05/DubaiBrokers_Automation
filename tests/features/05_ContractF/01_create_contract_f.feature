@contractF
Feature: Contract F - Prepare Create Contract Flow

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  And broker uses Contract F data set key "land-434-2026"
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
  And broker stores active Contract A number for Contract F use
  When broker returns to Contracts tab after approval flow for Contract F
  And I enter the created contract number
  And I click on Search button to find contract
  And I click on searched contract result
  And I open the approval link
  Then I verify edited sell price "100000" on approval page
  And I verify commission "20000" on approval page
  And I verify contract dates on approval page
  And I click on terms and conditions checkbox
  And I click on submit button
  And I confirm approval on popup
  Then I should see success message "Your signature request has been accepted successfully"
  And broker stores active Contract A number for Contract F use
  When broker returns to Contracts tab after approval flow for Contract F
  And broker clicks on Create Contract B
  And broker selects Person in contract B popup
  And broker selects Emirates ID as registration type in contract B popup
  And broker enters Emirates ID year "1986" and number "57419044" in contract B popup
  And broker selects Date of Birth "29/04/1971" from calendar in contract B popup
  And broker clicks Proceed to search in contract B popup
  And broker waits for Contract B search result and clicks it
  And broker handles response after selecting contract B search result
  And broker selects Yes on Green List in contract B form
  And broker selects passport expiry date 1 year from today in contract B form
  And broker selects passport type "Regular passport" in contract B form
  And broker selects Emirates ID expiry date 3 months from today in contract B form
  And broker enters mobile number "0558895363" in contract B form
  And broker enters email address "waqas.munir@eres.ae" in contract B form
  And broker selects Buyer radio in contract B form
  And broker accepts terms checkbox in contract B form
  And broker clicks Save and Continue in contract B form
  Then broker should see Property Information screen in contract B flow
  And broker selects "Unit" from property type lookup in contract B property information
  And broker selects "Residential" from Property Usage dropdown in contract B
  And broker selects "Rented" from Rental Status dropdown in contract B
  And broker selects "Yes" for Is Freehold question in contract B
  And broker enters "2" for Number of Rooms in contract B
  And broker enters "Marsa Dubai" for Area/Community in contract B
  And broker clicks Save and Continue in contract B form
  Then broker should see next section in contract B flow
  And broker enters budget "700000" on property financial information page in contract B
  And broker selects payment method "Cash" on property financial information page in contract B
  And broker clicks Save and Continue on Buyers Share page in contract B
  Then broker should verify percentage of buy is "100%" in contract B
  And broker clicks Save and Continue on Buyers Share page in contract B
  Then broker should see Commission and Duration screen in contract B
  And broker selects Contract Start Date 10 days from today in contract B
  And broker selects Contract End Date 2 months from Contract Start Date in contract B
  And broker selects "Yes" for Commission will be paid in contract B
  And broker enters commission amount "20000" in contract B
  And broker selects "Yes" for Is Buyer covering the marketing fees in contract B
  And broker clicks Save and Continue in contract B form
  Then broker should see Notes page in contract B
  And broker enters meaningful notes in contract B
  And broker clicks Save and Continue on Notes page in contract B
  Then broker should see Contract Preview page in contract B
  And broker clicks contract preview checkbox in contract B
  And broker clicks Submit Contract for Approval in contract B
  Then broker should see Contract submitted successfully in contract B
  And broker stores active Contract B number for Contract F use
  When broker returns to Contracts tab after approval flow for Contract F
  And broker enters the saved Contract B number for Contract F
  And broker clicks on Search button to find contract B
  And broker clicks on searched Contract B result
  And broker opens Contract B approval link
  And broker accepts terms and conditions on Contract B approval page
  And broker submits Contract B approval
  And broker confirms approval on popup for Contract B
  Then broker should see Contract B approval success message "Your signature request has been accepted successfully"
  And broker stores active Contract B number for Contract F use
  When broker returns to Contracts tab after approval flow for Contract F

@prepareContractF
Scenario: Prepare active Contract A and Contract B before Contract F process
  When broker enters the saved Contract A number for Contract F
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
  When broker selects Contract Start date 5 days from today on Contract F Contract Information page
  And broker selects Contract End Date 2 months from Start Date on Contract F Contract Information page
  And broker clicks Save and Continue in Contract F form
  Then broker should see Seller Broker and Buyer Broker commission page on Contract F
  When broker sets Seller Broker commission slider to 100% on Contract F
  And broker clicks Save and Continue in Contract F form
  Then broker should see DLD Registration Fees page on Contract F
  When broker clicks Save and Continue in Contract F form
  Then broker should see Notes page on Contract F
  When broker clicks Save and Continue in Contract F form
  Then broker should see Additional Terms and Conditions page on Contract F
  When broker clicks Add button on Additional Terms and Conditions page on Contract F
  And broker enters random meaningful English text on Additional Terms and Conditions page on Contract F
  And broker enters random meaningful Arabic text on Additional Terms and Conditions page on Contract F
  And broker clicks Save and Continue in Contract F form
  Then broker should see Contract F preview page
  And broker should see entered sell price deposit and contract end date on Contract F preview page
  When broker accepts the terms and conditions on Contract F preview page
  And broker clicks Submit Contract for Approval on Contract F preview page
  Then broker should see Contract F submitted successfully message
  And broker stores active Contract F number for reuse
