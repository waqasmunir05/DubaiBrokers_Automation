@login
Feature: Login with Emirates ID

Scenario: User logs in with Emirates ID
  Given I open the DLD login page
  When I select "Emirates ID" login option
  And I enter emirates id "784190168572845"
  And I click Send OTP for Emirates ID
  Then I should see OTP verification screen
  
