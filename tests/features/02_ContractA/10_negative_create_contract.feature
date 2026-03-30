@negativeCreateContract
Feature: Contract A - Negative Create Contract

Scenario: Create Contract with invalid certificate number
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I click on "Create Contract A" in the left panel
  Then I should see owner selection options
  When I select "Owner Person" option
  Then I should see property validation form
  When I enter Certificate Number "183271"
  And I select Certificate Year "2019"
  And I select Property Type "Unit"
  And I select Owner Verification Type "Passport"
  And I select "Passport" from the list
  Then I should see passport field displayed
  When I enter Passport "382239911"
  And I click on "Save & Close" button
  Then I should see property not found error message

Scenario: Create Contract with invalid passport number
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"
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
  When I enter Passport "000000000"
  And I click on "Save & Close" button
  Then I should see invalid owner information error message

Scenario: Create Contract with invalid certificate year
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I click on "Create Contract A" in the left panel
  Then I should see owner selection options
  When I select "Owner Person" option
  Then I should see property validation form
  When I enter Certificate Number "18327"
  And I select Certificate Year "2000"
  And I select Property Type "Unit"
  And I select Owner Verification Type "Passport"
  And I select "Passport" from the list
  Then I should see passport field displayed
  When I enter Passport "382239911"
  And I click on "Save & Close" button
  Then I should see invalid certificate year error message

Scenario: Create Contract with invalid property type
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"
  When I land on the dashboard
  And I click on "Contracts" tab
  And I close the popup message
  And I click on "Create Contract A" in the left panel
  Then I should see owner selection options
  When I select "Owner Person" option
  Then I should see property validation form
  When I enter Certificate Number "18327"
  And I select Certificate Year "2019"
  And I select Property Type "Land"
  And I select Owner Verification Type "Passport"
  And I select "Passport" from the list
  Then I should see passport field displayed
  When I enter Passport "382239911"
  And I click on "Save & Close" button
  Then I should see invalid property type error message
