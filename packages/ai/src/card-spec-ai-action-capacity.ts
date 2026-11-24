import type { listPlanningCardsWithFacts } from "@netgrid/cards/planning";
import type { AiCardHint } from "./ai-hint-contracts";

type PlanningEngine = ReturnType<
  typeof listPlanningCardsWithFacts
>[number]["planning"]["engine"];
type PlanningFlatlineReplacementSource = NonNullable<
  PlanningEngine["flatlineReplacementSources"]
>[number];
type PlanningEffect = NonNullable<
  PlanningEngine["abilities"]
>[number]["effects"][number];

export function deriveActionCapacityProfiles(
  entry: ReturnType<typeof listPlanningCardsWithFacts>[number],
): NonNullable<AiCardHint["actionCapacityProfiles"]> {
  const engine = entry.planning.engine;
  const controller = entry.facts.side;
  const profiles: NonNullable<AiCardHint["actionCapacityProfiles"]> = (
    engine.tagPreventionSources ?? []
  ).flatMap((source) => {
    if (source.cost.kind !== "credit_and_forgo_next_action") return [];
    if (source.kind !== "avoid_tag" || source.amount !== 1)
      throw new Error("card_spec_unknown_action_debt_tag_prevention_shape");
    return [
      {
        class: "action_debt" as const,
        timing: "prevention_window" as const,
        recipient: "runner" as const,
        restriction: "unrestricted" as const,
        reliability: "guaranteed" as const,
        sourceResource: "replacement_effect" as const,
        expiresAt: "debt_paid" as const,
        amount: 1,
        amountKind: "fixed" as const,
        bankable: false,
        repeatable: true,
      },
    ];
  });
  for (const ability of engine.abilities ?? []) {
    for (const effect of ability.effects)
      if (effect.kind === "start_runner_program_install_action_bundle")
        profiles.push({
          class: "restricted_gain",
          timing: "immediate",
          recipient: "runner",
          restriction: "program_install_only",
          reliability: "guaranteed",
          sourceResource: "source_card",
          expiresAt: "side_turn_end",
          amount: effect.actionCount,
          amountKind: "fixed",
          bankable: false,
          repeatable: false,
          actionTypes: ["install_card"],
        });
    const actionGains = gainActions(ability.effects);
    if (actionGains.length === 0) continue;
    if (ability.kind === "on_play") {
      for (const effect of actionGains)
        profiles.push(immediateActionGain(effect, controller));
      continue;
    }
    const sourceCounterCost = ability.costs.find(
      (cost) => cost.kind === "source_counter",
    );
    const advancementCounterCost = ability.costs.find(
      (cost) => cost.kind === "advancement_counter",
    );
    if (sourceCounterCost !== undefined) {
      for (const effect of actionGains)
        profiles.push({
          class: "finite_bank",
          timing:
            entry.facts.type === "agenda"
              ? "scored_activated"
              : "immediate",
          recipient: actionCapacityRecipient(effect, controller),
          restriction: "unrestricted",
          reliability: "guaranteed",
          sourceResource: "counter",
          expiresAt: "source_leaves_play",
          amount: effect.amount,
          amountKind: "fixed",
          bankable: true,
          repeatable: true,
        });
      continue;
    }
    if (advancementCounterCost !== undefined) {
      for (const effect of actionGains)
        profiles.push({
          class: "finite_bank",
          timing: "immediate",
          recipient: actionCapacityRecipient(effect, controller),
          restriction: "unrestricted",
          reliability: "guaranteed",
          sourceResource: "advancement_counter",
          expiresAt: "source_leaves_play",
          amount: effect.amount,
          amountKind: "fixed",
          bankable: true,
          repeatable: true,
        });
      continue;
    }
    throw new Error("card_spec_unknown_action_capacity_activated_gain_shape");
  }
  for (const effect of gainActions(engine.lifecycle?.on_rez ?? []))
    profiles.push({
      ...immediateActionGain(effect, controller),
      timing: "on_rez",
    });
  for (const trigger of engine.lifecycle?.start_of_corp_turn ?? [])
    for (const effect of gainActions(trigger.effects))
      profiles.push({
        class: "recurring_gain",
        timing: "start_of_turn",
        recipient: actionCapacityRecipient(effect, "corp"),
        restriction: "unrestricted",
        reliability:
          engine.uniqueDirectLongtail?.kind === "rezzed_leave_action_gain_asset"
            ? "conditional"
            : "guaranteed",
        sourceResource: "source_card",
        expiresAt: "source_leaves_play",
        amount: effect.amount,
        amountKind: "fixed",
        bankable: false,
        repeatable: true,
      });
  if (engine.corpUtility?.kind === "gain_restricted_install_actions")
    profiles.push({
      class: "restricted_gain",
      timing: "immediate",
      recipient: "corp",
      restriction: "install_only",
      reliability: "guaranteed",
      sourceResource: "source_card",
      expiresAt: "side_turn_end",
      amount: engine.corpUtility.amount,
      amountKind: "fixed",
      bankable: false,
      repeatable: false,
      actionTypes: ["install_card"],
    });
  if (
    engine.runnerUtilityLongtail?.kind ===
    "optional_extra_action_with_delayed_damage"
  )
    profiles.push({
      class: "recurring_gain",
      timing: "immediate",
      recipient: "runner",
      restriction: "unrestricted",
      reliability: "conditional",
      sourceResource: "source_card",
      expiresAt: "side_turn_end",
      amount: engine.runnerUtilityLongtail.extraActions,
      amountKind: "fixed",
      bankable: false,
      repeatable: true,
    });
  if (engine.runnerUtilityLongtail?.kind === "start_turn_random_effect_table") {
    const persistentAction = engine.runnerUtilityLongtail.outcomes.find(
      (outcome) =>
        outcome.kind === "trash_source_and_grant_persistent_extra_action",
    );
    if (persistentAction !== undefined)
      profiles.push({
        class: "random_gain",
        timing: "start_of_turn",
        recipient: "runner",
        restriction: "random_action",
        reliability: "random",
        sourceResource: "die_roll",
        expiresAt: "persistent",
        amount: persistentAction.extraActions,
        amountKind: "fixed",
        bankable: false,
        repeatable: true,
      });
  }
  if (engine.remainingReplacementLongtail?.kind === "run_action_spending_cap")
    profiles.push({
      class: "restricted_gain",
      timing: "immediate",
      recipient: "runner",
      restriction: "run_only",
      reliability: "conditional",
      sourceResource: "source_card",
      expiresAt: "resolution",
      amount: engine.remainingReplacementLongtail.actionGain,
      amountKind: "fixed",
      bankable: false,
      repeatable: true,
      actionTypes: ["start_run"],
    });
  for (const subroutine of engine.printedSubroutines ?? [])
    if (
      subroutine.kind === "runner_forgoes_next_action" ||
      subroutine.kind === "end_the_run_and_runner_forgoes_next_action"
    )
      profiles.push({
        class: "action_loss",
        timing: "encounter",
        recipient: "runner",
        restriction: "unrestricted",
        reliability: "conditional",
        sourceResource: "encounter_effect",
        expiresAt: "side_turn_end",
        amount: 1,
        amountKind: "fixed",
        bankable: false,
        repeatable: true,
      });
  profiles.push(
    ...flatlineActionCapacityProfiles(engine.flatlineReplacementSources),
  );
  if (
    engine.scoredAgenda?.kind ===
    "corp_start_turn_random_restricted_optional_action"
  )
    profiles.push({
      class: "random_gain",
      timing: "start_of_turn",
      recipient: "corp",
      restriction: "random_action",
      reliability: "random",
      sourceResource: "die_roll",
      expiresAt: "side_turn_end",
      amount: 1,
      amountKind: "fixed",
      bankable: false,
      repeatable: true,
    });
  if (
    engine.scoredAgenda?.kind === "corp_damage_replacement_pdca_action_counter"
  )
    profiles.push({
      class: "finite_bank",
      timing: "scored_activated",
      recipient: "corp",
      restriction: "unrestricted",
      reliability: "conditional",
      sourceResource: "damage_counter",
      expiresAt: "source_leaves_play",
      amount: 1,
      amountKind: "fixed",
      bankable: true,
      repeatable: true,
    });
  if (engine.scoredAgenda?.kind === "overadvance_start_of_corp_turn_actions")
    profiles.push({
      class: "recurring_gain",
      timing: "start_of_turn",
      recipient: "corp",
      restriction: "unrestricted",
      reliability: "guaranteed",
      sourceResource: "overadvance_counter",
      expiresAt: "source_leaves_play",
      amountKind: "dynamic",
      bankable: false,
      repeatable: true,
    });
  if (engine.corpUtility?.kind === "x_future_actions_and_credit_forfeit")
    profiles.push({
      class: "future_recurring_gain",
      timing: "future_turn_start",
      recipient: "corp",
      restriction: "unrestricted",
      reliability: "guaranteed",
      sourceResource: "credits_x",
      expiresAt: "duration_end",
      amount: 1,
      amountKind: "fixed",
      bankable: false,
      repeatable: false,
    });
  if (
    engine.successfulRunFollowups?.some(
      (followup) =>
        followup.kind === "skip_rd_access_add_purgeable_runner_virus_counter",
    ) ||
    engine.virusCounter !== undefined
  )
    profiles.push({
      class: "action_cost",
      timing: "persistent",
      recipient: "corp",
      restriction: "purge_only",
      reliability: "conditional",
      sourceResource: "virus_state",
      expiresAt: "resolution",
      amount: 3,
      amountKind: "fixed",
      bankable: false,
      repeatable: true,
      actionTypes: ["purge_virus_counters"],
    });
  if (
    engine.virusCounter?.addOnSuccessfulRun?.counterScope.kind ===
    "attacked_central_server_pool"
  )
    profiles.push({
      class: "action_loss",
      timing: "start_of_turn",
      recipient: "corp",
      restriction: "unrestricted",
      reliability: "conditional",
      sourceResource: "virus_state",
      expiresAt: "side_turn_end",
      amount: 1,
      amountKind: "fixed",
      bankable: false,
      repeatable: true,
    });
  if (
    engine.uniqueDirectLongtail?.kind ===
    "runner_start_turn_forced_random_action"
  )
    profiles.push({
      class: "mandatory_gain",
      timing: "start_of_turn",
      recipient: "runner",
      restriction: "mandatory_random_action",
      reliability: "mandatory",
      sourceResource: "die_roll",
      expiresAt: "resolution",
      amount: 1,
      amountKind: "fixed",
      bankable: false,
      repeatable: true,
    });
  if (
    engine.uniqueDirectLongtail?.kind ===
    "runner_start_turn_drip_counter_action_or_core_damage"
  )
    profiles.push({
      class: "recurring_gain",
      timing: "start_of_turn",
      recipient: "runner",
      restriction: "unrestricted",
      reliability: "conditional",
      sourceResource: "counter",
      expiresAt: "side_turn_end",
      amount: 1,
      amountKind: "fixed",
      bankable: false,
      repeatable: true,
    });
  const runLockTrace = engine.printedSubroutines?.find(
    (subroutine) =>
      subroutine.kind === "trace" &&
      subroutine.onSuccess.some((effect) => effect.kind === "end_run") &&
      subroutine.onSuccess.some(
        (effect) => effect.kind === "runner_run_lock_until_action_paid",
      ),
  );
  if (runLockTrace?.kind === "trace") {
    const runLock = runLockTrace.onSuccess.find(
      (effect) => effect.kind === "runner_run_lock_until_action_paid",
    );
    if (
      runLock === undefined ||
      !Number.isInteger(runLock.amount) ||
      runLock.amount <= 0 ||
      runLock.visibility !== "public"
    )
      throw new Error("card_spec_unknown_trace_run_lock_shape");
    profiles.push({
      class: "action_lock",
      timing: "encounter",
      recipient: "runner",
      restriction: "run_only",
      reliability: "conditional",
      sourceResource: "encounter_effect",
      expiresAt: "resolution",
      amountKind: "dynamic",
      bankable: false,
      repeatable: true,
      actionTypes: ["start_run"],
    });
  }
  return profiles;
}

type ActionCapacityProfile = NonNullable<
  AiCardHint["actionCapacityProfiles"]
>[number];

type GainActionsEffect = Extract<PlanningEffect, { kind: "gain_actions" }>;

function gainActions(effects: readonly PlanningEffect[]): GainActionsEffect[] {
  return effects.filter(
    (effect): effect is GainActionsEffect => effect.kind === "gain_actions",
  );
}

function actionCapacityRecipient(
  effect: GainActionsEffect,
  controller: "corp" | "runner",
): "corp" | "runner" {
  return effect.recipient === "controller" ? controller : effect.recipient;
}

function immediateActionGain(
  effect: GainActionsEffect,
  controller: "corp" | "runner",
): ActionCapacityProfile {
  return {
    class: "immediate_gain",
    timing: "immediate",
    recipient: actionCapacityRecipient(effect, controller),
    restriction: "unrestricted",
    reliability: "guaranteed",
    sourceResource: "source_card",
    expiresAt: "side_turn_end",
    amount: effect.amount,
    amountKind: "fixed",
    bankable: false,
    repeatable: false,
  };
}

function flatlineActionCapacityProfiles(
  sources: readonly PlanningFlatlineReplacementSource[] | undefined,
): ActionCapacityProfile[] {
  const profiles: ActionCapacityProfile[] = [];
  for (const source of sources ?? []) {
    if (source.kind === "flatline_replacement_from_grip") {
      profiles.push({
        class: "action_debt",
        timing: "prevention_window",
        recipient: "runner",
        restriction: "unrestricted",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "debt_paid",
        amount: source.resolution.futureActionDebt,
        amountKind: "fixed",
        bankable: false,
        repeatable: false,
      });
      continue;
    }
    if (source.kind === "flatline_replacement_installed") {
      const actionLoss = 4 - source.resolution.runnerActionsPerTurnOverride;
      if (actionLoss <= 0)
        throw new Error(
          "card_spec_unknown_action_capacity_flatline_action_loss_shape",
        );
      profiles.push({
        class: "action_loss",
        timing: "persistent",
        recipient: "runner",
        restriction: "unrestricted",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "persistent",
        amount: actionLoss,
        amountKind: "fixed",
        bankable: false,
        repeatable: false,
      });
    }
  }
  return profiles;
}
