import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { getLegalActions, hashGameState } from "../packages/engine/src/index";
import {
  buildCanonicalLegalActionInvocation,
  buildSemanticActionSetFingerprint,
  turnPlanningFingerprint,
} from "../packages/ai/src/plans/turn-planning-contracts";
import {
  assertTurnPlanCommitment,
  executionExpectationFromLegalAction,
} from "../packages/ai/src/plans/turn-plan-commitment";

const CHECKPOINT_DIRECTORY = path.resolve(
  "data/scenarios/ai-decision-checkpoints",
);
const PINNED_CS08_BASE_COMMIT = "a7f140987";
const RENT_I_CON_CHECKPOINT = "cp-disgruntled-01-post-pass-derez-d277.json";
const RENT_I_CON_INSTANCE = "runner_onr_classic_031_rent-i-con_1";
const RENT_I_CON_CAPABILITY_ID =
  "onr_classic_031_rent-i-con:break_any_subroutine_and_trash_after_run";
const TARGET_ICE_INSTANCE = "corp_onr_v1_237_data-wall_1";

const mode = process.argv.includes("--write") ? "write" : "check";
const files = readdirSync(CHECKPOINT_DIRECTORY)
  .filter((file) => file.endsWith(".json"))
  .sort();
const changed: Array<{ file: string; paths: string[] }> = [];

for (const file of files) {
  const filePath = path.join(CHECKPOINT_DIRECTORY, file);
  const sourceText =
    mode === "write"
      ? readPinnedCheckpointText(file)
      : readFileSync(filePath, "utf8");
  const original = JSON.parse(sourceText) as any;
  const current = structuredClone(original);
  if (file === RENT_I_CON_CHECKPOINT) rematerializeRentIConBinding(current);
  current.engine.stateHash = hashGameState(current.engine.testOnlyGameState);
  const changedPaths = leafDiffPaths(original, current);
  if (changedPaths.length === 0) continue;
  assertAllowedLeafChanges(file, changedPaths);
  changed.push({ file, paths: changedPaths });
  if (mode === "write") {
    const rendered =
      file === RENT_I_CON_CHECKPOINT
        ? `${JSON.stringify(current, null, 2)}\n`
        : replaceSingleStateHash(sourceText, current.engine.stateHash);
    writeFileSync(filePath, rendered, "utf8");
  }
}

const baselineChanges = files.map((file) => {
  const baseline = JSON.parse(readPinnedCheckpointText(file)) as unknown;
  const current = JSON.parse(
    readFileSync(path.join(CHECKPOINT_DIRECTORY, file), "utf8"),
  ) as unknown;
  const paths = leafDiffPaths(baseline, current);
  assertAllowedLeafChanges(file, paths);
  return { file, paths };
});
const baselineHashOnlyCount = baselineChanges.filter(
  ({ paths }) => paths.length === 1 && paths[0] === "engine.stateHash",
).length;
const baselineChangedCount = baselineChanges.filter(
  ({ paths }) => paths.length > 0,
).length;
const baselineCanonicalBindingCount = baselineChanges.filter(
  ({ file, paths }) => file === RENT_I_CON_CHECKPOINT && paths.length > 1,
).length;
if (
  mode === "check" &&
  changed.length === 0 &&
  (baselineChangedCount !== 352 ||
    baselineHashOnlyCount !== 351 ||
    baselineCanonicalBindingCount !== 1)
)
  throw new Error(
    `card_spec_checkpoint_baseline_audit_mismatch:${baselineChanges.length}:${baselineHashOnlyCount}:${baselineCanonicalBindingCount}`,
  );

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
  pinnedBaselineCommit: PINNED_CS08_BASE_COMMIT,
  baselineChangedCheckpointCount: baselineChangedCount,
  baselineHashOnlyCheckpointCount: baselineHashOnlyCount,
  baselineCanonicalBindingCheckpointCount: baselineCanonicalBindingCount,
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
  const hasLegacyBinding =
    sourceAbilityBinding?.kind === "legacy_ability_id" &&
    typeof sourceAbilityBinding.abilityId === "string";
  const hasCanonicalBinding =
    sourceAbilityBinding?.kind === "card_spec_capability_key" &&
    sourceAbilityBinding.sourceAbilityId === RENT_I_CON_CAPABILITY_ID &&
    !("abilityId" in sourceAbilityBinding);
  if (!hasExpectedSource || (!hasLegacyBinding && !hasCanonicalBinding))
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
  const allowed =
    file === RENT_I_CON_CHECKPOINT
      ? [
          "engine.stateHash",
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
      : ["engine.stateHash"];
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
