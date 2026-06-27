import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { chooseAiAction } from "../index";
import {
  PRACTICAL_TACTIC_BENCHMARK_CASES,
  frozenLegacyPracticalTacticSelector,
} from "../evaluation/practical-tactic-benchmark";
import { applyPracticalTacticOverlay } from "./practical-tactic-overlay";

describe("PracticalTacticOverlay", () => {
  it("surfaces the practical tactic corpus without overriding runtime actions", () => {
    const compared = PRACTICAL_TACTIC_BENCHMARK_CASES.map((benchmarkCase) =>
      applyPracticalTacticOverlay(
        benchmarkCase.input,
        frozenLegacyDecision(benchmarkCase.input),
        {
          practicalTacticOverlay: { enabled: true },
        },
      ),
    );

    expect(PRACTICAL_TACTIC_BENCHMARK_CASES).toHaveLength(40);
    expect(
      compared.filter((decision) =>
        (decision.evidence ?? []).some((entry) =>
          entry.startsWith("practical_tactic_overlay_candidate:"),
        ),
      ),
    ).toHaveLength(40);
    expect(
      compared.every(
        (decision, index) =>
          decision.actionId ===
          frozenLegacyPracticalTacticSelector(
            PRACTICAL_TACTIC_BENCHMARK_CASES[index]!.input,
          ).actionId,
      ),
    ).toBe(true);
    expect(
      compared.every((decision) =>
        (decision.evidence ?? []).includes(
          "practical_tactic_overlay_actual_override:false",
        ),
      ),
    ).toBe(true);
  });

  it("is default-off and only reports candidates when explicitly enabled", () => {
    const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES[0]!;
    const legacy = frozenLegacyDecision(benchmarkCase.input);

    expect(applyPracticalTacticOverlay(benchmarkCase.input, legacy, {})).toBe(
      legacy,
    );
    const compared = applyPracticalTacticOverlay(benchmarkCase.input, legacy, {
      practicalTacticOverlay: { enabled: true },
    });

    expect(compared.actionId).toBe(legacy.actionId);
    expect(compared.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic_overlay_compare:true",
        "practical_tactic_overlay_actual_override:false",
      ]),
    );
  });

  it("keeps the runtime action even when the practical candidate differs", () => {
    const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES.find(
      (candidate) => candidate.category === "runner_steal_agenda",
    );
    expect(benchmarkCase).toBeDefined();
    if (!benchmarkCase) throw new Error("Missing runner steal benchmark case");
    const runtimeDecision: AiDecision = {
      actionId: "runtime-reference-action",
      reasonCode: "semantic_runtime",
      explanation: "Normal Semantic Runtime reference.",
      consideredActionIds: benchmarkCase.input.legalActions.map(
        (action) => action.actionId,
      ),
      fallbackUsed: false,
    };

    const compared = applyPracticalTacticOverlay(
      benchmarkCase.input,
      runtimeDecision,
      {
        practicalTacticOverlay: { enabled: true },
      },
    );

    expect(compared.actionId).toBe("runtime-reference-action");
    expect(compared.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic_overlay_compare:true",
        "practical_tactic_overlay_actual_override:false",
        "practical_tactic_runtime_reference:runtime-reference-action",
      ]),
    );
    expect(compared.decisionDebug?.detailSections?.at(-1)?.items).toEqual(
      expect.arrayContaining([
        "runtime_reference:runtime-reference-action",
        "actual_override:false",
      ]),
    );
  });

  it("is wired into chooseAiAction as compare-only evidence when enabled", () => {
    const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES.find(
      (candidate) => candidate.category === "runner_steal_agenda",
    );
    expect(benchmarkCase).toBeDefined();
    if (!benchmarkCase) throw new Error("Missing runner steal benchmark case");

    const decision = chooseAiAction(benchmarkCase.input, {
      practicalTacticOverlay: { enabled: true },
    });

    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:runner_steal_agenda",
        "practical_tactic_overlay_compare:true",
        "practical_tactic_overlay_actual_override:false",
        "practical_tactic_overlay_candidate:runner.practical_tactic.steal_agenda",
      ]),
    );
    expect(JSON.stringify(decision)).not.toMatch(
      /cardInstances|privatePayload|secretGripIds|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });

  it("takes a marked high-payoff runner run over passive preparation", () => {
    const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES.find(
      (candidate) => candidate.category === "runner_take_high_payoff_run",
    );
    expect(benchmarkCase).toBeDefined();
    if (!benchmarkCase) {
      throw new Error("Missing runner high-payoff benchmark case");
    }

    const decision = applyPracticalTacticOverlay(
      benchmarkCase.input,
      frozenLegacyDecision(benchmarkCase.input),
      { practicalTacticOverlay: { enabled: true } },
    );

    expect(decision.actionId).toBe(
      frozenLegacyPracticalTacticSelector(benchmarkCase.input).actionId,
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:runner_high_payoff_run",
        "practical_tactic_overlay_candidate:runner.practical_tactic.high_payoff_run",
        "practical_tactic_overlay_actual_override:false",
      ]),
    );
  });

  it("does not force unmarked corp score windows through the overlay", () => {
    const benchmarkCase = PRACTICAL_TACTIC_BENCHMARK_CASES.find(
      (candidate) => candidate.category === "corp_safe_score",
    );
    expect(benchmarkCase).toBeDefined();
    if (!benchmarkCase) throw new Error("Missing corp safe score case");
    const input = {
      ...benchmarkCase.input,
      legalActions: benchmarkCase.input.legalActions.map((action) =>
        action.type === "score_agenda" ? unmarkedScoreAction(action) : action,
      ),
    };
    const legacy = frozenLegacyDecision(input);

    const decision = applyPracticalTacticOverlay(input, legacy, {
      practicalTacticOverlay: { enabled: true },
    });

    expect(decision.actionId).toBe(legacy.actionId);
    expect(decision.evidence ?? []).not.toContain(
      "practical_tactic:corp_safe_score",
    );
  });

  it("ignores label-only corp safe-score text", () => {
    const scoreAction = {
      ...action({
        actionId: "label-safe-score",
        side: "corp",
        type: "score_agenda",
        label: "Safe score protected remote",
      }),
      costs: [],
    };
    const input = {
      side: "corp",
      legalActions: [scoreAction],
      playerView: {
        side: "corp",
        own: {
          identity: visibleCard({ instanceId: "corp-id", type: "identity" }),
          credits: 5,
          clicks: 3,
          agendaPoints: 0,
          gripOrHq: [],
          heapOrArchives: [],
          scoreArea: [],
        },
        opponent: {
          identity: visibleCard({ instanceId: "runner-id", type: "identity" }),
          credits: 5,
          clicks: 3,
          agendaPoints: 0,
          tags: 0,
          badPublicity: 0,
        },
        servers: [],
      },
    } as unknown as AiDecisionInput;

    const decision = applyPracticalTacticOverlay(
      input,
      frozenDecision("label-safe-score"),
      { practicalTacticOverlay: { enabled: true } },
    );

    expect(decision.evidence ?? []).not.toContain(
      "practical_tactic:corp_safe_score",
    );
  });

  it("uses structured stale-run payloads and ignores label-only no-payoff text", () => {
    const draw = action({
      actionId: "draw-card",
      type: "draw_card",
      label: "Draw",
      source: "basic_action",
    });
    const labelOnlyRun = action({
      actionId: "label-stale-run",
      type: "start_run",
      label: "Run with no current payoff",
      source: "basic_action",
    });
    const structuredRun = action({
      actionId: "structured-stale-run",
      type: "start_run",
      label: "Run",
      source: "basic_action",
      payload: { knownNoCurrentPayoff: true },
    });

    const labelOnlyDecision = applyPracticalTacticOverlay(
      runnerInput({ legalActions: [labelOnlyRun, draw] }),
      frozenDecision("label-stale-run"),
      { practicalTacticOverlay: { enabled: true } },
    );
    expect(labelOnlyDecision.evidence ?? []).not.toContain(
      "practical_tactic:runner_avoid_stale_run",
    );

    const structuredDecision = applyPracticalTacticOverlay(
      runnerInput({ legalActions: [structuredRun, draw] }),
      frozenDecision("structured-stale-run"),
      { practicalTacticOverlay: { enabled: true } },
    );
    expect(structuredDecision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:runner_avoid_stale_run",
        "practical_tactic_overlay_candidate:runner.practical_tactic.avoid_stale_run",
      ]),
    );
    expect(structuredDecision.decisionDebug?.detailSections?.at(-1)?.items).toContain(
      "candidate:draw-card",
    );
  });

  it("uses structured access-payoff payloads and ignores label-only high-payoff run text", () => {
    const labelOnlyRun = action({
      actionId: "label-high-payoff-run",
      type: "start_run",
      label: "Run for valuable access",
      source: "basic_action",
    });
    const structuredRun = action({
      actionId: "structured-high-payoff-run",
      type: "start_run",
      label: "Run",
      source: "basic_action",
      payload: { accessPayoff: "fresh" },
    });

    const labelOnlyDecision = applyPracticalTacticOverlay(
      runnerInput({ legalActions: [labelOnlyRun] }),
      frozenDecision("label-high-payoff-run"),
      { practicalTacticOverlay: { enabled: true } },
    );
    expect(labelOnlyDecision.evidence ?? []).not.toContain(
      "practical_tactic:runner_high_payoff_run",
    );

    const structuredDecision = applyPracticalTacticOverlay(
      runnerInput({ legalActions: [structuredRun] }),
      frozenDecision("other-action"),
      { practicalTacticOverlay: { enabled: true } },
    );
    expect(structuredDecision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:runner_high_payoff_run",
        "practical_tactic_overlay_candidate:runner.practical_tactic.high_payoff_run",
      ]),
    );
    expect(structuredDecision.decisionDebug?.detailSections?.at(-1)?.items).toContain(
      "candidate:structured-high-payoff-run",
    );
  });

  it("uses structured tag-punish payloads and ignores label-only punish text", () => {
    const labelOnlyPunish = action({
      actionId: "label-punish",
      side: "corp",
      type: "play_operation",
      label: "Closed Accounts punish tag",
    });
    const structuredPunish = action({
      actionId: "structured-punish",
      side: "corp",
      type: "play_operation",
      label: "Closed Accounts",
      payload: { tagPunishAction: true },
    });
    const gain = action({
      actionId: "gain",
      side: "corp",
      type: "gain_credit",
      label: "Gain credit",
    });
    const advance = action({
      actionId: "advance",
      side: "corp",
      type: "advance_card",
      label: "Advance",
    });

    const labelOnlyDecision = applyPracticalTacticOverlay(
      corpInput({ tags: 1, legalActions: [labelOnlyPunish, gain] }),
      frozenDecision("gain"),
      { practicalTacticOverlay: { enabled: true } },
    );
    expect(labelOnlyDecision.evidence ?? []).not.toContain(
      "practical_tactic:corp_real_punish",
    );

    const structuredDecision = applyPracticalTacticOverlay(
      corpInput({ tags: 1, legalActions: [structuredPunish, gain] }),
      frozenDecision("gain"),
      { practicalTacticOverlay: { enabled: true } },
    );
    expect(structuredDecision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:corp_real_punish",
        "practical_tactic_overlay_candidate:corp.practical_tactic.real_punish",
      ]),
    );

    const staleDecision = applyPracticalTacticOverlay(
      corpInput({ tags: 0, legalActions: [structuredPunish, advance] }),
      frozenDecision("structured-punish"),
      { practicalTacticOverlay: { enabled: true } },
    );
    expect(staleDecision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:corp_abandon_stale_punish",
        "practical_tactic_overlay_candidate:corp.practical_tactic.abandon_stale_punish",
      ]),
    );
  });

  it("uses visible breaker source cards and ignores label-only coverage installs", () => {
    const visibleBreaker = visibleCard({
      instanceId: "visible-fracter",
      definitionId: "custom-fracter",
      title: "Neutral Tool",
      type: "program",
      subtypes: ["Icebreaker", "Fracter"],
    });
    const input = runnerInput({
      gripOrHq: [visibleBreaker],
      legalActions: [
        action({
          actionId: "label-only-fracter",
          type: "install_card",
          label: "Install Best Fracter",
          source: "missing-card",
        }),
        action({
          actionId: "visible-fracter-install",
          type: "install_card",
          label: "Install Neutral Tool",
          source: "visible-fracter",
        }),
      ],
    });

    const decision = applyPracticalTacticOverlay(
      input,
      frozenDecision("label-only-fracter"),
      { practicalTacticOverlay: { enabled: true } },
    );

    expect(decision.actionId).toBe("label-only-fracter");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "practical_tactic:runner_install_coverage",
        "practical_tactic_overlay_candidate:runner.practical_tactic.install_coverage",
      ]),
    );
    expect(decision.decisionDebug?.detailSections?.at(-1)?.items).toContain(
      "candidate:visible-fracter-install",
    );
  });
});

function frozenLegacyDecision(input: AiDecisionInput): AiDecision {
  const selected = frozenLegacyPracticalTacticSelector(input).actionId;
  return {
    actionId: selected,
    reasonCode: "frozen_legacy.practical_tactic_reference",
    explanation: "Frozen legacy reference for the practical tactic benchmark.",
    consideredActionIds: input.legalActions.map((action) => action.actionId),
    fallbackUsed: false,
  };
}

function frozenDecision(actionId: string): AiDecision {
  return {
    actionId,
    reasonCode: "test.reference",
    explanation: "Test reference.",
    consideredActionIds: [actionId],
    fallbackUsed: false,
  };
}

function unmarkedScoreAction(
  action: AiDecisionInput["legalActions"][number],
): AiDecisionInput["legalActions"][number] {
  const { payload: _payload, ...withoutPayload } = action;
  return { ...withoutPayload, label: "Score agenda" };
}

function runnerInput(options: {
  gripOrHq?: VisibleCard[];
  legalActions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "runner",
    legalActions: options.legalActions,
    playerView: {
      side: "runner",
      own: {
        identity: visibleCard({ instanceId: "runner-id", type: "identity" }),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: options.gripOrHq ?? [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      opponent: {
        identity: visibleCard({ instanceId: "corp-id", type: "identity" }),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        badPublicity: 0,
      },
      servers: [
        {
          id: "remote_1",
          root: [],
          ice: [
            visibleCard({
              instanceId: "wall-ice",
              title: "Visible Wall",
              type: "ice",
              subtypes: ["Barrier"],
              rezzed: true,
            }),
          ],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function corpInput(options: {
  tags: number;
  legalActions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "corp",
    legalActions: options.legalActions,
    playerView: {
      side: "corp",
      own: {
        identity: visibleCard({ instanceId: "corp-id", type: "identity" }),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
      },
      opponent: {
        identity: visibleCard({ instanceId: "runner-id", type: "identity" }),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: options.tags,
        badPublicity: 0,
      },
      servers: [],
    },
  } as unknown as AiDecisionInput;
}

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "install_card",
    label: "Action",
    source: "source",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}

function visibleCard(overrides: Partial<VisibleCard>): VisibleCard {
  return {
    instanceId: "card",
    definitionId: "definition",
    title: "Visible Card",
    type: "program",
    known: true,
    faceup: true,
    rezzed: true,
    ...overrides,
  } as VisibleCard;
}
