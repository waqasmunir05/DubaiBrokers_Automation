Feature: Login with Emirates ID

Scenario: User logs in using Emirates ID and verifies user name
  Given I open the DLD login page
  When I select "Emirates ID" login option
  And I enter Emirates ID "784190168572845"
  And I click on Send OTP
  And I enter OTP "123456"
  And I click on Verify
  Then I should see logged in username "card"

@negative
Scenario: User logs in with invalid OTP and sees error
  Given I open the DLD login page
  When I select "Emirates ID" login option
  And I enter Emirates ID "784190168572845"
  And I click on Send OTP
  And I enter OTP "12345"
  And I click on Verify
  Then I should see OTP error message "Otp Code not valid or expired"
