@contractB @wip
Feature: Contract B creation with Person using Emirates ID

Background:
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@createContractB
Scenario: Contract B creation with Person using Emirates ID
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
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
