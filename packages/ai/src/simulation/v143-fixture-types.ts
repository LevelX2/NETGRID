export type V143ExploitFixture = {
  fixtureId: string;
  title: string;
  category: string;
  expectedBadBehavior: string;
  expectedGoodBehavior: string;
  hiddenInfoSafe: boolean;
};

export type V143ExploitRegressionResult = {
  fixtureId: string;
  passed: boolean;
  message: string;
};
