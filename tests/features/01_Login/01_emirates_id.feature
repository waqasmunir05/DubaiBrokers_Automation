@login
Feature: Login with Emirates ID

Scenario: User logs in with Emirates ID
  Given I open the DLD login page
  When I select "Emirates ID" login option
  And I enter emirates id "784199271234512F"
  And I click on "Send OTP" button
  Then I should see OTP verification screen
