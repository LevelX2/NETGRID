import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  CARD_DEFINITIONS_BY_ID,
  createGameAfterSetup,
  hashState,
} from "@netgrid/engine";
import type { CardInstanceId, VisibleCard } from "@netgrid/shared";
import { temporaryEncounterOptionFacts } from "../../../../engine/src/game/run/temporary-encounter-option-facts";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

afterEach(() => resetResidentPlanPortfolioMemory());

function fixture(game: 8 | 29 | 36, requestedDecision?: number) {
  const decision = requestedDecision ?? { 8: 408, 29: 187, 36: 97 }[game];
  const native = JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta498-r2-g${game}-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
  return native;
}

// Requote only the Engine facts. The original private hand, actual public rig,
// action/choice IDs and persisted resident runtime remain the native checkpoint.
// Opponent hand/stack identities are neither needed nor reconstructed.
function requote(input: AiDecisionInputWithDeckCapabilities) {
  const view = input.playerView;
  if (
    !view.traceRulesProfile ||
    !view.run?.runId ||
    !view.run.position ||
    !view.opponent.rig
  )
    throw new Error("Native run, trace profile and public rig required");
  const state = createGameAfterSetup({
    seed: "temporary-native-rule-projection",
  });
  state.traceRulesProfile = view.traceRulesProfile;
  state.stateVersion = view.stateVersion - 1;
  const supportedRunKeys = [
    "runId",
    "attackedServerId",
    "phase",
    "position",
    "badPublicityCredits",
    "successful",
  ];
  if (Object.keys(view.run).some((key) => !supportedRunKeys.includes(key)))
    throw new Error(
      "Native temporary quote projection has an unsupported run field",
    );
  state.run = {
    runId: view.run.runId,
    attackedServerId: view.run.attackedServerId,
    phase: view.run.phase,
    position: structuredClone(view.run.position),
    successful: view.run.successful,
    ...(view.run.badPublicityCredits !== undefined
      ? { badPublicityCredits: view.run.badPublicityCredits }
      : {}),
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
  };
  state.corp.credits = view.own.credits;
  state.corp.hq = [];
  state.corp.servers = [];
  state.runner.credits = view.opponent.credits;
  state.runner.rig = { programs: [], hardware: [], resources: [] };
  const corpTemplate =
    state.cardInstances[
      Object.keys(state.cardInstances).find(
        (id) => state.cardInstances[id as CardInstanceId]?.owner === "corp",
      ) as CardInstanceId
    ]!;
  const runnerTemplate =
    state.cardInstances[
      Object.keys(state.cardInstances).find(
        (id) => state.cardInstances[id as CardInstanceId]?.owner === "runner",
      ) as CardInstanceId
    ]!;
  function add(card: VisibleCard, side: "runner" | "corp") {
    if (!card.known || !card.definitionId)
      throw new Error("Native public projection requires a known card");
    const id = card.instanceId;
    state.cardInstances[id] = {
      ...(side === "corp" ? corpTemplate : runnerTemplate),
      instanceId: id,
      definitionId: card.definitionId,
      owner: side,
      controller: side,
      zone: side === "corp" ? { side, zone: "hq" } : { side, zone: "rig" },
      faceup: side === "runner",
      rezzed: side === "runner",
      advancementCounters: card.advancementCounters ?? 0,
      counters: Object.fromEntries(
        (card.counterDisplays ?? [])
          .filter((c) => c.counterType)
          .map((c) => [c.counterType!, c.amount]),
      ),
    };
    if (side === "corp") state.corp.hq.push(id);
    else if (card.type === "program") state.runner.rig.programs.push(id);
    else if (card.type === "hardware") state.runner.rig.hardware.push(id);
    else if (card.type === "resource") state.runner.rig.resources.push(id);
    else throw new Error("Unsupported native installed card");
  }
  for (const card of view.own.gripOrHq) add(card, "corp");
  for (const card of view.opponent.rig) add(card, "runner");
  const before = hashState(state);
  for (const option of view.pendingChoice!.options.filter((o) =>
    o.id.startsWith("ice_"),
  )) {
    const id = option.value as CardInstanceId;
    const definition =
      CARD_DEFINITIONS_BY_ID[state.cardInstances[id]!.definitionId]!;
    option.metadata = {
      ...option.metadata,
      ...temporaryEncounterOptionFacts(state, id, definition),
    };
  }
  expect(hashState(state)).toBe(before);
}

function decide(native: ReturnType<typeof fixture>) {
  const input = { ...native.input, ...buildAiDecisionInputDto(native.input) };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    native.runtime,
  );
  const choiceBefore = structuredClone(input.playerView.pendingChoice);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(
    input.legalActions.find((a) => a.type === "resolve_choice")!.actionId,
  );
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.selectedChoices?.choiceId).toBe(choiceBefore!.choiceId);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    leafExecutorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
  });
  expect(input.playerView.pendingChoice).toEqual(choiceBefore);
  return decision.selectedChoices!.selectedOptionIds as string[];
}

it("SP-529 chooses the zero-bid guaranteed Asp over the currently breakable Fetch", () => {
  const native = fixture(8);
  requote(native.input);
  const choice = native.input.playerView.pendingChoice!;
  const asp = choice.options.find((o) => o.label === "Asp")!;
  const fetch = choice.options.find((o) => o.label === "Fetch 4.0.1")!;
  expect(
    JSON.parse(asp.metadata!.temporaryEncounterBreakQuoteJson as string),
  ).toMatchObject({
    effectClass: "trace_run_end",
    status: "unaffordable",
    requiredCredits: 5,
    guaranteedRunEnd: true,
    corpBid: 0,
    corpTraceStrength: 5,
    maximumRunnerTraceStrength: 4,
  });
  expect(
    JSON.parse(fetch.metadata!.temporaryEncounterBreakQuoteJson as string),
  ).toMatchObject({
    effectClass: "trace_tag",
    status: "breakable",
    requiredCredits: 4,
    guaranteedRunEnd: false,
  });
  expect(decide(native)).toEqual([asp.id]);
});

it.each(["funded", "blind", "unknown", "empty_fort"])(
  "does not claim a trace block for the %s countercase",
  (variant) => {
    const native = fixture(8);
    if (variant === "funded") native.input.playerView.opponent.credits = 5;
    if (variant === "blind")
      native.input.playerView.traceRulesProfile = "classic_blind";
    if (variant === "empty_fort")
      native.input.playerView.own.gripOrHq =
        native.input.playerView.own.gripOrHq.filter((c) => c.type !== "agenda");
    requote(native.input);
    const choice = native.input.playerView.pendingChoice!;
    if (variant === "unknown") {
      const asp = choice.options.find((o) => o.label === "Asp")!;
      const quote = JSON.parse(
        asp.metadata!.temporaryEncounterBreakQuoteJson as string,
      );
      asp.metadata!.temporaryEncounterBreakQuoteJson = JSON.stringify({
        ...quote,
        status: "unmodeled",
        reason: "public_support_incomplete",
      });
    }
    expect(decide(native)).toEqual([
      choice.options.find((o) => o.label === "Fetch 4.0.1")!.id,
    ]);
  },
);

it("SP-287 rejects the native empty relative-ICE option and keeps the existing choice owner", () => {
  const native = fixture(29);
  requote(native.input);
  const choice = native.input.playerView.pendingChoice!;
  expect(
    choice.options.find((o) => o.label === "Hunting Pack")!.metadata,
  ).toMatchObject({
    temporaryEncounterSubroutineTypes: [],
    temporaryEncounterHasAdditionalMechanics: false,
  });
  expect(decide(native)).toEqual([
    choice.options.find((o) => o.label === "Jack Attack")!.id,
  ]);
});

it("retains the HQ card when the empty relative ICE is the only temporary option", () => {
  const native = fixture(36);
  requote(native.input);
  const choice = native.input.playerView.pendingChoice!;
  expect(choice.options.map((o) => o.label)).toEqual([
    "Nicht nutzen",
    "Hunting Pack",
  ]);
  expect(decide(native)).toEqual(["decline"]);
});

it.each(["stale", "malformed"])(
  "fails closed on a %s trace quote",
  (variant) => {
    const native = fixture(8);
    requote(native.input);
    const asp = native.input.playerView.pendingChoice!.options.find(
      (o) => o.label === "Asp",
    )!;
    const quote = JSON.parse(
      asp.metadata!.temporaryEncounterBreakQuoteJson as string,
    );
    asp.metadata!.temporaryEncounterBreakQuoteJson =
      variant === "stale"
        ? JSON.stringify({ ...quote, stateVersion: quote.stateVersion - 1 })
        : "{";
    expect(() => decide(native)).toThrow("window_origin_missing");
  },
);

it("SP-530 preserves the native HQ card instead of spending it against a free full break", () => {
  const native = fixture(29, 280);
  const choice = native.input.playerView.pendingChoice!;
  expect(choice.options).toHaveLength(2);
  expect(
    JSON.parse(
      choice.options[1]!.metadata!.temporaryEncounterBreakQuoteJson as string,
    ),
  ).toMatchObject({
    status: "breakable",
    requiredCredits: 0,
    stateVersion: native.input.playerView.stateVersion,
    runId: native.input.playerView.run!.runId,
    cardId: choice.options[1]!.value,
    serverId: "hq",
  });
  expect(decide(native)).toEqual(["decline"]);
});

it.each(["stale", "malformed"])(
  "fails closed on a %s single-option break quote",
  (variant) => {
    const native = fixture(29, 280);
    const option = native.input.playerView.pendingChoice!.options[1]!;
    const quote = JSON.parse(
      option.metadata!.temporaryEncounterBreakQuoteJson as string,
    );
    option.metadata!.temporaryEncounterBreakQuoteJson =
      variant === "stale"
        ? JSON.stringify({ ...quote, stateVersion: quote.stateVersion - 1 })
        : "{";
    expect(() => decide(native)).toThrow("window_origin_missing");
  },
);
