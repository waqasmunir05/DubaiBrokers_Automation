Feature: Login with Username and Password

Scenario: User logs in using Username and Password
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "654321"
  And I click on "Login"
  Then I should see logged-in username as "MAJED AHMAD MAJED SAIF ALMHEIRI"

@negative
Scenario: User logs in with invalid password and sees error
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "majed.1015"
  And I enter password "123456"
  And I click on "Login"
  Then I should see login error message "Login Details Not Valid"
