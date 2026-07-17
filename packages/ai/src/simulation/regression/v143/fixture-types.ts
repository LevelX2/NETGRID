export type ExploitFixture = {
  fixtureId: string;
  title: string;
  category: string;
  expectedBadBehavior: string;
  expectedGoodBehavior: string;
  hiddenInfoSafe: boolean;
};

export type ExploitRegressionResult = {
  fixtureId: string;
  passed: boolean;
  message: string;
};
