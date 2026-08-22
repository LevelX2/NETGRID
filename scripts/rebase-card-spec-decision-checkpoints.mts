import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

import { getLegalActions, hashGameState } from "../packages/engine/src/index";
import {
  buildCanonicalLegalActionInvocation,
  buildSemanticActionSetFingerprint,
  turnPlanningFingerprint,
} from "../packages/ai/src/plans/turn-planning-contracts";
import {
  assertTurnPlanCommitment,
  executionExpectationFromLegalAction,
  TURN_PLAN_COMMITMENT_SCHEMA_VERSION,
} from "../packages/ai/src/plans/turn-plan-commitment";
import { AI_DECISION_CHECKPOINT_SCHEMA_VERSION } from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-types";

const CHECKPOINT_DIRECTORY = path.resolve(
  "data/scenarios/ai-decision-checkpoints",
);
const PINNED_CS08_BASE_COMMIT = "a7f140987";
const RENT_I_CON_CHECKPOINT = "cp-disgruntled-01-post-pass-derez-d277.json";
const RENT_I_CON_INSTANCE = "runner_onr_classic_031_rent-i-con_1";
const RENT_I_CON_CAPABILITY_ID =
  "onr_classic_031_rent-i-con:break_any_subroutine_and_trash_after_run";
const TARGET_ICE_INSTANCE = "corp_onr_v1_237_data-wall_1";
const CS09_EXPECTED_RECONCILIATIONS = {
  "corp-rez-payoff-menus.json": {
    "expectation.acceptableActions.0.sourceDefinitionId":
      "onr_proteus_032_misleading-access-menus",
    "expectation.acceptableActions.0.type": "rez_ice",
    "expectation.forbiddenActions.0.type": "decline_rez",
    "expectation.planExecution.requiredAssessmentEvidence.0":
      "engine_certified_ice_rez_qualitative_encounter_defense:rd:corp.rez_ice.corp_onr_proteus_032_misleading-access-menus_1.corp_onr_proteus_032_misleading-access-menus_1",
  },
  "cp-20eb-01-background-bank-cadence-d39.json": {
    "expectation.forbiddenActions.0.actionId": undefined,
    "expectation.forbiddenActions.0.sourceDefinitionId":
      "onr_proteus_150_streetware-distributor",
    "expectation.forbiddenActions.0.type": "activated_card_ability",
  },
  "cp-20eb-06-first-early-bank-load-control-d38.json": {
    "expectation.acceptableActions.0.actionId": undefined,
    "expectation.acceptableActions.0.sourceDefinitionId":
      "onr_proteus_150_streetware-distributor",
    "expectation.acceptableActions.0.type": "activated_card_ability",
  },
  "cp-a36a-01-turn-completion-d11.json": {
    "expectation.acceptableActions.0.targetServerId": "rd",
    "expectation.planExecution.acceptableCapabilities.0":
      "allocate_server_defense",
    "expectation.planExecution.requiredAssessmentEvidence.0":
      "corp_agenda_capacity_defense_conversion:rd:corp.install_card.corp_onr_proteus_038_snowbank_1.rd.corp_onr_proteus_038_snowbank_1.1",
  },
  "cp-a36a-07-counter-bank-ready-d89.json": {
    "expectation.acceptableActions.0.sourceDefinitionId":
      "onr_v1_279_wall-of-static",
    "expectation.acceptableActions.0.targetServerId": "rd",
    "expectation.planExecution": {
      acceptablePlanKinds: ["corp.defend_servers"],
      acceptableCapabilities: ["allocate_server_defense"],
      requiredAssessmentEvidence: [
        "engine_certified_global_defense_access_probability_reduced",
      ],
    },
  },
  "cp-d153-01-pay-for-early-remote-access-d7.json": {
    "expectation.acceptableActions.0.actionId": undefined,
    "expectation.acceptableActions.0.encounterWillEndRun": false,
    "expectation.acceptableActions.0.sourceDefinitionId":
      "onr_proteus_032_misleading-access-menus",
    "expectation.acceptableActions.0.type": "continue_run",
    "expectation.forbiddenActions.0.actionId": undefined,
    "expectation.forbiddenActions.0.encounterWillEndRun": true,
    "expectation.forbiddenActions.0.sourceDefinitionId":
      "onr_proteus_032_misleading-access-menus",
    "expectation.forbiddenActions.0.type": "continue_run",
  },
} satisfies Record<string, Record<string, unknown>>;

// CS10 changes the canonical action identity and typed planning evidence for a
// small, explicitly reviewed set of checkpoints. Pin each complete expectation
// so the rebase gate still rejects every unreviewed decision change.
const CS10_EXPECTED_EXPECTATION_FINGERPRINTS = {
  "corp-rez-payoff-menus.json":
    "sha256:6c92b3ec759b6bdf22ae1bbf67ee5ee2caf880a57494eabe09ec76918fbc4913",
  "cp-20eb-01-background-bank-cadence-d39.json":
    "sha256:0477d293a54bbce05d103c7443ba5829da1c814813e0d5e2608c71d9dadfa09d",
  "cp-20eb-06-first-early-bank-load-control-d38.json":
    "sha256:db10db780f1a30b06bea770a2eefecc1bf9cb97774c680bd80d405c71a3c8bef",
  "cp-23d6-01-preserve-krash-break-target-d37.json":
    "sha256:ee40fef9e04363b8fd2d8a9a25bdfb51b56ab92cde1e5b7f4736accc54883a5d",
  "cp-424a-01-force-shield-vs-krash.json":
    "sha256:f087d746c818bcf82a71eada94024db6ef1c12b1cc20947f72d158810648ce88",
  "cp-424a-05-blocked-matchpoint-sequence.json":
    "sha256:73ce28b1930876fca36f4825b388b0e17cbcd4010cdec5d682cc7cefc0f1d336",
  "cp-5f6d-03-newsgroup-dominance-d62.json":
    "sha256:13eec003a8f95c8bd947943f41b5e01c11ed59a364e32b608933b9bfdee64dca",
  "cp-a36a-01-turn-completion-d11.json":
    "sha256:dad4e1ac7337d7edd68ca33f7f72c5d21b651f28a37c1c63cd41708f7640b67f",
  "cp-a36a-05-counter-bank-replacement-d101.json":
    "sha256:85e1234e934ccc05e7402b9f972d1f55055a3b03317a1ff5cb71bd9871f1be7d",
  "cp-a36a-07-counter-bank-ready-d89.json":
    "sha256:5b44aeba4e205b3f8ec99eb0f59645248adba66f8e665192ddb9c6604c393a32",
  "cp-b34e-02-tutor-source-semantic-role-d106.json":
    "sha256:3fd1d15f8dc6795a8300f8cf333423a9aec837cb4c0fe8d178448a3170cd39d6",
  "cp-baseline-seed01-01-rd-protocol-known-blocked-d196.json":
    "sha256:6cd402a5c7ee1534e6690926de1c9af5d4211b050c338de52a2afa84aae6cfc9",
  "cp-baseline-seed01-02-rd-protocol-known-blocked-d278.json":
    "sha256:19963a3ffa7ef5ae77c35a9eb93fa9fa77e5c8bfad473dc5a81083075e7dddbe",
  "cp-baseline-seed01-03-rd-protocol-known-blocked-d347.json":
    "sha256:19963a3ffa7ef5ae77c35a9eb93fa9fa77e5c8bfad473dc5a81083075e7dddbe",
  "cp-baseline-seed05-06-background-bank-yields.json":
    "sha256:73327d295022d4a62fa66e34a69a61ee24117a21f08476aeb4b3baca406aa65d",
  "cp-baseline-seed09-01-rd-protocol-known-blocked-d290.json":
    "sha256:24895dfbffe38269e580683e2c4dd241fc2f12c02274dd3283d30446d26936a7",
  "cp-d153-01-pay-for-early-remote-access-d7.json":
    "sha256:36206082fead85bbb22fbb1b0d3495b692b5ea57adb77001f721124239482129",
  "cp-d153-12-cashout-for-rd-d185.json":
    "sha256:7eb371b9c7108fd136be8ecb76d4583222ec5ff35f41d93ad204b50a08c5567f",
  "cp-daed3ad-latest-08-retain-tycho-discard-cfo-d97.json":
    "sha256:e609e7dc5864fd7dec67460bb37872be8874dba192174d1322c69c0d3de3c5f1",
  "cp-e6aca-06-bind-vapor-decoy-route-d66.json":
    "sha256:5e3bb9c706a724b24a6c314fe329e1a75d2affd87f40f07626cf1ce04efafc24",
  "cp-e8886-06-livewire-real-economy.json":
    "sha256:91b77de11bdd013baa1c1621fb11efa36abc752d69e2e070d74a49df32c7a0b3",
  "cp-last-two-04.json":
    "sha256:63c9a0cadd98fc6af198c4c96d875dd9561ce9d85c5e200636ce4c600a18a268",
  "cp-manhunt-execution-04.json":
    "sha256:ac82b60ee8d12fad22161bfd031ddd3d3cc6060c0b4b2a0a2fbf9e54635f4de3",
  "cp-manhunt-execution-05.json":
    "sha256:ac82b60ee8d12fad22161bfd031ddd3d3cc6060c0b4b2a0a2fbf9e54635f4de3",
  "cp-renticon-code-rot-c6-01-negative-install-seed001-d38.json":
    "sha256:aa16ff4aafe9a44d971db791834fc0b7201e683e6eafd67740de9b93f3b59719",
  "cp-renticon-code-rot-c6-02-saturated-search-seed001-d63.json":
    "sha256:1a7d20d76e53415ec7a672bb5888b34f4eaa44384717d320813bcb91840967b7",
  "cp-renticon-code-rot-c6-04-overflow-draw-seed005-d202.json":
    "sha256:a8f88dd85029fe11ad347b4872f5df7ab8a16e93f6118d971f80f0a7d6dea248",
} satisfies Record<string, `sha256:${string}`>;

const mode = process.argv.includes("--write") ? "write" : "check";
const files = readdirSync(CHECKPOINT_DIRECTORY)
  .filter((file) => file.endsWith(".json"))
  .filter((file) => {
    const checkpoint = JSON.parse(
      readFileSync(path.join(CHECKPOINT_DIRECTORY, file), "utf8"),
    ) as { schemaVersion?: unknown };
    return (
      checkpoint.schemaVersion === AI_DECISION_CHECKPOINT_SCHEMA_VERSION
    );
  })
  .sort();
const changed: Array<{ file: string; paths: string[] }> = [];

for (const file of files) {
  const filePath = path.join(CHECKPOINT_DIRECTORY, file);
  const sourceText = readFileSync(filePath, "utf8");
  const original = JSON.parse(sourceText) as any;
  const current = structuredClone(original);
  rematerializeTurnPlanCommitmentContract(current);
  if (file === RENT_I_CON_CHECKPOINT) rematerializeRentIConBinding(current);
  current.engine.stateHash = hashGameState(current.engine.testOnlyGameState);
  const changedPaths = leafDiffPaths(original, current);
  if (changedPaths.length === 0) continue;
  assertAllowedLeafChanges(file, changedPaths);
  changed.push({ file, paths: changedPaths });
  if (mode === "write") {
    let rendered =
      file === RENT_I_CON_CHECKPOINT
        ? `${JSON.stringify(current, null, 2)}\n`
        : replaceSingleStateHash(sourceText, current.engine.stateHash);
    if (
      changedPaths.some(
        (changedPath) =>
          changedPath ===
            "runtime.residentPlanPortfolio.turnPlanCommitment.schemaVersion" ||
          changedPath ===
            "runtime.residentPlanPortfolio.turnPlanCommitment.sequenceRootPlanInstanceId",
      )
    ) {
      rendered = replaceTurnPlanCommitmentContract(rendered, current);
    }
    writeFileSync(filePath, rendered, "utf8");
  }
}

const report = {
  schemaVersion: "card-spec-decision-checkpoint-rebase-v1",
  mode,
  checkpointCount: files.length,
  changedCheckpointCount: changed.length,
  hashOnlyCheckpointCount: changed.filter(
    ({ paths }) => paths.length === 1 && paths[0] === "engine.stateHash",
  ).length,
  canonicalBindingCheckpointCount: changed.filter(
    ({ file }) => file === RENT_I_CON_CHECKPOINT,
  ).length,
  commitmentContractUpgradeCheckpointCount: changed.filter(({ paths }) =>
    paths.some(
      (changedPath) =>
        changedPath ===
          "runtime.residentPlanPortfolio.turnPlanCommitment.schemaVersion" ||
        changedPath ===
          "runtime.residentPlanPortfolio.turnPlanCommitment.sequenceRootPlanInstanceId",
    ),
  ).length,
  changed,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (mode === "check" && changed.length > 0) process.exitCode = 1;

function readPinnedCheckpointText(file: string): string {
  const repositoryPath = `data/scenarios/ai-decision-checkpoints/${file}`;
  return execFileSync(
    "git",
    ["show", `${PINNED_CS08_BASE_COMMIT}:${repositoryPath}`],
    {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
}

function replaceSingleStateHash(source: string, stateHash: string): string {
  const pattern = /("stateHash"\s*:\s*)"[^"]+"/g;
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1)
    throw new Error(`card_spec_checkpoint_state_hash_shape:${matches.length}`);
  return source.replace(
    pattern,
    (_match, prefix: string) => `${prefix}${JSON.stringify(stateHash)}`,
  );
}

function replaceTurnPlanCommitmentContract(
  sourceText: string,
  checkpoint: any,
): string {
  const commitment =
    checkpoint.runtime?.residentPlanPortfolio?.turnPlanCommitment;
  const sequenceRootPlanInstanceId = commitment?.sequenceRootPlanInstanceId;
  if (
    !commitment ||
    commitment.schemaVersion !== TURN_PLAN_COMMITMENT_SCHEMA_VERSION ||
    typeof sequenceRootPlanInstanceId !== "string" ||
    sequenceRootPlanInstanceId.trim().length === 0
  )
    throw new Error("checkpoint_turn_plan_commitment_contract_missing");
  const pattern = /^(\s*)"schemaVersion": "turn-plan-commitment-v1",$/gm;
  const matches = [...sourceText.matchAll(pattern)];
  if (matches.length !== 1)
    throw new Error(
      `checkpoint_turn_plan_commitment_schema_occurrence_mismatch:${matches.length}`,
    );
  const indentation = matches[0]?.[1] ?? "";
  return sourceText.replace(
    pattern,
    `${indentation}"schemaVersion": ${JSON.stringify(TURN_PLAN_COMMITMENT_SCHEMA_VERSION)},\n${indentation}"sequenceRootPlanInstanceId": ${JSON.stringify(sequenceRootPlanInstanceId)},`,
  );
}

function rematerializeRentIConBinding(checkpoint: any): void {
  const state = checkpoint.engine.testOnlyGameState;
  const runtimePortfolio = checkpoint.runtime?.residentPlanPortfolio;
  const commitment = runtimePortfolio?.turnPlanCommitment;
  const lease = runtimePortfolio?.turnPlanExecutionLease;
  if (!commitment || !lease)
    throw new Error("rent_i_con_checkpoint_missing_commitment_or_lease");
  const phase = commitment.phases[commitment.cursor.phaseIndex];
  const node = phase?.nodes[commitment.cursor.nodeIndex];
  if (!phase || !node)
    throw new Error("rent_i_con_checkpoint_missing_current_node");
  const sourceAbilityBinding = node.invocation.sourceAbilityBinding;
  const hasExpectedSource =
    node.invocation.sourceCardInstanceId === RENT_I_CON_INSTANCE;
  const hasCanonicalBinding =
    sourceAbilityBinding?.kind === "card_spec_capability_key" &&
    sourceAbilityBinding.sourceAbilityId === RENT_I_CON_CAPABILITY_ID;
  if (!hasExpectedSource || !hasCanonicalBinding)
    throw new Error("rent_i_con_checkpoint_unexpected_source_binding");

  const encounterState = structuredClone(state);
  encounterState.stateVersion = lease.stateIdentity.stateVersion;
  encounterState.activeSide = "runner";
  encounterState.timingPoint = "run.encounter_ice";
  encounterState.run.phase = "encounter_ice";
  encounterState.run.encounteredIceId = TARGET_ICE_INSTANCE;
  delete encounterState.run.approachedIceId;
  encounterState.run.position = { kind: "ice", serverId: "rd", iceIndex: 0 };
  encounterState.run.brokenSubroutineIndexes = [];
  encounterState.run.resolvedSubroutineIndexes = [];
  const legalActions = getLegalActions(encounterState, "runner");
  const action = legalActions.find(
    (candidate) =>
      candidate.type === "break_subroutine" &&
      candidate.payload?.breakerId === RENT_I_CON_INSTANCE &&
      candidate.payload?.iceId === TARGET_ICE_INSTANCE &&
      candidate.payload?.subroutineIndex === 0,
  );
  if (
    !action ||
    !action.abilityRef ||
    !("sourceAbilityId" in action.abilityRef) ||
    action.abilityRef.sourceAbilityId !== RENT_I_CON_CAPABILITY_ID ||
    action.payload?.cardImplementationCapabilityBindingKind !==
      "card_spec_capability_key"
  )
    throw new Error("rent_i_con_checkpoint_canonical_action_missing");

  const invocation = buildCanonicalLegalActionInvocation({
    stateIdentity: lease.stateIdentity,
    semanticActionType: node.invocation.semanticActionType,
    sourceCardInstanceId: RENT_I_CON_INSTANCE,
    sourceAbilityBinding: {
      kind: "card_spec_capability_key",
      sourceAbilityId: RENT_I_CON_CAPABILITY_ID,
    },
    boundTargets: node.invocation.boundTargets,
    boundChoices: node.invocation.boundChoices,
  });
  const { invocationKey, ...route } = invocation;
  const routeKey = turnPlanningFingerprint("committed-invocation-route", route);
  node.invocation = { ...route, routeKey };
  node.expectation = executionExpectationFromLegalAction({
    nodeId: node.nodeId,
    legalAction: action,
    expectedStateDeltaCodes: node.expectation.expectedStateDeltaCodes,
    expectedNextPlanningFingerprint:
      node.expectation.expectedNextPlanningFingerprint,
  });

  commitment.sourceLineHash = turnPlanningFingerprint("turn-plan-source-line", {
    sourcePlanId: commitment.sourcePlanId,
    side: commitment.side,
    turnKey: commitment.turnKey,
    phases: commitment.phases,
    priorityCoverage: commitment.priorityCoverage,
    valueClaimIds: commitment.valueClaimIds,
  });
  commitment.commitmentId = turnPlanningFingerprint("turn-plan-commitment", {
    sourceLineHash: commitment.sourceLineHash,
    runtimeInstanceId: commitment.runtimeInstanceId,
    planningRulesFingerprint: commitment.planningRulesFingerprint,
    stateIdentity: commitment.createdAtStateIdentity,
  });
  const transitionIdentity = {
    phaseId: phase.phaseId,
    nodeId: node.nodeId,
    routeKey,
    cursor: commitment.cursor,
    expectedStateDeltaCodes: node.expectation.expectedStateDeltaCodes,
    expectedNextPlanningFingerprint:
      node.expectation.expectedNextPlanningFingerprint,
    boundaryAfter: node.boundaryAfter,
  };
  commitment.nextExpectedTransition = {
    expectationId: turnPlanningFingerprint(
      "turn-plan-expected-transition",
      transitionIdentity,
    ),
    phaseId: phase.phaseId,
    nodeId: node.nodeId,
    routeKey,
    expectedStateDeltaCodes: structuredClone(
      node.expectation.expectedStateDeltaCodes,
    ),
    ...(node.boundaryAfter ? { boundaryAfter: node.boundaryAfter } : {}),
  };
  assertTurnPlanCommitment(commitment);

  lease.commitmentId = commitment.commitmentId;
  lease.routeKey = routeKey;
  lease.currentBinding = {
    actionId: action.actionId,
    stateVersion: lease.stateIdentity.stateVersion,
    semanticActionSetFingerprint:
      buildSemanticActionSetFingerprint(legalActions),
    invocationKey,
  };
  lease.expectationId = commitment.nextExpectedTransition.expectationId;
  lease.leaseId = turnPlanningFingerprint("turn-plan-execution-lease", {
    commitmentId: commitment.commitmentId,
    phaseIndex: commitment.cursor.phaseIndex,
    nodeIndex: commitment.cursor.nodeIndex,
    stateIdentity: lease.stateIdentity,
    actionId: action.actionId,
    invocationKey,
    expectationId: commitment.nextExpectedTransition.expectationId,
  });
}

function rematerializeTurnPlanCommitmentContract(checkpoint: any): void {
  const commitment =
    checkpoint.runtime?.residentPlanPortfolio?.turnPlanCommitment;
  if (!commitment) return;
  const sequenceRootPlanInstanceId =
    commitment.phases?.[0]?.root?.planInstanceId;
  if (
    typeof sequenceRootPlanInstanceId !== "string" ||
    sequenceRootPlanInstanceId.trim().length === 0
  )
    throw new Error("checkpoint_turn_plan_commitment_sequence_root_missing");
  commitment.schemaVersion = TURN_PLAN_COMMITMENT_SCHEMA_VERSION;
  commitment.sequenceRootPlanInstanceId = sequenceRootPlanInstanceId;
  assertTurnPlanCommitment(commitment);
}

function leafDiffPaths(left: unknown, right: unknown, prefix = ""): string[] {
  if (Object.is(left, right)) return [];
  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object" ||
    Array.isArray(left) !== Array.isArray(right)
  )
    return [prefix];
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = [
    ...new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)]),
  ].sort();
  return keys.flatMap((key) =>
    leafDiffPaths(
      leftRecord[key],
      rightRecord[key],
      prefix ? `${prefix}.${key}` : key,
    ),
  );
}

function assertAllowedLeafChanges(
  file: string,
  paths: readonly string[],
): void {
  const allowed = [
    "engine.stateHash",
    "runtime.residentPlanPortfolio.turnPlanCommitment.schemaVersion",
    "runtime.residentPlanPortfolio.turnPlanCommitment.sequenceRootPlanInstanceId",
    ...(file === RENT_I_CON_CHECKPOINT
      ? [
          "runtime.residentPlanPortfolio.turnPlanCommitment.commitmentId",
          "runtime.residentPlanPortfolio.turnPlanCommitment.sourceLineHash",
          "runtime.residentPlanPortfolio.turnPlanCommitment.phases.0.nodes.0.invocation.sourceAbilityBinding",
          "runtime.residentPlanPortfolio.turnPlanCommitment.phases.0.nodes.0.invocation.routeKey",
          "runtime.residentPlanPortfolio.turnPlanCommitment.phases.0.nodes.0.expectation",
          "runtime.residentPlanPortfolio.turnPlanCommitment.nextExpectedTransition.expectationId",
          "runtime.residentPlanPortfolio.turnPlanCommitment.nextExpectedTransition.routeKey",
          "runtime.residentPlanPortfolio.turnPlanExecutionLease.leaseId",
          "runtime.residentPlanPortfolio.turnPlanExecutionLease.commitmentId",
          "runtime.residentPlanPortfolio.turnPlanExecutionLease.routeKey",
          "runtime.residentPlanPortfolio.turnPlanExecutionLease.currentBinding",
          "runtime.residentPlanPortfolio.turnPlanExecutionLease.expectationId",
        ]
      : []),
  ];
  const unexpected = paths.filter(
    (changedPath) =>
      !allowed.some(
        (allowedPath) =>
          changedPath === allowedPath ||
          changedPath.startsWith(`${allowedPath}.`),
      ),
  );
  if (unexpected.length > 0)
    throw new Error(
      `card_spec_checkpoint_unexpected_leaf_change:${file}:${unexpected.join(",")}`,
    );
}

function assertExpectedCs09Reconciliation(file: string, checkpoint: unknown) {
  const expectedExpectationFingerprint =
    CS10_EXPECTED_EXPECTATION_FINGERPRINTS[file];
  const expectations = expectedExpectationFingerprint
    ? {}
    : (CS09_EXPECTED_RECONCILIATIONS[file] ?? {});
  for (const [path, expected] of Object.entries(expectations)) {
    const actual = valueAtPath(checkpoint, path);
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(
        `card_spec_checkpoint_reconciliation_value_mismatch:${file}:${path}`,
      );
  }
  if (expectedExpectationFingerprint) {
    const actualExpectationFingerprint = `sha256:${createHash("sha256")
      .update(JSON.stringify(valueAtPath(checkpoint, "expectation")))
      .digest("hex")}`;
    if (actualExpectationFingerprint !== expectedExpectationFingerprint)
      throw new Error(
        `card_spec_checkpoint_reconciliation_fingerprint_mismatch:${file}`,
      );
  }
}

function valueAtPath(value: unknown, dottedPath: string): unknown {
  return dottedPath.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}
