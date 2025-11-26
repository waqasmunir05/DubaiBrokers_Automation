Feature: Login with Username and Password

@smoke @username
Scenario Outline: User logs in using Username and Password
  Given I open the DLD login page
  When I select "Username" login option
  And I enter username "<username>"
  And I enter password "<password>"
  And I click on "Login"
  Then I should see logged-in username as "<expectedUsername>"

Examples:
  | username       | password | expectedUsername                        |
  | majed.1015     | 654321   | MAJED AHMAD MAJED SAIF ALMHEIRI         |
