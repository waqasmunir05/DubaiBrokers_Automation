import { Before, After } from '@cucumber/cucumber';
import { World } from './world';

// Before each scenario: initialize browser and page
Before(async function (this: World) {
  await this.init();
});

// After each scenario: cleanup browser and page
After(async function (this: World) {
  await this.cleanup();
});
