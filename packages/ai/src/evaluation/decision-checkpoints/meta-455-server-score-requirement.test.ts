import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r11-g13-d500.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import { corpAgendaInstallRequirement } from "../../plans/corp-agenda-install-requirement";
import { corpScorelineFeasibilityForDecisionInput } from "../../runtime/corp-scoreline-feasibility";

it("quotes Babylon without Overtime and selects the newly reachable terminal Tycho route", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const runtime = structuredClone(
    checkpoint.runtime,
  ) as unknown as AiRuntimeCheckpointV1;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    runtime.residentPlanPortfolio!,
  );
  const agenda = "corp_onr_v1_214_project-babylon_1";
  const paths = corpSameTurnScoreConversionPaths(input).filter(
    (p) => p.agendaCardId === agenda,
  );
  expect(paths.find((p) => p.targetServerId === "remote_1")).toMatchObject({
    advancementRequirement: 2,
    creditsRequired: 2,
    clicksRequired: 3,
    clicksGenerated: 0,
    steps: [
      { kind: "install_score_target" },
      { kind: "basic_advance" },
      { kind: "basic_advance" },
      { kind: "score_ready" },
    ],
  });
  expect(paths.find((p) => p.targetServerId === "new_remote")).toMatchObject({
    advancementRequirement: 3,
    creditsRequired: 7,
    clicksRequired: 5,
    clicksGenerated: 2,
  });
  const result = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(action).toMatchObject({
    type: "play_operation",
    source: "corp_onr_v1_297_overtime-incentives_3",
  });
  const parent =
    "plan:corp.score_agenda:agenda%3Acorp_onr_v1_220_tycho-extension_2%3Aremote_1";
  const plan = result.decisionDebug?.planFirstDecision;
  expect(plan?.rootPlanInstanceId).toBe(parent);
  expect(plan?.leafExecutorInstanceId).toBe(parent);
  expect(plan?.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 499,
  });
  expect(plan?.route?.stepId).toContain(parent);
  expect(result.fallbackUsed).toBe(false);
  const direct = input.legalActions.find(
    (a) =>
      a.type === "install_card" &&
      a.source === agenda &&
      a.payload?.serverId === "remote_1",
  )!;
  expect(
    corpScorelineFeasibilityForDecisionInput(input)
      .currentTurnClosableActionIds,
  ).toContain(direct.actionId);
});

it.each([
  "missing",
  "schema",
  "card",
  "server",
  "version",
  "action-version",
  "negative",
  "fraction",
  "nonfinite",
])("fails closed for an invalid destination requirement: %s", (kind) => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const action = input.legalActions.find(
    (a) =>
      a.type === "install_card" &&
      a.source.includes("project-babylon") &&
      a.payload?.serverId === "remote_1",
  )!;
  const p = action.payload!;
  if (kind === "missing")
    delete p.agendaInstallScoreHorizonQuoteAdvancementRequirement;
  if (kind === "schema")
    p.agendaInstallScoreHorizonQuoteSchemaVersion = "invalid";
  if (kind === "card") p.agendaInstallScoreHorizonQuoteCardId = "other";
  if (kind === "server")
    p.agendaInstallScoreHorizonQuoteTargetServerId = "remote_2";
  if (kind === "version")
    p.agendaInstallScoreHorizonQuoteExpiresAtStateVersion = 498;
  if (kind === "action-version") action.expiresAtStateVersion = 498;
  if (kind === "negative")
    p.agendaInstallScoreHorizonQuoteAdvancementRequirement = -1;
  if (kind === "fraction")
    p.agendaInstallScoreHorizonQuoteAdvancementRequirement = 1.5;
  if (kind === "nonfinite")
    p.agendaInstallScoreHorizonQuoteAdvancementRequirement = Infinity;
  expect(() =>
    corpAgendaInstallRequirement(
      input.playerView,
      action,
      action.source,
      "remote_1",
    ),
  ).toThrow(/invalid_player_view_card_projection/);
});

it("keeps the quoted difficulty even when the next-turn horizon is incomplete", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const action = input.legalActions.find(
    (a) =>
      a.type === "install_card" &&
      a.source.includes("project-babylon") &&
      a.payload?.serverId === "remote_1",
  )!;
  action.payload!.agendaInstallScoreHorizonQuoteComplete = false;
  expect(
    corpAgendaInstallRequirement(
      input.playerView,
      action,
      action.source,
      "remote_1",
    ),
  ).toBe(2);
});
