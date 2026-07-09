import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import { runnerRunPlanSemanticChoice } from "./runner-run-plan-policy";
import { revalidateRunnerRunPlan } from "./runner-run-plan-revalidation";
import type { RunnerRunPlan } from "./runner-run-plan-types";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

describe("runner run plan policy", () => {
  it("chooses the quoted pump step over continue through an unbroken ETR", () => {
    const pump = pumpAction({ costs: [{ credits: 1 }] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      legalActions: [pump, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(pump, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(pump.actionId);
    expect(selected?.reasonCode).toBe("runner.run_plan.encounter_survival");
    expect(selected?.evidence).toContain(
      "runner_run_plan_sequence_selected:true",
    );
    expect(selected?.evidence).toContain("pump_required_count:2");
  });

  it("does not conserve into ETR when non-noisy recurring credits pay part of Codecracker pumps", () => {
    const pump = pumpAction({ costs: [{ credits: 1 }] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
      credits: 2,
      extraRig: [quietPrograms()],
      legalActions: [pump, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(pump, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(pump.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_sequence_selected:true",
    );
    expect(selected?.evidence).toContain("sequence_cash_cost:2");
    expect(selected?.evidence).toContain("sequence_restricted_credits_spent:2");
    expect(selected?.evidence).not.toContain(
      "runner_run_plan_conserve_credits:true",
    );
  });

  it("pumps toward an affordable safety break even when access is unaffordable", () => {
    const pump = pumpAction({
      breakerId: "loony-goon-1",
      costs: [{ credits: 1 }],
    });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 2,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_231_cortical-scrub",
      iceTitle: "Cortical Scrub",
      iceStrength: 3,
      breaker: loonyGoon(),
      credits: 2,
      extraRig: [quietPrograms()],
      subroutines: [
        {
          id: "cortical-scrub-core-damage",
          type: "do_damage",
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
        {
          id: "cortical-scrub-etr",
          type: "end_the_run",
        },
      ],
      legalActions: [pump, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(pump, "encounter_survival", 900),
        choice(continueRun, "simple_run_choice", -2397),
      ],
    });

    expect(selected?.action.actionId).toBe(pump.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_safety_sequence_selected:true",
    );
    expect(selected?.evidence).toContain(
      "current_encounter_safety_break_sequence:true",
    );
    expect(selected?.evidence).toContain("required_subroutine_indexes:0");
  });

  it("breaks brain damage after pumping even when ETR and access are unaffordable", () => {
    const breakBrainDamage = breakAction({
      actionId: "break-cortical-scrub-brain-damage",
      breakerId: "loony-goon-1",
      costs: [{ credits: 1 }],
      subroutineIndex: 0,
    });
    const breakEndTheRun = breakAction({
      actionId: "break-cortical-scrub-etr",
      breakerId: "loony-goon-1",
      costs: [{ credits: 1 }],
      subroutineIndex: 1,
    });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 2,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_231_cortical-scrub",
      iceTitle: "Cortical Scrub",
      iceStrength: 3,
      breaker: { ...loonyGoon(), strength: 3 },
      credits: 1,
      subroutines: [
        {
          id: "cortical-scrub-core-damage",
          type: "do_damage",
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
        {
          id: "cortical-scrub-etr",
          type: "end_the_run",
        },
      ],
      legalActions: [breakBrainDamage, breakEndTheRun, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", -2397),
        choice(breakEndTheRun, "encounter_survival", 1000),
        choice(breakBrainDamage, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(breakBrainDamage.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_safety_sequence_selected:true",
    );
    expect(selected?.evidence).toContain(
      "current_encounter_safety_break_sequence:true",
    );
  });

  it("chooses a legal direct break when restricted breaker credits preserve cash reserve", () => {
    const breakSubroutine = breakAction({ costs: [{ credits: 4 }] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
      breakerStrength: 4,
      credits: 2,
      extraRig: [quietPrograms()],
      legalActions: [breakSubroutine, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(breakSubroutine, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(breakSubroutine.actionId);
    expect(selected?.evidence).toContain("sequence_cash_cost:2");
    expect(selected?.evidence).toContain("sequence_restricted_credits_spent:2");
  });

  it("chooses a direct break step over continue through an unbroken ETR", () => {
    const breakSubroutine = breakAction({ costs: [] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      legalActions: [breakSubroutine, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(breakSubroutine, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(breakSubroutine.actionId);
    expect(selected?.evidence).toContain(
      "current_encounter_direct_break_sequence:true",
    );
  });

  it("chooses a direct break over continuing through visible non-ETR damage", () => {
    const breakSubroutine = breakAction({ costs: [], subroutineIndex: 0 });
    const continueRun = continueAction({
      encounterWillEndRun: false,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      subroutines: [
        {
          id: "damage-subroutine",
          type: "do_damage",
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
      ],
      legalActions: [breakSubroutine, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(continueRun, "simple_run_choice", 900),
        choice(breakSubroutine, "encounter_survival", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(breakSubroutine.actionId);
    expect(selected?.evidence).toContain("required_subroutine_indexes:0");
  });

  it("conserves credits when breaking the current ICE cannot make the remaining known path reachable", () => {
    const breakSubroutine = breakAction({
      actionId: "break-current-code-gate",
      costs: [{ credits: 2 }],
      subroutineIndex: 0,
    });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      futureIce: [
        visibleIce({
          instanceId: "future-wall",
          iceDefinitionId: "onr_v1_253_laser-wire",
          iceTitle: "Laser Wire",
          iceStrength: 2,
        }),
      ],
      legalActions: [breakSubroutine, continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(breakSubroutine, "encounter_survival", 100),
        choice(continueRun, "simple_run_choice", -2397),
      ],
    });

    expect(selected?.action.actionId).toBe(continueRun.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_conserve_credits:true",
    );
    expect(selected?.evidence).toContain(
      "runner_run_plan_conserve_reason:known_ice_unbreakable",
    );
  });

  it("chooses jack out when continue would end the run and no access-preserving sequence exists", () => {
    const pump = pumpAction({ costs: [{ credits: 1 }] });
    const continueRun = continueAction({
      encounterWillEndRun: true,
      unbrokenSubroutineCount: 1,
    });
    const jackOut = action("jack_out", {
      actionId: "jack-out",
      source: "game_rule",
      costs: [],
      payload: {},
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_253_laser-wire",
      iceTitle: "Laser Wire",
      iceStrength: 2,
      legalActions: [pump, continueRun, jackOut],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(pump, "encounter_survival", 800),
        choice(continueRun, "simple_run_choice", 700),
        choice(jackOut, "simple_run_choice", 100),
      ],
    });

    expect(selected?.action.actionId).toBe(jackOut.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_abort_recommended:true",
    );
  });

  it("continues after all encounter subroutines are already broken", () => {
    const continueRun = continueAction({
      encounterWillEndRun: false,
      unbrokenSubroutineCount: 0,
    });
    const input = runnerEncounterInput({
      iceDefinitionId: "onr_v1_261_quandary",
      iceTitle: "Quandary",
      iceStrength: 2,
      breakerStrength: 2,
      legalActions: [continueRun],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [choice(continueRun, "simple_run_choice", 100)],
    });

    expect(selected?.action.actionId).toBe(continueRun.actionId);
    expect(selected?.evidence).toContain(
      "encounter_no_etr_break_required:true",
    );
  });

  it("continues from the server movement window after passed ICE was already paid", () => {
    const continueRun = action("continue_run", {
      actionId: "continue-run-to-access",
      source: "game_rule",
      costs: [],
      timingPoint: "run.jack_out_window",
      expiresAtStateVersion: 167,
      payload: {},
    });
    const jackOut = action("jack_out", {
      actionId: "jack-out",
      source: "game_rule",
      costs: [],
      timingPoint: "run.jack_out_window",
      expiresAtStateVersion: 167,
      payload: {},
    });
    const input = runnerServerMovementInput({
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
      credits: 0,
      legalActions: [jackOut, continueRun],
    });
    const basePlan = runPlan();
    const planAfterPaidIce: RunnerRunPlan = {
      ...basePlan,
      budget: {
        ...basePlan.budget,
        availableCredits: 4,
      },
      pathQuote: {
        ...basePlan.pathQuote,
        totalKnownCost: 4,
        expectedRemainingCredits: 0,
        canReachAccess: true,
      },
      revalidation: {
        ...basePlan.revalidation,
        reasons: ["fingerprint:previous"],
      },
    };

    const revalidated = revalidateRunnerRunPlan(input, planAfterPaidIce);
    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: revalidated,
      choices: [
        choice(jackOut, "simple_run_choice", -351),
        choice(continueRun, "simple_run_choice", 103),
      ],
    });

    expect(revalidated.revalidation.status).toBe("adjusted");
    expect(revalidated.pathQuote.totalKnownCost).toBe(0);
    expect(revalidated.pathQuote.canReachAccess).toBe(true);
    expect(selected?.action.actionId).toBe(continueRun.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_revalidation:adjusted",
    );
    expect(selected?.evidence).not.toContain(
      "runner_run_plan_abort_recommended:true",
    );
  });

  it("does not let abort revalidation override a better movement continue choice", () => {
    const continueRun = action("continue_run", {
      actionId: "continue-run-to-next-ice",
      source: "game_rule",
      costs: [],
      timingPoint: "run.jack_out_window",
      expiresAtStateVersion: 168,
      payload: {},
    });
    const jackOut = action("jack_out", {
      actionId: "jack-out",
      source: "game_rule",
      costs: [],
      timingPoint: "run.jack_out_window",
      expiresAtStateVersion: 168,
      payload: {},
    });
    const input = runnerServerMovementInput({
      iceDefinitionId: "onr_v1_252_keeper",
      iceTitle: "Keeper",
      iceStrength: 4,
      credits: 15,
      legalActions: [jackOut, continueRun],
    });
    const abortingPlan: RunnerRunPlan = {
      ...runPlan(),
      lifecycle: "abort_recommended",
      currentEncounter: {
        server: "rd",
        phase: "movement",
      },
      revalidation: {
        status: "abort_recommended",
        reasons: [
          "path_quote_changed",
          "cannot_reach:insufficient_credits_after_reserve",
        ],
        checkedAtStateVersion: 168,
      },
      pathQuote: {
        ...runPlan().pathQuote,
        canReachAccess: false,
        cannotReachReason: "insufficient_credits_after_reserve",
      },
    };

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: abortingPlan,
      choices: [
        choice(jackOut, "simple_run_choice", -351),
        choice(continueRun, "simple_run_choice", 103),
      ],
    });

    expect(selected?.action.actionId).toBe(continueRun.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_abort_yielded_to_continue:true",
    );
    expect(selected?.evidence).toContain(
      "runner_run_plan_revalidation:abort_recommended",
    );
  });

  it("uses successful-run followups before normal access", () => {
    const successFollowup = action("resolve_choice", {
      actionId: "credit-subversion-before-access",
      source: "runner-resource-1",
      costs: [],
      timingPoint: "access.resolve_card",
      expiresAtStateVersion: 170,
      payload: {
        sourceCardId: "runner-resource-1",
        sourceDefinitionId: "onr_proteus_136_credit-subversion",
        cardImplementationAbilityKey: "successful_run_before_access:0",
        cardImplementationPrimitiveKind: "successful_run_before_access_effect",
        cardImplementationEffectKind: "corp_lose_credits",
      },
    });
    const accessCard = action("access_card", {
      actionId: "access-rd-card",
      source: "game_rule",
      costs: [],
      timingPoint: "access.resolve_card",
      expiresAtStateVersion: 170,
      payload: {},
    });
    const input = runnerAccessInput({
      legalActions: [successFollowup, accessCard],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(accessCard, "runner_open_access_card", 9000),
        choice(successFollowup, "card_ability.trigger", 10),
      ],
    });

    expect(selected?.action.actionId).toBe(successFollowup.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_success_window_selected:true",
    );
    expect(selected?.evidence).toContain(
      "runner_run_plan_success_window_before_access:true",
    );
    expect(selected?.evidence).toContain(
      "runner_run_plan_success_window_signal:successful_run_before_access:0",
    );
  });

  it("does not treat generic resolve_choice as a runner success window", () => {
    const genericChoice = action("resolve_choice", {
      actionId: "generic-choice",
      source: "game_rule",
      costs: [],
      timingPoint: "access.resolve_card",
      expiresAtStateVersion: 170,
      payload: {},
    });
    const accessCard = action("access_card", {
      actionId: "access-rd-card",
      source: "game_rule",
      costs: [],
      timingPoint: "access.resolve_card",
      expiresAtStateVersion: 170,
      payload: {},
    });
    const input = runnerAccessInput({
      legalActions: [genericChoice, accessCard],
    });

    const selected = runnerRunPlanSemanticChoice({
      input,
      plan: runPlan(),
      choices: [
        choice(accessCard, "runner_open_access_card", 900),
        choice(genericChoice, "card_ability.trigger", 1200),
      ],
    });

    expect(selected?.action.actionId).toBe(accessCard.actionId);
    expect(selected?.evidence).toContain(
      "runner_run_plan_access_selected:access_card",
    );
    expect(selected?.evidence).not.toContain(
      "runner_run_plan_success_window_selected:true",
    );
  });
});

function runnerEncounterInput(params: {
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  credits?: number;
  breaker?: VisibleCard;
  extraRig?: VisibleCard[];
  breakerStrength?: number;
  subroutines?: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"];
  futureIce?: VisibleCard[];
  legalActions: LegalAction[];
}): AiDecisionInput {
  const ice = visibleIce(params);
  const futureIce = params.futureIce ?? [];
  return {
    side: "runner",
    playerView: {
      stateVersion: 143,
      side: "runner",
      activeSide: "runner",
      timingPoint: "run.encounter",
      phase: "runner_action",
      turn: 1,
      click: 1,
      winner: null,
      agendaPointsToWin: 7,
      own: {
        identity: { instanceId: "runner-id", known: true },
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [
          params.breaker ?? {
            instanceId: "codecracker-1",
            known: true,
            title: "Codecracker",
            definitionId: "onr_v1_014_codecracker",
            type: "program",
            subtypes: ["icebreaker"],
            strength: params.breakerStrength ?? 0,
          },
          ...(params.extraRig ?? []),
        ],
        clicks: 3,
        credits: params.credits ?? 7,
        tags: 0,
        badPublicity: 0,
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        gripOrHqCount: 5,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        clicks: 3,
        credits: 5,
        tags: 0,
        badPublicity: 0,
      },
      servers: [
        {
          id: "rd",
          label: "R&D",
          ice: [...futureIce, ice],
          root: [],
        },
      ],
      run: {
        attackedServerId: "rd",
        phase: "encounter_ice",
        position: { kind: "ice", serverId: "rd", iceIndex: futureIce.length },
        encounteredIce: ice,
        successful: false,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-plan-policy-test",
    decisionId: "runner-run-plan-policy-test:143:runner",
    actionNumber: 1,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function runnerServerMovementInput(params: {
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  credits: number;
  legalActions: LegalAction[];
}): AiDecisionInput {
  const ice = visibleIce(params);
  return {
    side: "runner",
    playerView: {
      stateVersion: 167,
      side: "runner",
      activeSide: "runner",
      timingPoint: "run.jack_out_window",
      phase: "runner_action",
      turn: 1,
      click: 3,
      winner: null,
      agendaPointsToWin: 7,
      own: {
        identity: { instanceId: "runner-id", known: true },
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [
          {
            instanceId: "codecracker-1",
            known: true,
            title: "Codecracker",
            definitionId: "onr_v1_014_codecracker",
            type: "program",
            subtypes: ["icebreaker"],
            strength: params.iceStrength,
          },
        ],
        clicks: 1,
        credits: params.credits,
        tags: 0,
        badPublicity: 0,
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        gripOrHqCount: 5,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        clicks: 3,
        credits: 5,
        tags: 0,
        badPublicity: 0,
      },
      servers: [
        {
          id: "rd",
          label: "R&D",
          ice: [ice],
          root: [],
        },
      ],
      run: {
        attackedServerId: "rd",
        phase: "movement",
        position: { kind: "server", serverId: "rd" },
        encounteredIce: ice,
        successful: false,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-plan-policy-server-movement-test",
    decisionId: "runner-run-plan-policy-server-movement-test:167:runner",
    actionNumber: 3,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function runnerAccessInput(params: {
  legalActions: LegalAction[];
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 170,
      side: "runner",
      activeSide: "runner",
      timingPoint: "access.resolve_card",
      phase: "run",
      turn: 1,
      click: 3,
      winner: null,
      agendaPointsToWin: 7,
      own: {
        identity: { instanceId: "runner-id", known: true },
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        clicks: 1,
        credits: 7,
        tags: 0,
        badPublicity: 0,
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        gripOrHqCount: 5,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        clicks: 3,
        credits: 5,
        tags: 0,
        badPublicity: 0,
      },
      servers: [
        {
          id: "rd",
          label: "R&D",
          ice: [],
          root: [],
        },
      ],
      run: {
        attackedServerId: "rd",
        phase: "access",
        position: { kind: "server", serverId: "rd" },
        successful: true,
      },
      publicEvents: [],
    },
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-plan-policy-access-test",
    decisionId: "runner-run-plan-policy-access-test:170:runner",
    actionNumber: 3,
    profileId: "runner-run-plan-profile",
  } as unknown as AiDecisionInput;
}

function visibleIce(params: {
  instanceId?: string;
  iceDefinitionId: string;
  iceTitle: string;
  iceStrength: number;
  subroutines?: NonNullable<VisibleCard["effectiveRunQuote"]>["subroutines"];
}): VisibleCard {
  return {
    instanceId: params.instanceId ?? "ice-1",
    known: true,
    title: params.iceTitle,
    definitionId: params.iceDefinitionId,
    type: "ice",
    subtypes:
      params.iceDefinitionId === "onr_v1_253_laser-wire"
        ? ["wall"]
        : params.iceDefinitionId === "onr_v1_231_cortical-scrub"
          ? ["sentry", "black_ice", "ap", "brainwipe"]
          : ["code_gate"],
    rezzed: true,
    strength: params.iceStrength,
    effectiveRunQuote: {
      iceInstanceId: "ice-1",
      iceDefinitionId: params.iceDefinitionId,
      effectiveStrength: params.iceStrength,
      subroutines: params.subroutines ?? [
        {
          id: `${params.iceDefinitionId}:etr`,
          type: "end_the_run",
        },
      ],
    },
  };
}

function loonyGoon(): VisibleCard {
  return {
    instanceId: "loony-goon-1",
    known: true,
    title: "Loony Goon",
    definitionId: "onr_v1_040_loony-goon",
    type: "program",
    subtypes: ["icebreaker", "killer"],
    strength: 0,
  };
}

function quietPrograms(): VisibleCard {
  return {
    instanceId: "quiet-1",
    known: true,
    title: "Vewy Vewy Quiet",
    definitionId: "onr_v1_071_vewy-vewy-quiet",
    type: "program",
    subtypes: ["stealth"],
    counterDisplays: [
      {
        id: "quiet-1-recurring",
        counterType: "recurring_credit",
        amount: 2,
        displayKind: "recurring_credit",
        label: "Recurring credits",
        ariaLabel: "2 recurring credits",
        creditPool: {
          kind: "recurring_credit",
          uses: ["using_icebreaker_during_run_non_noisy"],
        },
      },
    ],
  } as VisibleCard;
}

function runPlan(): RunnerRunPlan {
  return {
    id: "runplan-policy-test",
    side: "runner",
    lifecycle: "active",
    origin: "basic_start_run",
    objective: { kind: "access_rnd_top", expectedValue: 100 },
    targetServer: { id: "rd" },
    accessIntent: {
      server: "rd",
      expectedAccessCount: 1,
      stealAgendaPolicy: "steal_if_affordable",
      trashPolicy: "trash_if_value_positive",
      reserveForStealOrTrash: 0,
    },
    runStartActionId: "run-rd",
    sourceTacticalGoalIds: ["runner.opportunistic_central_run:rd"],
    sourceStrategyEvidence: ["deck_strategy:rd_pressure"],
    budget: {
      availableCredits: 7,
      runOnlyCredits: 0,
      recurringBreakerCredits: 0,
      recurringKillerCredits: 0,
      recurringLinkCredits: 0,
      stealthCredits: 0,
      nonNoisyBreakerCredits: 0,
      reservedCreditsAfterRun: 0,
      reservedCreditsForSteal: 0,
      reservedCreditsForTrash: 0,
      damageSafetyReserve: {
        minimumGripAfterRun: 0,
        preventionCreditsReserved: 0,
        evidence: [],
      },
      tagSafetyReserve: {
        minimumCreditsAfterTags: 0,
        expectedTagCount: 0,
        evidence: [],
      },
    },
    reserve: {
      minimumCreditsAfterRun: 0,
      minimumGripAfterRun: 0,
      preserveStealOrTrashCredits: 0,
      evidence: [],
    },
    pathQuote: {
      server: "rd",
      quoteStatus: "unknown",
      iceQuotes: [],
      totalKnownCost: 0,
      expectedUnknownCost: 0,
      expectedRemainingCredits: 7,
      reserveViolation: false,
      canReachAccess: true,
      requiredSequences: [],
    },
    currentEncounter: {
      server: "rd",
      phase: "encounter_ice",
      iceIndex: 0,
    },
    revalidation: {
      status: "valid",
      reasons: [],
      checkedAtStateVersion: 143,
    },
    abortPolicy: {
      allowJackOutWhenLegal: true,
      abortBelowCredits: 0,
      abortReasons: [],
    },
    visibilityEvidence: [{ kind: "player_view", ref: "run" }],
    debug: { summary: "test run plan", items: [] },
    createdAtStateVersion: 142,
    updatedAtStateVersion: 143,
  };
}

function choice(
  legalAction: LegalAction,
  scopeId: string,
  score: number,
): SemanticRuntimeChoice {
  return {
    action: legalAction,
    scopeId,
    score,
    scoreBreakdown: [
      {
        key: "test_score",
        label: "Test score",
        value: score,
        reason: "test",
      },
    ],
    reasonCode: `runner.semantic.${scopeId}`,
    explanation: scopeId,
    evidence: [`action_type:${legalAction.type}`],
  };
}

function pumpAction(params: {
  costs: LegalAction["costs"];
  breakerId?: string;
}): LegalAction {
  const breakerId = params.breakerId ?? "codecracker-1";
  return action("pump_breaker", {
    actionId: `pump-${breakerId}`,
    source: breakerId,
    costs: params.costs,
    payload: {
      breakerId,
      iceId: "ice-1",
      pumpStrengthAmount: 1,
    },
  });
}

function breakAction(params: {
  actionId?: string;
  breakerId?: string;
  costs: LegalAction["costs"];
  subroutineIndex?: number;
}): LegalAction {
  const breakerId = params.breakerId ?? "codecracker-1";
  return action("break_subroutine", {
    actionId: params.actionId ?? "break-codecracker",
    source: breakerId,
    costs: params.costs,
    payload: {
      breakerId,
      iceId: "ice-1",
      subroutineIndex: params.subroutineIndex ?? 0,
    },
  });
}

function continueAction(params: {
  encounterWillEndRun: boolean;
  unbrokenSubroutineCount: number;
}): LegalAction {
  return action("continue_run", {
    actionId: "continue-run",
    source: "game_rule",
    costs: [],
    payload: {
      encounterContinue: true,
      encounterWillEndRun: params.encounterWillEndRun,
      unbrokenSubroutineCount: params.unbrokenSubroutineCount,
    },
  });
}

function action(
  type: LegalAction["type"],
  params: {
    actionId: string;
    source: LegalAction["source"];
    costs: LegalAction["costs"];
    timingPoint?: string;
    expiresAtStateVersion?: number;
    payload: NonNullable<LegalAction["payload"]>;
  },
): LegalAction {
  return {
    actionId: params.actionId,
    side: "runner",
    type,
    label: params.actionId,
    source: params.source,
    timingPoint: params.timingPoint ?? "run.encounter",
    costs: params.costs,
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: params.expiresAtStateVersion ?? 143,
    payload: params.payload,
  } as unknown as LegalAction;
}
