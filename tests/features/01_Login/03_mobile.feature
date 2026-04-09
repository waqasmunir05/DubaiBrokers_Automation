@login
Feature: Login with Mobile Number

Scenario: User logs in with Mobile Number
  Given I open the DLD login page
  When I select "Mobile" login option
  And I enter mobile number "0558895363"
  And I click Send OTP for Mobile
  And I enter OTP "123456"
  And I click on Verify
  Then I should see Pending Requests tab on logged in page
