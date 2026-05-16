export type RulesBaseline = {
  rulesVersion: "26.03";
  cardTextSource: "manual";
  cardTextSnapshotId:
    | "mvp-0.1-demo"
    | "mvp-0.4-demo"
    | "mvp-0.8-demo"
    | "mvp-0.94-demo"
    | "mvp-0.95-demo"
    | "mvp-0.96-demo"
    | "mvp-0.97-demo"
    | "mvp-0.98-demo"
    | "mvp-0.99-demo";
  engineSchemaVersion:
    | "0.1.0"
    | "0.2.0"
    | "0.3.0"
    | "0.4.0"
    | "0.8.0"
    | "0.94.0"
    | "0.95.0"
    | "0.96.0"
    | "0.97.0"
    | "0.98.0"
    | "0.99.0";
  cardImplementationVersion:
    | "0.1.0"
    | "0.4.0"
    | "0.8.0"
    | "0.94.0"
    | "0.95.0"
    | "0.96.0"
    | "0.97.0"
    | "0.98.0"
    | "0.99.0";
  deviationRegistryVersion:
    | "0.1.0"
    | "0.2.0"
    | "0.3.0"
    | "0.4.0"
    | "0.8.0"
    | "0.94.0"
    | "0.95.0"
    | "0.96.0"
    | "0.97.0"
    | "0.98.0"
    | "0.99.0";
  playerViewSchemaVersion?:
    | "0.1.0"
    | "0.2.0"
    | "0.3.0"
    | "0.4.0"
    | "0.8.0"
    | "0.94.0"
    | "0.95.0"
    | "0.96.0"
    | "0.97.0"
    | "0.98.0"
    | "0.99.0";
  multiplayerSchemaVersion?:
    | "0.2.0"
    | "0.3.0"
    | "0.4.0"
    | "0.8.0"
    | "0.94.0"
    | "0.95.0"
    | "0.96.0"
    | "0.97.0"
    | "0.98.0"
    | "0.99.0";
  aiControllerSchemaVersion?:
    | "0.3.0"
    | "0.4.0"
    | "0.8.0"
    | "0.94.0"
    | "0.95.0"
    | "0.96.0"
    | "0.97.0"
    | "0.98.0"
    | "0.99.0";
  simulationSchemaVersion?:
    | "0.3.0"
    | "0.4.0"
    | "0.8.0"
    | "0.94.0"
    | "0.95.0"
    | "0.96.0"
    | "0.97.0"
    | "0.98.0"
    | "0.99.0";
};

export const MVP_0_1_BASELINE: RulesBaseline = {
  rulesVersion: "26.03",
  cardTextSource: "manual",
  cardTextSnapshotId: "mvp-0.1-demo",
  engineSchemaVersion: "0.1.0",
  cardImplementationVersion: "0.1.0",
  deviationRegistryVersion: "0.1.0",
};

export const MVP_0_2_BASELINE: RulesBaseline = {
  ...MVP_0_1_BASELINE,
  engineSchemaVersion: "0.2.0",
  deviationRegistryVersion: "0.2.0",
  playerViewSchemaVersion: "0.2.0",
  multiplayerSchemaVersion: "0.2.0",
};

export const MVP_0_3_BASELINE: RulesBaseline = {
  ...MVP_0_2_BASELINE,
  engineSchemaVersion: "0.3.0",
  deviationRegistryVersion: "0.3.0",
  playerViewSchemaVersion: "0.3.0",
  multiplayerSchemaVersion: "0.3.0",
  aiControllerSchemaVersion: "0.3.0",
  simulationSchemaVersion: "0.3.0",
};

export const MVP_0_4_BASELINE: RulesBaseline = {
  ...MVP_0_3_BASELINE,
  cardTextSnapshotId: "mvp-0.4-demo",
  engineSchemaVersion: "0.4.0",
  cardImplementationVersion: "0.4.0",
  deviationRegistryVersion: "0.4.0",
  playerViewSchemaVersion: "0.4.0",
  multiplayerSchemaVersion: "0.4.0",
  aiControllerSchemaVersion: "0.4.0",
  simulationSchemaVersion: "0.4.0",
};

export const MVP_0_8_BASELINE: RulesBaseline = {
  ...MVP_0_4_BASELINE,
  cardTextSnapshotId: "mvp-0.8-demo",
  engineSchemaVersion: "0.8.0",
  cardImplementationVersion: "0.8.0",
  deviationRegistryVersion: "0.8.0",
  playerViewSchemaVersion: "0.8.0",
  multiplayerSchemaVersion: "0.8.0",
  aiControllerSchemaVersion: "0.8.0",
  simulationSchemaVersion: "0.8.0",
};

export const MVP_0_94_BASELINE: RulesBaseline = {
  ...MVP_0_8_BASELINE,
  cardTextSnapshotId: "mvp-0.94-demo",
  engineSchemaVersion: "0.94.0",
  cardImplementationVersion: "0.94.0",
  deviationRegistryVersion: "0.94.0",
  playerViewSchemaVersion: "0.94.0",
  multiplayerSchemaVersion: "0.94.0",
  aiControllerSchemaVersion: "0.94.0",
  simulationSchemaVersion: "0.94.0",
};

export const MVP_0_95_BASELINE: RulesBaseline = {
  ...MVP_0_94_BASELINE,
  cardTextSnapshotId: "mvp-0.95-demo",
  engineSchemaVersion: "0.95.0",
  cardImplementationVersion: "0.95.0",
  deviationRegistryVersion: "0.95.0",
  playerViewSchemaVersion: "0.95.0",
  multiplayerSchemaVersion: "0.95.0",
  aiControllerSchemaVersion: "0.95.0",
  simulationSchemaVersion: "0.95.0",
};

export const MVP_0_96_BASELINE: RulesBaseline = {
  ...MVP_0_95_BASELINE,
  cardTextSnapshotId: "mvp-0.96-demo",
  engineSchemaVersion: "0.96.0",
  cardImplementationVersion: "0.96.0",
  deviationRegistryVersion: "0.96.0",
  playerViewSchemaVersion: "0.96.0",
  multiplayerSchemaVersion: "0.96.0",
  aiControllerSchemaVersion: "0.96.0",
  simulationSchemaVersion: "0.96.0",
};

export const MVP_0_97_BASELINE: RulesBaseline = {
  ...MVP_0_96_BASELINE,
  cardTextSnapshotId: "mvp-0.97-demo",
  engineSchemaVersion: "0.97.0",
  cardImplementationVersion: "0.97.0",
  deviationRegistryVersion: "0.97.0",
  playerViewSchemaVersion: "0.97.0",
  multiplayerSchemaVersion: "0.97.0",
  aiControllerSchemaVersion: "0.97.0",
  simulationSchemaVersion: "0.97.0",
};

export const MVP_0_98_BASELINE: RulesBaseline = {
  ...MVP_0_97_BASELINE,
  cardTextSnapshotId: "mvp-0.98-demo",
  engineSchemaVersion: "0.98.0",
  cardImplementationVersion: "0.98.0",
  deviationRegistryVersion: "0.98.0",
  playerViewSchemaVersion: "0.98.0",
  multiplayerSchemaVersion: "0.98.0",
  aiControllerSchemaVersion: "0.98.0",
  simulationSchemaVersion: "0.98.0",
};

export const MVP_0_99_BASELINE: RulesBaseline = {
  ...MVP_0_98_BASELINE,
  cardTextSnapshotId: "mvp-0.99-demo",
  engineSchemaVersion: "0.99.0",
  cardImplementationVersion: "0.99.0",
  deviationRegistryVersion: "0.99.0",
  playerViewSchemaVersion: "0.99.0",
  multiplayerSchemaVersion: "0.99.0",
  aiControllerSchemaVersion: "0.99.0",
  simulationSchemaVersion: "0.99.0",
};
