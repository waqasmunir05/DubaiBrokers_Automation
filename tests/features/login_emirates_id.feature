Feature: Login with Emirates ID

@smoke @emiratesid
Scenario Outline: User logs in using Emirates ID and verifies user name
  Given I open the DLD login page
  When I select "Emirates ID" login option
  And I enter Emirates ID "<emiratesId>"
  And I click on Send OTP
  And I enter OTP "<otp>"
  And I click on Verify
  Then I should see logged in username "<expectedUsername>"

Examples:
  | emiratesId         | otp     | expectedUsername |
  | 784198657419044    | 123456  | WAQAS MUNIR      |
