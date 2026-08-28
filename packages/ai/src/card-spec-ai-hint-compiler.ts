import aiSupportScenarioData from "../../../data/scenarios/card-support-ai-supported-current.json";
import {
  KNOWN_HINT_LINE_SUPPORT,
  KNOWN_HINT_BREAKER_COVERAGES,
  KNOWN_HINT_REMOTE_ROLE_KINDS,
  KNOWN_HINT_STRATEGIC_EXCHANGE_KINDS,
  KNOWN_HINT_STRATEGY_SUPPORT_PAIR_ROLES,
  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
  type KnownHintStrategySupportPairRole,
} from "./hint-ontology";
import {
  cardSpecPlanningCards,
  KNOWN_PLANNING_TACTIC_SIGNALS,
  KNOWN_PLANNING_TACTIC_USES,
} from "@netgrid/cards/planning";
import type { PlanningInterpretation } from "@netgrid/cards/planning";
import {
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type AiCardHint,
  type AiRuntimeValueHints,
} from "./ai-hint-contracts";

export {
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type AiCardHint,
  type AiRuntimeValueHintKey,
  type AiRuntimeValueHints,
} from "./ai-hint-contracts";

const CARD_SPEC_HINT_ENGINE_FIELDS = new Set([
  "schemaVersion",
  "characteristics",
  "corpRootRezCreditOutcome",
  "abilities",
  "accessEffects",
  "accessHooks",
  "agendaAccessReplacement",
  "advanceable",
  "corpTrashInstalledRunnerSource",
  "corpUtility",
  "damagePreventionSources",
  "flatlineReplacementSources",
  "fortCapacityModifiers",
  "fortRunWindows",
  "hardwareDeck",
  "hiddenReplacementLongtail",
  "hostedProgramCapacity",
  "hostedProgramModifiers",
  "iceEncounter",
  "icebreakerAbilities",
  "icebreakerEncounterStrengthBonus",
  "icebreakerSubtypeChange",
  "installCapabilities",
  "installAdditionalCosts",
  "installTargetBinding",
  "leavePlayCleanup",
  "lifecycle",
  "modifiers",
  "printedSubroutines",
  "relativeIce",
  "regionBaseline",
  "remainingReplacementLongtail",
  "restrictedHostedCreditSource",
  "runnerCounterEffects",
  "runnerEventLongtail",
  "runnerEventTargetedEffect",
  "runEncounterInterventions",
  "runnerRunStrengthBoost",
  "runnerUtilityLongtail",
  "scoredAgenda",
  "selfRezAdditionalCosts",
  "selfRezCostModifiers",
  "selfRezWindows",
  "selfStealCosts",
  "successfulRunFollowups",
  "tagPreventionSources",
  "trashPreventionSources",
  "unique",
  "uniqueDirectLongtail",
  "variableRez",
  "virusCounter",
]);

export function deriveCardSpecAiHint(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): AiCardHint {
  for (const field of Object.keys(entry.planning.engine))
    if (!CARD_SPEC_HINT_ENGINE_FIELDS.has(field))
      throw new Error(`card_spec_hint_unsupported_family: ${field}`);
  const annotations = entry.planning.planningAnnotations?.card ?? [];
  const planRoles = [
    ...new Set([
      ...annotations.flatMap((annotation) =>
        annotation.kind === "plan_role" ? [annotation.role] : [],
      ),
      ...derivedMechanicalPlanRoles(entry),
    ]),
  ];
  const strategicRole = annotations.flatMap((annotation) =>
    annotation.kind === "strategic_role" ? [annotation.role] : [],
  );
  const strategyAnchors = annotations.flatMap((annotation) =>
    annotation.kind === "strategy_anchor" ? [annotation.strategyKey] : [],
  );
  const lineSupport = closedPlanningValues(
    annotations.flatMap((annotation) =>
      annotation.kind === "line_support" ? [annotation.lineKey] : [],
    ),
    KNOWN_HINT_LINE_SUPPORT,
    "line_support",
  );
  const strategicExchangeKinds = closedPlanningValues(
    annotations.flatMap((annotation) =>
      annotation.kind === "strategic_exchange" ? [annotation.exchange] : [],
    ),
    KNOWN_HINT_STRATEGIC_EXCHANGE_KINDS,
    "strategic_exchange",
  );
  const remoteRoleAnnotation = annotations.find(
    (annotation) => annotation.kind === "remote_role",
  );
  const valueHints: AiRuntimeValueHints = {};
  for (const annotation of annotations)
    if (annotation.kind === "value_interpretation")
      valueHints[valueHintKey(annotation.axis)] =
        annotation.rating === "low"
          ? 1
          : annotation.rating === "medium"
            ? 2
            : annotation.rating === "high"
              ? 3
              : annotation.rating === "very_high"
                ? 4
                : 5;
  Object.assign(valueHints, deriveMechanicalValueHints(entry.planning.engine));
  const strategySupportPairs = annotations
    .filter((annotation) => annotation.kind === "strategy_support")
    .map((annotation) => {
      const role = strategySupportRole(annotation.role);
      return {
        strategyId: annotation.strategyKey,
        role,
        roleDetail: annotation.roleDetail,
        evidence:
          annotation.evidenceProfile === undefined
            ? derivedStrategyEvidence(
                entry.planning.engine,
                annotation.strategyKey,
              )
            : derivedCardStrategyEvidence(
                entry.planning.engine,
                annotation.strategyKey,
                role,
                annotation.roleDetail,
                annotation.evidenceProfile,
              ),
        confidence: annotation.confidence,
        ...(annotation.rationale === undefined
          ? {}
          : { rationale: annotation.rationale }),
      };
    });
  const capabilityStrategySupportPairs = (
    entry.planning.planningAnnotations?.capabilities ?? []
  ).flatMap((capability) =>
    deriveCapabilityStrategySupportPairs(entry, capability.capabilityKey),
  );
  const actionCapabilitySemantics = deriveActionCapabilitySemantics(entry);
  const actionPlanOwnerBindings = deriveActionPlanOwnerBindings(entry);
  const targetProfiles = deriveTargetProfiles(entry);
  const genericTypedHint = deriveGenericTypedHintOverlay(entry);
  const breakerProfile = deriveBreakerProfile(entry.planning.engine);
  const actionCapacityProfiles = deriveActionCapacityProfiles(entry);
  const closedMechanicalHint = deriveClosedMechanicalHintOverlay(entry);
  const effects = appendUniqueObjects(
    appendUniqueObjects(deriveHintEffects(entry), closedMechanicalHint.effects),
    genericTypedHint.effects,
  );
  const functionSignals = appendUniqueStrings(
    appendUniqueStrings(
      derivedFunctionSignals(entry),
      closedMechanicalHint.functionSignals,
    ),
    genericTypedHint.functionSignals,
  );
  const tacticSignals = appendUniqueStrings(
    derivedTacticSignals(entry),
    closedMechanicalHint.tacticSignals,
  );
  const actionTacticSignals = deriveActionTacticSignals(entry, effects);
  const conditions = appendUniqueObjects(
    appendUniqueObjects(
      deriveConditions(entry),
      closedMechanicalHint.conditions,
    ),
    genericTypedHint.conditions,
  );
  const costProfile = deriveCostProfile(annotations, entry);
  const riskTags = deriveRiskTags(annotations, entry);
  const roles = appendUniqueStrings(
    deriveRoles(entry),
    closedMechanicalHint.roles,
  );
  const evidence = deriveAiSupportEvidence(entry);
  const hint = {
    cardId: entry.definition.id,
    side: entry.definition.side,
    cardType: entry.definition.type,
    aiSupportStatus: evidence.status,
    roles,
    planRoles,
    valueHints,
    ...(strategicRole.length === 0 ? {} : { strategicRole }),
    ...(strategyAnchors.length === 0 ? {} : { strategyAnchors }),
    ...(lineSupport.length === 0 ? {} : { lineSupport }),
    ...(strategicExchangeKinds.length === 0 ? {} : { strategicExchangeKinds }),
    ...(strategySupportPairs.length === 0 ? {} : { strategySupportPairs }),
    ...(capabilityStrategySupportPairs.length > 0
      ? { actionStrategySupportPairs: capabilityStrategySupportPairs }
      : strategySupportPairs.length > 0 &&
          !annotations.some(
            (annotation) =>
              annotation.kind === "strategy_support" &&
              annotation.evidenceProfile !== undefined,
          ) &&
          entry.planning.engine.abilities?.some(
            (ability) => ability.kind === "on_play",
          ) === true
        ? { actionStrategySupportPairs: strategySupportPairs }
        : {}),
    ...(actionPlanOwnerBindings.length === 0
      ? {}
      : { actionPlanOwnerBindings }),
    ...(actionCapabilitySemantics.length === 0
      ? {}
      : { actionCapabilitySemantics }),
    ...(targetProfiles.length === 0 &&
    genericTypedHint.targetProfiles.length === 0
      ? {}
      : {
          targetProfiles: appendUniqueObjects(
            targetProfiles,
            genericTypedHint.targetProfiles,
          ),
        }),
    ...(breakerProfile === undefined ? {} : { breakerProfile }),
    ...(actionCapacityProfiles.length === 0 ? {} : { actionCapacityProfiles }),
    ...(effects.length === 0 ? {} : { effects }),
    ...(functionSignals.length === 0 ? {} : { functionSignals }),
    ...(tacticSignals.length === 0 ? {} : { tacticSignals }),
    ...(actionTacticSignals.length === 0 ? {} : { actionTacticSignals }),
    ...(conditions.length === 0 ? {} : { conditions }),
    ...(costProfile === undefined ? {} : { costProfile }),
    ...(riskTags.length === 0 ? {} : { riskTags }),
    quality: evidence.quality,
    scenarioRefs: evidence.scenarioRefs,
    ...(remoteRoleAnnotation?.kind === "remote_role"
      ? {
          remoteRole: {
            kind: closedPlanningValue(
              remoteRoleAnnotation.role,
              KNOWN_HINT_REMOTE_ROLE_KINDS,
              "remote_role",
            ),
            threatLevel: remoteRoleAnnotation.threatLevel,
            serverScope:
              entry.definition.type === "upgrade" ? "remote" : "server",
          },
        }
      : closedMechanicalHint.remoteRole === undefined
        ? {}
        : { remoteRole: closedMechanicalHint.remoteRole }),
    requiredMechanics: deriveRequiredMechanics(entry),
  } satisfies AiCardHint;
  return hint;
}

function deriveCapabilityStrategySupportPairs(
  entry: PlanningEntry,
  capabilityKey: string,
): NonNullable<AiCardHint["actionStrategySupportPairs"]> {
  const capability = (
    entry.planning.planningAnnotations?.capabilities ?? []
  ).find((candidate) => candidate.capabilityKey === capabilityKey);
  if (capability === undefined) return [];
  return capability.annotations.flatMap((annotation) =>
    annotation.kind !== "strategy_support"
      ? []
      : [
          {
            strategyId: annotation.strategyKey,
            role: strategySupportRole(annotation.role),
            roleDetail: annotation.roleDetail,
            evidence: derivedActionStrategyEvidence(
              entry.planning.engine,
              capabilityKey,
              annotation.strategyKey,
              strategySupportRole(annotation.role),
              annotation.roleDetail,
              annotation.evidenceAnchor,
            ),
            confidence: annotation.confidence,
            ...(annotation.rationale === undefined
              ? {}
              : { rationale: annotation.rationale }),
          },
        ],
  );
}

function deriveActionCapabilitySemantics(
  entry: PlanningEntry,
): NonNullable<AiCardHint["actionCapabilitySemantics"]> {
  const abilitySemantics = (entry.planning.engine.abilities ?? [])
    .map((ability) => {
      const overlay: GenericTypedHintOverlay = {
        effects: [],
        conditions: [],
        functionSignals: [],
        targetProfiles: [],
      };
      appendTypedCondition(overlay.conditions, ability.condition);
      appendGenericAbilityCosts(overlay, entry, ability);
      for (const effect of ability.effects ?? []) {
        appendGenericAbilityEffect(overlay, entry, ability, effect);
        appendGenericTargetProfile(overlay.targetProfiles, ability, effect);
      }
      appendScoredAgendaActivatedAbilityMarker(overlay, entry, ability);
      const strategySupportPairs = deriveCapabilityStrategySupportPairs(
        entry,
        ability.capabilityKey,
      );
      const effects = appendUniqueObjects([], overlay.effects);
      const conditions = uniqueConditions(overlay.conditions);
      const targetProfiles = appendUniqueObjects([], overlay.targetProfiles);
      const functionSignals = [...new Set(overlay.functionSignals)].sort();
      const abilityCosts = Array.isArray(ability.costs) ? ability.costs : [];
      const creditCost = abilityCosts.reduce(
        (sum, cost) =>
          sum + (cost.kind === "credit" ? Math.max(0, cost.amount) : 0),
        0,
      );
      const clickCost = abilityCosts.reduce(
        (sum, cost) =>
          sum + (cost.kind === "action" ? Math.max(0, cost.amount) : 0),
        0,
      );
      const costProfile = {
        ...(clickCost > 0 ? { clicks: clickCost } : {}),
        ...(creditCost > 0 ? { credits: creditCost } : {}),
      };
      return {
        capabilityKey: ability.capabilityKey,
        ...(Object.keys(costProfile).length === 0 ? {} : { costProfile }),
        ...(effects.length === 0 ? {} : { effects }),
        ...(functionSignals.length === 0 ? {} : { functionSignals }),
        ...(conditions.length === 0 ? {} : { conditions }),
        ...(targetProfiles.length === 0 ? {} : { targetProfiles }),
        ...(strategySupportPairs.length === 0 ? {} : { strategySupportPairs }),
      };
    })
    .sort((left, right) =>
      left.capabilityKey.localeCompare(right.capabilityKey),
    );
  const runnerUtility = entry.planning.engine.runnerUtilityLongtail;
  if (runnerUtility?.kind === "derez_fully_broken_passed_ice_and_end_run") {
    abilitySemantics.push({
      capabilityKey: runnerUtility.capabilityKey,
      effects: [
        {
          kind: "rez",
          scope: "ice",
          timing: "encounter_resolution",
          target: "derez",
          finite: true,
        },
        {
          kind: "future_run_effect",
          scope: "run_path",
          timing: "encounter_resolution",
          target: "ends_run_after_effect",
          finite: true,
        },
      ],
      functionSignals: ["ice.derez", "run.ends_run_after_effect"],
      conditions: [
        { kind: "requires_encounter" },
        { kind: "requires_rezzed_ice" },
      ],
    });
  }
  return abilitySemantics.sort((left, right) =>
    left.capabilityKey.localeCompare(right.capabilityKey),
  );
}

function deriveActionPlanOwnerBindings(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["actionPlanOwnerBindings"]> {
  const result: NonNullable<AiCardHint["actionPlanOwnerBindings"]> = [];
  for (const capability of entry.planning.planningAnnotations?.capabilities ??
    []) {
    const annotations = capability.annotations.filter(
      (annotation) => annotation.kind === "plan_owner",
    );
    if (annotations.length === 0) continue;
    if (annotations.length !== 1)
      throw new Error(
        `card_spec_plan_owner_duplicate: ${capability.capabilityKey}`,
      );
    const ownerNodeCount = countAddressableEngineNodes(
      entry.planning.engine,
      capability.capabilityKey,
    );
    if (ownerNodeCount === 0)
      throw new Error(
        `card_spec_plan_owner_capability_missing: ${capability.capabilityKey}`,
      );
    if (ownerNodeCount !== 1)
      throw new Error(
        `card_spec_plan_owner_capability_duplicate: ${capability.capabilityKey}`,
      );
    const annotation = annotations[0]!;
    result.push({
      capabilityKey: capability.capabilityKey,
      owner: annotation.owner,
      ...(annotation.route === undefined ? {} : { route: annotation.route }),
    });
  }
  return result.sort((left, right) =>
    left.capabilityKey.localeCompare(right.capabilityKey),
  );
}

function countAddressableEngineNodes(
  value: unknown,
  capabilityKey: string,
): number {
  if (Array.isArray(value))
    return value.reduce(
      (count, entry) =>
        count + countAddressableEngineNodes(entry, capabilityKey),
      0,
    );
  if (!isRecord(value)) return 0;
  return (
    (value.capabilityKey === capabilityKey ? 1 : 0) +
    Object.values(value).reduce<number>(
      (count, entry) =>
        count + countAddressableEngineNodes(entry, capabilityKey),
      0,
    )
  );
}

type ClosedMechanicalHintOverlay = {
  effects: NonNullable<AiCardHint["effects"]>;
  conditions: NonNullable<AiCardHint["conditions"]>;
  functionSignals: string[];
  tacticSignals: string[];
  roles: string[];
  remoteRole?: NonNullable<AiCardHint["remoteRole"]>;
};

type PlanningEntry = ReturnType<typeof cardSpecPlanningCards>[number];
type PlanningFlatlineReplacementSource = NonNullable<
  PlanningEntry["planning"]["engine"]["flatlineReplacementSources"]
>[number];
type PlanningAbility = NonNullable<
  PlanningEntry["planning"]["engine"]["abilities"]
>[number];
type PlanningEffect = PlanningAbility["effects"][number];
type GenericTypedHintOverlay = Pick<
  ClosedMechanicalHintOverlay,
  "effects" | "conditions" | "functionSignals"
> & {
  targetProfiles: NonNullable<AiCardHint["targetProfiles"]>;
};

type PlanningVirusCounterScope = NonNullable<
  NonNullable<
    PlanningEntry["planning"]["engine"]["virusCounter"]
  >["addOnSuccessfulRun"]
>["counterScope"];

function virusCounterHintTarget(scope: PlanningVirusCounterScope): string {
  switch (scope.kind) {
    case "source_card":
      return "source";
    case "shared_corp_pool":
      return "corp_purgeable_runner_virus_counter";
    case "attacked_server":
      return "successful_run_server";
    case "chosen_fully_broken_ice":
      return "chosen_fully_broken_ice";
    case "attacked_central_server_pool":
      return "central_server_socket_counters";
    default: {
      const exhaustive: never = scope;
      return exhaustive;
    }
  }
}

/**
 * Projects only closed CardSpec unions. This deliberately does not consult
 * card ids, rules text, labels, or legacy hint payloads.
 */
function deriveGenericTypedHintOverlay(
  entry: PlanningEntry,
): GenericTypedHintOverlay {
  const overlay: GenericTypedHintOverlay = {
    effects: [],
    conditions: [],
    functionSignals: [],
    targetProfiles: [],
  };
  const engine = entry.planning.engine;

  for (const ability of engine.abilities ?? []) {
    appendTypedCondition(overlay.conditions, ability.condition);
    appendGenericAbilityCosts(overlay, entry, ability);
    for (const effect of ability.effects ?? []) {
      appendGenericAbilityEffect(overlay, entry, ability, effect);
      appendGenericTargetProfile(overlay.targetProfiles, ability, effect);
    }
    appendScoredAgendaActivatedAbilityMarker(overlay, entry, ability);
  }

  for (const modifier of engine.modifiers ?? [])
    if (modifier.kind === "new_data_fort_creation_lock") {
      overlay.effects.push({
        kind: "global_modifier",
        scope: "corp",
        timing: "persistent",
        target: "remote.new_fort_creation_lock",
        repeatable: true,
      });
      overlay.functionSignals.push(
        "remote.new_fort_creation_lock",
        "tax.corp_remote_creation_removal",
      );
    }

  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "trace") {
      overlay.effects.push({
        kind: "trace",
        scope: "trace",
        timing: "encounter_resolution",
        target: "trace.source",
        finite: true,
      });
      overlay.functionSignals.push("corp_ice.trace_source", "trace.source");
      overlay.conditions.push({ kind: "requires_trace_attempt" });
      for (const success of subroutine.onSuccess)
        appendTraceOutcome(
          overlay,
          success,
          "encounter_resolution",
          "corp_ice",
        );
    }
    if (subroutine.kind === "prohibit_break_and_jack_out_next_ice") {
      overlay.effects.push(
        {
          kind: "future_encounter_effect",
          scope: "run_path",
          timing: "encounter_resolution",
          target: "corp_ice.next_ice_break_lock",
          finite: true,
        },
        {
          kind: "no_jack_out",
          scope: "run_path",
          timing: "encounter_resolution",
          target: "corp_ice.next_ice_jack_out_lock",
          finite: true,
        },
      );
      overlay.conditions.push({ kind: "requires_remaining_ice" });
      overlay.functionSignals.push(
        "corp_ice.next_ice_break_lock",
        "corp_ice.next_ice_jack_out_lock",
      );
    }
    if (subroutine.kind === "runner_run_lock_actions") {
      overlay.effects.push({
        kind: "run_lock",
        scope: "runner",
        timing: "encounter_resolution",
        resource: "actions",
        target: "corp_ice.run_lock",
        amount: subroutine.amount,
        finite: true,
      });
      overlay.functionSignals.push("corp_ice.run_lock", "run.lock");
    }
    if (
      subroutine.kind === "runner_forgoes_next_action" ||
      subroutine.kind === "end_the_run_and_runner_forgoes_next_action"
    ) {
      overlay.effects.push({
        kind: "action_penalty",
        scope: "runner",
        timing: "encounter_resolution",
        resource: "actions",
        target: "corp_ice.runner_action_loss",
        amount: 1,
        finite: true,
      });
      overlay.functionSignals.push(
        "corp_ice.runner_action_loss",
        "risk.action_loss",
      );
    }
  }

  const virus = engine.virusCounter;
  if (virus?.addOnSuccessfulRun !== undefined) {
    const successfulRunScope =
      virus.addOnSuccessfulRun.server === "rd"
        ? "rnd"
        : virus.addOnSuccessfulRun.server === "any"
          ? "server"
          : virus.addOnSuccessfulRun.server === "subsidiary_data_fort"
            ? "remote"
            : virus.addOnSuccessfulRun.server;
    overlay.effects.push({
      kind: "persistent_counter_effect",
      scope: successfulRunScope,
      timing: "successful_run",
      resource: "counters",
      target: `virus.${virusCounterHintTarget(
        virus.addOnSuccessfulRun.counterScope,
      )}`,
      amount: virus.addOnSuccessfulRun.amount,
      repeatable: true,
    });
    overlay.conditions.push({ kind: "requires_successful_run" });
    overlay.functionSignals.push(
      "virus.counter_gain_on_successful_run",
      "virus.corp_purgeable_counter",
    );
  }
  if (virus?.centralAccessCountModifier !== undefined) {
    overlay.effects.push({
      kind: "multiaccess",
      scope: virus.centralAccessCountModifier.server === "rd" ? "rnd" : "hq",
      timing: "persistent",
      resource: "cards",
      target: "virus.central_access_per_counter",
      repeatable: true,
    });
    overlay.functionSignals.push("virus.central_access_per_counter");
  }
  if (virus?.accessTrash !== undefined) {
    overlay.effects.push({
      kind: "persistent_counter_effect",
      scope: virus.accessTrash.server === "rd" ? "rnd" : "hq",
      timing: "on_access",
      resource: "counters",
      target: "access_trash_pressure",
      amount: virus.accessTrash.threshold,
      repeatable: true,
    });
    overlay.functionSignals.push("access.free_trash", "virus.access_trash");
  }
  if (
    virus?.startOfRunnerTurn?.kind === "random_reveal_hq_cards_per_two_counters"
  ) {
    overlay.effects.push({
      kind: "hq_info",
      scope: "hq",
      timing: "start_of_turn",
      resource: "cards",
      target: "random_hq_reveal_per_counter_group",
      amount: virus.startOfRunnerTurn.countPerGroup,
      repeatable: true,
    });
    overlay.functionSignals.push("info.hq_reveal");
  }
  if (virus?.startOfRunnerTurn?.kind === "private_look_top_rd_at_threshold") {
    overlay.effects.push({
      kind: "topdeck_info",
      scope: "rnd",
      timing: "start_of_turn",
      resource: "cards",
      target: "top_cards",
      amount: virus.startOfRunnerTurn.count,
      repeatable: true,
    });
    overlay.functionSignals.push("info.rnd_top");
  }
  if (virus !== undefined) {
    overlay.effects.push({
      kind: "delayed_penalty",
      scope: "corp",
      timing: "action",
      resource: "actions",
      target: "virus_purge",
      amount: 3,
      repeatable: true,
    });
    overlay.functionSignals.push("virus.purge_tax");
  }

  for (const modifier of engine.modifiers ?? []) {
    if (
      modifier.kind === "break_ability_use_cost" &&
      modifier.appliesToRunner?.subtype === "noisy"
    )
      overlay.functionSignals.push("tax.noisy_breaker_ability");
    if (modifier.kind === "install_cost") {
      if (!Number.isInteger(modifier.amount) || modifier.amount <= 0)
        throw new Error("card_spec_unknown_install_cost_modifier_shape");
      const sameFort = modifier.appliesTo.sameServerAsSource === true;
      overlay.effects.push({
        kind: modifier.operation === "reduce" ? "install_discount" : "run_tax",
        scope: sameFort ? "fort" : "corp",
        timing: "persistent",
        resource: "credits",
        target:
          modifier.operation === "reduce"
            ? "ice.install_cost_discount"
            : "ice.install_cost_increase",
        amount: modifier.amount,
        repeatable: true,
      });
      overlay.functionSignals.push(
        modifier.operation === "reduce"
          ? "setup.install_discount"
          : "tax.corp_ice_install",
      );
      if (modifier.activeWhile === "rezzed")
        overlay.conditions.push({ kind: "requires_rezzed_card" });
    }
    if (modifier.kind === "access_count") {
      if (!Number.isInteger(modifier.amount) || modifier.amount <= 0)
        throw new Error("card_spec_unknown_access_count_modifier_shape");
      const server = modifier.server === "rd" ? "rnd" : modifier.server;
      overlay.effects.push({
        kind: "multiaccess",
        scope: server,
        timing: "persistent",
        resource: "cards",
        target: `access.${server}_multiaccess`,
        amount: modifier.amount,
        repeatable: true,
      });
      overlay.functionSignals.push(`access.${server}_multiaccess`);
    }
    if (modifier.kind === "agenda_difficulty") {
      if (!Number.isInteger(modifier.amount) || modifier.amount <= 0)
        throw new Error("card_spec_unknown_agenda_difficulty_modifier_shape");
      const operation =
        modifier.operation === "reduce" ? "discount" : "increase";
      overlay.effects.push({
        kind: "global_modifier",
        scope: "remote",
        timing: "persistent",
        target: `score.${modifier.appliesTo.subtype}_difficulty_${operation}`,
        amount: modifier.amount,
        repeatable: true,
      });
      overlay.functionSignals.push(
        `remote.agenda_difficulty_${operation}`,
        `score.agenda_difficulty_${operation}`,
        `score.${modifier.appliesTo.subtype}_difficulty_${operation}`,
      );
    }
    if (modifier.kind === "steal_cost") {
      overlay.effects.push(
        {
          kind: "run_tax",
          scope: "accessed_card",
          timing: "on_access",
          resource: "credits",
          target: "agenda_steal_cost",
          amount: modifier.amount,
          repeatable: true,
        },
        {
          kind: "remote_protection",
          scope: "fort",
          timing: "persistent",
          target: "remote.agenda_steal_tax",
          repeatable: true,
        },
      );
      overlay.functionSignals.push(
        "remote.agenda_steal_tax",
        "remote.scoring_protection",
        "tax.runner_credit",
      );
    }
    if (modifier.kind === "ice_strength") {
      const runnerWeakensIce =
        entry.definition.side === "runner" && modifier.operation === "reduce";
      overlay.effects.push(
        runnerWeakensIce
          ? {
              kind: "global_modifier",
              scope: "ice",
              timing: "persistent",
              resource: "strength",
              target: "ice.strength_modifier",
              amount: modifier.amount,
              repeatable: true,
            }
          : {
              kind: "remote_protection",
              scope: "ice",
              timing: "persistent",
              resource: "strength",
              target: "ice.corp_strength_support",
              amount: modifier.amount,
              repeatable: true,
            },
      );
      overlay.functionSignals.push("ice.strength_modifier");
      if (!runnerWeakensIce)
        overlay.functionSignals.push("ice.corp_strength_support");
    }
    if (
      modifier.kind === "additional_subroutine" &&
      modifier.subroutine.kind === "end_the_run_unless_runner_pays"
    ) {
      const scope = modifier.appliesTo.sameServerAsSource ? "fort" : "ice";
      overlay.effects.push(
        {
          kind: "run_tax",
          scope,
          timing: "during_run",
          resource: "credits",
          target: "run.corp_pay_or_end_run",
          amount: modifier.subroutine.amount,
          repeatable: true,
        },
        {
          kind: "remote_protection",
          scope,
          timing: "persistent",
          target: "remote.scoring_protection",
          repeatable: true,
        },
      );
      overlay.functionSignals.push(
        "run.corp_pay_or_end_run",
        "remote.scoring_protection",
        "tax.runner_credit",
      );
    }
  }
  for (const window of engine.fortRunWindows ?? []) {
    if (window.kind === "corp_trace_bits_during_runs_on_this_fort") {
      overlay.effects.push({
        kind: "trace_credit",
        scope: "fort",
        timing: "during_run",
        resource: "credits",
        target: "trace.corp_credit_support",
        amount: window.amount,
        repeatable: true,
      });
      overlay.functionSignals.push("trace.corp_credit_support");
    }
    if (window.kind === "block_stealth_bits_during_runs_on_this_fort") {
      overlay.effects.push({
        kind: "run_tax",
        scope: "fort",
        timing: "during_run",
        resource: "credits",
        target: "run.corp_stealth_credit_lockout",
        repeatable: true,
      });
      overlay.functionSignals.push(
        "run.corp_stealth_credit_lockout",
        "tax.runner_credit",
      );
    }
    if (window.kind === "discounted_rez_ice_on_this_fort") {
      overlay.effects.push({
        kind: "rez_discount",
        scope: "fort",
        timing: "during_run",
        resource: "credits",
        target: "ice.corp_rez_discount",
        repeatable: true,
      });
      overlay.functionSignals.push(
        "economy.rez_discount",
        "ice.corp_rez_discount",
        "remote.scoring_protection",
      );
    }
    if (window.kind === "temporary_hq_ice_encounter_after_successful_run") {
      overlay.effects.push({
        kind: "future_encounter_effect",
        scope: "run_path",
        timing: "successful_run",
        target: "ice.corp_hq_runpath_insert",
        finite: true,
      });
      overlay.functionSignals.push("ice.corp_fort_defense", "tax.ice");
    }
    if (
      window.kind === "runner_pay_or_end_run_after_passing_ice_on_this_fort"
    ) {
      overlay.effects.push(
        {
          kind: "run_tax",
          scope: "fort",
          timing: "during_run",
          resource: "credits",
          target: "run.corp_pay_or_end_run",
          amount: window.amount,
          repeatable: true,
        },
        {
          kind: "remote_protection",
          scope: "fort",
          timing: "persistent",
          target: "remote.scoring_protection",
          repeatable: true,
        },
      );
      overlay.functionSignals.push(
        "run.corp_pay_or_end_run",
        "tax.runner_credit",
      );
    }
  }

  for (const access of engine.accessEffects ?? []) {
    appendTypedCondition(overlay.conditions, access.condition);
    const punishingAccess = access.effects.some((effect) =>
      [
        "add_runner_counter",
        "damage",
        "damage_from_source_advancement_counters",
        "trace",
        "trash_installed_runner_cards",
        "trash_installed_runner_hardware_and_programs",
      ].includes(effect.kind),
    );
    if (punishingAccess) {
      overlay.effects.push({
        kind: "ambush",
        scope: "accessed_card",
        timing: "on_access",
        target: "remote.ambush",
        finite: true,
      });
      overlay.functionSignals.push("access.punish", "remote.ambush");
    }
    for (const effect of access.effects) {
      if (effect.kind === "reduce_current_access_queue") {
        overlay.effects.push({
          kind: "remote_protection",
          scope: "central",
          timing: "on_access",
          resource: "cards",
          target: "access.corp_central_access_reduction",
          amount: effect.amount,
          repeatable: true,
        });
        overlay.functionSignals.push("access.corp_central_access_reduction");
      }
      if (effect.kind !== "trash_installed_runner_cards") continue;
      overlay.effects.push({
        kind: effect.target === "hardware" ? "hardware_trash" : "program_trash",
        scope: effect.target === "hardware" ? "hardware" : "installed_program",
        timing: "on_access",
        target:
          effect.target === "hardware"
            ? "access.corp_hardware_trash"
            : "access.corp_program_trash",
        ...(typeof effect.amount === "number"
          ? { amount: effect.amount }
          : { amountKind: "dynamic" as const }),
        finite: true,
      });
      overlay.functionSignals.push(
        effect.target === "hardware"
          ? "access.hardware_trash"
          : "access.program_trash",
      );
    }
  }

  const remaining = engine.remainingReplacementLongtail;
  if (remaining?.kind === "runner_draw_tax_tag") {
    overlay.effects.push({
      kind: "tag_source",
      scope: "runner",
      timing: "persistent",
      resource: "tags",
      target: "runner_draw_tax_tag",
      amount: 1,
      repeatable: true,
    });
    overlay.conditions.push(
      { kind: "requires_runner_draw" },
      { kind: "requires_runner_pay_or_take_tag" },
    );
    overlay.functionSignals.push("draw.runner_tax", "tag.source");
  }
  if (remaining?.kind === "trace_bit_counter_pool_asset") {
    if (
      remaining.counterType !== "bit" ||
      !Number.isInteger(remaining.addAfterTrace) ||
      remaining.addAfterTrace <= 0 ||
      !Number.isInteger(remaining.traceValueAndLimitPerBit) ||
      remaining.traceValueAndLimitPerBit <= 0 ||
      remaining.visibility !== "public"
    )
      throw new Error("card_spec_unknown_trace_counter_pool_shape");
    overlay.effects.push(
      {
        kind: "persistent_counter_effect",
        scope: "corp",
        timing: "trace_window",
        resource: "counters",
        target: "trace.counter_pool_after_attempt",
        amount: remaining.addAfterTrace,
        repeatable: true,
      },
      {
        kind: "trace_credit",
        scope: "trace",
        timing: "trace_window",
        resource: "credits",
        target: "trace.value_and_limit_per_counter",
        amount: remaining.traceValueAndLimitPerBit,
        repeatable: true,
      },
    );
    overlay.functionSignals.push(
      "trace.counter_pool",
      "trace.value_support",
      "trace.limit_support",
    );
  }

  const hiddenReplacement = engine.hiddenReplacementLongtail;
  if (hiddenReplacement?.kind === "delayed_install_with_counter_countdown") {
    if (hiddenReplacement.visibility !== "hidden_info_barrier")
      throw new Error("card_spec_unknown_delayed_install_countdown_shape");
    overlay.effects.push({
      kind: "install",
      scope: "runner",
      timing: "persistent",
      resource: "cards",
      target: "setup.install_countdown",
      repeatable: true,
    });
    overlay.functionSignals.push(
      "setup.delayed_install",
      "setup.install_countdown",
    );
  }
  if (
    hiddenReplacement?.kind === "secret_spend_guess_then_targeted_bypass_run"
  ) {
    if (hiddenReplacement.visibility !== "hidden_info_barrier")
      throw new Error("card_spec_unknown_targeted_bypass_run_shape");
    overlay.effects.push(
      {
        kind: "future_run_effect",
        scope: "server",
        timing: "action",
        target: "make_run",
        finite: true,
      },
      {
        kind: "future_encounter_effect",
        scope: "ice",
        timing: "during_run",
        target: "bypass_chosen_ice",
        finite: true,
      },
    );
    overlay.functionSignals.push("run.make_run", "run.bypass_chosen_ice");
  }

  const uniqueDirect = engine.uniqueDirectLongtail;
  if (uniqueDirect?.kind === "tagged_meat_damage") {
    if (
      uniqueDirect.requiredRunnerTags <= 0 ||
      uniqueDirect.damageType !== "meat" ||
      uniqueDirect.damageAmount <= 0 ||
      uniqueDirect.visibility !== "public"
    )
      throw new Error("card_spec_unknown_tagged_meat_damage_shape");
    overlay.effects.push(
      {
        kind: "damage",
        scope: "runner",
        timing: "action",
        resource: "meat_damage",
        target: "tagged_runner_meat_damage",
        amount: uniqueDirect.damageAmount,
        finite: true,
      },
      {
        kind: "tag_punish_payoff",
        scope: "runner",
        timing: "action",
        resource: "tags",
        target: "tagged_runner_meat_damage",
        amount: uniqueDirect.requiredRunnerTags,
        finite: true,
      },
    );
    overlay.conditions.push({ kind: "requires_runner_tagged" });
    overlay.functionSignals.push("damage.payoff", "tag.payoff");
  }
  if (uniqueDirect?.kind === "tag_threshold_meat_damage_asset") {
    if (
      uniqueDirect.damageType !== "meat" ||
      uniqueDirect.damageAmount <= 0 ||
      uniqueDirect.visibility !== "public"
    )
      throw new Error("card_spec_unknown_tag_threshold_meat_damage_shape");
    overlay.effects.push(
      {
        kind: "damage",
        scope: "runner",
        timing: "action",
        resource: "meat_damage",
        target: "tag_threshold_meat_damage",
        amount: uniqueDirect.damageAmount,
        finite: true,
      },
      {
        kind: "tag_punish_payoff",
        scope: "runner",
        timing: "action",
        resource: "tags",
        target: "tag_threshold_meat_damage",
        finite: true,
      },
    );
    overlay.conditions.push({ kind: "requires_runner_tagged" });
    overlay.functionSignals.push("damage.payoff", "tag.payoff");
  }
  if (uniqueDirect?.kind === "rezzed_leave_action_gain_asset") {
    overlay.effects.push(
      {
        kind: "extra_action",
        scope: "corp",
        timing: "start_of_turn",
        resource: "actions",
        target: "corp.recurring_extra_action",
        amount: uniqueDirect.actionGain,
        repeatable: true,
      },
      {
        kind: "delayed_penalty",
        scope: "corp",
        timing: "on_leave_play",
        target: "risk.loss_condition",
      },
    );
    overlay.functionSignals.push(
      "action.corp_repeatable_extra_action",
      "risk.loss_condition",
    );
  }

  for (const followup of engine.successfulRunFollowups ?? [])
    if (
      followup.kind === "successful_run_before_access_effect" &&
      followup.effect.kind === "trash_remote_fort"
    ) {
      overlay.effects.push({
        kind: "access_replacement",
        scope: "remote",
        timing: "after_successful_run",
        target: "remote.root_wipe",
        finite: true,
      });
      overlay.conditions.push({ kind: "requires_successful_run" });
      overlay.functionSignals.push(
        "access.remote_root_wipe",
        "run.remote_sabotage",
      );
    }

  if (
    engine.runnerUtilityLongtail?.kind === "trace_link_end_run_after_encounter"
  ) {
    overlay.effects.push({
      kind: "delayed_penalty",
      scope: "run_path",
      timing: "encounter_resolution",
      target: "run.ends_after_current_encounter",
      finite: true,
    });
    overlay.functionSignals.push(
      "run.ends_run_after_effect",
      "trace.ends_run_after_encounter",
    );
  }

  for (const source of engine.damagePreventionSources ?? []) {
    if (source.damageTypes.length === 0)
      throw new Error("card_spec_unknown_damage_prevention_shape");
    overlay.effects.push({
      kind: "damage_prevention",
      scope: "runner",
      timing: "prevention_window",
      resource: "damage",
      target: `prevent.${[...source.damageTypes].sort().join("_and_")}_damage`,
      ...(typeof source.amount === "number" ? { amount: source.amount } : {}),
      repeatable: source.limit?.kind === "per_turn",
    });
    overlay.functionSignals.push("defense.damage_prevention");
  }
  for (const source of engine.tagPreventionSources ?? []) {
    if (source.kind !== "avoid_tag" || source.amount !== 1)
      throw new Error(
        source.cost.kind === "credit_and_forgo_next_action"
          ? "card_spec_unknown_action_debt_tag_prevention_shape"
          : "card_spec_unknown_tag_prevention_shape",
      );
    overlay.effects.push({
      kind: "tag_prevention",
      scope: "runner",
      timing: "prevention_window",
      resource: "tags",
      target: "avoid_tag",
      amount: source.amount,
      finite: true,
    });
    overlay.functionSignals.push("defense.tag_prevention");
  }

  for (const effect of engine.lifecycle?.on_install ?? [])
    appendHostedCreditLifecycleEffect(
      overlay,
      entry.definition.side,
      effect,
      "install",
    );
  for (const effect of engine.lifecycle?.on_score ?? [])
    appendHostedCreditLifecycleEffect(
      overlay,
      entry.definition.side,
      effect,
      "when_scored",
    );
  for (const effect of engine.lifecycle?.on_rez ?? [])
    appendHostedCreditLifecycleEffect(
      overlay,
      entry.definition.side,
      effect,
      "on_rez",
    );
  for (const trigger of engine.lifecycle?.start_of_corp_turn ?? []) {
    appendTypedCondition(overlay.conditions, trigger.condition);
    for (const effect of trigger.effects)
      appendHostedCreditLifecycleEffect(
        overlay,
        entry.definition.side,
        effect,
        "start_of_turn",
      );
  }
  for (const trigger of engine.lifecycle?.start_of_runner_turn ?? []) {
    appendTypedCondition(overlay.conditions, trigger.condition);
    for (const effect of trigger.effects) {
      if (effect.kind !== "take_hosted_credits") continue;
      const amount = effect.amount;
      if (
        effect.source !== "source" ||
        effect.recipient !== "controller" ||
        effect.mode !== "up_to_amount_if_available" ||
        !Number.isInteger(amount) ||
        amount === undefined ||
        amount <= 0
      )
        throw new Error("card_spec_unknown_installment_credit_shape");
      overlay.effects.push(
        {
          kind: "counter_economy",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          target: "economy.installment_credit",
          amount,
          economyMode: "bank_cashout",
          repeatable: true,
        },
        {
          kind: "economy",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          target: "economy.turn_start_credit",
          amount,
          repeatable: true,
        },
      );
      overlay.functionSignals.push(
        "economy.installment_credit",
        "economy.turn_start_credit",
      );
    }
  }

  const breaker = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breaker?.kind === "break_subroutine") {
    if (breaker.special?.kind === "blink_random_break_or_net_damage") {
      overlay.effects.push({
        kind: "damage",
        scope: "runner",
        timing: "during_ice_encounter",
        resource: "net_damage",
        target: "breaker.random_failure_damage",
        repeatable: true,
      });
      overlay.functionSignals.push(
        "breaker.random_failure",
        "risk.random_outcome",
        "risk.runner_net_damage",
      );
    }
    if (
      breaker.onSuccessfulBreak?.some(
        (effect) => effect.kind === "lose_bits_from_stealth_sources",
      )
    )
      overlay.functionSignals.push("breaker.stealth_payment_loss");
    if (
      breaker.special?.kind ===
      "set_next_sentry_free_break_after_fully_breaking_wall"
    ) {
      overlay.effects.push({
        kind: "future_encounter_effect",
        scope: "run_path",
        timing: "during_ice_encounter",
        target: "breaker.next_sentry_free_break",
        amount: 1,
        finite: true,
      });
      overlay.functionSignals.push("breaker.next_sentry_free_break");
    }
  }

  appendScoredAgendaProjection(overlay, engine.scoredAgenda);
  return overlay;
}

function appendScoredAgendaActivatedAbilityMarker(
  overlay: GenericTypedHintOverlay,
  entry: PlanningEntry,
  ability: PlanningAbility,
): void {
  if (
    entry.definition.type !== "agenda" ||
    ability.kind !== "activated" ||
    (ability.effects?.length ?? 0) === 0
  )
    return;
  overlay.effects.push({
    kind: "scored_agenda_action",
    scope: "score_area",
    timing: "scored_activated",
    target: "score.scored_agenda_ability",
    finite: false,
  });
  overlay.functionSignals.push("score.scored_agenda_action");
}

function appendHostedCreditLifecycleEffect(
  overlay: GenericTypedHintOverlay,
  side: "runner" | "corp",
  effect: PlanningEffect,
  timing: NonNullable<AiCardHint["effects"]>[number]["timing"],
): void {
  if (effect.kind === "add_hosted_credits") {
    if (
      effect.target !== "source" ||
      !Number.isInteger(effect.amount) ||
      effect.amount <= 0
    )
      throw new Error("card_spec_unknown_hosted_credit_bank_load_shape");
    overlay.effects.push({
      kind: "finite_economy_pool",
      scope: side,
      timing,
      resource: "credits",
      target: "economy.hosted_credit_bank",
      amount: effect.amount,
      amountKind: "fixed",
      economyMode: "fixed_pool",
      finite: true,
    });
    overlay.functionSignals.push(
      "economy.finite_pool",
      "economy.hosted_credit_bank",
      "economy.temporary_resource_bank",
    );
  }
  if (effect.kind === "take_hosted_credits") {
    overlay.effects.push({
      kind: "economy",
      scope: side,
      timing,
      resource: "credits",
      target: "economy.hosted_credit_cashout",
      amountKind: effect.mode === "all" ? "all_available" : "dynamic",
      economyMode: "bank_cashout",
    });
    overlay.functionSignals.push("economy.hosted_credit_cashout");
  }
}

function typedEffectTiming(
  ability: PlanningAbility,
): NonNullable<AiCardHint["effects"]>[number]["timing"] {
  if (ability.kind === "on_play") return "action";
  if (ability.timing === "access_start") return "on_access";
  if (ability.timing === "corp_start_run_window") return "start_of_run";
  if (ability.timing === "corp_encounter") return "during_ice_encounter";
  if (ability.timing === "runner_cost_penalty_support") return "payment_window";
  if (ability.timing === "during_run" || ability.timing === "corp_during_run")
    return "during_run";
  if (ability.timing === "trace_success_cancel_window") return "trace_success";
  if (
    ability.timing === "corp_trace_window" ||
    ability.timing === "trace_base_link_window" ||
    ability.timing === "trace_post_bid_link_window"
  )
    return "trace_window";
  return "action";
}

function controlledSide(
  entry: PlanningEntry,
  recipient: "controller" | "runner" | "corp",
): "runner" | "corp" {
  return recipient === "controller" ? entry.definition.side : recipient;
}

function appendGenericAbilityCosts(
  overlay: GenericTypedHintOverlay,
  entry: PlanningEntry,
  ability: PlanningAbility,
): void {
  if (
    entry.definition.side !== "runner" ||
    !Array.isArray(ability.costs) ||
    !ability.costs.some((cost) => cost.kind === "trash_source")
  )
    return;
  const timing =
    entry.definition.type === "agenda" && ability.kind === "activated"
      ? ("scored_activated" as const)
      : typedEffectTiming(ability);
  overlay.effects.push({
    kind:
      entry.definition.type === "program"
        ? "program_trash"
        : entry.definition.type === "hardware"
          ? "hardware_trash"
          : "resource_trash",
    scope:
      entry.definition.type === "program"
        ? "installed_program"
        : entry.definition.type === "hardware"
          ? "hardware"
          : "installed_card",
    timing,
    target: "source.trash",
    finite: true,
  });
  overlay.functionSignals.push("risk.self_trash");
}

function appendGenericAbilityEffect(
  overlay: GenericTypedHintOverlay,
  entry: PlanningEntry,
  ability: PlanningAbility,
  effect: PlanningEffect,
): void {
  const timing =
    entry.definition.type === "agenda" && ability.kind === "activated"
      ? ("scored_activated" as const)
      : typedEffectTiming(ability);
  if (effect.kind === "add_current_run_access_count") {
    overlay.effects.push({
      kind: "multiaccess",
      scope: effect.server === "rd" ? "rnd" : "hq",
      timing: "persistent",
      resource: "cards",
      target:
        effect.server === "rd"
          ? "access.rnd_hidden_multiaccess"
          : "access.hq_hidden_multiaccess",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push(
      effect.server === "rd"
        ? "access.rnd_multiaccess"
        : "access.hq_multiaccess",
    );
  }
  if (effect.kind === "gain_credits") {
    overlay.effects.push({
      kind: ability.kind === "activated" ? "action_economy" : "economy",
      scope: controlledSide(entry, effect.recipient),
      timing,
      resource: "credits",
      target: "economy.burst_credit",
      amount: effect.amount,
      ...(ability.kind === "activated"
        ? { economyMode: "liquid_payout" as const }
        : {}),
      finite: true,
    });
    overlay.functionSignals.push("economy.burst_credit", "economy.generic");
  }
  if (effect.kind === "gain_credits_per_advancement_counter_on_source") {
    overlay.effects.push(
      {
        kind: "economy",
        scope: controlledSide(entry, effect.recipient),
        timing,
        resource: "credits",
        target: "economy.corp_counter_cashout",
        amount: effect.amountPerCounter,
        finite: true,
      },
      {
        kind: "advanceable_economy",
        scope: "remote",
        timing,
        resource: "advancement_counters",
        target: "advance.corp_counter_bank",
        repeatable: true,
      },
      {
        kind: "advanceable_economy",
        scope: "remote",
        timing,
        resource: "credits",
        target: "economy.corp_counter_cashout",
        amount: effect.amountPerCounter,
        repeatable: true,
      },
    );
    overlay.conditions.push({ kind: "requires_advancement_counter" });
    overlay.functionSignals.push(
      "advance.corp_counter_bank",
      "economy.corp_counter_cashout",
    );
  }
  if (effect.kind === "gain_temporary_corp_credits") {
    overlay.effects.push({
      kind: "finite_economy_pool",
      scope: "corp",
      timing,
      resource: "credits",
      target: "economy.corp_install_rez_credit",
      amount: effect.amount,
      economyMode: "restricted_credit",
      finite: true,
    });
    overlay.functionSignals.push(
      "economy.corp_install_rez_credit",
      "risk.temporary_credit_drawback",
    );
  }
  if (effect.kind === "draw_cards") {
    overlay.effects.push({
      kind: "draw",
      scope: controlledSide(entry, effect.recipient),
      timing,
      resource: "cards",
      target: "setup.draw",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("setup.draw");
  }
  if (effect.kind === "corp_random_discard_from_hq") {
    overlay.effects.push({
      kind: "random_discard",
      scope: "hq",
      timing,
      resource: "cards",
      target: "corp.random_discard_from_hq",
      amount: effect.count,
      finite: true,
    });
    overlay.functionSignals.push("corp.random_discard_pressure");
  }
  if (effect.kind === "gain_runner_event_agenda_point") {
    overlay.effects.push({
      kind: "scored_agenda_action",
      scope: "runner",
      timing,
      resource: "agenda_points",
      target: "runner.agenda_point_conversion",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("runner.agenda_point_conversion");
  }
  if (effect.kind === "damage") {
    overlay.effects.push({
      kind: "damage",
      scope: "runner",
      timing,
      resource: hintDamageResource(effect.damageType),
      target: `damage.${effect.damageType}`,
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("damage.payoff");
    if (
      effect.recipient === "runner" &&
      ability.condition?.kind === "runner_is_tagged"
    ) {
      overlay.effects.push({
        kind: "tag_punish_payoff",
        scope: "runner",
        timing,
        resource: "tags",
        target: "tagged_runner_damage",
        amount: effect.amount,
        finite: true,
      });
      overlay.functionSignals.push("tag.payoff");
    }
  }
  if (effect.kind === "add_tags") {
    overlay.effects.push({
      kind: "tag_source",
      scope: "runner",
      timing,
      resource: "tags",
      target: "tag.source",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("tag.source");
  }
  if (effect.kind === "remove_tags") {
    overlay.effects.push({
      kind: "tag_prevention",
      scope: "runner",
      timing,
      resource: "tags",
      target: "remove_tags",
      ...(effect.mode === "all" ? {} : { amount: effect.amount }),
      finite: true,
    });
    overlay.functionSignals.push("tag.removal");
  }
  if (effect.kind === "avoid_next_tag") {
    overlay.effects.push({
      kind: "tag_prevention",
      scope: "runner",
      timing,
      resource: "tags",
      target: "avoid_next_tag",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("defense.next_tag_prevention");
  }
  if (effect.kind === "trash_source") {
    overlay.effects.push({
      kind:
        entry.definition.type === "program"
          ? "program_trash"
          : entry.definition.type === "hardware"
            ? "hardware_trash"
            : "resource_trash",
      scope:
        entry.definition.type === "program"
          ? "installed_program"
          : entry.definition.type === "hardware"
            ? "hardware"
            : "installed_card",
      timing,
      target: "source.trash",
      finite: true,
    });
    overlay.functionSignals.push("risk.self_trash");
  }
  if (effect.kind === "trace") {
    overlay.effects.push({
      kind: "trace",
      scope: "trace",
      timing,
      target: "trace.source",
      finite: true,
    });
    overlay.functionSignals.push("trace.source");
    overlay.conditions.push({ kind: "requires_trace_attempt" });
    for (const success of effect.onSuccess)
      appendTraceOutcome(overlay, success, timing, "trace");
  }
  if (effect.kind === "make_run") appendMakeRunProjection(overlay, effect);
  if (effect.kind === "move_top_trash_to_grip") {
    if (
      effect.recipient !== "runner" ||
      effect.visibility !== "hidden_info_barrier"
    )
      throw new Error("card_spec_unknown_top_trash_recovery_shape");
    overlay.effects.push({
      kind: "card_recovery",
      scope: "heap",
      timing,
      resource: "cards",
      target: "move_top_trash_to_grip",
      amount: 1,
      finite: true,
    });
    overlay.effects.push({
      kind: "search",
      scope: "heap",
      timing,
      resource: "cards",
      target: "top_trash_card",
      amount: 1,
      finite: true,
    });
    overlay.functionSignals.push(
      "setup.recovery",
      "setup.search",
      "setup.top_trash_recovery",
    );
  }
  if (effect.kind === "search_stack_to_grip") {
    if (
      !["program", "any_card"].includes(effect.filter) ||
      effect.shuffleAfterwards !== true ||
      effect.visibility !== "hidden_info_barrier"
    )
      throw new Error("card_spec_unknown_stack_search_to_grip_shape");
    overlay.effects.push({
      kind: "search",
      scope: "stack",
      timing,
      resource: "cards",
      target: effect.filter,
      finite: true,
    });
    overlay.functionSignals.push("setup.search");
  }
  if (effect.kind === "search_stack_install") {
    overlay.effects.push(
      {
        kind: "search",
        scope: "stack",
        timing,
        resource: "cards",
        target: effect.filter,
        finite: true,
      },
      {
        kind: "install",
        scope: "installed_card",
        timing,
        target: effect.filter,
        installCost: effect.installCost,
        finite: true,
      },
    );
    overlay.functionSignals.push(
      "setup.program_install",
      "setup.program_search",
      "setup.search",
    );
  }
  if (effect.kind === "look_top_stack_show_to_corp_then_install_matching") {
    overlay.effects.push(
      {
        kind: "topdeck_info",
        scope: "stack",
        timing,
        resource: "cards",
        target: "look_top_stack",
        amount: effect.count,
        finite: true,
      },
      {
        kind: "search",
        scope: "stack",
        timing,
        resource: "cards",
        target: "top_stack_matching_card",
        amount: effect.count,
        finite: true,
      },
      {
        kind: "install",
        scope: "installed_card",
        timing,
        target:
          effect.allowedTypes.length === 1
            ? effect.allowedTypes[0]!
            : "matching_card",
        amount: 1,
        finite: true,
      },
    );
    overlay.functionSignals.push(
      "info.stack_top",
      "setup.program_install",
      "setup.search",
    );
  }
  if (effect.kind === "expose_installed_card") {
    if (
      effect.target !== "chosen_installed_corp_card" ||
      !["inside_data_fort", "any_installed"].includes(effect.scope) ||
      effect.visibility !== "public"
    )
      throw new Error("card_spec_unknown_expose_installed_card_shape");
    overlay.effects.push({
      kind: "expose_info",
      scope: "installed_card",
      timing,
      resource: "cards",
      target: "info.expose_installed_card",
      finite: true,
    });
    overlay.functionSignals.push("info.expose_installed_card");
  }
  if (effect.kind === "pay_rez_cost_to_trash_rezzed_ice") {
    if (effect.target !== "chosen_rezzed_ice" || effect.visibility !== "public")
      throw new Error("card_spec_unknown_pay_rez_cost_trash_ice_shape");
    overlay.effects.push({
      kind: "ice_trash",
      scope: "ice",
      timing,
      resource: "credits",
      target: "pay_rez_cost_to_trash_rezzed_ice",
      finite: true,
    });
    overlay.functionSignals.push("ice.trash", "economy.dynamic_rez_cost");
  }
  if (effect.kind === "corp_choice_rez_or_trash_ice") {
    if (
      effect.target !== "chosen_installed_ice" ||
      effect.visibility !== "public"
    )
      throw new Error("card_spec_unknown_corp_rez_or_trash_ice_shape");
    overlay.effects.push(
      {
        kind: "rez",
        scope: "ice",
        timing,
        target: "corp_choice_rez_or_trash_ice",
        finite: true,
      },
      {
        kind: "ice_trash",
        scope: "ice",
        timing,
        target: "corp_choice_rez_or_trash_ice",
        finite: true,
      },
    );
    overlay.functionSignals.push("ice.corp_rez_choice", "ice.trash");
  }
  if (effect.kind === "distribute_advancement_counters") {
    if (
      effect.target !== "installed_advanceable_cards" ||
      !Number.isInteger(effect.amount) ||
      effect.amount <= 0
    )
      throw new Error("card_spec_unknown_distribute_advancement_shape");
    overlay.effects.push({
      kind: "advance_burst",
      scope: "installed_card",
      timing,
      resource: "advancement_counters",
      target: `advance.${effect.distribution}`,
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push(
      "advance.counter_manipulation",
      "score.fast_advance_support",
    );
  }
  if (effect.kind === "move_advancement_counters") {
    if (
      effect.target !== "chosen_installed_advanceable_card" ||
      !["chosen_card", "source_card"].includes(effect.source) ||
      (effect.maxAmount !== "all" &&
        (!Number.isInteger(effect.maxAmount) || effect.maxAmount <= 0))
    )
      throw new Error("card_spec_unknown_move_advancement_shape");
    overlay.effects.push({
      kind: "advance",
      scope: "installed_card",
      timing,
      resource: "advancement_counters",
      target: "advance.counter_transfer",
      ...(effect.maxAmount === "all"
        ? { amountKind: "all_available" as const }
        : { amount: effect.maxAmount }),
      finite: true,
    });
    overlay.functionSignals.push(
      "advance.counter_manipulation",
      "score.fast_advance_support",
    );
  }
  if (effect.kind === "look_top_stack_take_matching") {
    overlay.effects.push(
      {
        kind: "topdeck_info",
        scope: "stack",
        timing,
        resource: "cards",
        target: "look_top_stack",
        amount: effect.count,
        finite: true,
      },
      {
        kind: "search",
        scope: "stack",
        timing,
        resource: "cards",
        target:
          effect.allowedTypes.length === 1
            ? effect.allowedTypes[0]!
            : "take_matching_cards",
        finite: true,
      },
    );
    overlay.functionSignals.push("setup.search", "info.stack_top");
  }
  if (effect.kind === "use_base_link") {
    overlay.effects.push({
      kind: "base_link",
      scope: "runner",
      timing: "trace_window",
      resource: "link",
      target: "trace.base_link",
      amount: effect.baseLink,
      finite: true,
    });
    overlay.functionSignals.push("defense.trace_defense", "trace.base_link");
  }
  if (effect.kind === "increase_trace_link") {
    overlay.effects.push({
      kind: "link",
      scope: "runner",
      timing: "trace_window",
      resource: "link",
      target: "trace.link_boost",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("defense.trace_defense", "trace.link_boost");
  }
  if (effect.kind === "add_hosted_credits") {
    overlay.effects.push({
      kind: "counter_economy",
      scope: entry.definition.side,
      timing,
      resource: "credits",
      target: "economy.bank_load",
      amount: effect.amount,
      amountKind: "fixed",
      economyMode: "bank_load",
    });
    overlay.functionSignals.push(
      "economy.counter",
      "economy.hosted_credit_bank",
    );
  }
  if (effect.kind === "take_hosted_credits") {
    overlay.effects.push({
      kind: "action_economy",
      scope: entry.definition.side,
      timing,
      resource: "credits",
      target:
        effect.mode === "all"
          ? "economy.bank_cashout_all"
          : "economy.hosted_credit_cashout",
      ...(effect.mode === "all"
        ? { amountKind: "all_available" as const }
        : effect.amount === undefined
          ? { amountKind: "dynamic" as const }
          : { amount: effect.amount, amountKind: "fixed" as const }),
      economyMode: effect.mode === "all" ? "bank_cashout" : "liquid_payout",
      finite: true,
    });
    overlay.functionSignals.push("economy.hosted_credit_cashout");
  }
  if (effect.kind === "add_corp_purgeable_runner_virus_counter") {
    overlay.effects.push({
      kind: "persistent_counter_effect",
      scope: "corp",
      timing,
      resource: "actions",
      target: "virus.corp_action_denial",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("virus.corp_action_denial");
  }
}

function appendTraceOutcome(
  overlay: GenericTypedHintOverlay,
  outcome: Extract<PlanningEffect, { kind: "trace" }>["onSuccess"][number],
  sourceTiming: NonNullable<AiCardHint["effects"]>[number]["timing"],
  targetPrefix: string,
): void {
  const timing =
    sourceTiming === "encounter_resolution" ? "trace_success" : sourceTiming;
  if (
    outcome.kind === "add_tags" ||
    outcome.kind === "add_tags_by_trace_margin_over_runner_link"
  ) {
    overlay.effects.push({
      kind: "tag_source",
      scope: "runner",
      timing,
      resource: "tags",
      target: `${targetPrefix}.trace_tag`,
      ...(outcome.kind === "add_tags"
        ? { amount: outcome.amount }
        : { amountKind: "dynamic" }),
      finite: true,
    });
    overlay.functionSignals.push("tag.source");
  }
  if (outcome.kind === "end_run") {
    overlay.effects.push({
      kind: "etr",
      scope: "run_path",
      timing,
      target: `${targetPrefix}.conditional_end_run`,
      finite: true,
    });
    overlay.functionSignals.push("ice.etr");
  }
  if (outcome.kind === "runner_run_lock_until_action_paid") {
    overlay.effects.push({
      kind: "run_lock",
      scope: "runner",
      timing,
      resource: "actions",
      target: `${targetPrefix}.run_lock`,
      amount: outcome.amount,
      finite: true,
    });
    overlay.functionSignals.push("run.lock");
  }
  if (
    outcome.kind === "unpreventable_meat_damage" ||
    outcome.kind === "preventable_damage"
  ) {
    const damageType =
      outcome.kind === "unpreventable_meat_damage"
        ? "meat"
        : outcome.damageType;
    overlay.effects.push({
      kind: "damage",
      scope: "runner",
      timing,
      resource: hintDamageResource(damageType),
      target: `${targetPrefix}.${damageType}_damage`,
      amount: outcome.amount,
      finite: true,
    });
    overlay.functionSignals.push("damage.payoff");
  }
  if (outcome.kind === "add_counter") {
    overlay.effects.push({
      kind: "persistent_counter_effect",
      scope: "runner",
      timing,
      resource: "counters",
      target: `${targetPrefix}.${outcome.counterType}_counter`,
      amount: outcome.amount,
      finite: true,
    });
    overlay.functionSignals.push("trace.counter");
  }
  if (outcome.kind === "trash_hardware" || outcome.kind === "trash_program") {
    overlay.effects.push({
      kind:
        outcome.kind === "trash_hardware" ? "hardware_trash" : "program_trash",
      scope:
        outcome.kind === "trash_hardware" ? "hardware" : "installed_program",
      timing,
      target: `${targetPrefix}.${outcome.kind}`,
      finite: true,
    });
    overlay.functionSignals.push(
      outcome.kind === "trash_hardware"
        ? "access.corp_hardware_trash"
        : "access.corp_program_trash",
    );
  }
  overlay.conditions.push({ kind: "requires_trace_success" });
}

function appendMakeRunProjection(
  overlay: GenericTypedHintOverlay,
  effect: Extract<PlanningEffect, { kind: "make_run" }>,
): void {
  const server =
    effect.target.kind === "central_server"
      ? effect.target.server === "rd"
        ? "rnd"
        : effect.target.server
      : "runner";
  overlay.effects.push({
    kind: "future_run_effect",
    scope: server,
    timing: "action",
    target: "make_run",
    finite: true,
  });
  overlay.functionSignals.push(
    "run.make_run",
    effect.target.kind === "central_server"
      ? `run.${effect.target.server === "rd" ? "rnd" : effect.target.server}`
      : "run.any_server",
  );
  if (effect.damagePreventionPool !== undefined) {
    overlay.effects.push({
      kind: "damage_prevention",
      scope: "runner",
      timing: "during_run",
      resource: "damage",
      target: "run.damage_prevention_pool",
      amount: effect.damagePreventionPool,
      finite: true,
    });
    overlay.functionSignals.push("defense.run_damage_prevention");
  }
  if (
    effect.target.kind === "central_server" &&
    effect.accessServerOverride !== undefined &&
    effect.accessServerOverride !== effect.target.server
  ) {
    const accessServer =
      effect.accessServerOverride === "rd"
        ? "rnd"
        : effect.accessServerOverride;
    overlay.functionSignals.push(
      `access.${effect.accessServerOverride}_via_${effect.target.server}`,
    );
    overlay.effects.push({
      kind: "access_replacement",
      scope: accessServer,
      timing: "successful_run",
      target: `${effect.accessServerOverride}_via_${effect.target.server}`,
      finite: true,
    });
  }
  if ((effect.freeTrashAccessZones?.length ?? 0) > 0) {
    overlay.effects.push({
      kind: "trash_credit",
      scope: server,
      timing: "successful_run",
      resource: "trash_credits",
      target: "access.free_trash",
      finite: true,
    });
    overlay.functionSignals.push("economy.trash_credit");
  }
  if ((effect.accessCount ?? 1) > 1)
    overlay.effects.push({
      kind: "multiaccess",
      scope: server,
      timing: "successful_run",
      resource: "cards",
      target: "run.additional_access",
      amount: (effect.accessCount ?? 1) - 1,
      finite: true,
    });
  if (effect.bypassFirstIce === true) {
    overlay.effects.push({
      kind: "future_encounter_effect",
      scope: "run_path",
      timing: "during_run",
      target: "bypass_first_ice",
      finite: true,
    });
    overlay.functionSignals.push("run.bypass_first_ice");
  }
  if (effect.runTemporaryCredits !== undefined) {
    overlay.effects.push({
      kind: "finite_economy_pool",
      scope: "runner",
      timing: "during_run",
      resource: "credits",
      target: "run.temporary_credits",
      amount: effect.runTemporaryCredits.amount,
      finite: true,
    });
    overlay.functionSignals.push("economy.run_credits");
  }
  if (effect.successfulRunRunnerCreditGain !== undefined) {
    overlay.effects.push({
      kind: "economy",
      scope: "runner",
      timing: "successful_run",
      resource: "credits",
      target: "run.successful_run_credit_gain",
      amount: effect.successfulRunRunnerCreditGain,
      finite: true,
    });
    overlay.functionSignals.push("economy.burst_credit");
  }
  if (effect.successfulRunRunnerTagGain !== undefined) {
    overlay.effects.push({
      kind: "tag",
      scope: "runner",
      timing: "successful_run",
      resource: "tags",
      target: "run.successful_run_self_tag",
      amount: effect.successfulRunRunnerTagGain,
      finite: true,
    });
    overlay.functionSignals.push("risk.self_tag");
  }
  if (effect.afterRunCompletedUnpreventableCoreDamage !== undefined) {
    overlay.effects.push({
      kind: "damage",
      scope: "runner",
      timing: "during_run",
      resource: "brain_damage",
      target: "run.after_completed_self_damage",
      amount: effect.afterRunCompletedUnpreventableCoreDamage,
      finite: true,
    });
    overlay.functionSignals.push("risk.self_damage");
  }
  if (effect.runTraceLinkBonus !== undefined) {
    overlay.effects.push({
      kind: "link",
      scope: "runner",
      timing: "during_run",
      resource: "link",
      target: "run.trace_link_bonus",
      amount: effect.runTraceLinkBonus,
      finite: true,
    });
    overlay.functionSignals.push("defense.trace_defense");
  }
}

function appendGenericTargetProfile(
  profiles: NonNullable<AiCardHint["targetProfiles"]>,
  ability: PlanningAbility,
  effect: PlanningEffect,
): void {
  const timing =
    ability.kind === "on_play"
      ? ("on_play" as const)
      : effect.kind === "make_run"
        ? ("activated_ability" as const)
        : ("activated_ability" as const);
  const purpose = `${effect.kind}:${ability.capabilityKey}`;
  if (effect.kind === "make_run" && effect.target.kind === "chosen_server")
    profiles.push({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing,
      targetType: "server",
      purpose,
      hiddenInfoPolicy: "legal_targets_only",
    });
  if (effect.kind === "search_stack_install")
    profiles.push({
      schemaVersion: "target-profile-v1",
      kind: "search_install_target",
      timing,
      targetType: "program",
      purpose,
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
  if (effect.kind === "look_top_stack_take_matching")
    profiles.push({
      zone: "stack_top",
      ...(effect.allowedTypes.length === 1
        ? { targetCardType: effect.allowedTypes[0] }
        : {}),
      lookCount: effect.count,
      showToOpponent: effect.revealTakenToCorp,
      shuffleAfter: effect.shuffleRemainder,
    });
  if (effect.kind === "look_top_stack_show_to_corp_then_install_matching")
    profiles.push({
      zone: "stack_top",
      ...(effect.allowedTypes.length === 1
        ? { targetCardType: effect.allowedTypes[0] }
        : {}),
      lookCount: effect.count,
      showToOpponent: true,
      shuffleAfter: effect.shuffleAfterwards,
    });
  if (effect.kind === "choose_stack_or_trash_program_install")
    profiles.push({
      schemaVersion: "target-profile-v1",
      kind: "search_install_target",
      timing,
      targetType: "program",
      purpose,
      hiddenInfoPolicy: "public_or_controller_known_only",
    });
  if (effect.kind === "expose_installed_card")
    profiles.push({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing,
      targetType: "card",
      purpose,
      hiddenInfoPolicy: "legal_targets_only",
    });
  if (
    effect.kind === "pay_rez_cost_to_trash_rezzed_ice" ||
    effect.kind === "corp_choice_rez_or_trash_ice"
  )
    profiles.push({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing,
      targetType: "installed_ice",
      purpose,
      hiddenInfoPolicy: "legal_targets_only",
    });
  if (effect.kind === "move_advancement_counters")
    profiles.push({
      schemaVersion: "target-profile-v1",
      kind: "use_target",
      timing,
      targetType: "card",
      purpose,
      hiddenInfoPolicy: "legal_targets_only",
    });
}

function appendTypedCondition(
  conditions: NonNullable<AiCardHint["conditions"]>,
  condition: PlanningAbility["condition"],
): void {
  if (condition === undefined) return;
  if (
    condition.kind === "runner_is_tagged" ||
    condition.kind === "runner_tags_at_least"
  )
    conditions.push({ kind: "requires_runner_tagged" });
  if (condition.kind === "source_has_hosted_credits")
    conditions.push({ kind: "requires_credit_pool" });
  if (condition.kind === "source_has_advancement_counters")
    conditions.push({ kind: "requires_advancement_counter" });
  if (condition.kind === "runner_attempted_run_last_turn")
    conditions.push(
      condition.minimumRuns > 1
        ? { kind: "requires_runner_attempted_multiple_runs_last_turn" }
        : { kind: "requires_runner_attempted_run_last_turn" },
    );
  if (condition.kind === "runner_attempted_run_this_game")
    conditions.push({ kind: "requires_runner_attempted_run_this_game" });
  if (condition.kind === "runner_trashed_node_last_turn")
    conditions.push({ kind: "requires_runner_trashed_node_last_turn" });
  if (condition.kind === "runner_installed_resource_last_turn")
    conditions.push({ kind: "requires_runner_installed_resource_last_turn" });
  if (condition.kind === "runner_liberated_agenda_subtype_this_turn")
    conditions.push({
      kind:
        condition.subtype === "black_ops"
          ? "requires_liberated_black_ops_agenda"
          : condition.subtype === "gray_ops"
            ? "requires_liberated_gray_ops_agenda"
            : "requires_liberated_agenda_this_turn",
    });
  if (
    condition.kind === "corp_scored_agenda_subtype_last_turn" &&
    condition.subtype === "black_ops"
  )
    conditions.push({
      kind: "requires_corp_scored_black_ops_agenda_last_turn",
    });
  if (condition.kind === "runner_made_successful_hq_and_rd_runs_this_turn")
    conditions.push({ kind: "requires_successful_run" });
  if (condition.kind === "runner_made_successful_run_on_server_this_turn")
    conditions.push({
      kind:
        condition.server === "hq"
          ? "requires_successful_hq_run"
          : "requires_successful_run",
    });
  if (
    condition.kind === "current_encounter_ice" ||
    condition.kind === "current_encounter_ice_subtype"
  )
    conditions.push({ kind: "requires_encounter" });
  if (condition.kind === "current_run_server")
    conditions.push({ kind: "requires_during_run" });
}

function appendScoredAgendaProjection(
  overlay: GenericTypedHintOverlay,
  scored: PlanningEntry["planning"]["engine"]["scoredAgenda"],
): void {
  if (scored === undefined) return;
  if (scored.kind === "add_counters_on_score")
    overlay.functionSignals.push(
      "score.action_counter_bank",
      "score.run_end_counter_bank",
    );
  if (scored.kind === "purge_runner_virus_counters_and_prevent_next")
    overlay.functionSignals.push(
      "virus.corp_counter_clear",
      "virus.corp_counter_prevention",
    );
  if (scored.kind === "gain_credits_on_score") {
    overlay.effects.push({
      kind: "economy",
      scope: "corp",
      timing: "when_scored",
      resource: "credits",
      target: "score.credit_gain",
      amount: scored.amount,
      finite: true,
    });
    overlay.functionSignals.push("economy.burst_credit", "score.credit_gain");
  }
  if (scored.kind === "score_credit_swing_if_corp_credit_threshold_met") {
    if (
      !Number.isInteger(scored.threshold) ||
      scored.threshold <= 0 ||
      !Number.isInteger(scored.gainAmount) ||
      scored.gainAmount <= 0
    )
      throw new Error("card_spec_unknown_score_credit_threshold_shape");
    overlay.effects.push(
      {
        kind: "economy",
        scope: "corp",
        timing: "when_scored",
        resource: "credits",
        target: "score.credit_threshold_swing",
        amount: scored.threshold,
        finite: true,
      },
      {
        kind: "delayed_penalty",
        scope: "corp",
        timing: "when_scored",
        resource: "credits",
        target: "score.lose_all_credits_below_threshold",
        amountKind: "all_available",
        finite: true,
      },
    );
    overlay.conditions.push({ kind: "requires_corp_credits_threshold" });
    overlay.functionSignals.push(
      "economy.burst_credit",
      "score.credit_threshold_swing",
      "risk.economy_crash_on_score",
    );
  }
  if (scored.kind === "scored_agenda_credit_until_install_or_rez") {
    overlay.effects.push({
      kind: "action_economy",
      scope: "corp",
      timing: "scored_activated",
      resource: "credits",
      target: "score.install_or_rez_credit",
      amount: scored.gainAmount,
      amountKind: "fixed",
      economyMode: "liquid_payout",
      repeatable: true,
      finite: false,
    });
    overlay.functionSignals.push(
      "economy.action",
      "economy.corp_install_rez_budget",
    );
  }
  if (scored.kind === "shuffle_hq_archives_into_rd_then_draw") {
    overlay.effects.push(
      {
        kind: "zone_shuffle",
        scope: "rnd",
        timing: "when_scored",
        resource: "cards",
        target: "score.shuffle_hq_archives_into_rnd",
        finite: true,
      },
      {
        kind: "draw",
        scope: "corp",
        timing: "when_scored",
        resource: "cards",
        target: "score.draw",
        amount: scored.drawCount,
        finite: true,
      },
    );
    overlay.functionSignals.push("setup.draw", "zone.shuffle");
  }
  if (scored.kind === "meat_damage_bonus") {
    overlay.effects.push({
      kind: "global_modifier",
      scope: "damage",
      timing: "persistent",
      resource: "meat_damage",
      target: "score.meat_damage_bonus",
      amount: scored.amount,
    });
    overlay.functionSignals.push("damage.corp_damage_amplifier");
  }
  if (
    scored.kind === "overadvance_bonus_agenda_points" ||
    scored.kind === "fixed_bonus_agenda_points_on_score"
  ) {
    overlay.effects.push({
      kind: "score_acceleration",
      scope: "score_area",
      timing: "when_scored",
      target: "score.bonus_agenda_points",
      ...(scored.kind === "fixed_bonus_agenda_points_on_score"
        ? { amount: scored.amount }
        : {}),
      finite: true,
    });
    overlay.functionSignals.push("score.bonus_agenda_point");
    if (scored.kind === "overadvance_bonus_agenda_points")
      overlay.functionSignals.push(
        "advance.overadvance_payoff",
        "score.overadvance_bonus",
        "score.overadvance_scaling",
      );
  }
  if (scored.kind === "overadvance_start_of_corp_turn_credits") {
    overlay.effects.push({
      kind: "start_of_turn_economy",
      scope: "corp",
      timing: "start_of_turn",
      resource: "credits",
      target: "score.overadvance_credit",
      amount: scored.creditPerGroup,
      repeatable: true,
    });
    overlay.functionSignals.push("economy.turn_start_credit");
  }
  if (scored.kind === "overadvance_start_of_corp_turn_actions")
    overlay.functionSignals.push("economy.action", "score.overadvance_action");
  if (scored.kind === "corp_start_turn_random_restricted_optional_action")
    overlay.functionSignals.push("economy.action", "risk.random_outcome");
  if (scored.kind === "corp_damage_replacement_pdca_action_counter")
    overlay.functionSignals.push(
      "damage.corp_damage_replacement",
      "score.action_counter_bank",
    );
  if (
    scored.kind === "corp_start_turn_optional_draw" ||
    scored.kind === "corp_start_turn_mandatory_draw"
  ) {
    overlay.effects.push({
      kind: "draw",
      scope: "corp",
      timing: "start_of_turn",
      resource: "cards",
      target: "score.recurring_draw",
      amount: scored.drawCount,
      repeatable: true,
    });
    overlay.functionSignals.push("setup.draw", "draw.corp_recurring");
  }
  if (scored.kind === "tagged_runner_meat_damage_reduce_hand_size_on_success") {
    overlay.effects.push(
      {
        kind: "damage",
        scope: "runner",
        timing: "scored_activated",
        resource: "meat_damage",
        target: "score.tagged_runner_meat_damage",
        amount: scored.damageAmount,
        finite: true,
      },
      {
        kind: "hand_size_modifier",
        scope: "runner",
        timing: "persistent",
        resource: "hand_size",
        target: "score.damage_hand_size_reduction",
        amount: -scored.handSizeReduction,
      },
    );
    overlay.conditions.push({ kind: "requires_runner_tagged" });
    overlay.functionSignals.push("damage.payoff", "tag.payoff");
  }
  if (
    scored.kind === "choose_fort_ice_strength_bonus" ||
    scored.kind === "select_rezzed_ice_mark_modifier"
  ) {
    overlay.effects.push({
      kind: "global_modifier",
      scope: "ice",
      timing: "scored_activated",
      resource: "strength",
      target: "score.ice_strength_modifier",
      amount:
        scored.kind === "choose_fort_ice_strength_bonus"
          ? scored.amount
          : scored.strengthBonusPerCounter,
    });
    overlay.functionSignals.push("ice.corp_strength_support");
  }
  if (
    scored.kind === "score_rez_installed_ice_at_no_cost" ||
    scored.kind === "reveal_top_rd_install_and_rez_ice_trash_rest"
  ) {
    overlay.effects.push({
      kind: "rez",
      scope: "ice",
      timing: "when_scored",
      target: "score.free_rez_ice",
      finite: true,
    });
    overlay.functionSignals.push("ice.corp_free_rez");
  }
  if (scored.kind === "reveal_installed_ice_subtype_for_credits")
    overlay.functionSignals.push(
      "economy.burst_credit",
      "info.expose_installed_card",
    );
  if (scored.kind === "shuffle_selected_hq_agendas_into_rd_gain_credits")
    overlay.functionSignals.push("economy.burst_credit", "zone.shuffle");
  if (scored.kind === "score_install_hq_cards_into_new_remote_then_rez")
    overlay.functionSignals.push(
      "economy.corp_install_rez_budget",
      "install.corp_new_remote_fort_from_hq",
      "score.remote_fort_creation",
      "score.remote_install_budget",
    );
}

function deriveClosedMechanicalHintOverlay(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): ClosedMechanicalHintOverlay {
  const engine = entry.planning.engine;
  const overlay: ClosedMechanicalHintOverlay = {
    effects: [],
    conditions: [],
    functionSignals: [],
    tacticSignals: [],
    roles: [],
  };
  const corpUtility = engine.corpUtility;

  for (const ability of engine.abilities ?? []) {
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "mark_next_agenda_access_credit_gain") {
        if (
          ability.kind !== "on_play" ||
          ability.costs !== "printed" ||
          !Number.isInteger(effect.amount) ||
          effect.amount <= 0 ||
          effect.visibility !== "public"
        )
          throw new Error("card_spec_unknown_next_agenda_access_credit_shape");
        overlay.effects.push(
          {
            kind: "economy",
            scope: "runner",
            timing: "on_access",
            resource: "credits",
            target: "next_agenda_credit",
            amount: effect.amount,
            finite: true,
          },
          {
            kind: "scored_agenda_action",
            scope: "runner",
            timing: "on_access",
            target: "next_agenda_credit",
            finite: true,
          },
        );
        overlay.functionSignals.push(
          "access.next_agenda_credit",
          "economy.generic",
        );
        overlay.roles.push("economy", "event");
      }
      if (effect.kind === "mark_next_agenda_access_agenda_point") {
        if (
          ability.kind !== "on_play" ||
          ability.costs !== "printed" ||
          !Number.isInteger(effect.amount) ||
          effect.amount <= 0 ||
          effect.visibility !== "public"
        )
          throw new Error("card_spec_unknown_next_agenda_access_point_shape");
        overlay.effects.push(
          {
            kind: "scored_agenda_action",
            scope: "runner",
            timing: "on_access",
            target: "bonus_agenda_point",
            amount: effect.amount,
            finite: true,
          },
          {
            kind: "access_replacement",
            scope: "runner",
            timing: "on_access",
            target: "next_agenda_bonus",
            amount: effect.amount,
            finite: true,
          },
        );
        overlay.functionSignals.push(
          "access.next_agenda_bonus",
          "score.bonus_agenda_point",
        );
        overlay.roles.push("event");
      }
      if (effect.kind === "free_rez_installed_ice_with_counters") {
        const temporaryShape =
          effect.target === "chosen_installed_ice" &&
          effect.counterType === "kludge" &&
          effect.amount.kind === "chosen_x_min_one" &&
          effect.lifecycle ===
            "remove_one_counter_start_corp_turn_trash_on_last";
        const installmentShape =
          effect.target === "chosen_installed_ice" &&
          effect.counterType === "term" &&
          effect.amount.kind === "target_rez_cost" &&
          effect.lifecycle === "rent_to_own_start_corp_turn";
        if (
          ability.kind !== "on_play" ||
          ability.costs !== "printed" ||
          effect.visibility !== "public" ||
          (!temporaryShape && !installmentShape)
        )
          throw new Error("card_spec_unknown_free_rez_ice_shape");
        overlay.effects.push(
          {
            kind: "rez",
            scope: "ice",
            timing: "action",
            target: "corp_ice.free_rez",
            finite: true,
          },
          {
            kind: "rez",
            scope: "ice",
            timing: "corp_turn",
            target: installmentShape
              ? "corp_ice.installment_rez"
              : "corp_ice.temporary_rez",
            finite: false,
          },
        );
        overlay.functionSignals.push("ice.corp_free_rez");
        overlay.tacticSignals.push("ice.corp_free_rez");
        if (installmentShape) {
          overlay.functionSignals.push(
            "ice.corp_installment_rez",
            "risk.deferred_rez_payment_liability",
            "risk.term_counter_payment_liability",
          );
          overlay.tacticSignals.push(
            "ice.corp_installment_rez",
            "risk.deferred_rez_payment_liability",
            "risk.term_counter_payment_liability",
          );
        } else {
          overlay.functionSignals.push(
            "ice.corp_temporary_rez",
            "risk.temporary_rez_liability",
          );
          overlay.tacticSignals.push(
            "ice.corp_temporary_rez",
            "risk.temporary_rez_liability",
          );
        }
        overlay.roles.push("operation");
      }
    }
  }

  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind !== "end_the_run_unless_runner_pays") continue;
    if (!Number.isInteger(subroutine.amount) || subroutine.amount <= 0)
      throw new Error("card_spec_unknown_pay_or_end_run_shape");
    overlay.effects.push({
      kind: "etr",
      scope: "run_path",
      timing: "encounter_resolution",
      resource: "credits",
      target: "corp_ice.end_run_unless_runner_pays",
      amount: subroutine.amount,
      finite: true,
    });
    overlay.functionSignals.push(
      "corp_ice.end_run",
      "corp_ice.encounter_tax",
      "corp_ice.runner_pay_or_end_run",
      "ice.etr",
    );
    overlay.tacticSignals.push(
      "corp_ice.encounter_tax",
      "corp_ice.runner_pay_or_end_run",
    );
    overlay.roles.push("etr_ice");
  }

  for (const effect of engine.lifecycle?.on_rez ?? []) {
    if (effect.kind !== "gain_credits") continue;
    if (
      effect.recipient !== "corp" ||
      !Number.isInteger(effect.amount) ||
      effect.amount <= 0 ||
      effect.visibility !== "public"
    )
      throw new Error("card_spec_unknown_on_rez_credit_shape");
    overlay.effects.push({
      kind: "economy",
      scope: "corp",
      timing: "on_rez",
      resource: "credits",
      amount: effect.amount,
      finite: true,
    });
    overlay.functionSignals.push("corp_ice.rez_economy", "economy.generic");
    overlay.tacticSignals.push("corp_ice.rez_economy");
  }
  if (corpUtility?.kind === "meat_damage_boost") {
    if (
      corpUtility.cost.kind !== "advancement_counter" ||
      corpUtility.cost.amount !== 1 ||
      corpUtility.amount !== 1 ||
      corpUtility.timing !== "successful_meat_damage" ||
      corpUtility.visibility !== "public"
    )
      throw new Error("card_spec_unknown_meat_damage_boost_shape");
    overlay.effects.push({
      kind: "global_modifier",
      scope: "damage",
      timing: "action",
    });
    overlay.conditions.push({ kind: "requires_advancement_counter" });
    overlay.functionSignals.push("advance.corp_counter_bank");
    overlay.tacticSignals.push(
      "advance.corp_counter_bank",
      "damage.corp_damage_amplifier",
    );
  }
  if (corpUtility?.kind === "expose_prevention") {
    if (
      corpUtility.cost.kind !== "credit" ||
      corpUtility.cost.amount !== 1 ||
      corpUtility.timing !== "during_expose_attempt" ||
      (corpUtility.mayRezAtWindow !== undefined &&
        corpUtility.mayRezAtWindow !== true) ||
      corpUtility.visibility !== "public"
    )
      throw new Error("card_spec_unknown_expose_prevention_shape");
    overlay.effects.push({
      kind: "prevention_replacement",
      scope: "installed_card",
      timing: "prevention_window",
    });
    overlay.functionSignals.push("expose.corp_prevention");
    overlay.tacticSignals.push("expose.corp_prevention");
  }
  if (corpUtility?.kind === "fort_start_runner_spend_cap") {
    if (
      corpUtility.timing !== "start_of_run" ||
      corpUtility.target !== "source_fort" ||
      corpUtility.mayRezAtWindow !== true ||
      corpUtility.visibility !== "public"
    )
      throw new Error("card_spec_unknown_fort_start_spend_cap_shape");
    overlay.effects.push({
      kind: "run_tax",
      resource: "credits",
      scope: "fort",
      target: "run.corp_spend_cap",
      timing: "during_run",
    });
    overlay.conditions.push({ kind: "requires_during_run" });
    overlay.functionSignals.push(
      "run.corp_spend_cap",
      "tax.remote",
      "tax.runner_credit",
    );
    overlay.tacticSignals.push("run.corp_spend_cap", "tax.runner_credit");
    overlay.remoteRole = {
      kind: "run_tax",
      threatLevel: "high",
      serverScope: "fort",
    };
  }
  if (corpUtility?.kind === "installed_hardware_trash_by_counter") {
    if (
      corpUtility.excludesSubtype !== "cybernetics" ||
      corpUtility.visibility !== "public"
    )
      throw new Error(
        "card_spec_unknown_installed_hardware_trash_by_counter_shape",
      );
    overlay.effects.push(
      {
        kind: "hardware_trash",
        scope: "runner",
        timing: "action",
        resource: "credits",
        target: "installed_runner_hardware_non_cybernetics",
        finite: true,
      },
      {
        kind: "tag_punish_payoff",
        scope: "runner",
        timing: "action",
        resource: "tags",
        target: "tagged_runner_hardware_trash",
        finite: true,
      },
    );
    overlay.conditions.push(
      { kind: "requires_runner_tagged" },
      { kind: "requires_installed_hardware" },
    );
    overlay.functionSignals.push("access.corp_hardware_trash", "tag.payoff");
    overlay.tacticSignals.push("punish.payoff", "tag.payoff");
  }

  for (const source of engine.flatlineReplacementSources ?? []) {
    if (source.kind === "flatline_replacement_from_grip") {
      if (
        source.replacement !== "flatline_tag_replacement" ||
        source.visibility !== "public"
      ) {
        throw new Error(
          "card_spec_unknown_flatline_replacement_from_grip_shape",
        );
      }
      overlay.effects.push({
        kind: "flatline_prevention",
        resource: "damage",
        scope: "runner",
        target: "flatline",
        timing: "prevention_window",
      });
      overlay.conditions.push({ kind: "requires_prevention_window" });
      overlay.functionSignals.push("defense.damage_prevention");
      continue;
    }
    if (source.kind !== "damage_replacement_from_grip") continue;
    if (
      source.replacement !== "prevent_meat_damage_add_bad_publicity" ||
      source.damageType !== "meat" ||
      source.activeOnlyDuring !== "corp_turn" ||
      source.badPublicity !== 2 ||
      source.visibility !== "public"
    )
      throw new Error("card_spec_unknown_flatline_replacement_shape");
    overlay.effects.push(
      {
        kind: "meat_damage_prevention",
        scope: "runner",
        target: "meat_damage",
        timing: "prevention_window",
      },
      {
        kind: "run_tax",
        scope: "corp",
        target: "bad_publicity_pressure",
        timing: "prevention_window",
      },
      {
        kind: "flatline_prevention",
        resource: "damage",
        scope: "runner",
        timing: "flatline_replacement",
      },
      {
        kind: "prevention_replacement",
        resource: "damage",
        scope: "runner",
        timing: "flatline_replacement",
      },
    );
    overlay.conditions.push(
      { kind: "requires_meat_damage" },
      { kind: "requires_prevention_window" },
    );
    overlay.functionSignals.push(
      "corp.bad_publicity_pressure",
      "defense.damage_prevention",
      "defense.meat_damage_prevention",
    );
  }

  const targetedEffect = engine.runnerEventTargetedEffect;
  if (targetedEffect?.kind === "add_strength_counter_to_installed_icebreaker") {
    if (
      targetedEffect.counterType !== "power" ||
      targetedEffect.amount !== 1 ||
      targetedEffect.visibility !== "public"
    )
      throw new Error("card_spec_unknown_breaker_strength_counter_shape");
    overlay.effects.push(
      {
        kind: "global_modifier",
        amount: 1,
        resource: "strength",
        scope: "installed_program",
        target: "icebreaker",
        timing: "action",
      },
      {
        kind: "breaker",
        scope: "installed_program",
        target: "strength_boost",
        timing: "action",
      },
    );
    overlay.conditions.push({ kind: "requires_installed_program" });
    overlay.functionSignals.push("breaker.support", "run.break_cost_support");
  }

  const runnerEvent = engine.runnerEventLongtail;
  if (
    runnerEvent?.kind ===
    "trash_installed_runner_connections_then_add_bad_publicity"
  ) {
    if (
      runnerEvent.count !== 2 ||
      runnerEvent.badPublicity !== 1 ||
      runnerEvent.visibility !== "hidden_info_barrier"
    )
      throw new Error("card_spec_unknown_bad_publicity_self_cost_shape");
    overlay.effects.push({
      kind: "run_tax",
      scope: "corp",
      target: "bad_publicity_self_damage_cost",
      timing: "action",
    });
    overlay.functionSignals.push("corp.bad_publicity_self_damage_cost");
  }

  const runnerUtility = engine.runnerUtilityLongtail;
  if (runnerUtility?.kind === "derez_fully_broken_passed_ice_and_end_run") {
    if (
      runnerUtility.cost.kind !== "credit" ||
      !Number.isInteger(runnerUtility.cost.amount) ||
      runnerUtility.cost.amount < 0 ||
      runnerUtility.timing !== "after_passing_fully_broken_ice" ||
      runnerUtility.target !== "that_ice" ||
      runnerUtility.visibility !== "public"
    )
      throw new Error("card_spec_unknown_post_pass_derez_shape");
    overlay.effects.push({
      kind: "rez",
      scope: "ice",
      timing: "encounter_resolution",
      target: "derez",
      finite: true,
    });
    overlay.conditions.push(
      { kind: "requires_encounter" },
      { kind: "requires_rezzed_ice" },
    );
    overlay.functionSignals.push("ice.derez");
    overlay.tacticSignals.push("ice.derez");
    overlay.roles.push("derez", "fully_broken_ice");
    overlay.effects.push({
      kind: "future_run_effect",
      scope: "run_path",
      timing: "encounter_resolution",
      target: "ends_run_after_effect",
      finite: true,
    });
    overlay.functionSignals.push("run.ends_run_after_effect");
    overlay.tacticSignals.push("run.ends_run_after_effect");
    if (
      entry.definition.type === "event" &&
      engine.abilities?.some(
        (ability) =>
          ability.kind === "on_play" &&
          ability.effects?.some((effect) => effect.kind === "make_run"),
      )
    ) {
      overlay.functionSignals.push(
        "run.any_server",
        "run.event_tempo",
        "run.make_run",
      );
      overlay.tacticSignals.push(
        "run.make_run",
        "run.any_server",
        "run.event_tempo",
      );
      overlay.roles.push("run_event");
    }
  }
  if (
    runnerUtility?.kind === "hidden_resource_post_meat_damage_random_hq_discard"
  ) {
    if (
      runnerUtility.cost.kind !== "trash_source" ||
      runnerUtility.amount !== 2 ||
      runnerUtility.visibility !== "hidden_info_barrier"
    )
      throw new Error("card_spec_unknown_hidden_retaliation_shape");
    appendHiddenResourceEffects(overlay.effects);
    overlay.effects.push(
      {
        kind: "global_modifier",
        scope: "runner",
        target: "resource.connection",
        timing: "persistent",
      },
      {
        kind: "prevention_replacement",
        scope: "runner",
        target: "defense.damage_retaliation",
        timing: "persistent",
      },
      {
        kind: "persistent_counter_effect",
        amount: 2,
        finite: true,
        resource: "cards",
        scope: "hq",
        target: "random_discard",
        timing: "persistent",
      },
    );
    overlay.functionSignals.push(
      ...hiddenResourceFunctionSignals(),
      "corp.random_discard_pressure",
      "defense.damage_retaliation",
      "resource.connection",
    );
    overlay.roles.push(
      "connection",
      "hidden_zone_tool",
      "random_discard_pressure",
      "resource",
    );
  }

  if (
    runnerUtility?.kind ===
    "replace_installed_program_trash_with_host_on_source"
  ) {
    overlay.effects.push({
      kind: "program_trash_prevention",
      scope: "runner",
      timing: "prevention_window",
      resource: "cards",
      target: "installed_program",
      repeatable: true,
    });
    overlay.conditions.push({ kind: "requires_prevention_window" });
    overlay.functionSignals.push("defense.program_trash_prevention");
    overlay.roles.push("trash_prevention");
  }

  for (const source of engine.trashPreventionSources ?? []) {
    if (source.kind !== "prevent_installed_card_trash") continue;
    if (
      source.protectsCardTypes.length !== 1 ||
      source.protectsCardTypes[0] !== "resource" ||
      source.excludesSelf !== true ||
      source.activeOnlyDuring !== "corp_turn" ||
      source.mode !== "one_or_more_simultaneous" ||
      source.cost.kind !== "trash_source" ||
      source.priority !== 30 ||
      source.visibility !== "public"
    ) {
      overlay.effects.push({
        kind: "prevention_replacement",
        scope: "installed_card",
        target: "defense.installed_card_trash_prevention",
        timing: "prevention_window",
      });
      overlay.conditions.push({ kind: "requires_prevention_window" });
      overlay.functionSignals.push("defense.installed_card_trash_prevention");
      overlay.roles.push("trash_prevention");
      continue;
    }
    appendHiddenResourceEffects(overlay.effects);
    overlay.effects.push({
      kind: "prevention_replacement",
      scope: "runner",
      target: "defense.resource_trash_prevention",
      timing: "persistent",
    });
    overlay.conditions.push({ kind: "requires_prevention_window" });
    overlay.functionSignals.push(
      ...hiddenResourceFunctionSignals(),
      "defense.resource_trash_prevention",
    );
    overlay.roles.push("hidden_zone_tool", "resource", "trash_prevention");
  }
  return overlay;
}

function appendHiddenResourceEffects(
  effects: NonNullable<AiCardHint["effects"]>,
): void {
  effects.push(
    {
      kind: "global_modifier",
      scope: "runner",
      target: "resource.hidden",
      timing: "persistent",
    },
    {
      kind: "prevention_replacement",
      scope: "runner",
      target: "hidden.runner_resource",
      timing: "persistent",
    },
    {
      kind: "global_modifier",
      scope: "runner",
      target: "resource.hidden_one_shot",
      timing: "persistent",
    },
    {
      kind: "prevention_replacement",
      scope: "runner",
      target: "hidden.one_shot_resource",
      timing: "persistent",
    },
    {
      kind: "prevention_replacement",
      scope: "runner",
      target: "hidden.reveals_on_use",
      timing: "persistent",
    },
    {
      kind: "prevention_replacement",
      scope: "runner",
      target: "hidden.reveals_on_trash",
      timing: "persistent",
    },
  );
}

function hiddenResourceFunctionSignals(): string[] {
  return [
    "hidden.one_shot_resource",
    "hidden.reveals_on_trash",
    "hidden.reveals_on_use",
    "hidden.runner_resource",
    "resource.hidden",
    "resource.hidden_one_shot",
  ];
}

function appendUniqueStrings(
  base: readonly string[],
  additions: readonly string[],
): string[] {
  const result = [...base];
  for (const addition of additions)
    if (!result.includes(addition)) result.push(addition);
  return result;
}

function appendUniqueObjects<const Value>(
  base: readonly Value[],
  additions: readonly Value[],
): Value[] {
  const result = [...base];
  const seen = new Set(base.map((value) => JSON.stringify(value)));
  for (const addition of additions) {
    const key = JSON.stringify(addition);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(addition);
  }
  return result;
}

function derivedMechanicalPlanRoles(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const closedExtended = usesClosedExtendedMechanicalProfile(entry);
  if (!usesExtendedMechanicalSemantics(entry) && !closedExtended) return [];
  const engine = entry.planning.engine;
  const roles = new Set<string>();
  if (
    closedExtended
      ? engine.scoredAgenda !== undefined ||
        engine.agendaAccessReplacement?.kind === "install_as_runner_program"
      : engine.scoredAgenda !== undefined
  )
    roles.add("score_agenda");
  if (
    engine.icebreakerAbilities !== undefined &&
    engine.installTargetBinding === undefined &&
    engine.icebreakerEncounterStrengthBonus === undefined &&
    engine.icebreakerSubtypeChange === undefined &&
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "tactic_interpretation" &&
        annotation.use === "coverage.breaker",
    ) === true
  )
    roles.add("break_ice");
  if (
    !closedExtended &&
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "draw_cards"),
    )
  )
    roles.add("draw");
  if (
    closedExtended &&
    (engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd" ||
      engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
  )
    roles.add("draw");
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "remove_tags"),
    )
  )
    roles.add("recover_from_tags");
  if (
    engine.hardwareDeck === true ||
    engine.runnerUtilityLongtail?.kind === "base_memory_equals_grip_count"
  )
    roles.add("runner_install_hardware");
  if (
    engine.restrictedHostedCreditSource?.usableFor.includes("increase_link") &&
    entry.definition.type === "resource"
  )
    roles.add("increase_link");
  return [...roles];
}

function deriveActionCapacityProfiles(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["actionCapacityProfiles"]> {
  const engine = entry.planning.engine;
  const controller = entry.definition.side;
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
            entry.definition.type === "agenda"
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

function strategySupportRole(value: string): KnownHintStrategySupportPairRole {
  const role = KNOWN_HINT_STRATEGY_SUPPORT_PAIR_ROLES.find(
    (candidate) => candidate === value,
  );
  if (role === undefined)
    throw new Error(`card_spec_unknown_strategy_support_role: ${value}`);
  return role;
}

function closedPlanningValue<const Values extends readonly string[]>(
  value: string,
  allowed: Values,
  field: string,
): Values[number] {
  const result = allowed.find((candidate) => candidate === value);
  if (result === undefined)
    throw new Error(`card_spec_unknown_${field}: ${value}`);
  return result;
}

function closedPlanningValues<const Values extends readonly string[]>(
  values: readonly string[],
  allowed: Values,
  field: string,
): Values[number][] {
  return values.map((value) => closedPlanningValue(value, allowed, field));
}

function deriveRequiredMechanics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  if (usesClosedExtendedMechanicalProfile(entry))
    return deriveExtendedRequiredMechanics(entry);
  const mechanics = new Set(entry.definition.mechanics);
  const normalizeGenericMechanics = usesGenericCompatibilityMechanics(entry);
  if (normalizeGenericMechanics)
    for (const internal of [
      "abilities",
      "corpRootRezCreditOutcome",
      "on_play",
      "printedSubroutines",
    ])
      mechanics.delete(internal);
  if (isSimpleBreaker(entry))
    for (const internal of [
      "break_subroutine",
      "credit",
      "ice_subtype",
      "icebreakerAbilities",
      "increase_strength",
    ])
      mechanics.delete(internal);
  if (hasGenericOnPlayEffect(entry))
    for (const internal of [
      "chosen_server",
      "gain_credits",
      "runner_is_tagged",
    ])
      mechanics.delete(internal);
  if (entry.definition.type === "identity") mechanics.add("identity_setup");
  if (
    entry.definition.type === "agenda" &&
    entry.planning.engine.scoredAgenda === undefined
  ) {
    mechanics.delete("score_agenda");
    mechanics.add("score");
    mechanics.add("steal");
    mechanics.add("advancement_requirement");
    mechanics.add("agenda_points");
  }
  if (
    entry.planning.engine.characteristics.memoryLimitBonus !== undefined ||
    isSimpleBreaker(entry)
  )
    mechanics.add("memory");
  if (
    entry.planning.engine.corpRootRezCreditOutcome !== undefined ||
    (entry.definition.type === "upgrade" && normalizeGenericMechanics)
  )
    mechanics.add("trash_cost");
  if (isSimpleBreaker(entry) || isSimplePrintedIce(entry))
    for (const subtype of entry.definition.subtypes)
      mechanics.add(`subtype_${subtype}`);
  if (isSimplePrintedIce(entry))
    for (const subroutine of entry.planning.engine.printedSubroutines ?? [])
      mechanics.add(subroutine.kind);
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    mechanics.add("resource_tag_interaction");
  for (const ability of entry.planning.engine.abilities ?? []) {
    if (
      Array.isArray(ability.costs) &&
      ability.costs.some((cost) => cost.kind === "action")
    )
      mechanics.add("take_click_ability");
    for (const effect of ability.effects ?? []) {
      if (
        (normalizeGenericMechanics && effect.kind === "gain_credits") ||
        (normalizeGenericMechanics && effect.kind === "draw_cards") ||
        (normalizeGenericMechanics && effect.kind === "make_run") ||
        (normalizeGenericMechanics && effect.kind === "lose_credits")
      )
        mechanics.delete(effect.kind);
      if (effect.kind === "add_hosted_credits") {
        mechanics.add("gain_credit");
        mechanics.add("bit_depot");
      }
      if (effect.kind === "take_hosted_credits") mechanics.add("bit_depot");
      if (
        effect.kind === "make_run" &&
        effect.badPublicityRunAftermath !== undefined
      )
        mechanics.add("subtype_bad_publicity");
      if (effect.kind === "make_run" && !normalizeGenericMechanics) {
        mechanics.add("start_run");
        if ((effect.successfulRunRunnerCreditGain ?? 0) > 0)
          mechanics.add("successful_run_credit_gain");
      }
    }
  }
  if (
    entry.planning.engine.variableRez?.kind === "alternate_subtype" &&
    entry.planning.engine.variableRez.alternateSubtypes.includes("wall")
  )
    mechanics.add("alternate_subtype_wall");
  return [...mechanics].sort();
}

function usesClosedExtendedMechanicalProfile(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  const engine = entry.planning.engine;
  const simpleReviewedBreaker =
    isSimpleBreaker(entry) &&
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "tactic_interpretation" &&
        annotation.use === "coverage.breaker",
    ) === true;
  return (
    simpleReviewedBreaker ||
    closedCurrentRunAdditionalAccess(entry) !== null ||
    engine.agendaAccessReplacement?.kind === "install_as_runner_program" ||
    engine.corpUtility !== undefined ||
    engine.damagePreventionSources !== undefined ||
    engine.flatlineReplacementSources !== undefined ||
    engine.hardwareDeck === true ||
    engine.hostedProgramCapacity !== undefined ||
    engine.iceEncounter !== undefined ||
    engine.relativeIce !== undefined ||
    engine.restrictedHostedCreditSource !== undefined ||
    engine.runnerCounterEffects !== undefined ||
    engine.runnerEventLongtail !== undefined ||
    engine.runnerEventTargetedEffect !== undefined ||
    engine.runnerRunStrengthBoost !== undefined ||
    engine.runnerUtilityLongtail !== undefined ||
    engine.selfRezAdditionalCosts !== undefined ||
    engine.selfRezCostModifiers !== undefined ||
    engine.selfStealCosts !== undefined ||
    engine.successfulRunFollowups !== undefined ||
    engine.tagPreventionSources !== undefined ||
    engine.trashPreventionSources !== undefined ||
    engine.uniqueDirectLongtail !== undefined ||
    engine.virusCounter !== undefined ||
    engine.scoredAgenda?.kind === "add_counters_on_score" ||
    engine.scoredAgenda?.kind ===
      "purge_runner_virus_counters_and_prevent_next" ||
    engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw" ||
    engine.modifiers?.some((modifier) =>
      [
        "break_subroutine_cost",
        "break_ability_use_cost",
        "hand_size",
        "memory_units",
      ].includes(modifier.kind),
    ) === true ||
    engine.printedSubroutines?.some((subroutine) =>
      [
        "random_damage",
        "trace",
        "next_encounter_unless_fully_break_damage",
        "prohibit_break_next_ice",
        "trash_program",
        "deflect_run",
        "end_the_run_and_trash_source_at_end_of_turn",
      ].includes(subroutine.kind),
    ) === true ||
    engine.abilities?.some(
      (ability) =>
        (Array.isArray(ability.costs) &&
          ability.costs.some(
            (cost) => cost.kind === "action" && cost.amount > 1,
          )) ||
        additionalClickAmount(ability.costs) === 1 ||
        ability.effects?.some((effect) =>
          [
            "double_chosen_ice_strength_until_end_of_turn",
            "private_look",
            "remove_tags",
            "transfer_hosted_credits",
          ].includes(effect.kind),
        ) ||
        ability.effects?.some(
          (effect) =>
            effect.kind === "make_run" &&
            (effect.successfulRunAccessReplacement !== undefined ||
              effect.corpRezCostSurcharge !== undefined),
        ),
    ) === true ||
    engine.accessEffects?.some((access) =>
      access.effects.some((effect) =>
        [
          "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
          "trash_installed_runner_hardware_and_programs",
        ].includes(effect.kind),
      ),
    ) === true
  );
}

function deriveExtendedRequiredMechanics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const mechanics = new Set<string>();
  const cardType = entry.definition.type;
  if (cardType === "agenda") mechanics.add("score_agenda");
  if (cardType === "asset") {
    mechanics.add("install_asset");
    mechanics.add("rez_card");
  }
  if (cardType === "event") mechanics.add("play_event");
  if (cardType === "hardware") mechanics.add("install_hardware");
  if (cardType === "ice") {
    mechanics.add("install_ice");
    mechanics.add("rez_ice");
    mechanics.add("encounter_ice");
  }
  if (cardType === "operation") mechanics.add("play_operation");
  if (cardType === "program") mechanics.add("install_program");
  if (cardType === "resource") mechanics.add("install_resource");
  if (cardType === "upgrade") mechanics.add("rez_card");
  if (
    (cardType === "asset" || cardType === "upgrade") &&
    engine.characteristics.numeric.trashCost !== null
  )
    mechanics.add("trash_on_access");

  if (engine.scoredAgenda?.kind === "add_counters_on_score")
    for (const token of ["scored_counter", "corp_during_run_paid_ability"])
      mechanics.add(token);
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    for (const token of [
      "purge_runner_virus_counters",
      "virus_counter_prevention",
    ])
      mechanics.add(token);
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    for (const token of ["start_turn_trigger", "draw_cards"])
      mechanics.add(token);
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    for (const token of [
      "agenda_access_replacement",
      "install_as_runner_program",
      "runner_score_action",
      "remove_from_game_on_leave_play",
    ])
      mechanics.add(token);

  for (const ability of engine.abilities ?? []) {
    if (ability.kind === "activated") mechanics.add("activated_ability");
    if (
      Array.isArray(ability.costs) &&
      ability.costs.some((cost) => cost.kind === "action" && cost.amount > 1)
    )
      mechanics.add("double_action_cost");
    if (additionalClickAmount(ability.costs) === 1)
      mechanics.add("double_action_cost");
    for (const cost of Array.isArray(ability.costs) ? ability.costs : []) {
      if (cost.kind === "credit") mechanics.add("credit_cost");
      if (cost.kind === "tap_source")
        for (const token of ["paid_tap_ability", "tap_source"])
          mechanics.add(token);
      if (cost.kind === "trash_source") mechanics.add("trash_source");
      if (cost.kind === "source_counter") mechanics.add("source_counter_cost");
    }
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "draw_cards") mechanics.add("draw_cards");
      if (effect.kind === "gain_credits") mechanics.add("gain_credits");
      if (effect.kind === "make_run") mechanics.add("start_run");
      if (
        effect.kind === "make_run" &&
        effect.successfulRunAccessReplacement !== undefined
      ) {
        mechanics.add("successful_run_access_replacement");
        const replacement = effect.successfulRunAccessReplacement;
        if (replacement === "reveal_rd_until_agenda_store_in_hq")
          for (const token of ["reveal_cards_until_agenda", "move_card_to_hq"])
            mechanics.add(token);
        if (replacement === "corp_lose_credits")
          mechanics.add("corp_credit_loss");
        if (replacement === "runner_spend_corp_lose_credits")
          mechanics.add("runner_spend_corp_credit_loss");
        if (replacement === "private_look_top_rd")
          mechanics.add("private_rnd_top_look");
        if (replacement === "archives_faceup_to_rd")
          mechanics.add("archives_faceup_to_rd");
        if (replacement === "trash_rezzed_ice_on_fort_and_tag_runner")
          for (const token of ["trash_rezzed_ice", "add_tags"])
            mechanics.add(token);
        if (replacement === "runner_gain_agenda_point")
          mechanics.add("runner_gain_agenda_point");
      }
      if (
        effect.kind === "make_run" &&
        effect.corpRezCostSurcharge !== undefined
      )
        mechanics.add("run_duration_rez_cost_surcharge");
      if (effect.kind === "remove_tags") mechanics.add("remove_tags");
      if (effect.kind === "end_run") mechanics.add("end_run");
      if (effect.kind === "private_look") {
        mechanics.add(
          effect.zone === "hq" ? "private_hq_look" : "private_rnd_top_look",
        );
      }
      if (effect.kind === "double_chosen_ice_strength_until_end_of_turn")
        for (const token of ["target_rezzed_ice", "temporary_ice_strength"])
          mechanics.add(token);
      if (effect.kind === "score_source_as_agenda")
        mechanics.add("runner_score_action");
      if (effect.kind === "transfer_hosted_credits")
        mechanics.add("hosted_credit_transfer");
    }
  }

  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage")
      mechanics.add("printed_subroutine_damage");
    if (subroutine.kind === "random_damage")
      for (const token of [
        "printed_random_damage",
        "random_die_resolution",
        "core_damage",
      ])
        mechanics.add(token);
    if (subroutine.kind === "trace") mechanics.add("trace");
    if (subroutine.kind === "end_the_run") mechanics.add("end_the_run");
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      for (const token of ["end_the_run", "delayed_turn_end_trash"])
        mechanics.add(token);
    if (subroutine.kind === "trash_program")
      mechanics.add("trash_installed_program");
    if (subroutine.kind === "prohibit_break_next_ice")
      mechanics.add("next_encounter_no_break_subroutines");
    if (subroutine.kind === "deflect_run") {
      mechanics.add("deflect_run");
      mechanics.add("encounter_reposition");
      if (subroutine.cost !== undefined)
        mechanics.add("paid_subroutine_choice");
      if (subroutine.autoBreakIfNoTarget === true)
        mechanics.add("auto_break_without_target");
    }
  }
  for (const install of engine.installCapabilities ?? [])
    if (
      install.kind === "install_not_on_archives" ||
      install.kind === "install_only_in_hq_or_rd" ||
      install.kind === "install_only_inside_subsidiary_data_fort"
    )
      mechanics.add("install_restriction");
  if (engine.selfRezCostModifiers !== undefined)
    mechanics.add("sleepy_noisy_rez_discount");
  if (engine.selfRezAdditionalCosts !== undefined)
    mechanics.add("agenda_point_rez_cost");
  if (engine.selfRezWindows?.some((window) => window.kind === "trace_attempt"))
    mechanics.add("trace_window_self_rez");
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      mechanics.add("start_run_ice_move");
  if (engine.runnerCounterEffects !== undefined)
    for (const token of [
      "runner_counter",
      "run_start_counter_damage",
      "runner_counter_removal",
    ])
      mechanics.add(token);
  if (engine.characteristics.subtypes.includes("region"))
    mechanics.add("region_upgrade");
  for (const subtype of engine.characteristics.subtypes)
    mechanics.add(`subtype_${subtype}`);
  if (engine.unique !== undefined) mechanics.add("unique");
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "break_subroutine_cost")
      mechanics.add("break_subroutine_cost_modifier");
    if (modifier.kind === "break_ability_use_cost")
      mechanics.add("break_ability_use_cost_modifier");
    if (modifier.kind === "hand_size") mechanics.add("hand_size_modifier");
    if (modifier.kind === "memory_units") mechanics.add("memory_modifier");
  }

  const utilityKind = engine.corpUtility?.kind;
  if (utilityKind === "runner_memory_limit_modifier_until_end_of_turn")
    for (const token of [
      "runner_is_tagged",
      "temporary_memory_limit_modifier",
      "trash_installed_program_if_over_memory",
    ])
      mechanics.add(token);
  if (utilityKind === "draw_corp_cards_then_shuffle_hq_card_into_rd")
    for (const token of [
      "draw_cards",
      "shuffle_hq_to_rd",
      "double_action_cost",
    ])
      mechanics.add(token);
  if (utilityKind === "corp_archives_to_hq")
    for (const token of ["archives_to_hq", "reveal", "double_action_cost"])
      mechanics.add(token);
  if (utilityKind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
    for (const token of [
      "corp_start_turn",
      "random_die_resolution",
      "add_tags",
      "run_attempt_count",
    ])
      mechanics.add(token);
  if (utilityKind === "corp_draw_extra_then_bottom_one")
    for (const token of ["corp_draw_replacement", "extra_draw", "bottom_rd"])
      mechanics.add(token);
  if (utilityKind === "run_start_lose_runner_credits_per_tag")
    for (const token of ["run_start_tax", "runner_tags", "same_fort"])
      mechanics.add(token);
  if (utilityKind === "start_run_redirect_to_source_fort")
    mechanics.add("start_run_redirect_to_source_fort");
  if (
    engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
    engine.relativeIce.dynamicDamageSubroutine !== undefined
  )
    mechanics.add("corp_ice.outer_ice_scaling");
  if (
    engine.variableRez?.kind === "alternate_subtype" &&
    engine.variableRez.alternateSubtypes.includes("wall")
  )
    mechanics.add("alternate_subtype_wall");
  if (engine.runnerRunStrengthBoost !== undefined)
    mechanics.add("temporary_strength_bonus");
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "make_run_each_data_fort_sequence")
        for (const token of [
          "make_run_each_data_fort_sequence",
          "forgo_next_action_on_failed_sequence",
        ])
          mechanics.add(token);
      if (
        effect.kind === "make_run" &&
        effect.badPublicityRunAftermath !== undefined
      )
        mechanics.add("subtype_bad_publicity");
    }
  if (
    engine.runnerEventLongtail?.kind ===
    "search_stack_install_program_free_then_run_return_or_penalty"
  )
    for (const token of [
      "search_stack_install",
      "temporary_program_install_run",
    ])
      mechanics.add(token);
  for (const followup of engine.successfulRunFollowups ?? []) {
    mechanics.add("successful_run_trigger");
    if (followup.kind === "optional_make_run_after_successful_run")
      mechanics.add("make_run");
    if (
      followup.kind ===
      "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count"
    )
      for (const token of ["shuffle_grip_into_stack", "draw_cards"])
        mechanics.add(token);
  }

  for (const access of engine.accessEffects ?? []) {
    mechanics.add("access_effect");
    if (access.condition?.kind === "runner_tags_at_least")
      mechanics.add("runner_tags_at_least");
    for (const effect of access.effects) {
      if (
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner"
      )
        for (const token of [
          "trash_installed_corp_cards",
          "net_damage",
          "tap_source",
        ])
          mechanics.add(token);
      if (effect.kind === "trash_installed_runner_hardware_and_programs")
        for (const token of ["trash_hardware", "trash_programs"])
          mechanics.add(token);
    }
  }

  const breakAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  const pumpAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (breakAbility?.kind === "break_subroutine") {
    mechanics.add("pump_icebreaker_strength");
    if (breakAbility.matches.kind === "any")
      mechanics.add("break_any_subroutine");
    if (breakAbility.matches.kind === "ice_subtype")
      mechanics.add(
        `break_${breakerCoverageForSubtype(breakAbility.matches.subtype)}_subroutine`,
      );
    if (
      breakAbility.special?.kind ===
      "once_per_run_break_tag_and_all_stealth_loss"
    )
      for (const token of ["tag_self", "stealth_credit_loss"])
        mechanics.add(token);
    if (breakAbility.special?.kind === "run_end_trash_source_if_used")
      mechanics.add("run_end_self_trash");
    if (breakAbility.special?.kind === "run_start_random_strength_bonus")
      mechanics.add("run_start_random_strength_bonus");
  }
  if (
    pumpAbility?.kind === "increase_strength" &&
    pumpAbility.duration === "current_turn"
  )
    mechanics.add("run_duration_strength");

  const runnerUtilityKind = engine.runnerUtilityLongtail?.kind;
  if (runnerUtilityKind === "hq_access_expose_all_installed_corp_cards")
    for (const token of ["hq_access_trigger", "expose_installed_corp_cards"])
      mechanics.add(token);
  if (
    runnerUtilityKind === "derez_fully_broken_passed_ice" ||
    runnerUtilityKind === "derez_fully_broken_passed_ice_and_end_run"
  )
    for (const token of [
      "fully_break_ice_window",
      "derez_ice",
      "paid_tap_ability",
      "tap_source",
    ])
      mechanics.add(token);
  if (runnerUtilityKind === "derez_fully_broken_passed_ice_and_end_run")
    mechanics.add("end_run");
  if (runnerUtilityKind === "base_memory_equals_grip_count")
    mechanics.add("memory_limit_from_grip_size");
  if (runnerUtilityKind === "trace_attempts_auto_success_add_tag")
    for (const token of ["trace_attempt_modifier", "take_tag"])
      mechanics.add(token);
  if (runnerUtilityKind === "start_turn_random_effect_table")
    mechanics.add("random_start_turn_damage");
  if (runnerUtilityKind === "first_prep_credit_gain_bonus")
    mechanics.add("prep_credit_gain_bonus");

  for (const trigger of engine.lifecycle?.start_of_runner_turn ?? [])
    if (trigger.effects.some((effect) => effect.kind === "gain_credits"))
      mechanics.add("start_of_turn_credit");
  for (const effect of engine.lifecycle?.on_leave_play ?? []) {
    if (effect.kind === "lose_credits") mechanics.add("leave_play_credit_loss");
    if (effect.kind === "damage") mechanics.add("leave_play_damage");
  }

  const runnerEventKind = engine.runnerEventLongtail?.kind;
  if (runnerEventKind === "trash_grip_search_stack_to_grip_equal_count")
    for (const token of ["trash_grip", "search_stack", "shuffle_stack"])
      mechanics.add(token);
  if (runnerEventKind === "runner_corruption_agenda_point_transfer")
    for (const token of [
      "recent_stolen_agenda_gate",
      "score_area_transfer",
      "gain_credits",
      "take_tag",
    ])
      mechanics.add(token);
  if (runnerEventKind === "do_the_drine_unpreventable_core_damage_for_credits")
    for (const token of ["runner_choice", "brain_damage", "gain_credits"])
      mechanics.add(token);
  if (runnerEventKind === "three_dice_gain_credits")
    for (const token of ["random_die_resolution", "gain_credits"])
      mechanics.add(token);
  if (runnerEventKind === "library_search_run")
    for (const token of [
      "start_run",
      "successful_run_bonus_access",
      "no_noisy_icebreaker_or_trace_condition",
    ])
      mechanics.add(token);

  if (engine.hardwareDeck === true) mechanics.add("deck_unique_replacement");
  if (engine.unique !== undefined && cardType === "resource")
    mechanics.add("unique_resource");
  if (engine.restrictedHostedCreditSource !== undefined) {
    for (const token of ["restricted_credit_pool", "hosted_counters"])
      mechanics.add(token);
    if (engine.restrictedHostedCreditSource.usableFor.includes("play_events"))
      mechanics.add("play_event_payment");
    if (engine.restrictedHostedCreditSource.usableFor.includes("increase_link"))
      mechanics.add("trace_link_payment");
  }
  if (engine.damagePreventionSources !== undefined)
    mechanics.add("damage_prevention_turn_limit");
  for (const source of engine.tagPreventionSources ?? []) {
    mechanics.add("prevent_tag");
    mechanics.add("credit_cost");
    mechanics.add(
      source.cost.kind === "credit_and_forgo_next_action"
        ? "future_action_debt"
        : "trash_source",
    );
  }
  return [...mechanics].sort();
}

function hasGenericOnPlayEffect(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.planning.engine.abilities?.some(
      (ability) =>
        ability.kind === "on_play" &&
        ability.effects?.some((effect) =>
          ["gain_credits", "draw_cards", "make_run", "lose_credits"].includes(
            effect.kind,
          ),
        ),
    ) === true
  );
}

function isSimpleBreaker(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.planning.engine.icebreakerAbilities !== undefined &&
    entry.planning.engine.installTargetBinding === undefined &&
    entry.planning.engine.icebreakerEncounterStrengthBonus === undefined &&
    entry.planning.engine.icebreakerSubtypeChange === undefined
  );
}

function isSimplePrintedIce(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.planning.engine.printedSubroutines !== undefined &&
    entry.planning.engine.variableRez === undefined
  );
}

function isPlainRemoteValueUpgrade(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.definition.type === "upgrade" &&
    entry.planning.engine.fortRunWindows === undefined &&
    (!usesClosedExtendedMechanicalProfile(entry) ||
      entry.planning.engine.accessEffects === undefined) &&
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "value_interpretation" &&
        annotation.axis === "remote_root_value",
    ) === true
  );
}

function usesGenericCompatibilityMechanics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  return (
    entry.definition.type === "identity" ||
    (entry.definition.type === "agenda" &&
      entry.planning.engine.scoredAgenda === undefined) ||
    entry.planning.engine.characteristics.memoryLimitBonus !== undefined ||
    entry.planning.engine.corpRootRezCreditOutcome !== undefined ||
    isPlainRemoteValueUpgrade(entry) ||
    hasGenericOnPlayEffect(entry) ||
    isSimpleBreaker(entry) ||
    isSimplePrintedIce(entry)
  );
}

function usesExtendedMechanicalSemantics(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): boolean {
  const engine = entry.planning.engine;
  return (
    engine.agendaAccessReplacement !== undefined ||
    engine.corpUtility !== undefined ||
    engine.damagePreventionSources !== undefined ||
    engine.flatlineReplacementSources !== undefined ||
    engine.hardwareDeck !== undefined ||
    engine.hostedProgramCapacity !== undefined ||
    engine.iceEncounter !== undefined ||
    engine.relativeIce !== undefined ||
    engine.restrictedHostedCreditSource !== undefined ||
    engine.runnerCounterEffects !== undefined ||
    engine.runnerEventLongtail !== undefined ||
    engine.runnerEventTargetedEffect !== undefined ||
    engine.runnerRunStrengthBoost !== undefined ||
    engine.runnerUtilityLongtail !== undefined ||
    engine.selfRezAdditionalCosts !== undefined ||
    engine.selfRezCostModifiers !== undefined ||
    engine.selfRezWindows !== undefined ||
    engine.selfStealCosts !== undefined ||
    engine.successfulRunFollowups !== undefined ||
    engine.tagPreventionSources !== undefined ||
    engine.trashPreventionSources !== undefined ||
    engine.unique !== undefined ||
    engine.uniqueDirectLongtail !== undefined ||
    engine.virusCounter !== undefined ||
    engine.characteristics.subtypes.includes("region") ||
    entry.planning.planningAnnotations?.card?.some(
      (annotation) =>
        annotation.kind === "tactic_interpretation" &&
        annotation.use === "coverage.breaker",
    ) === true ||
    engine.modifiers?.some((modifier) =>
      [
        "break_subroutine_cost",
        "break_ability_use_cost",
        "hand_size",
        "memory_units",
      ].includes(modifier.kind),
    ) === true ||
    engine.printedSubroutines?.some((subroutine) =>
      [
        "random_damage",
        "trace",
        "prohibit_break_next_ice",
        "trash_program",
        "deflect_run",
        "end_the_run_and_trash_source_at_end_of_turn",
      ].includes(subroutine.kind),
    ) === true ||
    engine.icebreakerAbilities?.some(
      (ability) =>
        (ability.kind === "break_subroutine" &&
          ability.special !== undefined) ||
        (ability.kind === "increase_strength" &&
          ability.duration === "current_turn"),
    ) === true ||
    engine.abilities?.some(
      (ability) =>
        (Array.isArray(ability.costs) &&
          ability.costs.some(
            (cost) => cost.kind === "action" && cost.amount > 1,
          )) ||
        ability.effects?.some(
          (effect) =>
            ![
              "gain_credits",
              "draw_cards",
              "make_run",
              "lose_credits",
            ].includes(effect.kind),
        ),
    ) === true
  );
}

function hasExtendedHintFamily(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): boolean {
  return (
    engine.agendaAccessReplacement !== undefined ||
    engine.corpUtility !== undefined ||
    engine.damagePreventionSources !== undefined ||
    engine.hardwareDeck !== undefined ||
    engine.restrictedHostedCreditSource !== undefined ||
    engine.runnerCounterEffects !== undefined ||
    engine.runnerEventLongtail !== undefined ||
    engine.runnerUtilityLongtail !== undefined ||
    engine.selfRezAdditionalCosts !== undefined ||
    engine.selfRezCostModifiers !== undefined ||
    engine.successfulRunFollowups !== undefined ||
    engine.tagPreventionSources !== undefined ||
    engine.unique !== undefined
  );
}

function deriveAiSupportEvidence(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): {
  status: AiCardHint["aiSupportStatus"];
  quality: NonNullable<AiCardHint["quality"]>;
  scenarioRefs: string[];
} {
  const scenario = aiSupportScenarioData.scenarios.find(
    (candidate) => candidate.id === "active_card_support_ai_supported",
  );
  if (
    aiSupportScenarioData.status !== "ai_supported" ||
    scenario === undefined ||
    !scenario.coversCards.includes(entry.definition.id)
  )
    throw new Error(
      `card_spec_ai_support_scenario_evidence_missing: ${entry.definition.id}`,
    );
  const confidence = highestStrategySupportConfidence(
    entry.planning.planningAnnotations?.card ?? [],
  );
  return {
    status: "ai_supported",
    quality: {
      hintReviewed: true,
      needsHumanReview: false,
      strategyCovered: confidence !== undefined,
      ...(confidence === undefined ? {} : { confidence }),
    },
    scenarioRefs: [
      `data/scenarios/card-support-ai-supported-current.json#${scenario.id}`,
    ],
  };
}

function highestStrategySupportConfidence(
  annotations: readonly PlanningInterpretation[],
): "low" | "medium" | "high" | undefined {
  const rank = { low: 0, medium: 1, high: 2 } as const;
  return annotations.reduce<"low" | "medium" | "high" | undefined>(
    (highest, annotation) =>
      annotation.kind === "strategy_support" &&
      (highest === undefined || rank[annotation.confidence] > rank[highest])
        ? annotation.confidence
        : highest,
    undefined,
  );
}

function deriveRoles(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const roles = new Set<string>();
  const engine = entry.planning.engine;
  const cardType = entry.definition.type;
  if (cardType === "identity") {
    roles.add(`${entry.definition.side}_identity`);
    roles.add("setup");
  }
  if (
    cardType === "agenda" &&
    engine.scoredAgenda === undefined &&
    engine.agendaAccessReplacement === undefined
  ) {
    roles.add("agenda");
    roles.add("score_plan");
    if (entry.definition.agendaPoints !== undefined)
      roles.add(`agenda_${entry.definition.agendaPoints}pt`);
    roles.add("no_ability_agenda");
  }
  if (
    cardType === "hardware" &&
    engine.characteristics.memoryLimitBonus &&
    !usesExtendedMechanicalSemantics(entry)
  ) {
    roles.add("memory");
    roles.add("setup");
  }
  if (cardType === "upgrade" && isPlainRemoteValueUpgrade(entry)) {
    roles.add("remote_support");
    roles.add("upgrade");
  }
  if (engine.corpRootRezCreditOutcome !== undefined) {
    roles.add("asset_trash_target");
    roles.add("economy_asset");
  }
  if (
    engine.hiddenReplacementLongtail?.kind ===
    "delayed_install_with_counter_countdown"
  ) {
    if (engine.hiddenReplacementLongtail.visibility !== "hidden_info_barrier")
      throw new Error("card_spec_unknown_delayed_install_countdown_shape");
    roles.add("delayed_install");
  }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits") {
        roles.add("economy");
        roles.add(cardType);
        if (cardType === "operation") roles.add("economy_operation");
      }
      if (effect.kind === "draw_cards") {
        roles.add("draw");
        roles.add(cardType);
        if (cardType === "operation") roles.add("draw_operation");
      }
      if (effect.kind === "make_run") {
        roles.add(cardType);
        roles.add("run_pressure");
        if ((effect.successfulRunRunnerCreditGain ?? 0) >= 3)
          roles.add("economy");
      }
      if (
        effect.kind === "lose_credits" &&
        ability.condition?.kind === "runner_is_tagged"
      )
        roles.add("tag_punishment");
      if (effect.kind === "add_current_run_access_count") {
        const additionalAccess = closedCurrentRunAdditionalAccess(entry);
        if (!additionalAccess)
          throw new Error(
            "card_spec_unknown_current_run_additional_access_shape",
          );
        roles.add("hidden_zone_tool");
        roles.add("resource");
        roles.add(
          additionalAccess.server === "rd" ? "rd_multiaccess" : "multiaccess",
        );
      }
    }
  if (entry.planning.engine.icebreakerAbilities !== undefined) {
    roles.add("icebreaker");
    roles.add("program");
  }
  const breaker = entry.planning.engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breaker?.kind === "break_subroutine") {
    const coveredSubtypes =
      breaker.matches.kind === "ice_subtype"
        ? [breaker.matches.subtype]
        : breaker.matches.kind === "selected_ice_subtype"
          ? entry.planning.engine.installTargetBinding?.kind ===
            "choose_icebreaker_subtype_on_install"
            ? (entry.planning.engine.installTargetBinding.choices ?? [])
            : []
          : [];
    for (const subtype of coveredSubtypes) {
      const coverage = breakerCoverageForSubtype(subtype);
      if (coverage === "code_gate") roles.add("breaker_decoder");
      if (coverage === "sentry") roles.add("breaker_killer");
      if (coverage === "wall") roles.add("breaker_fracter");
    }
  }
  if (isSimpleBreaker(entry)) {
    const breakAbility = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "break_subroutine",
    );
    const pumpAbility = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "increase_strength",
    );
    if (
      breakAbility?.kind === "break_subroutine" &&
      pumpAbility?.kind === "increase_strength" &&
      breakAbility.cost.amount <= 1 &&
      pumpAbility.cost.amount <= 1 &&
      breakAbility.special === undefined
    )
      roles.add("efficient_breaker");
  }
  for (const modifier of entry.planning.engine.modifiers ?? [])
    if (modifier.kind === "rez_cost" || modifier.kind === "ice_strength") {
      roles.add("ice_modifier");
      if (entry.definition.side === "corp") {
        roles.add("economy_asset");
        roles.add("remote_support");
      } else if (entry.definition.type === "program") {
        roles.add("program");
      }
    }
  for (const access of entry.planning.engine.accessEffects ?? []) {
    for (const effect of access.effects)
      if (
        effect.kind === "damage" ||
        effect.kind === "damage_from_source_advancement_counters"
      ) {
        roles.add("ambush");
        roles.add(hintDamageResource(effect.damageType));
      }
    if (access.visibility === "hidden_info_barrier") roles.add("hidden_zone");
  }
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "add_hosted_credits" ||
          effect.kind === "take_hosted_credits",
      ),
    )
  )
    roles.add("economy");
  if (lifecycleHasCreditEffect(entry.planning.engine.lifecycle))
    for (const role of ["economy", "resource"]) roles.add(role);
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "choose_stack_or_trash_program_install",
      ),
    )
  ) {
    roles.add("hidden_zone_tool");
    roles.add("temporary_program_install");
  }
  for (const subroutine of entry.planning.engine.printedSubroutines ?? []) {
    roles.add("ice");
    if (subroutine.kind === "damage") roles.add("damage_ice");
    if (subroutine.kind === "end_the_run") roles.add("etr_ice");
    if (subroutine.kind === "give_runner_tag") roles.add("tag_ice");
    if (
      subroutine.kind === "runner_lose_credits" ||
      (subroutine.kind === "corp_gain_credit" && subroutine.amount >= 2)
    )
      roles.add("taxing_ice");
  }
  if (entry.definition.subtypes.includes("barrier")) roles.add("barrier_ice");
  if (entry.definition.subtypes.includes("code_gate"))
    roles.add("code_gate_ice");
  if (
    entry.planning.engine.printedSubroutines !== undefined &&
    entry.definition.subtypes.includes("sentry")
  )
    roles.add("sentry_ice");
  if (
    entry.planning.engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  )
    for (const role of ["corp", "agenda", "per_card_longtail"]) roles.add(role);
  if (
    entry.planning.engine.fortRunWindows?.some(
      (window) => window.kind === "server_run_start_restriction",
    ) === true
  )
    for (const role of ["upgrade", "advance", "agenda"]) roles.add(role);
  if (
    entry.planning.engine.fortRunWindows?.some(
      (window) => window.kind === "discounted_rez_ice_on_this_fort",
    ) === true
  )
    roles.add("run_defense");
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "add_hosted_credits" ||
          effect.kind === "take_hosted_credits",
      ),
    )
  )
    for (const role of ["economy", "resource"]) roles.add(role);
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (
      hasExtendedHintFamily(engine) &&
      (cardType === "asset" ||
        cardType === "event" ||
        cardType === "operation" ||
        cardType === "hardware" ||
        cardType === "program" ||
        cardType === "resource")
    )
      roles.add(cardType);
  }
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (cardType === "agenda") roles.add("agenda");
    if (engine.scoredAgenda?.kind === "add_counters_on_score")
      for (const role of ["advanceable", "run_defense", "counter"])
        roles.add(role);
    if (
      engine.scoredAgenda?.kind ===
      "purge_runner_virus_counters_and_prevent_next"
    )
      roles.add("virus");
    if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
      roles.add("draw");
    if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
      for (const role of ["access_replacement", "runner_program"])
        roles.add(role);
    if (
      engine.successfulRunFollowups?.some(
        (followup) =>
          followup.kind ===
          "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count",
      )
    )
      roles.add("remote_support");
    if (
      engine.successfulRunFollowups?.some(
        (followup) =>
          followup.kind === "optional_make_run_after_successful_run",
      )
    )
      roles.add("run_support");
    if (
      engine.corpUtility?.kind ===
      "runner_memory_limit_modifier_until_end_of_turn"
    )
      for (const role of [
        "memory_pressure",
        "program_trash",
        "tag_punishment_operation",
      ])
        roles.add(role);
    if (engine.corpUtility?.kind === "corp_archives_to_hq")
      roles.add("ice_recovery");
    if (
      engine.corpUtility?.kind ===
      "corp_start_turn_tag_roll_per_runner_run_last_turn"
    )
      roles.add("tag_punishment");
    if (engine.corpUtility?.kind === "run_start_lose_runner_credits_per_tag")
      roles.add("tag_punishment");
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind ===
            "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
        ),
      )
    )
      for (const role of ["ambush", "net_damage"]) roles.add(role);
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind === "trash_installed_runner_hardware_and_programs",
        ),
      )
    )
      for (const role of ["ambush", "tag_punishment"]) roles.add(role);
    if (engine.hardwareDeck === true) roles.add("deck");
    if (engine.tagPreventionSources !== undefined) roles.add("tag_prevention");
    if (engine.damagePreventionSources !== undefined)
      roles.add("damage_prevention");
    for (const subroutine of engine.printedSubroutines ?? []) {
      if (
        subroutine.kind === "damage" ||
        subroutine.kind === "random_damage" ||
        (subroutine.kind === "trace" &&
          subroutine.onSuccess.some(
            (outcome) =>
              outcome.kind === "preventable_damage" ||
              outcome.kind === "unpreventable_meat_damage",
          ))
      )
        roles.add("damage");
      if (subroutine.kind === "random_damage") roles.add("core_damage_ice");
      if (subroutine.kind === "prohibit_break_next_ice")
        roles.add("run_lock_ice");
      if (subroutine.kind === "trash_program") roles.add("program_trash_ice");
      if (subroutine.kind === "deflect_run") roles.add("taxing_ice");
      if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn") {
        roles.add("etr_ice");
        roles.add("taxing_ice");
      }
    }
    if (
      engine.printedSubroutines !== undefined &&
      entry.definition.subtypes.includes("ap")
    )
      roles.add("ap_ice");
    if (
      engine.printedSubroutines !== undefined &&
      entry.definition.subtypes.includes("wall")
    )
      roles.add("barrier_ice");
    if (
      (engine.printedSubroutines ?? []).filter(
        (subroutine) => subroutine.kind === "end_the_run",
      ).length > 1
    )
      roles.add("taxing_ice");
    const breakerRoleAbility = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "break_subroutine",
    );
    if (breakerRoleAbility?.kind === "break_subroutine") {
      if (breakerRoleAbility.matches.kind === "any") {
        roles.add("universal_breaker");
      }
      if (breakerRoleAbility.special?.kind === "run_end_trash_source_if_used")
        roles.add("self_trash");
      if (
        breakerRoleAbility.special?.kind ===
        "once_per_run_break_tag_and_all_stealth_loss"
      )
        roles.add("noisy");
    }
    if (engine.unique !== undefined && cardType !== "resource")
      roles.add("unique");
    if (
      engine.scoredAgenda?.kind ===
      "purge_runner_virus_counters_and_prevent_next"
    )
      roles.add("virus");
    if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
      roles.add("draw");
    if (
      engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd"
    )
      roles.add("draw_operation");
    if (engine.accessEffects?.some((access) => access.effects.length > 0))
      for (const role of ["ambush", "upgrade"]) roles.add(role);
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind ===
            "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
        ),
      )
    )
      roles.add("net_damage");
    if (
      engine.accessEffects?.some((access) =>
        access.effects.some(
          (effect) =>
            effect.kind === "trash_installed_runner_hardware_and_programs",
        ),
      )
    )
      roles.add("tag_punishment");
    const runnerUtility = engine.runnerUtilityLongtail?.kind;
    if (runnerUtility === "hq_access_expose_all_installed_corp_cards")
      for (const role of ["expose", "hq_access"]) roles.add(role);
    if (runnerUtility === "derez_fully_broken_passed_ice")
      for (const role of ["derez", "fully_broken_ice"]) roles.add(role);
    if (runnerUtility === "base_memory_equals_grip_count")
      for (const role of ["memory", "setup"]) roles.add(role);
    if (runnerUtility === "trace_attempts_auto_success_add_tag")
      for (const role of ["economy", "tag_self", "trace"]) roles.add(role);
    if (runnerUtility === "first_prep_credit_gain_bonus") roles.add("economy");
    const runnerEvent = engine.runnerEventLongtail?.kind;
    if (runnerEvent === "trash_grip_search_stack_to_grip_equal_count")
      for (const role of ["stack_search", "setup"]) roles.add(role);
    if (runnerEvent === "runner_corruption_agenda_point_transfer")
      for (const role of [
        "agenda_steal_followup",
        "high_risk_economy",
        "tag_self",
      ])
        roles.add(role);
    if (runnerEvent === "do_the_drine_unpreventable_core_damage_for_credits")
      for (const role of [
        "brain_damage_economy",
        "high_risk_economy",
        "choice",
      ])
        roles.add(role);
    if (runnerEvent === "three_dice_gain_credits")
      for (const role of ["economy", "deterministic_random"]) roles.add(role);
    if (runnerEvent === "library_search_run")
      for (const role of [
        "multiaccess",
        "run_event",
        "hq_pressure",
        "rd_pressure",
      ])
        roles.add(role);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "make_run"),
      )
    ) {
      for (const ability of engine.abilities)
        for (const effect of ability.effects ?? []) {
          if (
            effect.kind !== "make_run" ||
            effect.successfulRunAccessReplacement === undefined
          )
            continue;
          roles.add("access_replacement");
          if (effect.target.kind === "central_server")
            roles.add(
              effect.target.server === "rd"
                ? "rd_pressure"
                : `${effect.target.server}_pressure`,
            );
          const replacement = effect.successfulRunAccessReplacement;
          if (replacement === "reveal_rd_until_agenda_store_in_hq")
            for (const role of ["rd_access_replacement", "agenda_pressure"])
              roles.add(role);
          if (
            replacement === "corp_lose_credits" ||
            replacement === "runner_spend_corp_lose_credits"
          )
            roles.add("corp_credit_denial");
          if (replacement === "private_look_top_rd") roles.add("topdeck_info");
          if (replacement === "archives_faceup_to_rd")
            roles.add("archives_recovery");
          if (replacement === "trash_rezzed_ice_on_fort_and_tag_runner")
            roles.add("ice_trash");
          if (replacement === "runner_gain_agenda_point")
            roles.add("agenda_pressure");
        }
      if (
        engine.abilities.some((ability) =>
          ability.effects?.some(
            (effect) =>
              effect.kind === "make_run" &&
              effect.corpRezCostSurcharge !== undefined,
          ),
        )
      )
        for (const role of ["rez_tax", "run_event"]) roles.add(role);
      roles.delete("run_pressure");
    }
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "remove_tags"),
      )
    )
      roles.add("tag_removal");
    if (engine.hardwareDeck === true) roles.add("memory");
    if (
      engine.restrictedHostedCreditSource?.usableFor.includes(
        "using_icebreaker_during_run",
      )
    ) {
      roles.add("run_support");
      roles.add("recurring_credit");
    }
    if (
      engine.restrictedHostedCreditSource?.usableFor.length === 1 &&
      engine.restrictedHostedCreditSource.usableFor[0] === "increase_link"
    )
      for (const role of entry.definition.subtypes.includes("connection")
        ? ["connection", "economy", "link"]
        : ["link"])
        roles.add(role);
    if (
      engine.restrictedHostedCreditSource?.usableFor.includes("play_events")
    ) {
      roles.add("economy");
      roles.add("event_credit_host");
    }
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "private_look"),
      )
    )
      for (const role of [
        "resource",
        engine.abilities.some((ability) =>
          ability.effects?.some(
            (effect) => effect.kind === "private_look" && effect.zone === "hq",
          ),
        )
          ? "hq_access"
          : "rd_run_reward",
      ])
        roles.add(role);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "transfer_hosted_credits",
        ),
      )
    )
      for (const role of ["asset", "economy", "hosting"]) roles.add(role);
  }
  return [...roles];
}

function deriveRiskTags(
  annotations: readonly PlanningInterpretation[],
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const risks = annotations.flatMap((annotation) =>
    annotation.kind === "risk_interpretation" ? [annotation.risk] : [],
  );
  if (
    entry.definition.type === "agenda" &&
    entry.planning.engine.scoredAgenda === undefined
  )
    risks.push("hidden_until_score_or_access");
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "make_run"),
    )
  )
    risks.push("run");
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "draw_cards"),
    )
  )
    risks.push("hidden_zone_change");
  if (isSimpleBreaker(entry)) risks.push("encounter");
  if (entry.definition.type === "hardware") risks.push("install_runner");
  if (
    entry.planning.engine.corpRootRezCreditOutcome !== undefined ||
    isPlainRemoteValueUpgrade(entry)
  )
    risks.push("hidden_root");
  if (isSimplePrintedIce(entry)) risks.push("hidden_ice");
  if (
    entry.planning.engine.printedSubroutines?.some(
      (subroutine) => subroutine.kind === "give_runner_tag",
    ) ||
    entry.planning.engine.abilities?.some(
      (ability) => ability.condition?.kind === "runner_is_tagged",
    )
  )
    risks.push("tag");
  if (hasHiddenInfoBarrier(entry.planning.engine))
    risks.push("hidden_info_barrier");
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    risks.push("resource_trash_if_tagged");
  if (
    entry.planning.engine.lifecycle?.on_install?.some(
      (effect) => effect.kind === "gain_credits",
    )
  )
    risks.push("credit_swing");
  if (
    entry.planning.engine.lifecycle?.on_leave_play?.some(
      (effect) => effect.kind === "pay_credits_or_lose_game",
    )
  )
    risks.push("leave_play_penalty");
  if (
    entry.planning.engine.scoredAgenda?.kind ===
    "score_credit_swing_if_corp_credit_threshold_met"
  )
    risks.push("credit_threshold", "credit_swing", "economy_crash_on_score");
  if (
    entry.planning.engine.uniqueDirectLongtail?.kind === "tagged_meat_damage" ||
    entry.planning.engine.uniqueDirectLongtail?.kind ===
      "tag_threshold_meat_damage_asset"
  )
    risks.push("tag", "damage_window", "flatline_pressure");
  if (
    entry.planning.engine.uniqueDirectLongtail?.kind ===
    "rezzed_leave_action_gain_asset"
  )
    risks.push("loss_condition");
  if (
    entry.planning.engine.lifecycle?.on_runner_run_start?.some((trigger) =>
      trigger.effects.some((effect) => effect.kind === "trash_source"),
    )
  )
    risks.push("run_ends_economy_source");
  if (
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "choose_stack_or_trash_program_install",
      ),
    )
  )
    risks.push("temporary_install");
  if ((entry.planning.engine.accessEffects?.length ?? 0) > 0)
    risks.push("access_window");
  if (
    entry.planning.engine.accessEffects?.some((access) =>
      access.effects.some(
        (effect) =>
          effect.kind === "damage" ||
          effect.kind === "damage_from_source_advancement_counters",
      ),
    )
  )
    risks.push("damage_window");
  if (
    entry.planning.engine.accessEffects?.some(
      (access) =>
        access.visibility === "hidden_info_barrier" ||
        access.effects.some(
          (effect) => effect.visibility === "hidden_info_barrier",
        ),
    )
  )
    risks.push("hidden_zone_barrier");
  if (usesClosedExtendedMechanicalProfile(entry))
    risks.push(...deriveClosedExtendedRiskTags(entry));
  return [...new Set(risks)];
}

function deriveClosedExtendedRiskTags(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const risks = new Set<string>();
  if (engine.scoredAgenda?.kind === "add_counters_on_score")
    for (const risk of ["public_counter", "scored_counter", "single_use"])
      risks.add(risk);
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    for (const risk of ["virus_meta", "temporary_prevention"]) risks.add(risk);
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    risks.add("start_turn_trigger");
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    for (const risk of [
      "access_replacement",
      "memory_pressure_for_runner",
      "remove_from_game",
      "runner_can_score_later",
    ])
      risks.add(risk);

  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage" && subroutine.damageType === "net")
      risks.add("ap_damage");
    if (subroutine.kind === "trace") risks.add("trace");
    if (subroutine.kind === "prohibit_break_next_ice")
      risks.add("next_encounter_lock");
    if (subroutine.kind === "random_damage")
      for (const risk of ["deterministic_random", "core_damage"])
        risks.add(risk);
    if (subroutine.kind === "trash_program") risks.add("program_trash");
    if (subroutine.kind === "deflect_run") {
      risks.add("run_redirect");
      risks.add("target_fort_choice");
      if (subroutine.cost !== undefined) risks.add("corp_credit_cost");
    }
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      for (const risk of ["self_trash", "turn_end_delayed_effect"])
        risks.add(risk);
  }
  if (engine.selfRezCostModifiers !== undefined) risks.add("noisy_discount");
  if (engine.runnerCounterEffects !== undefined) risks.add("runner_counter");
  for (const install of engine.installCapabilities ?? []) {
    risks.add("install_restriction");
    if (install.kind === "install_not_on_archives")
      risks.add("archives_only_target");
    if (install.kind === "install_only_inside_subsidiary_data_fort")
      risks.add("subsidiary_target_only");
  }
  if (engine.selfRezAdditionalCosts !== undefined)
    risks.add("agenda_point_cost");
  for (const window of engine.fortRunWindows ?? []) {
    if (
      window.kind === "move_self_to_different_position_on_same_fort" ||
      window.kind === "move_self_to_outermost_position_on_other_fort"
    )
      risks.add("start_run_reposition");
    if (
      window.kind === "corp_return_passed_ice_to_hq" &&
      window.mode === "required_pay_or_return"
    )
      risks.add("self_bounce_or_maintenance_cost");
  }
  if (engine.iceEncounter?.kind === "roll_die_strength_or_derez_auto_pass")
    for (const risk of [
      "deterministic_random",
      "self_derez",
      "automatic_pass_failure",
    ])
      risks.add(risk);

  const utility = engine.corpUtility?.kind;
  if (utility === "runner_memory_limit_modifier_until_end_of_turn")
    for (const risk of ["memory_pressure", "program_trash", "tag_condition"])
      risks.add(risk);
  if (utility === "draw_corp_cards_then_shuffle_hq_card_into_rd")
    for (const risk of ["double_action", "hq_card_selection", "hidden_zone"])
      risks.add(risk);
  if (utility === "corp_archives_to_hq")
    for (const risk of [
      "archives_dependency",
      "double_action",
      "reveal_to_runner",
    ])
      risks.add(risk);
  if (utility === "corp_start_turn_tag_roll_per_runner_run_last_turn")
    for (const risk of ["tag", "random_effect"]) risks.add(risk);
  if (utility === "corp_draw_extra_then_bottom_one")
    for (const risk of ["hidden_zone", "draw_replacement", "unique"])
      risks.add(risk);
  if (utility === "run_start_lose_runner_credits_per_tag")
    for (const risk of ["run_cost_modifier", "tag_synergy"]) risks.add(risk);
  for (const followup of engine.successfulRunFollowups ?? []) {
    risks.add("successful_run");
    if (followup.kind === "skip_rd_access_add_purgeable_runner_virus_counter")
      risks.add("access_replacement");
    if (followup.visibility === "hidden_info_barrier") risks.add("hidden_zone");
  }
  if (
    engine.virusCounter?.onCorpInstall?.kind ===
    "roll_per_counter_trash_installed_card_and_remove_counter_on_success"
  )
    for (const risk of ["deterministic_random", "random_effect"])
      risks.add(risk);
  if (engine.characteristics.subtypes.includes("region"))
    for (const risk of ["run_cost_modifier", "region"]) risks.add(risk);

  for (const access of engine.accessEffects ?? []) {
    risks.add("hidden_zone");
    if (
      access.effects.some(
        (effect) =>
          effect.kind ===
          "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
      )
    )
      for (const risk of ["net_damage", "subsidiary_only"]) risks.add(risk);
    if (
      access.effects.some(
        (effect) =>
          effect.kind === "trash_installed_runner_hardware_and_programs",
      )
    )
      for (const risk of ["tag_threshold", "rig_trash"]) risks.add(risk);
  }
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "double_chosen_ice_strength_until_end_of_turn",
      ),
    )
  )
    for (const risk of ["targeted_ice", "temporary_modifier"]) risks.add(risk);

  const breaker = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  const pump = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (
    breaker?.kind === "break_subroutine" &&
    breaker.special?.kind === "once_per_run_break_tag_and_all_stealth_loss"
  )
    for (const risk of ["noisy", "tag_risk", "stealth_loss"]) risks.add(risk);
  if (pump?.kind === "increase_strength" && pump.duration === "current_turn")
    risks.add("run_duration_strength");
  if (
    breaker?.kind === "break_subroutine" &&
    breaker.special?.kind === "run_end_trash_source_if_used"
  )
    risks.add("self_trash");
  if (
    breaker?.kind === "break_subroutine" &&
    breaker.special?.kind === "blink_random_break_or_net_damage"
  )
    for (const risk of ["random_outcome", "net_damage"]) risks.add(risk);
  if (
    breaker?.kind === "break_subroutine" &&
    breaker.onSuccessfulBreak?.some(
      (effect) => effect.kind === "lose_bits_from_stealth_sources",
    )
  )
    risks.add("stealth_loss");

  const runnerUtility = engine.runnerUtilityLongtail?.kind;
  if (runnerUtility === "hq_access_expose_all_installed_corp_cards")
    risks.add("public_reveal");
  if (runnerUtility === "derez_fully_broken_passed_ice")
    for (const risk of ["timing_window", "tap_source"]) risks.add(risk);
  if (runnerUtility === "base_memory_equals_grip_count")
    for (const risk of ["dynamic_memory", "grip_size_dependency"])
      risks.add(risk);
  if (runnerUtility === "trace_attempts_auto_success_add_tag")
    for (const risk of ["trace_liability", "tag_self"]) risks.add(risk);
  if (runnerUtility === "trace_link_end_run_after_encounter")
    risks.add("run_ends_after_encounter");
  if (runnerUtility === "first_prep_credit_gain_bonus")
    risks.add("prep_dependency");
  if (runnerUtility === "start_turn_random_effect_table")
    for (const risk of [
      "deterministic_random",
      "brain_damage",
      "unpreventable_damage",
    ])
      risks.add(risk);

  const runnerEvent = engine.runnerEventLongtail?.kind;
  if (runnerEvent === "trash_grip_search_stack_to_grip_equal_count")
    for (const risk of [
      "grip_trash",
      "hidden_zone_projection",
      "high_opportunity_cost",
    ])
      risks.add(risk);
  if (runnerEvent === "runner_corruption_agenda_point_transfer")
    for (const risk of [
      "agenda_transfer",
      "conditional_play",
      "tag_self",
      "high_opportunity_cost",
    ])
      risks.add(risk);
  if (runnerEvent === "do_the_drine_unpreventable_core_damage_for_credits")
    for (const risk of [
      "brain_damage",
      "unpreventable_damage",
      "high_opportunity_cost",
    ])
      risks.add(risk);
  if (runnerEvent === "three_dice_gain_credits")
    risks.add("deterministic_random");
  if (runnerEvent === "library_search_run")
    for (const risk of [
      "conditional_access",
      "run_success_dependency",
      "noisy_breaker_restriction",
    ])
      risks.add(risk);

  for (const ability of engine.abilities ?? []) {
    if (additionalClickAmount(ability.costs) === 1) risks.add("double_action");
    for (const cost of Array.isArray(ability.costs) ? ability.costs : []) {
      if (cost.kind === "credit") risks.add("credit_cost");
      if (cost.kind === "tap_source" || cost.kind === "trash_source")
        risks.add("tap_source");
    }
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "make_run") risks.add("run_success_dependency");
      if (effect.kind === "make_run" && effect.successfulRunAccessReplacement) {
        risks.add("access_replacement");
        if (
          effect.successfulRunAccessReplacement === "private_look_top_rd" ||
          effect.successfulRunAccessReplacement ===
            "reveal_rd_until_agenda_store_in_hq"
        )
          for (const risk of ["hidden_zone", "rd_reveal"]) risks.add(risk);
      }
      if (effect.kind === "make_run" && effect.corpRezCostSurcharge)
        risks.add("run_cost_modifier");
      if (effect.kind === "remove_tags") risks.add("tag_clear_timing");
      if (effect.kind === "private_look") risks.add("hidden_zone");
    }
  }
  if (engine.unique !== undefined && entry.definition.type === "resource")
    risks.add("unique_resource");
  if (engine.hardwareDeck === true) risks.add("deck_unique");
  if (engine.restrictedHostedCreditSource !== undefined) {
    risks.add("restricted_credits");
    if (engine.restrictedHostedCreditSource.usableFor.includes("play_events"))
      risks.add("hosted_counters");
  }
  if (engine.damagePreventionSources !== undefined) risks.add("damage_window");
  for (const source of engine.tagPreventionSources ?? []) {
    if (source.cost.kind === "credit_and_forgo_next_action") {
      for (const risk of [
        "future_action_debt",
        "tag_prevention",
        "credit_cost",
      ])
        risks.add(risk);
    } else {
      for (const risk of ["tag_prevention", "credit_cost", "trash_source"])
        risks.add(risk);
    }
  }
  for (const effect of engine.lifecycle?.on_leave_play ?? []) {
    if (effect.kind === "lose_credits") risks.add("leave_play_credit_loss");
    if (effect.kind === "damage") risks.add("leave_play_damage");
  }
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "transfer_hosted_credits",
      ),
    )
  )
    for (const risk of ["runner_trash_value", "stored_credit_exposure"])
      risks.add(risk);
  return [...risks];
}

function lifecycleHasCreditEffect(
  lifecycle: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"]["lifecycle"],
): boolean {
  if (lifecycle === undefined) return false;
  return (
    lifecycle.on_install?.some((effect) => effect.kind === "gain_credits") ===
      true ||
    lifecycle.start_of_runner_turn?.some((entry) =>
      entry.effects.some((effect) => effect.kind === "lose_credits"),
    ) === true ||
    lifecycle.on_leave_play?.some(
      (effect) => effect.kind === "pay_credits_or_lose_game",
    ) === true
  );
}

function hasHiddenInfoBarrier(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): boolean {
  return (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "choose_stack_or_trash_program_install" &&
          effect.visibility === "hidden_info_barrier",
      ),
    ) === true ||
    engine.accessEffects?.some(
      (access) =>
        access.visibility === "hidden_info_barrier" ||
        access.effects.some(
          (effect) => effect.visibility === "hidden_info_barrier",
        ),
    ) === true ||
    engine.scoredAgenda?.visibility === "hidden_info_barrier"
  );
}

function deriveCostProfile(
  annotations: readonly PlanningInterpretation[],
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): AiCardHint["costProfile"] {
  if (usesClosedExtendedMechanicalProfile(entry))
    return applyStaticCardCosts(
      deriveClosedExtendedCostProfile(annotations, entry),
      entry,
    );
  const engine = entry.planning.engine;
  const opportunity = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "opportunity_cost",
  );
  const reserve = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "reserve_risk",
  );
  const clicks = engine.abilities?.some((ability) => ability.kind === "on_play")
    ? hasGenericOnPlayEffect(entry)
      ? undefined
      : 1
    : engine.abilities
        ?.flatMap((ability) =>
          Array.isArray(ability.costs) ? ability.costs : [],
        )
        .find((cost) => cost.kind === "action")?.amount;
  if (
    clicks === undefined &&
    opportunity === undefined &&
    reserve === undefined
  )
    return applyStaticCardCosts(undefined, entry);
  return applyStaticCardCosts(
    {
      ...(clicks === undefined ? {} : { clicks }),
      ...(opportunity?.kind === "risk_interpretation"
        ? { opportunityCost: opportunity.severity }
        : {}),
      ...(reserve?.kind === "risk_interpretation"
        ? { reserveRisk: reserve.severity }
        : {}),
    },
    entry,
  );
}

function applyStaticCardCosts(
  current: AiCardHint["costProfile"],
  entry: PlanningEntry,
): AiCardHint["costProfile"] {
  const result: NonNullable<AiCardHint["costProfile"]> = { ...(current ?? {}) };
  const characteristics = entry.planning.engine.characteristics;
  if (
    entry.definition.type === "event" ||
    entry.definition.type === "operation"
  ) {
    result.clicks = 1;
    if (characteristics.playCost?.kind === "fixed")
      result.credits = characteristics.playCost.credits;
  }
  if (
    entry.definition.type === "program" ||
    entry.definition.type === "hardware" ||
    entry.definition.type === "resource"
  ) {
    result.clicks = 1;
    if (characteristics.numeric.installCost !== null)
      result.credits = characteristics.numeric.installCost;
  }
  if (
    entry.definition.type === "asset" ||
    entry.definition.type === "ice" ||
    entry.definition.type === "upgrade"
  ) {
    if (characteristics.numeric.rezCost !== null)
      result.credits = characteristics.numeric.rezCost;
  }
  if (characteristics.numeric.memoryCost !== null)
    result.memory = characteristics.numeric.memoryCost;
  return Object.keys(result).length === 0 ? undefined : result;
}

function deriveClosedExtendedCostProfile(
  annotations: readonly PlanningInterpretation[],
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): AiCardHint["costProfile"] {
  const engine = entry.planning.engine;
  const result: NonNullable<AiCardHint["costProfile"]> = {};
  const opportunity = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "opportunity_cost",
  );
  const reserve = annotations.find(
    (annotation) =>
      annotation.kind === "risk_interpretation" &&
      annotation.risk === "reserve_risk",
  );
  if (opportunity?.kind === "risk_interpretation")
    result.opportunityCost = opportunity.severity;
  if (reserve?.kind === "risk_interpretation")
    result.reserveRisk = reserve.severity;

  const activatedAbilities = (engine.abilities ?? []).filter(
    (ability) => ability.kind === "activated",
  );
  const onPlayAbilities = (engine.abilities ?? []).filter(
    (ability) => ability.kind === "on_play",
  );
  const arrayCosts = (engine.abilities ?? []).flatMap((ability) =>
    Array.isArray(ability.costs) ? ability.costs : [],
  );
  const actionCost = arrayCosts.find((cost) => cost.kind === "action");
  const creditCost = arrayCosts.find((cost) => cost.kind === "credit");
  const counterCost = arrayCosts.find((cost) => cost.kind === "source_counter");
  const additionalClicks = (engine.abilities ?? [])
    .filter(
      (ability) => !Array.isArray(ability.costs) && ability.costs !== "printed",
    )
    .reduce(
      (maximum, ability) =>
        Math.max(maximum, additionalClickAmount(ability.costs)),
      0,
    );
  if (actionCost?.kind === "action") result.clicks = actionCost.amount;
  else if (onPlayAbilities.length > 0) result.clicks = 1 + additionalClicks;
  else if (activatedAbilities.length > 0 && entry.definition.side === "runner")
    result.clicks = 0;
  if (creditCost?.kind === "credit") result.credits = creditCost.amount;
  if (counterCost?.kind === "source_counter")
    result.counters = counterCost.amount;

  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    result.memory = engine.agendaAccessReplacement.memoryCost;
  if (engine.selfRezAdditionalCosts !== undefined)
    result.agendaPoints = engine.selfRezAdditionalCosts.reduce(
      (total, cost) => total + cost.amount,
      0,
    );
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      result.credits = window.cost.amount;
  for (const subroutine of engine.printedSubroutines ?? [])
    if (subroutine.kind === "deflect_run" && subroutine.cost !== undefined)
      result.credits = subroutine.cost.amount;

  if (
    engine.corpUtility !== undefined &&
    entry.definition.type === "operation"
  ) {
    result.clicks =
      engine.corpUtility.playCost?.kind === "printed"
        ? 1 + engine.corpUtility.playCost.additionalClicks
        : 1;
    if (engine.characteristics.playCost?.kind === "fixed")
      result.credits = engine.characteristics.playCost.credits;
  }
  const breaker = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breaker?.kind === "break_subroutine") {
    result.clicks = 0;
    result.credits = breaker.cost.amount;
    if (engine.characteristics.numeric.memoryCost !== null)
      result.memory = engine.characteristics.numeric.memoryCost;
  }
  if (engine.runnerEventLongtail !== undefined) result.clicks = 1;
  if (engine.hardwareDeck === true || entry.definition.type === "hardware") {
    result.clicks = 1;
    if (engine.characteristics.numeric.installCost !== null)
      result.credits = engine.characteristics.numeric.installCost;
  }
  if (entry.definition.type === "resource" && activatedAbilities.length === 0) {
    result.clicks = 1;
    if (engine.characteristics.numeric.installCost !== null)
      result.credits = engine.characteristics.numeric.installCost;
  }
  if (
    entry.definition.type === "resource" &&
    activatedAbilities.length > 0 &&
    creditCost === undefined &&
    engine.characteristics.numeric.installCost !== null
  )
    result.credits = engine.characteristics.numeric.installCost;
  if (
    entry.definition.type === "program" &&
    engine.icebreakerAbilities === undefined
  ) {
    result.clicks = 0;
    result.credits ??= 0;
    if (engine.characteristics.numeric.memoryCost !== null)
      result.memory = engine.characteristics.numeric.memoryCost;
  }
  if (engine.runnerUtilityLongtail?.kind === "derez_fully_broken_passed_ice") {
    delete result.credits;
    result.counters = 0;
  }
  return Object.keys(result).length === 0 ? undefined : result;
}

function deriveConditions(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["conditions"]> {
  const engine = entry.planning.engine;
  const conditions: NonNullable<AiCardHint["conditions"]> = [];
  if (
    engine.abilities?.some(
      (ability) => ability.condition?.kind === "source_has_hosted_credits",
    )
  )
    conditions.push({ kind: "requires_installed_resource" });
  if (
    engine.abilities?.some(
      (ability) => ability.condition?.kind === "runner_is_tagged",
    )
  )
    conditions.push({ kind: "requires_runner_tagged" });
  if (engine.lifecycle?.start_of_runner_turn !== undefined)
    conditions.push({ kind: "requires_start_of_turn" });
  if (engine.scoredAgenda !== undefined)
    conditions.push(
      { kind: "requires_score_window" },
      { kind: "requires_scored_agenda" },
    );
  for (const access of engine.accessEffects ?? []) {
    conditions.push({ kind: "requires_accessed_card" });
    if (access.effects.some((effect) => effect.kind === "trace"))
      conditions.push({ kind: "requires_trace_success" });
    if (
      access.effects.some(
        (effect) =>
          effect.kind === "damage_from_source_advancement_counters" ||
          (effect.kind === "trash_installed_runner_cards" &&
            typeof effect.amount === "object" &&
            effect.amount.kind === "source_advancement_counter_count"),
      )
    )
      conditions.push({ kind: "requires_advancement_counter" });
    if (access.sourceZones.includes("rd"))
      conditions.push({ kind: "requires_rnd_top" });
  }
  if (
    engine.modifiers?.some((modifier) =>
      [
        "install_cost",
        "rez_cost",
        "ice_strength",
        "additional_subroutine",
        "break_subroutine_cost",
        "break_ability_use_cost",
      ].includes(modifier.kind),
    )
  )
    conditions.push({ kind: "requires_installed_ice" });
  if ((engine.printedSubroutines?.length ?? 0) > 0)
    conditions.push(
      { kind: "requires_encounter" },
      { kind: "requires_unbroken_subroutine" },
    );
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (
      engine.abilities?.some(
        (ability) =>
          ability.kind === "activated" && ability.timing === "corp_during_run",
      )
    )
      conditions.push({ kind: "requires_during_run" });
    if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
      conditions.push({ kind: "requires_start_of_turn" });
    if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
      conditions.push({ kind: "requires_accessed_card" });
    if (
      engine.printedSubroutines?.some(
        (subroutine) => subroutine.kind === "trace",
      )
    )
      conditions.push({ kind: "requires_trace_success" });
    if (
      engine.printedSubroutines?.some(
        (subroutine) => subroutine.kind === "prohibit_break_next_ice",
      )
    )
      conditions.push({ kind: "requires_remaining_ice" });
    if (
      engine.printedSubroutines?.some(
        (subroutine) => subroutine.kind === "trash_program",
      )
    )
      conditions.push({ kind: "requires_installed_program" });
    for (const subroutine of engine.printedSubroutines ?? [])
      if (subroutine.kind === "deflect_run") {
        conditions.push({ kind: "requires_rezzed_ice" });
        if (subroutine.cost !== undefined)
          conditions.push({ kind: "requires_corp_credits_threshold" });
        if (subroutine.target === "any_data_fort")
          conditions.push({ kind: "requires_remote_server" });
        if (subroutine.target === "subsidiary_data_fort")
          conditions.push({ kind: "requires_remote_server" });
      }
    if (engine.fortRunWindows !== undefined)
      conditions.push({ kind: "requires_installed_ice" });
    const corpUtilityKind = engine.corpUtility?.kind;
    if (corpUtilityKind === "runner_memory_limit_modifier_until_end_of_turn")
      conditions.push({ kind: "requires_runner_tagged" });
    if (corpUtilityKind === "corp_archives_to_hq")
      conditions.push({ kind: "requires_archives_card" });
    if (corpUtilityKind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
      conditions.push({ kind: "requires_start_of_turn" });
    if (corpUtilityKind === "run_start_lose_runner_credits_per_tag")
      conditions.push(
        { kind: "requires_during_run" },
        { kind: "requires_runner_tagged" },
      );
    if (engine.successfulRunFollowups !== undefined)
      conditions.push({ kind: "requires_successful_run" });
    if (
      engine.modifiers?.some(
        (modifier) =>
          modifier.kind === "break_subroutine_cost" ||
          modifier.kind === "break_ability_use_cost",
      )
    )
      conditions.push({ kind: "requires_during_run" });
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) =>
            effect.kind === "double_chosen_ice_strength_until_end_of_turn",
        ),
      )
    )
      conditions.push(
        { kind: "requires_installed_ice" },
        { kind: "requires_corp_credits_threshold" },
      );
    for (const access of engine.accessEffects ?? [])
      if (access.condition?.kind === "runner_tags_at_least")
        conditions.push({ kind: "requires_runner_tagged" });
      else if (
        access.effects.some(
          (effect) =>
            effect.kind === "trash_installed_runner_cards" &&
            typeof effect.amount === "object" &&
            effect.amount.kind === "source_advancement_counter_count",
        )
      )
        conditions.push({ kind: "requires_advancement_counter" });
      else if (
        access.effects.some(
          (effect) =>
            effect.kind ===
            "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
        )
      )
        conditions.push({ kind: "requires_remote_server" });
    const breaker = engine.icebreakerAbilities?.find(
      (ability) => ability.kind === "break_subroutine",
    );
    if (
      breaker?.kind === "break_subroutine" &&
      (breaker.special !== undefined ||
        breaker.onUse?.some(
          (effect) => effect.kind === "reset_source_counter_on_fort_change",
        ) ||
        breaker.onSuccessfulBreak?.some(
          (effect) => effect.kind === "mark_run_end_source_counter_award",
        ))
    )
      conditions.push(
        { kind: "requires_during_run" },
        { kind: "requires_encounter" },
      );
    if (
      engine.icebreakerAbilities?.some(
        (ability) =>
          ability.kind === "increase_strength" &&
          ability.duration === "current_turn",
      )
    )
      conditions.push({ kind: "requires_during_run" });
    const runnerUtilityKind = engine.runnerUtilityLongtail?.kind;
    if (runnerUtilityKind === "hq_access_expose_all_installed_corp_cards")
      conditions.push(
        { kind: "requires_hq_pressure" },
        { kind: "requires_accessed_card" },
      );
    if (runnerUtilityKind === "derez_fully_broken_passed_ice")
      conditions.push(
        { kind: "requires_encounter" },
        { kind: "requires_rezzed_ice" },
      );
    if (runnerUtilityKind === "trace_attempts_auto_success_add_tag")
      conditions.push({ kind: "requires_trace_attempt" });
    if (runnerUtilityKind === "first_prep_credit_gain_bonus")
      conditions.push({ kind: "requires_runner_action" });
    if (runnerUtilityKind === "base_memory_equals_grip_count")
      conditions.push({ kind: "requires_runner_draw" });
    const runnerEventKind = engine.runnerEventLongtail?.kind;
    if (runnerEventKind === "trash_grip_search_stack_to_grip_equal_count")
      conditions.push(
        { kind: "requires_grip_card" },
        { kind: "requires_stack_search" },
      );
    if (runnerEventKind === "runner_corruption_agenda_point_transfer")
      conditions.push({ kind: "requires_stolen_agenda_last_turn" });
    if (
      runnerEventKind === "do_the_drine_unpreventable_core_damage_for_credits"
    )
      conditions.push(
        { kind: "requires_runner_action" },
        { kind: "requires_brain_damage" },
      );
    if (runnerEventKind === "three_dice_gain_credits")
      conditions.push({ kind: "requires_runner_action" });
    if (runnerEventKind === "library_search_run")
      conditions.push({ kind: "requires_successful_run" });
    if (
      engine.abilities?.some(
        (ability) => additionalClickAmount(ability.costs) === 1,
      )
    )
      conditions.push({ kind: "requires_runner_action" });
    for (const ability of engine.abilities ?? [])
      for (const effect of ability.effects ?? []) {
        if (
          effect.kind === "make_run" &&
          effect.successfulRunAccessReplacement
        ) {
          if (effect.target.kind === "central_server") {
            if (effect.target.server === "rd")
              conditions.push({ kind: "requires_rnd_pressure" });
            if (effect.target.server === "hq")
              conditions.push({ kind: "requires_hq_pressure" });
          }
          conditions.push({ kind: "requires_successful_run" });
        }
        if (effect.kind === "make_run" && effect.corpRezCostSurcharge)
          conditions.push({ kind: "requires_during_run" });
        if (effect.kind === "private_look")
          conditions.push(
            { kind: "requires_runner_action" },
            {
              kind:
                effect.zone === "hq"
                  ? "requires_hq_pressure"
                  : "requires_rnd_pressure",
            },
          );
      }
    if (engine.damagePreventionSources !== undefined)
      conditions.push({ kind: "requires_damage" });
    if (engine.tagPreventionSources !== undefined)
      conditions.push({ kind: "requires_prevention_window" });
    if (engine.runnerUtilityLongtail?.kind === "start_turn_random_effect_table")
      conditions.push({ kind: "requires_start_of_turn" });
  }
  return uniqueConditions(conditions);
}

function uniqueConditions(
  conditions: NonNullable<AiCardHint["conditions"]>,
): NonNullable<AiCardHint["conditions"]> {
  const seen = new Set<string>();
  return conditions.filter((condition) =>
    seen.has(condition.kind) ? false : (seen.add(condition.kind), true),
  );
}

function deriveActionTacticSignals(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
  effects: NonNullable<AiCardHint["effects"]>,
): string[] {
  const signals = new Set<string>();
  for (const effect of effects) {
    signals.add(`effect:${effect.kind}`);
    signals.add(`effect_scope:${effect.scope}`);
    signals.add(`effect_timing:${effect.timing}`);
    if (effect.kind === "multiaccess")
      signals.add(
        effect.scope === "hq"
          ? "access.hq_multiaccess"
          : "access.rnd_multiaccess",
      );
    if (
      effect.kind === "scored_agenda_action" &&
      effect.target === "runner.agenda_point_conversion"
    )
      signals.add("runner.agenda_point_conversion");
    if (effect.kind === "scored_agenda_action" && effect.scope === "score_area")
      signals.add("corp.score_progress");
    if (
      effect.kind === "action_penalty" &&
      effect.target === "corp_ice.runner_action_loss"
    )
      signals.add("corp_ice.runner_action_loss");
  }
  if (usesClosedExtendedMechanicalProfile(entry)) {
    for (const effect of effects) {
      if (effect.kind === "scored_agenda_action")
        signals.add("corp.score_progress");
      if (
        effect.kind === "access_replacement" ||
        effect.kind === "access_punish" ||
        effect.kind === "ambush" ||
        effect.kind === "hq_info" ||
        effect.kind === "topdeck_info" ||
        effect.kind === "multiaccess" ||
        effect.timing === "on_access"
      )
        signals.add("access.payoff");
      if (effect.kind === "access_punish")
        signals.add("access.corp_access_punish");
      if (effect.kind === "ambush") signals.add("access.corp_ambush");
      if (effect.kind === "trace") signals.add("trace.source");
      if (effect.kind === "program_trash")
        signals.add("target.runner_program_trash");
      if (effect.kind === "hardware_trash")
        signals.add("target.runner_hardware_trash");
      if (effect.kind === "tag_source" || effect.kind === "tag")
        signals.add("tag.source");
      if (effect.kind === "multiaccess")
        signals.add(
          effect.scope === "hq"
            ? "access.hq_multiaccess"
            : "access.rnd_multiaccess",
        );
      if (effect.kind === "search") signals.add("setup.search");
      if (
        effect.kind === "tag_prevention" ||
        effect.kind === "net_damage_prevention" ||
        effect.kind === "brain_damage_prevention"
      )
        signals.add("survival.defense");
    }
    if (entry.planning.engine.printedSubroutines !== undefined)
      signals.add("corp.ice_protection");
  }
  for (const annotation of allPlanningAnnotations(entry)) {
    if (annotation.kind === "tactic_interpretation")
      signals.add(
        closedPlanningValue(
          annotation.use,
          KNOWN_PLANNING_TACTIC_USES,
          "tactic_use",
        ),
      );
    if (annotation.kind === "remote_role")
      signals.add(`remote_role:${annotation.role}`);
  }
  return [...signals].sort();
}

function allPlanningAnnotations(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): PlanningInterpretation[] {
  return [
    ...(entry.planning.planningAnnotations?.card ?? []),
    ...(entry.planning.planningAnnotations?.capabilities ?? []).flatMap(
      (capability) => capability.annotations,
    ),
  ];
}

function deriveTargetProfiles(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["targetProfiles"]> {
  const preferences =
    entry.planning.planningAnnotations?.card?.filter(
      (annotation) => annotation.kind === "target_preference",
    ) ?? [];
  const preference = preferences[0];
  const exposesInstalledCards =
    entry.planning.engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "expose_installed_cards",
      ),
    ) === true;
  if (preferences.length > 0 && exposesInstalledCards)
    return preferences.flatMap((targetPreference) => {
      const serverProfile = deriveClosedExtendedTargetProfile(
        entry,
        targetPreference,
      );
      return [
        { ...serverProfile, hiddenInfoPolicy: "legal_targets_only" as const },
        {
          ...serverProfile,
          purpose: `${targetPreference.purpose}_card_selection`,
          targetType: "card" as const,
          hiddenInfoPolicy: "legal_targets_only" as const,
        },
      ];
    });
  if (
    preferences.length > 0 &&
    (usesClosedExtendedMechanicalProfile(entry) ||
      hasClosedTargetPreferenceOwner(entry.planning.engine))
  )
    return preferences.map((targetPreference) =>
      deriveClosedExtendedTargetProfile(entry, targetPreference),
    );
  const requiredSubtype = entry.planning.engine.modifiers?.flatMap(
    (modifier) =>
      (modifier.kind === "rez_cost" || modifier.kind === "ice_strength") &&
      modifier.appliesTo.subtype !== undefined
        ? [modifier.appliesTo.subtype]
        : [],
  )[0];
  const sameFortAdditionalSubroutine =
    entry.planning.engine.modifiers?.some(
      (modifier) =>
        modifier.kind === "additional_subroutine" &&
        modifier.appliesTo.cardType === "ice" &&
        modifier.appliesTo.sameServerAsSource === true,
    ) === true;
  // This describes an already-bound rez decision. The scope comes directly
  // from a closed mechanical modifier, so the defense plan need not recreate
  // card-specific target semantics from labels or rules text.
  const modifierRezSupportProfiles: NonNullable<AiCardHint["targetProfiles"]> =
    [
      ...(requiredSubtype === undefined
        ? []
        : [
            {
              schemaVersion: "target-profile-v1" as const,
              kind: "use_target" as const,
              timing: "corp_rez_window" as const,
              targetType: "installed_ice" as const,
              purpose: "rez_support_visible_installed_ice",
              preferences: [],
              avoid: [
                "hidden_info_dependent_choice",
              ] as Array<"hidden_info_dependent_choice">,
              hiddenInfoPolicy: "legal_targets_only" as const,
              requiredSubtypes: [requiredSubtype],
              serverScope: "any_visible_server" as const,
            },
          ]),
      ...(sameFortAdditionalSubroutine
        ? [
            {
              schemaVersion: "target-profile-v1" as const,
              kind: "use_target" as const,
              timing: "corp_rez_window" as const,
              targetType: "installed_ice" as const,
              purpose: "rez_support_visible_installed_ice",
              preferences: [],
              avoid: [
                "hidden_info_dependent_choice",
              ] as Array<"hidden_info_dependent_choice">,
              hiddenInfoPolicy: "legal_targets_only" as const,
              serverScope: "source_fort" as const,
              activeRunConstraint:
                "same_fort_upcoming_ice_when_active" as const,
            },
          ]
        : []),
    ];
  if (preference?.kind === "target_preference" && sameFortAdditionalSubroutine)
    return [
      {
        schemaVersion: "target-profile-v1",
        kind: "install_target",
        timing: "on_install",
        targetType: "server",
        purpose: preference.purpose,
        ...(preference.preferences === undefined
          ? {}
          : {
              preferences: closedPlanningValues(
                preference.preferences,
                KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                "target_preference",
              ),
            }),
        ...(preference.avoid === undefined
          ? {}
          : {
              avoid: closedPlanningValues(
                preference.avoid,
                KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                "target_avoid",
              ),
            }),
        hiddenInfoPolicy: "public_or_controller_known_only",
      },
      ...modifierRezSupportProfiles,
    ];
  if (preference?.kind === "target_preference" && requiredSubtype !== undefined)
    return [
      {
        schemaVersion: "target-profile-v1",
        kind: "use_target",
        timing: "corp_rez_window",
        targetType: "installed_ice",
        purpose: preference.purpose,
        ...(preference.preferences === undefined
          ? {}
          : {
              preferences: closedPlanningValues(
                preference.preferences,
                KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                "target_preference",
              ),
            }),
        avoid: ["hidden_info_dependent_choice"],
        hiddenInfoPolicy: "legal_targets_only",
        requiredSubtypes: [requiredSubtype],
        serverScope: "any_visible_server",
      },
      ...modifierRezSupportProfiles,
    ];
  if (modifierRezSupportProfiles.length > 0) return modifierRezSupportProfiles;
  const capabilityPreferences = new Map(
    (entry.planning.planningAnnotations?.capabilities ?? []).flatMap(
      (capability) => {
        const target = capability.annotations.find(
          (annotation) => annotation.kind === "target_preference",
        );
        return target?.kind === "target_preference"
          ? [[capability.capabilityKey, target] as const]
          : [];
      },
    ),
  );
  const installBinding = entry.planning.engine.installTargetBinding;
  if (installBinding !== undefined) {
    const target = capabilityPreferences.get(installBinding.capabilityKey);
    if (target !== undefined) {
      const base = {
        schemaVersion: "target-profile-v1" as const,
        kind:
          installBinding.kind === "choose_installed_ice_on_install"
            ? ("install_target" as const)
            : ("mode_choice" as const),
        timing: "on_install" as const,
        targetType:
          installBinding.kind === "choose_installed_ice_on_install"
            ? ("installed_ice" as const)
            : ("ice_type" as const),
        purpose: target.purpose,
        ...(target.preferences === undefined
          ? {}
          : {
              preferences: closedPlanningValues(
                target.preferences,
                KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                "target_preference",
              ),
            }),
        ...(target.avoid === undefined
          ? {}
          : {
              avoid: closedPlanningValues(
                target.avoid,
                KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                "target_avoid",
              ),
            }),
        hiddenInfoPolicy: "visible_or_known_only" as const,
      };
      const subtypeChange = entry.planning.engine.icebreakerSubtypeChange;
      if (subtypeChange !== undefined) {
        const changeTarget = capabilityPreferences.get(
          subtypeChange.capabilityKey,
        );
        if (changeTarget === undefined) return [base];
        return [
          base,
          {
            ...base,
            timing: "paid_action" as const,
            purpose: changeTarget.purpose,
            ...(changeTarget.preferences === undefined
              ? {}
              : {
                  preferences: closedPlanningValues(
                    changeTarget.preferences,
                    KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                    "target_preference",
                  ),
                }),
            ...(changeTarget.avoid === undefined
              ? {}
              : {
                  avoid: closedPlanningValues(
                    changeTarget.avoid,
                    KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                    "target_avoid",
                  ),
                }),
          },
        ];
      }
      return [base];
    }
  }
  const onPlay = entry.planning.engine.abilities?.find(
    (ability) => ability.kind === "on_play",
  );
  if (onPlay !== undefined) {
    const target = capabilityPreferences.get(onPlay.capabilityKey);
    const onPlayEffectKinds = new Set(
      (onPlay.effects ?? []).map((effect) => effect.kind),
    );
    const trashesRecentlyInstalledResource = onPlay.effects?.some(
      (effect) =>
        effect.kind === "trace" &&
        effect.onSuccess.some(
          (outcome) =>
            outcome.kind === "trash_runner_resource_and_add_tag" &&
            outcome.target === "runner_resource_installed_last_turn",
        ),
    );
    if (target !== undefined && trashesRecentlyInstalledResource)
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: "use_target",
          timing: "on_play",
          targetType: "resource",
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "legal_targets_only",
        },
      ];
    if (
      target !== undefined &&
      (onPlayEffectKinds.has("search_trash_to_grip") ||
        onPlayEffectKinds.has("trash_cards_from_grip_for_credits"))
    )
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: "use_target",
          timing: "on_play",
          targetType: "card",
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ];
    if (target !== undefined && onPlayEffectKinds.has("search_stack_to_grip"))
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: "use_target",
          timing: "on_play",
          targetType: "card",
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ];
    if (
      target !== undefined &&
      onPlayEffectKinds.has("distribute_advancement_counters")
    )
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: "use_target",
          timing: "on_play",
          targetType: "card",
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ];
    if (
      target !== undefined &&
      (onPlayEffectKinds.has("search_stack_install") ||
        onPlayEffectKinds.has("choose_stack_or_trash_program_install"))
    )
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: "search_install_target",
          timing: "on_play",
          targetType: "program",
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ];
  }
  const scoredAgenda = entry.planning.engine.scoredAgenda;
  if (scoredAgenda !== undefined && "capabilityKey" in scoredAgenda) {
    const target = capabilityPreferences.get(scoredAgenda.capabilityKey);
    if (target !== undefined) {
      const scoredTargetShape =
        scoredAgenda.kind === "reveal_top_rd_install_and_rez_ice_trash_rest"
          ? {
              kind: "install_target" as const,
              targetType: "server" as const,
            }
          : scoredAgenda.kind === "reveal_installed_ice_subtype_for_credits"
            ? {
                kind: "use_target" as const,
                targetType: "installed_ice" as const,
              }
            : scoredAgenda.kind === "score_rez_installed_ice_at_no_cost"
              ? {
                  kind: "use_target" as const,
                  targetType: "installed_ice" as const,
                }
              : {
                  kind: "install_target" as const,
                  targetType: "card" as const,
                };
      return [
        {
          schemaVersion: "target-profile-v1",
          kind: scoredTargetShape.kind,
          timing: "on_score",
          targetType: scoredTargetShape.targetType,
          purpose: target.purpose,
          ...(target.preferences === undefined
            ? {}
            : {
                preferences: closedPlanningValues(
                  target.preferences,
                  KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
                  "target_preference",
                ),
              }),
          ...(target.avoid === undefined
            ? {}
            : {
                avoid: closedPlanningValues(
                  target.avoid,
                  KNOWN_HINT_TARGET_PROFILE_AVOIDS,
                  "target_avoid",
                ),
              }),
          hiddenInfoPolicy: "public_or_controller_known_only",
        },
      ];
    }
  }
  const ownedCapabilityPreferences = [
    ...capabilityPreferences.entries(),
  ].filter(([capabilityKey]) =>
    mechanicalOwnerHasCapabilityKey(entry.planning.engine, capabilityKey),
  );
  if (ownedCapabilityPreferences.length > 0)
    return ownedCapabilityPreferences.map(([capabilityKey, preference]) => {
      const abilities = entry.planning.engine.abilities;
      const scopedAbilities = abilities?.filter((ability) =>
        mechanicalOwnerHasCapabilityKey(ability, capabilityKey),
      );
      return deriveClosedExtendedTargetProfile(
        scopedAbilities !== undefined && scopedAbilities.length > 0
          ? {
              ...entry,
              planning: {
                ...entry.planning,
                engine: {
                  ...entry.planning.engine,
                  abilities: scopedAbilities,
                },
              },
            }
          : entry,
        preference,
      );
    });
  if (capabilityPreferences.size > 0)
    throw new Error(
      `card_spec_target_preference_without_supported_mechanical_owner: ${entry.definition.id}`,
    );
  return [];
}

function mechanicalOwnerHasCapabilityKey(
  value: unknown,
  capabilityKey: string,
): boolean {
  if (Array.isArray(value))
    return value.some((entry) =>
      mechanicalOwnerHasCapabilityKey(entry, capabilityKey),
    );
  if (value === null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.capabilityKey === capabilityKey) return true;
  return Object.values(record).some((entry) =>
    mechanicalOwnerHasCapabilityKey(entry, capabilityKey),
  );
}

function hasClosedTargetPreferenceOwner(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): boolean {
  return (
    engine.variableRez?.kind === "alternate_subtype" ||
    engine.variableRez?.kind === "x_strength" ||
    engine.variableRez?.kind === "paid_end_the_run_subroutines" ||
    engine.fortRunWindows !== undefined ||
    engine.icebreakerAbilities !== undefined ||
    engine.icebreakerSubtypeChange !== undefined ||
    engine.runnerRunStrengthBoost !== undefined ||
    engine.runnerEventTargetedEffect !== undefined ||
    engine.hostedProgramCapacity !== undefined ||
    engine.restrictedHostedCreditSource !== undefined ||
    engine.trashPreventionSources !== undefined ||
    engine.virusCounter !== undefined ||
    engine.successfulRunFollowups !== undefined ||
    engine.runnerUtilityLongtail !== undefined ||
    engine.runnerEventLongtail !== undefined ||
    engine.remainingReplacementLongtail?.kind ===
      "hidden_draw_keep_or_top_replacement" ||
    engine.hiddenReplacementLongtail?.kind ===
      "conceal_and_reorder_installed_ice" ||
    engine.hiddenReplacementLongtail?.kind ===
      "secret_spend_guess_then_targeted_bypass_run" ||
    engine.hiddenReplacementLongtail?.kind ===
      "purge_replacement_with_runner_virus_counter_cleanup" ||
    engine.corpUtility !== undefined ||
    engine.lifecycle?.start_of_corp_turn?.some((trigger) =>
      trigger.effects.some(
        (effect) => effect.kind === "show_hq_agendas_for_credits",
      ),
    ) === true ||
    engine.lifecycle?.on_score?.some(
      (effect) => effect.kind === "trash_corp_installed_cards_in_source_server",
    ) === true ||
    engine.lifecycle?.on_rez?.some(
      (effect) => effect.kind === "replace_source_fort_cards_from_hq",
    ) === true ||
    engine.modifiers?.some(
      (modifier) => modifier.kind === "new_data_fort_creation_lock",
    ) === true ||
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) =>
        effect.kind === "make_run"
          ? true
          : [
              "copy_same_fort_ice_subroutine_for_run",
              "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity",
              "expose_installed_cards",
              "expose_installed_card",
              "free_rez_installed_ice_with_counters",
              "remove_same_fort_advancement_counters_for_run_credits",
              "search_stack_install",
              "search_stack_to_grip",
              "look_top_stack_take_matching",
              "look_top_stack_take_one_arrange_rest",
              "search_trash_to_grip",
              "trash_cards_from_grip_for_credits",
              "trash_own_installed_cards_for_credits",
              "trash_own_rezzed_ice_for_credits",
              "derez_rezzed_black_ice",
              "trash_unrezzed_ice",
            ].includes(effect.kind),
      ),
    ) === true
  );
}

function deriveClosedExtendedTargetProfile(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
  preference: Extract<PlanningInterpretation, { kind: "target_preference" }>,
): NonNullable<AiCardHint["targetProfiles"]>[number] {
  const engine = entry.planning.engine;
  const planningFields = {
    schemaVersion: "target-profile-v1" as const,
    purpose: preference.purpose,
    ...(preference.preferences === undefined
      ? {}
      : {
          preferences: closedPlanningValues(
            preference.preferences,
            KNOWN_HINT_TARGET_PROFILE_PREFERENCES,
            "target_preference",
          ),
        }),
    ...(preference.avoid === undefined
      ? {}
      : {
          avoid: closedPlanningValues(
            preference.avoid,
            KNOWN_HINT_TARGET_PROFILE_AVOIDS,
            "target_avoid",
          ),
        }),
  };
  const lookTopStack = engine.abilities
    ?.flatMap((ability) => ability.effects ?? [])
    .find((effect) => effect.kind === "look_top_stack_take_matching");
  if (lookTopStack?.kind === "look_top_stack_take_matching")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType:
        lookTopStack.allowedTypes.length === 1 &&
        lookTopStack.allowedTypes[0] === "program"
          ? "program"
          : "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  const revealTopStackAndInstall = engine.abilities
    ?.flatMap((ability) => ability.effects ?? [])
    .find(
      (effect) =>
        effect.kind === "look_top_stack_show_to_corp_then_install_matching",
    );
  if (
    revealTopStackAndInstall?.kind ===
    "look_top_stack_show_to_corp_then_install_matching"
  )
    return {
      ...planningFields,
      kind: "search_install_target",
      timing: "activated_ability",
      targetType:
        revealTopStackAndInstall.allowedTypes.length === 1 &&
        revealTopStackAndInstall.allowedTypes[0] === "program"
          ? "program"
          : "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "search_stack_to_grip"),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType: "program",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "look_top_stack_take_one_arrange_rest",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "search_trash_to_grip" ||
          effect.kind === "trash_cards_from_grip_for_credits",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "trash_own_installed_cards_for_credits",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "move_advancement_counters",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "derez_rezzed_black_ice",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "installed_ice",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.hiddenReplacementLongtail?.kind ===
    "conceal_and_reorder_installed_ice"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "ice_position",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.hiddenReplacementLongtail?.kind ===
    "secret_spend_guess_then_targeted_bypass_run"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "installed_ice",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.hiddenReplacementLongtail?.kind ===
    "purge_replacement_with_runner_virus_counter_cleanup"
  )
    return {
      ...planningFields,
      kind: "replacement_target",
      timing: "replacement_window",
      targetType: "counter",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "trash_unrezzed_ice"),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "pay_rez_cost_to_trash_rezzed_ice",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "installed_ice",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.remainingReplacementLongtail?.kind ===
    "hidden_draw_keep_or_top_replacement"
  )
    return {
      ...planningFields,
      kind: "replacement_target",
      timing: "replacement_window",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.lifecycle?.on_score?.some(
      (effect) => effect.kind === "trash_corp_installed_cards_in_source_server",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_score",
      targetType: "program",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (engine.variableRez?.kind === "alternate_subtype")
    return {
      ...planningFields,
      kind: "mode_choice",
      timing: "encounter_resolution",
      targetType: "mode_choice",
      hiddenInfoPolicy: "legal_options_only",
    };
  if (engine.variableRez?.kind === "x_strength")
    return {
      ...planningFields,
      kind: "mode_choice",
      timing: "corp_rez_window",
      targetType: "mode_choice",
      hiddenInfoPolicy: "legal_options_only",
    };
  if (engine.variableRez?.kind === "paid_end_the_run_subroutines")
    return {
      ...planningFields,
      kind: "mode_choice",
      timing: "corp_rez_window",
      targetType: "mode_choice",
      hiddenInfoPolicy: "legal_options_only",
    };
  if (
    engine.fortRunWindows?.some(
      (window) =>
        window.kind === "move_self_to_different_position_on_same_fort",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "paid_or_triggered_reposition",
      targetType: "ice_position",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.fortRunWindows?.some(
      (window) => window.kind === "discounted_rez_ice_on_this_fort",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "corp_rez_window",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
      serverScope: "source_fort",
    };
  if (
    engine.fortRunWindows?.some(
      (window) =>
        window.kind === "temporary_hq_ice_encounter_after_successful_run" ||
        window.kind === "swap_unrezzed_fort_ice_with_hq_ice",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
      serverScope: "source_fort",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "free_rez_installed_ice_with_counters",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "corp_rez_window",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.fortRunWindows?.some(
      (window) =>
        window.kind ===
        "add_advancement_counters_after_passing_last_ice_on_this_fort",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "copy_same_fort_ice_subroutine_for_run",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.lifecycle?.on_rez?.some(
      (effect) => effect.kind === "replace_source_fort_cards_from_hq",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind ===
          "remove_same_fort_advancement_counters_for_run_credits",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.icebreakerSubtypeChange !== undefined)
    return {
      ...planningFields,
      kind: "mode_choice",
      timing: "paid_action",
      targetType: "ice_type",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "make_run" &&
          effect.eventApproachIceExposeBeforeRez === true,
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "start_of_run",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "expose_installed_card",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType: "card",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "expose_installed_cards",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "server",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "make_run" &&
          effect.runnerCreditGainOnCorpRez !== undefined,
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind ===
          "corp_choice_derez_last_rezzed_black_ice_or_bad_publicity",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "search_stack_install"),
    )
  )
    return {
      ...planningFields,
      kind: "search_install_target",
      timing: "activated_ability",
      targetType: "program",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.modifiers?.some(
      (modifier) => modifier.kind === "new_data_fort_creation_lock",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    return {
      ...planningFields,
      kind: "replacement_target",
      timing: "on_access",
      targetType: "accessed_card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.printedSubroutines?.some(
      (subroutine) => subroutine.kind === "trash_program",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "subroutine_resolution",
      targetType: "program",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.printedSubroutines?.some(
      (subroutine) => subroutine.kind === "deflect_run",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "subroutine_resolution",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (engine.fortRunWindows !== undefined)
    return {
      ...planningFields,
      kind: "use_target",
      timing: "start_of_run",
      targetType: "ice_position",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd" ||
    engine.corpUtility?.kind === "corp_archives_to_hq"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.corpUtility?.kind === "corp_draw_extra_then_bottom_one")
    return {
      ...planningFields,
      kind: "replacement_target",
      timing: "replacement_window",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.lifecycle?.start_of_corp_turn?.some((trigger) =>
      trigger.effects.some(
        (effect) => effect.kind === "show_hq_agendas_for_credits",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "start_of_turn",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.corpUtility?.kind === "fort_start_reorder_ice")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "server",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.corpUtility?.kind === "gain_restricted_install_actions")
    return {
      ...planningFields,
      kind: "install_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.corpUtility?.kind === "corp_rd_top_reorder")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.corpUtility?.kind === "move_installed_corp_card_to_hq")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.accessEffects !== undefined)
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_access",
      targetType: "card",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) =>
          effect.kind === "double_chosen_ice_strength_until_end_of_turn",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerUtilityLongtail?.kind ===
    "hq_access_expose_all_installed_corp_cards"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "hq_access",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerUtilityLongtail?.kind === "derez_fully_broken_passed_ice" ||
    engine.runnerUtilityLongtail?.kind ===
      "derez_fully_broken_passed_ice_and_end_run"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "encounter_resolution",
      targetType: "installed_ice",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.runnerEventLongtail?.kind ===
    "trash_grip_search_stack_to_grip_equal_count"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerEventLongtail?.kind ===
    "grip_install_program_or_hardware_with_temporary_credits"
  )
    return {
      ...planningFields,
      kind: "install_target",
      timing: "on_play",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerEventLongtail?.kind ===
    "search_stack_install_program_free_then_run_return_or_penalty"
  )
    return {
      ...planningFields,
      kind: "search_install_target",
      timing: "on_play",
      targetType: "program",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerEventLongtail?.kind ===
    "do_the_drine_unpreventable_core_damage_for_credits"
  )
    return {
      ...planningFields,
      kind: "mode_choice",
      timing: "on_play",
      targetType: "mode_choice",
      hiddenInfoPolicy: "legal_options_only",
    };
  if (engine.runnerEventLongtail?.kind === "library_search_run")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
    };
  const makeRun = engine.abilities
    ?.flatMap((ability) => ability.effects ?? [])
    .find((effect) => effect.kind === "make_run");
  if (makeRun?.kind === "make_run")
    return makeRun.successfulRunAccessReplacement !== undefined
      ? {
          ...planningFields,
          kind: "replacement_target",
          timing: "after_successful_run",
          targetType: "card",
          hiddenInfoPolicy: "current_access_only",
        }
      : {
          ...planningFields,
          kind: "use_target",
          timing: "on_play",
          targetType: "server",
          hiddenInfoPolicy: "legal_targets_only",
        };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some((effect) => effect.kind === "private_look"),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.icebreakerAbilities?.some(
      (ability) =>
        ability.kind === "break_subroutine" &&
        ability.onSuccessfulBreak?.some(
          (effect) => effect.kind === "lose_bits_from_stealth_sources",
        ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.icebreakerAbilities !== undefined)
    return {
      ...planningFields,
      kind: "use_target",
      timing: "during_ice_encounter",
      targetType: "subroutine",
      hiddenInfoPolicy: "legal_targets_only",
    };
  if (engine.runnerRunStrengthBoost !== undefined)
    return {
      ...planningFields,
      kind: "use_target",
      timing: "during_ice_encounter",
      targetType: "icebreaker",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.runnerEventTargetedEffect !== undefined)
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_play",
      targetType: "icebreaker",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.hostedProgramCapacity !== undefined)
    return {
      ...planningFields,
      kind: "hosted_install_target",
      timing: "on_install",
      targetType:
        engine.hostedProgramCapacity.allowedProgramSubtypes?.length === 1 &&
        engine.hostedProgramCapacity.allowedProgramSubtypes[0] === "icebreaker"
          ? "icebreaker"
          : "program",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.restrictedHostedCreditSource?.usableFor.includes("install_programs")
  )
    return {
      ...planningFields,
      kind: "install_target",
      timing: "paid_action",
      targetType: "program",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.trashPreventionSources !== undefined)
    return {
      ...planningFields,
      kind: "replacement_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.successfulRunFollowups?.some(
      (followup) =>
        followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "after_successful_run",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
      serverScope: "source_fort",
    };
  if (
    engine.successfulRunFollowups?.some(
      (followup) => followup.kind === "reverse_ice_on_successful_run_fort",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "after_successful_run",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
      serverScope: "source_fort",
    };
  if (
    engine.successfulRunFollowups?.some(
      (followup) => followup.kind === "successful_run_before_access_effect",
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "server",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.virusCounter?.addOnSuccessfulRun !== undefined) {
    const addOnSuccessfulRun = engine.virusCounter.addOnSuccessfulRun;
    if (
      addOnSuccessfulRun.server === "any" &&
      addOnSuccessfulRun.counterScope.kind === "chosen_fully_broken_ice"
    )
      return {
        ...planningFields,
        kind: "use_target",
        timing: "after_successful_run",
        targetType: "installed_ice",
        hiddenInfoPolicy: "visible_or_known_only",
        serverScope: "source_fort",
      };
    const server = addOnSuccessfulRun.server;
    if (server !== "hq" && server !== "rd")
      throw new Error("card_spec_unknown_virus_counter_target_profile_server");
    return {
      ...planningFields,
      kind: "use_target",
      timing: server === "hq" ? "hq_access" : "rnd_access",
      targetType: "accessed_card",
      hiddenInfoPolicy: "current_access_only",
    };
  }
  if (
    engine.runnerUtilityLongtail?.kind === "successful_run_fort_counter_expose"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "after_successful_run",
      targetType: "server",
      hiddenInfoPolicy: "legal_targets_only",
      serverScope: "source_fort",
    };
  if (engine.runnerUtilityLongtail?.kind === "trash_fully_broken_passed_ice")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "encounter_resolution",
      targetType: "installed_ice",
      hiddenInfoPolicy: "visible_or_known_only",
      serverScope: "source_fort",
    };
  if (
    engine.runnerUtilityLongtail?.kind ===
    "replace_installed_program_trash_with_host_on_source"
  )
    return {
      ...planningFields,
      kind: "replacement_target",
      timing: "replacement_window",
      targetType: "program",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (
    engine.runnerUtilityLongtail?.kind ===
    "hidden_resource_current_access_free_trash"
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "current_access_only",
    };
  if (engine.corpUtility?.kind === "trash_runner_resources_if_tagged")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  if (engine.corpUtility?.kind === "installed_hardware_trash_by_counter")
    return {
      ...planningFields,
      kind: "use_target",
      timing: "on_use",
      targetType: "card",
      hiddenInfoPolicy: "visible_or_known_only",
    };
  if (
    engine.abilities?.some((ability) =>
      ability.effects?.some(
        (effect) => effect.kind === "trash_own_rezzed_ice_for_credits",
      ),
    )
  )
    return {
      ...planningFields,
      kind: "use_target",
      timing: "activated_ability",
      targetType: "installed_ice",
      hiddenInfoPolicy: "public_or_controller_known_only",
    };
  throw new Error(
    `card_spec_target_preference_without_supported_mechanical_owner: ${entry.definition.id}`,
  );
}

function deriveMechanicalValueHints(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): AiRuntimeValueHints {
  const result: AiRuntimeValueHints = {};
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? [])
      if (effect.kind === "add_hosted_credits") result.economy = effect.amount;
  for (const effect of engine.lifecycle?.on_install ?? [])
    if (effect.kind === "gain_credits")
      result.installCreditGain = effect.amount;
  for (const entry of engine.lifecycle?.start_of_runner_turn ?? [])
    for (const effect of entry.effects)
      if (effect.kind === "lose_credits" && effect.amount !== undefined)
        result.startOfTurnCreditLoss = effect.amount;
  for (const effect of engine.lifecycle?.on_leave_play ?? [])
    if (effect.kind === "pay_credits_or_lose_game")
      result.leavePlayPayCost = effect.amount;
  for (const access of engine.accessEffects ?? [])
    for (const effect of access.effects)
      if (effect.kind === "damage")
        result.damage = Math.max(result.damage ?? 0, effect.amount);
      else if (effect.kind === "damage_from_source_advancement_counters")
        result.damage = Math.max(result.damage ?? 0, effect.minimumAmount);
  return result;
}

function deriveBreakerProfile(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): AiCardHint["breakerProfile"] {
  const abilities = engine.icebreakerAbilities;
  if (abilities === undefined) return undefined;
  const breaker = abilities.find(
    (ability) => ability.kind === "break_subroutine",
  );
  const pump = abilities.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (breaker?.kind !== "break_subroutine") return undefined;
  if (
    pump?.kind !== "increase_strength" &&
    breaker.special?.kind === "run_start_random_strength_bonus" &&
    breaker.matches.kind === "ice_subtype"
  )
    return {
      coverage: [
        closedPlanningValue(
          breakerCoverageForSubtype(breaker.matches.subtype),
          KNOWN_HINT_BREAKER_COVERAGES,
          "breaker_coverage",
        ),
      ],
      breakCost: breaker.cost.amount,
      sideEffects: ["random_failure"],
    };
  if (pump?.kind !== "increase_strength")
    return {
      ...breakerProfileWithoutPump(engine, breaker),
      ...(breaker.special?.kind === "blink_random_break_or_net_damage"
        ? {
            sideEffects: ["random_failure"],
            randomOutcome: {
              kind: "random_break_or_damage",
              successProbabilityPerAttempt: 0.5,
              failureDamageType: "net",
              maxSingleFailureDamage: 3,
            },
          }
        : {}),
    };
  if (breaker.matches.kind === "selected_ice_subtype")
    return {
      configurableCoverage: true,
      coverageCandidates: [
        ...(engine.installTargetBinding?.kind ===
        "choose_icebreaker_subtype_on_install"
          ? (engine.installTargetBinding.choices ?? [])
          : (engine.icebreakerSubtypeChange?.choices ?? [])),
      ],
      breakCost: breaker.cost.amount,
      ...(breaker.count === undefined
        ? { maxSubroutinesPerBreak: 1 }
        : {
            maxSubroutinesPerBreak: breaker.count,
            multiSubroutineBreak: breaker.count > 1,
          }),
      pumpCost: pump.cost.amount,
      pumpStrengthAmount: pump.amount,
      ...(engine.icebreakerSubtypeChange?.limit === "once_until_selected"
        ? { oneTimeModeChoice: true }
        : { reconfigurableType: engine.icebreakerSubtypeChange !== undefined }),
      ...(breaker.onSuccessfulBreak?.some(
        (effect) => effect.kind === "lose_bits_from_stealth_sources",
      )
        ? { sideEffects: ["stealth_loss"] }
        : {}),
    };
  if (breaker.matches.kind === "any")
    return {
      coverage: ["universal"],
      emergencyCoverage: true,
      breakCost: breaker.cost.amount,
      ...(engine.characteristics.strength.kind === "fixed"
        ? { baseStrength: engine.characteristics.strength.value }
        : {}),
      maxSubroutinesPerBreak: 1,
      pumpCost: pump.cost.amount,
      pumpStrengthAmount: pump.amount,
      ...(breaker.special?.kind === "run_end_trash_source_if_used"
        ? {
            restrictions: ["trashes_self_at_end_of_run_after_break_use"],
            sideEffects: ["program_trash_risk"],
          }
        : {}),
    };
  if (breaker.matches.kind !== "ice_subtype")
    return {
      ...breakerProfileWithoutPump(engine, breaker),
      pumpCost: pump.cost.amount,
      pumpStrengthAmount: pump.amount,
    };
  return {
    coverage: [
      closedPlanningValue(
        breakerCoverageForSubtype(breaker.matches.subtype),
        KNOWN_HINT_BREAKER_COVERAGES,
        "breaker_coverage",
      ),
    ],
    breakCost: breaker.cost.amount,
    ...(engine.installTargetBinding === undefined &&
    engine.icebreakerEncounterStrengthBonus === undefined &&
    engine.icebreakerSubtypeChange === undefined &&
    engine.characteristics.strength.kind === "fixed"
      ? { baseStrength: engine.characteristics.strength.value }
      : {}),
    ...(engine.installTargetBinding === undefined &&
    engine.icebreakerEncounterStrengthBonus === undefined &&
    engine.icebreakerSubtypeChange === undefined
      ? breaker.count === undefined
        ? { maxSubroutinesPerBreak: 1 }
        : {
            maxSubroutinesPerBreak: breaker.count,
            multiSubroutineBreak: breaker.count > 1,
          }
      : {}),
    pumpCost: pump.cost.amount,
    pumpStrengthAmount: pump.amount,
    ...(breaker.special?.kind === "once_per_run_break_tag_and_all_stealth_loss"
      ? {
          restrictions: ["first_sentry_break_each_run_gives_runner_tag"],
          sideEffects: ["stealth_loss"],
        }
      : breaker.onSuccessfulBreak?.some(
            (effect) => effect.kind === "lose_bits_from_stealth_sources",
          )
        ? { sideEffects: ["stealth_loss"] }
        : pump.duration === "current_turn"
          ? { sideEffects: ["temporary_strength"] }
          : {}),
    targetedIceBonus: engine.installTargetBinding !== undefined,
    strengthBonusVsChosenIce:
      engine.icebreakerEncounterStrengthBonus?.kind ===
      "against_selected_installed_ice",
  };
}

function breakerCoverageForSubtype(
  subtype: string,
): (typeof KNOWN_HINT_BREAKER_COVERAGES)[number] {
  if (subtype === "barrier") return "wall";
  if (subtype === "code_gate" || subtype === "sentry") return subtype;
  return closedPlanningValue(
    subtype,
    KNOWN_HINT_BREAKER_COVERAGES,
    "breaker_coverage",
  );
}

function breakerProfileWithoutPump(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
  breaker: Extract<
    NonNullable<
      ReturnType<
        typeof cardSpecPlanningCards
      >[number]["planning"]["engine"]["icebreakerAbilities"]
    >[number],
    { kind: "break_subroutine" }
  >,
): NonNullable<AiCardHint["breakerProfile"]> {
  const coverage = breakerCoverageForMatches(breaker.matches);
  return {
    coverage,
    ...(breaker.matches.kind === "any" ? { emergencyCoverage: true } : {}),
    breakCost: breaker.cost.amount,
    ...(engine.characteristics.strength.kind === "fixed"
      ? { baseStrength: engine.characteristics.strength.value }
      : {}),
    ...(breaker.count === undefined
      ? { maxSubroutinesPerBreak: 1 }
      : {
          maxSubroutinesPerBreak: breaker.count,
          multiSubroutineBreak: breaker.count > 1,
        }),
  };
}

function breakerCoverageForMatches(
  matches: Extract<
    NonNullable<
      ReturnType<
        typeof cardSpecPlanningCards
      >[number]["planning"]["engine"]["icebreakerAbilities"]
    >[number],
    { kind: "break_subroutine" }
  >["matches"],
): NonNullable<NonNullable<AiCardHint["breakerProfile"]>["coverage"]> {
  if (matches.kind === "any") return ["universal"];
  if (matches.kind === "ice_subtype")
    return [breakerCoverageForSubtype(matches.subtype)];
  if (matches.kind === "ice_subtype_any_of")
    return [
      ...new Set(
        matches.subtypes.map((subtype) =>
          breakerCoverageForSpecializedSubtype(subtype),
        ),
      ),
    ];
  if (matches.kind === "subroutine_traces") return ["trace"];
  if (matches.kind === "subroutine_tag")
    return [breakerCoverageForSpecializedSubtype(matches.tag)];
  if (matches.kind === "subroutine_tag_any_of")
    return [
      ...new Set(
        matches.tags.map((tag) => breakerCoverageForSpecializedSubtype(tag)),
      ),
    ];
  return ["unknown_special"];
}

function breakerCoverageForSpecializedSubtype(
  subtype: string,
): (typeof KNOWN_HINT_BREAKER_COVERAGES)[number] {
  if (subtype === "barrier") return "wall";
  if (KNOWN_HINT_BREAKER_COVERAGES.includes(subtype as never))
    return subtype as (typeof KNOWN_HINT_BREAKER_COVERAGES)[number];
  return "unknown_special";
}

function deriveHintEffects(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["effects"]> {
  if (usesClosedExtendedMechanicalProfile(entry))
    return deriveClosedExtendedHintEffects(entry);
  const engine = entry.planning.engine;
  const effects: NonNullable<AiCardHint["effects"]> = [];
  if (engine.corpRootRezCreditOutcome !== undefined)
    effects.push({
      kind: "economy",
      scope: "corp",
      timing: "on_rez",
      amount: engine.corpRootRezCreditOutcome.effect.amount,
    });
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits")
        effects.push({
          kind: "economy",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          amount: effect.amount,
          finite: true,
        });
      if (effect.kind === "draw_cards")
        effects.push({
          kind: "draw",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          resource: "cards",
          amount: effect.amount,
          finite: true,
        });
      if (
        effect.kind === "lose_credits" &&
        effect.recipient === "runner" &&
        ability.condition?.kind === "runner_is_tagged"
      )
        effects.push({
          kind: "tag_punish_payoff",
          scope: "runner",
          timing: "action",
          ...(effect.amount === undefined ? {} : { amount: effect.amount }),
          finite: true,
        });
    }
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    effects.push({
      kind: "global_modifier",
      scope: "runner",
      timing: "persistent",
      target: "resource.connection",
    });
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "rez_cost")
      effects.push({
        kind: "rez_discount",
        scope: "ice",
        timing: "persistent",
        amount: modifier.amount,
        resource: "credits",
      });
    if (modifier.kind === "ice_strength" && entry.definition.side === "corp")
      effects.push({
        kind: "remote_protection",
        scope: "ice",
        timing: "persistent",
        amount: modifier.amount,
        resource: "strength",
      });
  }
  if (engine.icebreakerAbilities !== undefined)
    effects.push({ kind: "breaker", scope: "runner", timing: "persistent" });
  for (const access of engine.accessEffects ?? []) {
    for (const effect of access.effects) {
      if (effect.kind === "trace") {
        effects.push({
          kind: "trace",
          scope: "runner",
          timing: "on_access",
          target: "trace.source",
          finite: true,
        });
        for (const successEffect of effect.onSuccess) {
          if (successEffect.kind !== "add_tags") continue;
          effects.push({
            kind: "tag_source",
            scope: "runner",
            timing: "trace_success",
            resource: "tags",
            target: "tag.source",
            amount: successEffect.amount,
            finite: true,
          });
        }
      }
      if (
        effect.kind === "damage" ||
        effect.kind === "damage_from_source_advancement_counters"
      )
        effects.push({
          kind: "damage",
          scope: "runner",
          timing: "on_access",
          resource: hintDamageResource(effect.damageType),
          amount:
            effect.kind === "damage" ? effect.amount : effect.minimumAmount,
          target: accessDamageAmbushSignal(effect.damageType),
        });
    }
  }
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "server_run_start_restriction")
      effects.push({
        kind: "remote_tax",
        scope: "remote",
        timing: "during_run",
        target: "run.corp_server_lock",
      });
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage")
      effects.push({
        kind: "damage",
        scope: "runner",
        timing: "encounter_resolution",
        resource: hintDamageResource(subroutine.damageType),
        ...(typeof subroutine.amount === "number"
          ? { amount: subroutine.amount }
          : { amountKind: "dynamic" as const }),
        finite: true,
        target: `corp_ice.${subroutine.damageType}_damage`,
      });
    if (subroutine.kind === "end_the_run")
      effects.push({
        kind: "etr",
        scope: "run_path",
        timing: "encounter_resolution",
        target: "corp_ice.end_run",
      });
    if (subroutine.kind === "corp_gain_credit")
      effects.push({
        kind: "economy",
        scope: "corp",
        timing: "encounter_resolution",
        resource: "credits",
        amount: subroutine.amount,
        finite: true,
        target: "corp_ice.credit_gain",
      });
    if (subroutine.kind === "runner_lose_credits")
      effects.push({
        kind: "run_tax",
        scope: "runner",
        timing: "encounter_resolution",
        resource: "credits",
        amount: subroutine.amount,
        finite: true,
        target: "corp_ice.credit_loss",
      });
    if (subroutine.kind === "give_runner_tag")
      effects.push({
        kind: "tag_source",
        scope: "runner",
        timing: "encounter_resolution",
        amount: subroutine.amount,
        finite: true,
        target: "corp_ice.tag_source",
      });
  }
  if (engine.variableRez?.kind === "x_strength")
    effects.push({
      kind: "global_modifier",
      scope: "ice",
      timing: "on_rez",
      resource: "strength",
      target: "corp_ice.rez_paid_scaling",
    });
  if (
    engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  )
    effects.push(
      {
        kind: "economy",
        scope: "corp",
        timing: "when_scored",
        resource: "credits",
        amount: engine.scoredAgenda.temporaryCredits.amount,
      },
      { kind: "install", scope: "remote", timing: "when_scored" },
      { kind: "remote_build", scope: "remote", timing: "when_scored" },
      { kind: "rez", scope: "remote", timing: "when_scored" },
    );
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "choose_stack_or_trash_program_install")
        effects.push(
          {
            kind: "search",
            scope: "runner",
            timing: "action",
            target: "program_search",
          },
          {
            kind: "install",
            scope: "installed_card",
            timing: "action",
            target: "program",
          },
          {
            kind: "install_discount",
            scope: "installed_card",
            timing: "action",
            target: "temporary_program_install",
          },
          {
            kind: "delayed_penalty",
            scope: "runner",
            timing: "runner_turn",
            target: "end_of_turn_bounce",
          },
        );
    }
  for (const effect of engine.lifecycle?.on_install ?? [])
    if (effect.kind === "gain_credits") {
      effects.push({
        kind: "economy",
        scope: "runner",
        timing: "persistent",
        target: "economy.high_risk_burst_credit",
      });
      effects.push({
        kind: "economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
        amount: effect.amount,
      });
      effects.push({
        kind: "counter_economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
      });
    }
  for (const entry of engine.lifecycle?.start_of_runner_turn ?? [])
    for (const effect of entry.effects) {
      if (effect.kind === "gain_credits")
        effects.push({
          kind: "economy",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          target: "economy.turn_start_credit",
          amount: effect.amount,
          repeatable: true,
        });
      if (effect.kind === "lose_credits" && effect.amount !== undefined) {
        effects.push({
          kind: "economy",
          scope: "runner",
          timing: "persistent",
          target: "economy.turn_start_credit",
        });
        effects.push({
          kind: "delayed_penalty",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          amount: effect.amount,
        });
      }
    }
  for (const entry of engine.lifecycle?.on_runner_run_start ?? [])
    if (entry.effects.some((effect) => effect.kind === "trash_source"))
      effects.push({
        kind: "delayed_penalty",
        scope: "runner",
        timing: "start_of_run",
        target: "risk.ends_on_run",
        finite: true,
      });
  for (const effect of engine.lifecycle?.on_leave_play ?? [])
    if (effect.kind === "pay_credits_or_lose_game") {
      effects.push(
        {
          kind: "delayed_penalty",
          scope: "runner",
          timing: "persistent",
          target: "risk.debt_loss_condition",
        },
        {
          kind: "delayed_penalty",
          scope: "runner",
          timing: "persistent",
          target: "risk.lose_game_debt",
        },
      );
      effects.push({
        kind: "delayed_penalty",
        scope: "runner",
        timing: "on_leave_play",
        resource: "credits",
        amount: effect.amount,
      });
    }
  return effects;
}

function deriveClosedExtendedHintEffects(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): NonNullable<AiCardHint["effects"]> {
  const engine = entry.planning.engine;
  const effects: NonNullable<AiCardHint["effects"]> = [];
  const relativeDynamicDamage = engine.relativeIce?.dynamicDamageSubroutine;
  const variableRunLockTrace = engine.printedSubroutines?.find(
    (subroutine) =>
      subroutine.kind === "trace" &&
      engine.variableRez?.kind === "x_strength" &&
      engine.variableRez.traceLimitFromValue === true &&
      subroutine.traceLimit === 0 &&
      subroutine.onSuccess.some((effect) => effect.kind === "end_run") &&
      subroutine.onSuccess.some(
        (effect) =>
          effect.kind === "runner_run_lock_until_action_paid" &&
          effect.amount === 2 &&
          effect.visibility === "public",
      ),
  );
  if (
    relativeDynamicDamage !== undefined &&
    !engine.printedSubroutines?.some(
      (subroutine) =>
        subroutine.kind === "damage" &&
        subroutine.capabilityKey ===
          relativeDynamicDamage.subroutineCapabilityKey,
    )
  )
    throw new Error("card_spec_unknown_relative_ice_dynamic_damage_binding");

  if (engine.scoredAgenda?.kind === "add_counters_on_score") {
    effects.push(
      {
        kind: "scored_agenda_action",
        scope: "score_area",
        timing: "when_scored",
        target: "score.action_counter_bank",
        finite: true,
      },
      {
        kind: "persistent_counter_effect",
        scope: "score_area",
        timing: "when_scored",
        resource: "counters",
        target: "score.action_counter_bank",
        amount: engine.scoredAgenda.amount,
        finite: true,
      },
    );
  }
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    effects.push(
      {
        kind: "persistent_counter_effect",
        scope: "runner",
        timing: "when_scored",
        resource: "counters",
        target: "virus.corp_counter_prevention",
        finite: true,
      },
      {
        kind: "prevention_replacement",
        scope: "corp",
        timing: "persistent",
        resource: "counters",
        target: "virus.corp_counter_prevention",
        amount: engine.scoredAgenda.preventCount,
        finite: true,
      },
    );
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    effects.push(
      {
        kind: "draw",
        scope: "corp",
        timing: "start_of_turn",
        resource: "cards",
        target: "score.recurring_draw",
        amount: engine.scoredAgenda.drawCount,
        repeatable: true,
      },
      {
        kind: "draw",
        scope: "corp",
        timing: "start_of_turn",
        resource: "cards",
        target: "draw.corp_draw",
        amount: engine.scoredAgenda.drawCount,
        repeatable: true,
      },
    );
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    effects.push(
      {
        kind: "access_replacement",
        scope: "accessed_card",
        timing: "on_access",
        resource: "cards",
        target: "access.runner_program_bounce",
        finite: true,
      },
      {
        kind: "install",
        scope: "runner",
        timing: "on_access",
        resource: "memory",
        target: "runner_installs_agenda_as_program",
        amount: engine.agendaAccessReplacement.memoryCost,
        finite: true,
      },
    );

  for (const ability of engine.abilities ?? []) {
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "add_current_run_access_count") {
        const additionalAccess = closedCurrentRunAdditionalAccess(entry);
        if (!additionalAccess)
          throw new Error(
            "card_spec_unknown_current_run_additional_access_shape",
          );
        const accessSignalServer =
          additionalAccess.server === "rd" ? "rnd" : additionalAccess.server;
        effects.push({
          kind: "multiaccess",
          scope: accessSignalServer,
          timing: "persistent",
          resource: "cards",
          target: `access.${accessSignalServer}_hidden_multiaccess`,
          amount: additionalAccess.amount,
          finite: true,
        });
      }
      if (effect.kind === "end_run")
        effects.push({
          kind: "etr",
          scope: "run_path",
          timing: "during_run",
          target: "remap_counter_end_run",
          finite: true,
        });
      if (effect.kind === "score_source_as_agenda")
        effects.push({
          kind: "scored_agenda_action",
          scope: "score_area",
          timing: "action",
          target: "score.closeout_agenda",
          finite: true,
        });
      if (effect.kind === "double_chosen_ice_strength_until_end_of_turn")
        effects.push(
          {
            kind: "global_modifier",
            scope: "ice",
            timing: "during_run",
            resource: "strength",
            target: "double_chosen_ice_strength_until_end_of_turn",
            finite: true,
          },
          {
            kind: "remote_protection",
            scope: "remote",
            timing: "during_run",
            target: "remote.scoring_protection",
            finite: true,
          },
        );
      if (effect.kind === "gain_credits")
        effects.push({
          kind: "economy",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          resource: "credits",
          target: "burst_credit",
          amount: effect.amount,
          finite: true,
        });
      if (effect.kind === "draw_cards")
        effects.push({
          kind: "draw",
          scope:
            effect.recipient === "controller"
              ? entry.definition.side
              : effect.recipient,
          timing: "action",
          resource: "cards",
          target: "draw",
          amount: effect.amount,
          finite: true,
        });
      if (effect.kind === "remove_tags")
        effects.push({
          kind: "tag_prevention",
          scope: "runner",
          timing: "action",
          resource: "tags",
          target: "remove_tags",
          finite: true,
          ...(effect.mode === "all"
            ? {}
            : {
                amount: requiredFiniteNumber(
                  effect.amount,
                  "remove_tags.amount",
                ),
              }),
        });
      if (effect.kind === "avoid_next_tag")
        effects.push({
          kind: "tag_prevention",
          scope: "runner",
          timing: "persistent",
          resource: "tags",
          target: "avoid_next_tag",
          amount: effect.amount,
          finite: true,
        });
      if (effect.kind === "private_look")
        effects.push({
          kind: effect.zone === "hq" ? "hq_info" : "topdeck_info",
          scope: effect.zone === "rd" ? "rnd" : effect.zone,
          timing: "action",
          resource: "cards",
          target: effect.zone === "hq" ? "full_reveal" : "top_cards",
          ...(typeof effect.count === "number" ? { amount: effect.count } : {}),
          repeatable: true,
        });
      if (effect.kind === "make_run") {
        effects.push({
          kind: "future_run_effect",
          scope:
            effect.target.kind === "central_server"
              ? effect.target.server === "rd"
                ? "rnd"
                : effect.target.server
              : "runner",
          timing: "action",
          target:
            effect.target.kind === "central_server"
              ? `make_${effect.target.server === "rd" ? "rnd" : effect.target.server}_run`
              : "make_chosen_server_run",
          finite: true,
        });
        if (effect.successfulRunAccessReplacement !== undefined) {
          const replacement = effect.successfulRunAccessReplacement;
          const replacementScope =
            effect.target.kind === "central_server"
              ? effect.target.server === "rd"
                ? "rnd"
                : effect.target.server
              : "server";
          effects.push({
            kind: "access_replacement",
            scope: replacementScope,
            timing: "successful_run",
            target: replacement,
            finite: true,
          });
          if (replacement === "reveal_rd_until_agenda_store_in_hq")
            effects.push({
              kind: "topdeck_info",
              scope: "rnd",
              timing: "successful_run",
              resource: "cards",
              target: "reveal_until_agenda",
              finite: true,
            });
          if (replacement === "private_look_top_rd")
            effects.push({
              kind: "topdeck_info",
              scope: "rnd",
              timing: "successful_run",
              resource: "cards",
              target: "private_look_top_rd",
              amount: requiredFiniteNumber(
                effect.successfulRunPrivateLookCount,
                "successfulRunPrivateLookCount",
              ),
              finite: true,
            });
          if (replacement === "corp_lose_credits")
            effects.push({
              kind: "economy",
              scope: "corp",
              timing: "successful_run",
              resource: "credits",
              target: "economy.corp_credit_loss",
              amount: requiredFiniteNumber(
                effect.successfulRunCreditLoss,
                "successfulRunCreditLoss",
              ),
              finite: true,
            });
          if (replacement === "archives_faceup_to_rd")
            effects.push({
              kind: "card_recovery",
              scope: "archives",
              timing: "successful_run",
              resource: "cards",
              target: "archives_faceup_to_rd",
              amount: requiredFiniteNumber(
                effect.successfulRunArchivesMoveCount,
                "successfulRunArchivesMoveCount",
              ),
              finite: true,
            });
          if (replacement === "trash_rezzed_ice_on_fort_and_tag_runner")
            effects.push({
              kind: "ice_trash",
              scope: "fort",
              timing: "successful_run",
              target: "trash_rezzed_ice_on_fort",
              finite: true,
            });
          if (replacement === "runner_gain_agenda_point")
            effects.push({
              kind: "scored_agenda_action",
              scope: "runner",
              timing: "successful_run",
              resource: "agenda_points",
              target: "runner_gain_agenda_point",
              amount: 1,
              finite: true,
            });
        }
        if (effect.corpRezCostSurcharge !== undefined)
          effects.push({
            kind: "run_tax",
            scope: "corp",
            timing: "during_run",
            resource: "credits",
            target: "matching_printed_rez_cost_surcharge",
            finite: true,
          });
      }
      if (effect.kind === "transfer_hosted_credits")
        effects.push({
          kind:
            effect.direction === "controller_to_source"
              ? "finite_economy_pool"
              : "economy",
          scope: "corp",
          timing: "action",
          target:
            effect.direction === "controller_to_source"
              ? "economy.corp_charge_bank"
              : "economy.corp_action_charged_bank",
        });
    }
  }

  for (const subroutine of engine.printedSubroutines ?? []) {
    const isRelativeDynamicDamage =
      subroutine.kind === "damage" &&
      engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
      relativeDynamicDamage?.subroutineCapabilityKey ===
        subroutine.capabilityKey;
    if (subroutine.kind === "damage") {
      if (isRelativeDynamicDamage && relativeDynamicDamage !== undefined)
        if (relativeDynamicDamage.amountPerCount <= 0)
          throw new Error(
            "card_spec_unknown_relative_ice_dynamic_damage_shape",
          );
        else
          effects.push({
            kind: "damage",
            scope: "runner",
            timing: "encounter_resolution",
            resource: hintDamageResource(subroutine.damageType),
            target: "corp_ice.outer_ice_scaling",
            amount: relativeDynamicDamage.amountPerCount,
          });
      else {
        if (typeof subroutine.amount !== "number")
          throw new Error(
            "card_spec_unknown_relative_ice_dynamic_damage_binding",
          );
        effects.push({
          kind: "damage",
          scope: "runner",
          timing: "encounter",
          resource: "damage",
          target: `corp_ice.${subroutine.damageType}_damage`,
          amount: subroutine.amount,
          finite: true,
        });
      }
    }
    if (subroutine.kind === "next_encounter_unless_fully_break_damage")
      effects.push(
        {
          kind: "future_encounter_effect",
          scope: "runner",
          timing: "encounter",
          resource: hintDamageResource(subroutine.damageType),
          target: "next_encounter_unless_fully_break_damage",
          amount: subroutine.amount,
          finite: true,
        },
        {
          kind: "damage",
          scope: "runner",
          timing: "encounter",
          resource: hintDamageResource(subroutine.damageType),
          target: `damage.${subroutine.damageType}`,
          amount: subroutine.amount,
          finite: true,
        },
      );
    if (subroutine.kind === "random_damage")
      effects.push({
        kind: "damage",
        scope: "runner",
        timing: "encounter",
        resource: "damage",
        target: "corp_ice.brain_damage",
        amount: subroutine.amount,
        finite: true,
      });
    if (subroutine.kind === "trace") {
      if (subroutine === variableRunLockTrace)
        effects.push(
          {
            kind: "trace",
            scope: "trace",
            timing: "encounter_resolution",
            target: "corp_ice.trace_source",
          },
          {
            kind: "etr",
            scope: "run_path",
            timing: "trace_success",
            target: "corp_ice.conditional_end_run",
          },
          {
            kind: "run_lock",
            scope: "runner",
            timing: "trace_success",
            resource: "actions",
            target: "corp_ice.run_lock",
          },
        );
      else
        effects.push({
          kind: "trace",
          scope: "runner",
          timing: "encounter",
          target: "trace.source",
          finite: true,
        });
    }
    if (subroutine.kind === "end_the_run")
      effects.push({
        kind: "etr",
        scope: "run_path",
        timing:
          engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
          relativeDynamicDamage !== undefined
            ? "encounter_resolution"
            : "encounter",
        target: "corp_ice.end_run",
        ...(relativeDynamicDamage === undefined ? { finite: true } : {}),
      });
    if (subroutine.kind === "prohibit_break_next_ice")
      effects.push({
        kind: "future_encounter_effect",
        scope: "run_path",
        timing: "encounter",
        target: "corp_ice.next_ice_break_lock",
        finite: true,
      });
    if (subroutine.kind === "trash_program")
      effects.push({
        kind: "program_trash",
        scope: "installed_program",
        timing: "encounter",
        target: "corp_ice.program_trash",
        finite: true,
      });
    if (subroutine.kind === "deflect_run")
      effects.push({
        kind: "run_lock",
        scope: "run_path",
        timing: "encounter",
        target: "run.corp_redirect",
        ...(subroutine.cost === undefined
          ? {}
          : { resource: "credits", amount: subroutine.cost.amount }),
        finite: true,
      });
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      effects.push(
        {
          kind: "etr",
          scope: "run_path",
          timing: "encounter",
          target: "corp_ice.end_run",
          finite: true,
        },
        {
          kind: "delayed_penalty",
          scope: "corp",
          timing: "end_of_turn",
          resource: "cards",
          target: "trash_source_at_end_of_turn",
          finite: true,
        },
      );
  }
  if (
    engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
    engine.relativeIce.strengthBonusPerCount !== undefined
  ) {
    if (engine.relativeIce.strengthBonusPerCount <= 0)
      throw new Error("card_spec_unknown_relative_ice_strength_shape");
    effects.push({
      kind: "global_modifier",
      scope: "ice",
      timing: "persistent",
      resource: "strength",
      target: "ice.strength_modifier",
    });
  }
  if (engine.variableRez?.kind === "x_strength")
    effects.push({
      kind: "global_modifier",
      scope: "ice",
      timing: "on_rez",
      resource: "strength",
      target: "corp_ice.rez_paid_scaling",
    });
  if (
    (engine.printedSubroutines ?? []).filter(
      (subroutine) =>
        subroutine.kind === "end_the_run" ||
        subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn",
    ).length > 1
  ) {
    for (let index = effects.length - 1; index >= 0; index -= 1)
      if (
        effects[index]?.kind === "etr" &&
        effects[index]?.target === "corp_ice.end_run"
      )
        effects.splice(index, 1);
    effects.unshift({
      kind: "etr",
      scope: "run_path",
      timing: "encounter",
      target: "corp_ice.end_run",
      finite: true,
    });
    effects.splice(1, 0, {
      kind: "etr",
      scope: "run_path",
      timing: "encounter",
      target: "corp_ice.multi_end_run",
      finite: true,
    });
  }

  if (engine.selfRezCostModifiers !== undefined) {
    const rezDiscount = engine.selfRezCostModifiers.reduce(
      (total, modifier) => total + modifier.amount,
      0,
    );
    if (rezDiscount <= 0)
      throw new Error("card_spec_unknown_self_rez_cost_modifier_shape");
    effects.push({
      kind: "rez_discount",
      scope: "corp",
      timing: "during_run",
      resource: "credits",
      target: "noisy_icebreaker_self_rez_discount",
      amount: rezDiscount,
      finite: true,
    });
  }
  if (engine.runnerCounterEffects !== undefined) {
    for (const counter of engine.runnerCounterEffects) {
      if (counter.runStart !== undefined) {
        const amountPerCounter = requiredFiniteNumber(
          counter.runStart.amountPerCounter,
          "runner_counter_effect.run_start.amount_per_counter",
        );
        effects.push({
          kind: "persistent_counter_effect",
          scope: "runner",
          timing: "start_of_run",
          resource:
            counter.runStart.damageType === "brain"
              ? "brain_damage"
              : "net_damage",
          target: `runner_counter_${counter.counterType}_run_start_${counter.runStart.damageType}_damage`,
          amount: amountPerCounter,
          repeatable: true,
        });
      }
      if (counter.startOfRunnerTurn !== undefined) {
        const amountPerCounter = requiredFiniteNumber(
          counter.startOfRunnerTurn.amountPerCounter,
          "runner_counter_effect.start_of_runner_turn.amount_per_counter",
        );
        const consequence =
          counter.startOfRunnerTurn.kind === "add_tags" ? "tags" : "credits";
        effects.push({
          kind: "persistent_counter_effect",
          scope: "runner",
          timing: "start_of_turn",
          resource: consequence,
          target: `runner_counter_${counter.counterType}_start_of_runner_turn_${consequence}`,
          amount: amountPerCounter,
          repeatable: true,
        });
      }
      effects.push({
        kind: "persistent_counter_effect",
        scope: "runner",
        timing: "action",
        resource: "counters",
        target: `runner_counter_${counter.counterType}_remove_for_${requiredFiniteNumber(
          counter.removeCost,
          "runner_counter_effect.remove_cost",
        )}_credits`,
        amount: 1,
        repeatable: true,
      });
    }
  }
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      effects.push({
        kind: "future_encounter_effect",
        scope: "run_path",
        timing: "start_of_run",
        target: "move_self_to_outermost_position_on_other_fort",
        finite: true,
      });

  appendClosedCorpUtilityEffects(effects, engine.corpUtility);
  appendClosedAccessEffects(effects, engine.accessEffects);
  appendClosedBreakerEffects(effects, engine);
  appendClosedRunnerLongtailEffects(effects, engine);
  appendClosedHardwareEffects(effects, engine);
  const seen = new Set<string>();
  return effects.filter((effect) => {
    const fingerprint = JSON.stringify(effect);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

function appendClosedCorpUtilityEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  utility: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"]["corpUtility"],
): void {
  if (utility?.kind === "runner_memory_limit_modifier_until_end_of_turn")
    effects.push(
      {
        kind: "global_modifier",
        scope: "runner",
        timing: "action",
        resource: "memory",
        target: "runner_memory_limit_modifier_until_end_of_turn",
        amount: -utility.amount,
        finite: true,
      },
      {
        kind: "program_trash",
        scope: "installed_program",
        timing: "action",
        target: "memory_pressure_program_trash",
        finite: true,
      },
      {
        kind: "tag_punish_payoff",
        scope: "runner",
        timing: "action",
        resource: "memory",
        target: "memory_pressure",
        amount: utility.amount,
        finite: true,
      },
    );
  if (utility?.kind === "draw_corp_cards_then_shuffle_hq_card_into_rd")
    effects.push(
      {
        kind: "draw",
        scope: "corp",
        timing: "action",
        resource: "cards",
        target: "draw.corp_draw",
        amount: utility.drawCount,
        finite: true,
      },
      {
        kind: "zone_shuffle",
        scope: "rnd",
        timing: "action",
        resource: "cards",
        target: "rnd.corp_shuffle_hq_into_rnd",
        amount: 1,
        finite: true,
      },
    );
  if (utility?.kind === "corp_archives_to_hq")
    effects.push(
      {
        kind: "card_recovery",
        scope: "archives",
        timing: "action",
        resource: "cards",
        target: "archives.corp_recovery",
        finite: true,
      },
      {
        kind: "search",
        scope: "archives",
        timing: "action",
        resource: "cards",
        target: "ice_recovery",
        finite: true,
      },
    );
  if (utility?.kind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
    effects.push({
      kind: "tag_source",
      scope: "runner",
      timing: "start_of_turn",
      resource: "tags",
      target: "tag.source",
      amount: utility.tagOn,
      repeatable: true,
    });
  if (utility?.kind === "end_turn_tag_if_runner_received_tag")
    effects.push({
      kind: "tag_source",
      scope: "runner",
      timing: "end_of_turn",
      resource: "tags",
      target: "tag.additional_source",
      amount: 1,
      repeatable: true,
    });
  if (utility?.kind === "corp_draw_extra_then_bottom_one")
    effects.push(
      {
        kind: "draw",
        scope: "corp",
        timing: "persistent",
        resource: "cards",
        target: "draw.corp_draw",
        amount: utility.extraDraw,
        repeatable: true,
      },
      {
        kind: "zone_shuffle",
        scope: "rnd",
        timing: "persistent",
        resource: "cards",
        target: "bottom_one_drawn_card",
        amount: 1,
        repeatable: true,
      },
    );
  if (utility?.kind === "run_start_lose_runner_credits_per_tag")
    effects.push(
      {
        kind: "run_tax",
        scope: "runner",
        timing: "start_of_run",
        resource: "credits",
        target: "tax.runner_credit",
        repeatable: true,
      },
      {
        kind: "tag_punish_payoff",
        scope: "runner",
        timing: "start_of_run",
        resource: "credits",
        target: "tag.payoff",
        repeatable: true,
      },
    );
}

function appendClosedAccessEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  accesses: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"]["accessEffects"],
): void {
  for (const access of accesses ?? []) {
    effects.push({
      kind: "ambush",
      scope: "accessed_card",
      timing: "on_access",
      target: "remote.ambush",
      finite: true,
    });
    for (const effect of access.effects) {
      if (effect.kind === "trace") {
        effects.push({
          kind: "trace",
          scope: "runner",
          timing: "on_access",
          target: "trace.source",
          finite: true,
        });
        for (const successEffect of effect.onSuccess) {
          if (successEffect.kind !== "add_tags") continue;
          effects.push({
            kind: "tag_source",
            scope: "runner",
            timing: "trace_success",
            resource: "tags",
            target: "tag.source",
            amount: successEffect.amount,
            finite: true,
          });
        }
      }
      if (
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner"
      )
        effects.push(
          {
            kind: "damage",
            scope: "runner",
            timing: "on_access",
            resource: "damage",
            target: "access.corp_net_damage_ambush",
            repeatable: true,
          },
          {
            kind: "ice_trash",
            scope: "server",
            timing: "on_access",
            target: "ice.corp_self_trash_cost",
            finite: true,
          },
        );
      if (effect.kind === "trash_installed_runner_hardware_and_programs")
        effects.push(
          {
            kind: "hardware_trash",
            scope: "runner",
            timing: "on_access",
            target: "access.corp_hardware_trash",
            finite: true,
          },
          {
            kind: "program_trash",
            scope: "installed_program",
            timing: "on_access",
            target: "access.corp_program_trash",
            amount: effect.programAmount,
            finite: true,
          },
          {
            kind: "tag_punish_payoff",
            scope: "runner",
            timing: "on_access",
            target: "tag.payoff",
            finite: true,
          },
        );
    }
  }
}

function appendClosedBreakerEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): void {
  const breaker = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breaker?.kind !== "break_subroutine") return;
  effects.push({ kind: "breaker", scope: "runner", timing: "persistent" });
  if (breaker.special?.kind === "once_per_run_break_tag_and_all_stealth_loss")
    effects.push(
      {
        kind: "tag",
        scope: "runner",
        timing: "during_run",
        resource: "tags",
        target: "self_tag_after_first_sentry_break",
        amount: 1,
      },
      {
        kind: "finite_economy_pool",
        scope: "runner",
        timing: "during_run",
        resource: "credits",
        target: "stealth_credit_loss",
      },
    );
  if (breaker.special?.kind === "run_end_trash_source_if_used")
    effects.push({
      kind: "delayed_penalty",
      scope: "installed_program",
      timing: "on_leave_play",
      target: "run_end_self_trash",
    });
}

function appendClosedRunnerLongtailEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): void {
  const utility = engine.runnerUtilityLongtail;
  if (utility?.kind === "hq_access_expose_all_installed_corp_cards")
    effects.push(
      {
        kind: "hq_info",
        scope: "hq",
        timing: "on_access",
        resource: "cards",
        target: "full_reveal",
      },
      {
        kind: "expose_info",
        scope: "installed_card",
        timing: "on_access",
        resource: "cards",
        target: "installed_corp_cards",
      },
    );
  if (
    utility?.kind === "derez_fully_broken_passed_ice" ||
    utility?.kind === "derez_fully_broken_passed_ice_and_end_run"
  )
    effects.push({
      kind: "rez",
      scope: "ice",
      timing: "encounter_resolution",
      target: "derez",
    });
  if (utility?.kind === "access_point_subroutine_modifier")
    effects.push(
      {
        kind: "damage_prevention",
        scope: "runner",
        timing: "encounter",
        resource: "net_damage",
        target: "ap_net_damage_reduction",
        repeatable: true,
      },
      {
        kind: "run_tax",
        scope: "runner",
        timing: "during_run",
        resource: "credits",
        target: "run.break_cost_penalty",
        amount: 1,
        repeatable: true,
      },
    );
  if (utility?.kind === "base_memory_equals_grip_count")
    effects.push({
      kind: "global_modifier",
      scope: "runner",
      timing: "persistent",
      resource: "memory",
      target: "base_memory_equals_grip_count",
    });
  if (utility?.kind === "trace_attempts_auto_success_add_tag")
    effects.push(
      {
        kind: "trace",
        scope: "trace",
        timing: "trace_window",
        target: "runner_trace_attempts_auto_success",
        repeatable: true,
      },
      {
        kind: "tag",
        scope: "runner",
        timing: "trace_success",
        resource: "tags",
        target: "self_tag_after_trace",
        amount: 1,
        repeatable: true,
      },
    );
  if (utility?.kind === "first_prep_credit_gain_bonus")
    effects.push({
      kind: "economy",
      scope: "runner",
      timing: "action",
      resource: "credits",
      target: "economy.conditional_burst_credit",
      amount: utility.amount,
      repeatable: true,
    });

  for (const followup of engine.successfulRunFollowups ?? []) {
    if (followup.kind === "optional_make_run_after_successful_run")
      effects.push({
        kind: "future_run_effect",
        scope: "runner",
        timing: "after_successful_run",
        target: "make_run",
        repeatable: true,
      });
    if (
      followup.kind ===
      "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count"
    )
      effects.push(
        {
          kind: "access_punish",
          scope: "runner",
          timing: "after_successful_run",
          resource: "cards",
          target: "runner_grip_shuffle_stack_redraw",
          repeatable: true,
        },
        {
          kind: "zone_shuffle",
          scope: "stack",
          timing: "after_successful_run",
          resource: "cards",
          target: "runner_grip_shuffle_stack_redraw",
          repeatable: true,
        },
        {
          kind: "draw",
          scope: "runner",
          timing: "after_successful_run",
          resource: "cards",
          target: "same_count_redraw",
          repeatable: true,
        },
      );
    if (followup.kind === "skip_rd_access_add_purgeable_runner_virus_counter")
      effects.push({
        kind: "access_replacement",
        scope: "rnd",
        timing: "successful_run",
        resource: "counters",
        target: "virus.doom_counter",
        amount: followup.amount,
        repeatable: true,
      });
    if (followup.kind === "force_rez_ice_outermost_inward_after_successful_run")
      effects.push({
        kind: "rez",
        scope: "ice",
        timing: "after_successful_run",
        target: "force_rez_bound_fort_ice_outermost_inward",
        repeatable: true,
      });
  }

  if (
    engine.virusCounter?.onCorpInstall?.kind ===
    "roll_per_counter_trash_installed_card_and_remove_counter_on_success"
  )
    effects.push({
      kind: "persistent_counter_effect",
      scope: "corp",
      timing: "install",
      resource: "counters",
      target: "install.corp_random_trash",
      repeatable: true,
    });

  const event = engine.runnerEventLongtail;
  if (event?.kind === "trash_grip_search_stack_to_grip_equal_count")
    effects.push(
      {
        kind: "search",
        scope: "stack",
        timing: "action",
        resource: "cards",
        target: "stack_card_search",
        finite: true,
      },
      {
        kind: "zone_shuffle",
        scope: "stack",
        timing: "action",
        resource: "cards",
        target: "shuffle_after_search",
        finite: true,
      },
      {
        kind: "delayed_penalty",
        scope: "runner",
        timing: "action",
        resource: "cards",
        target: "trash_grip_as_search_cost",
        finite: true,
      },
    );
  if (event?.kind === "runner_corruption_agenda_point_transfer")
    effects.push(
      {
        kind: "economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
        target: "credits_per_agenda_point_lost",
        amount: event.creditsPerAgendaPoint,
        finite: true,
      },
      {
        kind: "tag",
        scope: "runner",
        timing: "action",
        resource: "tags",
        target: "self_tag_after_agenda_transfer",
        amount: event.tagRunner,
        finite: true,
      },
      {
        kind: "run_tax",
        scope: "score_area",
        timing: "action",
        target: "agenda_points_given_to_corp",
        finite: true,
      },
    );
  if (event?.kind === "do_the_drine_unpreventable_core_damage_for_credits")
    effects.push(
      {
        kind: "economy",
        scope: "runner",
        timing: "action",
        resource: "credits",
        target: "credits_per_self_brain_damage",
        amount: event.creditsPerDamage,
        finite: true,
      },
      {
        kind: "damage",
        scope: "runner",
        timing: "action",
        resource: "brain_damage",
        target: "self_unpreventable_brain_damage",
        finite: true,
      },
    );
  if (event?.kind === "three_dice_gain_credits")
    effects.push({
      kind: "economy",
      scope: "runner",
      timing: "action",
      resource: "credits",
      target: "three_dice_credit_gain_expected_value",
      amount: Math.floor((event.diceCount * (event.dieFaces + 1)) / 2),
      finite: true,
    });
  if (event?.kind === "library_search_run")
    effects.push(
      {
        kind: "future_run_effect",
        scope: "runner",
        timing: "action",
        target: "make_hq_or_rnd_run",
        finite: true,
      },
      {
        kind: "multiaccess",
        scope: "hq",
        timing: "successful_run",
        resource: "cards",
        amount: event.accessBonus,
        finite: true,
      },
      {
        kind: "multiaccess",
        scope: "rnd",
        timing: "successful_run",
        resource: "cards",
        amount: event.accessBonus,
        finite: true,
      },
      {
        kind: "run_lock",
        scope: "run_path",
        timing: "during_run",
        target: "no_noisy_icebreaker_or_trace",
        finite: true,
      },
    );
}

function appendClosedHardwareEffects(
  effects: NonNullable<AiCardHint["effects"]>,
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
): void {
  if (engine.hardwareDeck === true)
    effects.push({
      kind: "hardware_trait",
      scope: "hardware",
      timing: "persistent",
      target: "deck_exclusive",
    });
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "memory_units")
      effects.push({
        kind: "global_modifier",
        scope: "runner",
        timing: "persistent",
        resource: "memory",
        amount: modifier.amount,
      });
    if (modifier.kind === "hand_size")
      effects.push({
        kind: "hand_size_modifier",
        scope: "runner",
        timing: "persistent",
        resource: "hand_size",
        amount: modifier.amount,
      });
    if (
      modifier.kind === "break_subroutine_cost" ||
      modifier.kind === "break_ability_use_cost"
    )
      effects.push({
        kind: "run_tax",
        scope: modifier.sameServerAsSource ? "fort" : "runner",
        timing: "during_run",
        resource: "credits",
        target: "run.break_cost_penalty",
        amount: modifier.amount,
        repeatable: true,
      });
  }
  for (const source of engine.restrictedHostedCreditSource === undefined
    ? []
    : [engine.restrictedHostedCreditSource])
    for (const use of source.usableFor)
      effects.push({
        kind: "recurring_economy",
        scope: "runner",
        timing: "persistent",
        resource: "credits",
        target: restrictedHostedCreditTarget(use),
        amount: source.capacity,
        economyMode: "restricted_credit",
        repeatable: true,
      });
  for (const source of engine.tagPreventionSources ?? [])
    if (source.cost.kind === "credit_and_forgo_next_action")
      effects.push({
        kind: "action_penalty",
        scope: "runner",
        timing: "prevention_window",
        resource: "actions",
        target: "action_loss",
        amount: 1,
      });
  for (const trigger of engine.lifecycle?.start_of_runner_turn ?? [])
    for (const effect of trigger.effects)
      if (effect.kind === "gain_credits")
        effects.push({
          kind: "economy",
          scope: "runner",
          timing: "start_of_turn",
          resource: "credits",
          target: "economy.turn_start_credit",
          amount: effect.amount,
          repeatable: true,
        });
  for (const trigger of engine.lifecycle?.on_runner_run_start ?? [])
    if (trigger.effects.some((effect) => effect.kind === "trash_source"))
      effects.push({
        kind: "delayed_penalty",
        scope: "runner",
        timing: "start_of_run",
        target: "risk.ends_on_run",
        finite: true,
      });
  for (const effect of engine.lifecycle?.on_leave_play ?? []) {
    if (effect.kind === "lose_credits")
      effects.push({
        kind: "delayed_penalty",
        scope: "runner",
        timing: "on_leave_play",
        resource: "credits",
        target: "risk.leaves_play_loss",
        amount: requiredFiniteNumber(
          effect.amount,
          "lifecycle.on_leave_play.lose_credits.amount",
        ),
        finite: true,
      });
    if (effect.kind === "damage")
      effects.push({
        kind: "damage",
        scope: "runner",
        timing: "on_leave_play",
        resource: hintDamageResource(effect.damageType),
        target: "self_inflicted_brain_damage",
        amount: effect.amount,
        finite: true,
      });
  }
  if (engine.runnerUtilityLongtail?.kind === "start_turn_random_effect_table")
    for (const outcome of engine.runnerUtilityLongtail.outcomes)
      if (outcome.kind === "unpreventable_damage")
        effects.push({
          kind: "damage",
          scope: "runner",
          timing: "start_of_turn",
          resource: hintDamageResource(outcome.damageType),
          target: "self_inflicted_brain_damage",
          amount: outcome.amount,
          repeatable: true,
        });
}

function restrictedHostedCreditTarget(
  use: NonNullable<
    PlanningEntry["planning"]["engine"]["restrictedHostedCreditSource"]
  >["usableFor"][number],
): string {
  switch (use) {
    case "using_icebreaker_during_run":
      return "icebreaker";
    case "using_icebreaker_during_run_non_noisy":
      return "non_noisy_icebreaker";
    case "using_killer_during_run":
      return "killer";
    case "increase_link":
      return "link";
    case "trash_nodes":
      return "node_trash";
    case "trash_upgrades":
      return "upgrade_trash";
    case "install_programs":
      return "program_install";
    case "remove_tags":
      return "tag_clear";
    case "play_events":
      return "play_events";
  }
}

function hintDamageResource(
  damageType: "net" | "meat" | "core" | "brain",
): "net_damage" | "meat_damage" | "brain_damage" {
  if (damageType === "net") return "net_damage";
  if (damageType === "meat") return "meat_damage";
  if (damageType === "core" || damageType === "brain") return "brain_damage";
  throw new Error(`card_spec_unknown_damage_type: ${String(damageType)}`);
}

function accessDamageAmbushSignal(
  damageType: "net" | "meat" | "core" | "brain",
):
  | "access.corp_net_damage_ambush"
  | "access.corp_meat_damage_ambush"
  | "access.corp_brain_damage_ambush" {
  if (damageType === "net") return "access.corp_net_damage_ambush";
  if (damageType === "meat") return "access.corp_meat_damage_ambush";
  if (damageType === "core" || damageType === "brain")
    return "access.corp_brain_damage_ambush";
  throw new Error(`card_spec_unknown_damage_type: ${String(damageType)}`);
}

function derivedFunctionSignals(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const signals = new Set<string>();
  const relativeDynamicDamage = engine.relativeIce?.dynamicDamageSubroutine;
  if (engine.corpRootRezCreditOutcome !== undefined) {
    signals.add("economy.corp_credit_burst");
    signals.add("economy.generic");
  }
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "rez_cost") signals.add("economy.rez_discount");
    if (modifier.kind === "ice_strength") signals.add("ice.strength_modifier");
  }
  for (const access of engine.accessEffects ?? []) {
    if (access.ignoreIfAccessedFrom?.includes("archives"))
      signals.add("access.archives_safe_exception");
    if (access.revealIfAccessedFrom?.includes("rd"))
      signals.add("access.rnd_reveal_requirement");
    for (const effect of access.effects)
      if (
        effect.kind === "damage" ||
        effect.kind === "damage_from_source_advancement_counters"
      ) {
        signals.add(accessDamageAmbushSignal(effect.damageType));
        if (effect.kind === "damage_from_source_advancement_counters")
          signals.add("advance.corp_counter_bank");
      }
  }
  for (const window of engine.fortRunWindows ?? []) {
    if (window.kind === "server_run_start_restriction") {
      signals.add("condition.corp_installed_or_advanced_this_fort_last_turn");
      signals.add("run.corp_server_lock");
      signals.add("tax.remote");
    }
    if (window.kind === "corp_trace_bits_during_runs_on_this_fort")
      signals.add("trace.corp_credit_support");
  }
  if (engine.variableRez !== undefined) {
    signals.add("corp_ice.rez_paid_scaling");
    signals.add("ice.strength_modifier");
  }
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage") {
      if (
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
        relativeDynamicDamage?.subroutineCapabilityKey ===
          subroutine.capabilityKey
      ) {
        signals.add("corp_ice.outer_ice_scaling");
        signals.add("damage.payoff");
      } else signals.add(`corp_ice.${subroutine.damageType}_damage`);
    }
    if (subroutine.kind === "end_the_run") {
      signals.add("corp_ice.end_run");
      signals.add("ice.etr");
    }
    if (subroutine.kind === "corp_gain_credit") {
      signals.add("corp_ice.credit_gain");
      signals.add("economy.corp_credit_burst");
      signals.add("economy.generic");
    }
    if (subroutine.kind === "runner_lose_credits") {
      signals.add("corp_ice.credit_loss");
      signals.add("tax.runner_credit");
      signals.add("tax.ice");
    }
    if (subroutine.kind === "give_runner_tag") {
      signals.add("corp_ice.tag_source");
      signals.add("tag.source");
    }
  }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits") {
        signals.add(`economy.${effect.recipient}_credit_burst`);
        signals.add("economy.generic");
      }
      if (effect.kind === "draw_cards")
        signals.add(`draw.${effect.recipient}_draw`);
      if (effect.kind === "add_current_run_access_count") {
        const additionalAccess = closedCurrentRunAdditionalAccess(entry);
        if (!additionalAccess)
          throw new Error(
            "card_spec_unknown_current_run_additional_access_shape",
          );
        const accessSignalServer =
          additionalAccess.server === "rd" ? "rnd" : additionalAccess.server;
        signals.add(`access.${accessSignalServer}_hidden_multiaccess`);
        signals.add(`access.${accessSignalServer}_multiaccess`);
      }
      if (
        effect.kind === "lose_credits" &&
        effect.recipient === "runner" &&
        ability.condition?.kind === "runner_is_tagged"
      ) {
        signals.add("risk.requires_tagged_runner");
        signals.add("tag.payoff");
      }
      if (
        effect.kind === "add_hosted_credits" ||
        effect.kind === "take_hosted_credits"
      ) {
        signals.add("economy.action");
        signals.add("economy.action_credit");
        signals.add("economy.counter");
        signals.add("economy.generic");
        signals.add("economy.temporary_resource_bank");
      }
      if (effect.kind === "choose_stack_or_trash_program_install")
        for (const signal of [
          "setup.end_of_turn_bounce",
          "setup.install_discount",
          "setup.program_install",
          "setup.program_search",
          "setup.search",
          "setup.temporary_program_install",
        ])
          signals.add(signal);
    }
  if (
    engine.abilities?.some(
      (ability) =>
        ability.condition?.kind === "current_run_server" &&
        ability.condition.server === "hq",
    )
  ) {
    signals.add("condition.during_hq_run");
  }
  if (
    engine.lifecycle?.on_install?.some(
      (effect) => effect.kind === "gain_credits",
    )
  )
    for (const signal of [
      "economy.counter",
      "economy.generic",
      "economy.high_risk_burst_credit",
    ])
      signals.add(signal);
  if (
    engine.lifecycle?.start_of_runner_turn?.some((entry) =>
      entry.effects.some((effect) => effect.kind === "gain_credits"),
    )
  )
    for (const signal of ["economy.generic", "economy.turn_start_credit"])
      signals.add(signal);
  if (
    engine.lifecycle?.on_leave_play?.some(
      (effect) => effect.kind === "pay_credits_or_lose_game",
    )
  )
    for (const signal of ["risk.debt_loss_condition", "risk.lose_game_debt"])
      signals.add(signal);
  const breakerSignalAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "break_subroutine",
  );
  if (breakerSignalAbility?.kind === "break_subroutine") {
    if (breakerSignalAbility.matches.kind === "ice_subtype")
      signals.add(
        `breaker.${breakerCoverageForSubtype(
          breakerSignalAbility.matches.subtype,
        )}`,
      );
    else signals.add("breaker.configurable_coverage");
  }
  if (engine.icebreakerSubtypeChange !== undefined)
    signals.add("breaker.reconfigurable_type");
  if (engine.icebreakerEncounterStrengthBonus !== undefined) {
    signals.add("breaker.strength_bonus_vs_chosen_ice");
    signals.add("breaker.targeted_ice_bonus");
  }
  if (
    entry.definition.type === "resource" &&
    entry.definition.subtypes.includes("connection")
  )
    signals.add("resource.connection");
  if (engine.scoredAgenda?.kind === "add_counters_on_score")
    for (const signal of [
      "defense.corp_run_end_counter",
      "run.corp_end_run_counter",
      "score.action_counter_bank",
      "score.agenda_action",
      "score.run_end_counter_bank",
    ])
      signals.add(signal);
  if (
    engine.scoredAgenda?.kind === "purge_runner_virus_counters_and_prevent_next"
  )
    for (const signal of [
      "defense.virus_counter_defense",
      "virus.corp_counter_clear",
      "virus.corp_counter_prevention",
    ])
      signals.add(signal);
  if (engine.scoredAgenda?.kind === "corp_start_turn_mandatory_draw")
    for (const signal of [
      "draw.corp_draw",
      "draw.corp_recurring",
      "score.recurring_draw",
    ])
      signals.add(signal);
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    for (const signal of [
      "access.corp_agenda_steal_replacement",
      "access.corp_delayed_agenda_score",
      "access.corp_runner_agenda_program_install",
      "access.runner_program_bounce",
      "risk.fragile_delayed_score",
      "risk.program_removal_denies_score",
      "risk.runner_memory_burden",
      "score.agenda_action",
      "score.closeout_agenda",
    ])
      signals.add(signal);
  if (engine.selfRezCostModifiers !== undefined)
    for (const signal of ["corp_ice.rez_economy", "economy.rez_discount"])
      signals.add(signal);
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "trace") {
      signals.add("corp_ice.trace_source");
      signals.add("trace.source");
      for (const outcome of subroutine.onSuccess) {
        if (
          outcome.kind === "preventable_damage" ||
          outcome.kind === "unpreventable_meat_damage"
        ) {
          const damageType =
            outcome.kind === "preventable_damage" ? outcome.damageType : "meat";
          signals.add("corp_ice.damage_source");
          signals.add(`corp_ice.${damageType}_damage`);
          signals.add("damage.payoff");
        }
        if (
          outcome.kind === "add_tags" ||
          outcome.kind === "add_tags_by_trace_margin_over_runner_link"
        ) {
          signals.add("corp_ice.tag_source");
          signals.add("tag.source");
        }
        if (outcome.kind === "end_run") {
          signals.add("corp_ice.conditional_end_run");
          signals.add("ice.etr");
        }
        if (outcome.kind === "runner_run_lock_until_action_paid") {
          signals.add("corp_ice.run_lock");
          signals.add("run.lock");
        }
        if (outcome.kind === "add_counter")
          signals.add("tax.runner_persistent");
      }
    }
    if (subroutine.kind === "prohibit_break_next_ice")
      for (const signal of [
        "corp_ice.next_ice_break_lock",
        "ice.future_pressure",
      ])
        signals.add(signal);
    if (subroutine.kind === "random_damage")
      for (const signal of [
        "corp_ice.brain_damage",
        "corp_ice.random_or_guessing",
        "damage.payoff",
        "risk.random_outcome",
      ])
        signals.add(signal);
    if (subroutine.kind === "trash_program")
      signals.add("corp_ice.program_trash");
    if (subroutine.kind === "deflect_run") signals.add("run.corp_redirect");
    if (subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn")
      for (const signal of [
        "corp_ice.end_run",
        "corp_ice.self_bounce_or_maintenance_drawback",
        "ice.etr",
      ])
        signals.add(signal);
  }
  if (
    (engine.printedSubroutines ?? []).filter(
      (subroutine) =>
        subroutine.kind === "end_the_run" ||
        subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn",
    ).length > 1
  )
    signals.add("corp_ice.multi_end_run");
  if (
    engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
    engine.relativeIce.strengthBonusPerCount !== undefined
  )
    signals.add("ice.strength_modifier");
  if (engine.runnerCounterEffects !== undefined)
    for (const signal of [
      "damage.corp_persistent_damage_counter",
      "defense.corp_run_end_counter",
    ])
      signals.add(signal);
  for (const window of engine.fortRunWindows ?? []) {
    if (
      window.kind === "move_self_to_different_position_on_same_fort" ||
      window.kind === "move_self_to_outermost_position_on_other_fort"
    )
      signals.add("corp_ice.mobile_position_change");
    if (
      window.kind === "corp_return_passed_ice_to_hq" &&
      window.mode === "required_pay_or_return"
    )
      signals.add("corp_ice.self_bounce_or_maintenance_drawback");
    if (
      window.kind === "runner_pay_or_end_run_after_passing_ice_on_this_fort"
    ) {
      signals.add("run.corp_pay_or_end_run");
      signals.add("tax.runner_credit");
    }
    if (window.kind === "temporary_hq_ice_encounter_after_successful_run") {
      signals.add("ice.corp_fort_defense");
      signals.add("tax.ice");
    }
  }
  if (
    engine.corpUtility?.kind ===
    "runner_memory_limit_modifier_until_end_of_turn"
  )
    for (const signal of [
      "risk.program_cleanup_after_mu_loss",
      "risk.requires_tagged_runner",
      "tag.payoff",
    ])
      signals.add(signal);
  if (
    engine.corpUtility?.kind === "draw_corp_cards_then_shuffle_hq_card_into_rd"
  )
    for (const signal of [
      "draw.corp_draw",
      "hq.corp_hand_refresh",
      "risk.double_operation_action_cost",
      "rnd.corp_shuffle_hq_into_rnd",
    ])
      signals.add(signal);
  if (engine.corpUtility?.kind === "corp_archives_to_hq")
    for (const signal of [
      "archives.corp_recovery",
      "info.reveal_recovered_cards_to_runner",
      "risk.double_operation_action_cost",
    ])
      signals.add(signal);
  if (
    engine.corpUtility?.kind ===
    "corp_start_turn_tag_roll_per_runner_run_last_turn"
  )
    for (const signal of [
      "condition.runner_attempted_run_last_turn",
      "risk.random_outcome",
      "tag.source",
    ])
      signals.add(signal);
  if (engine.corpUtility?.kind === "corp_draw_extra_then_bottom_one")
    for (const signal of ["draw.corp_draw", "hq.corp_hand_filter"])
      signals.add(signal);
  if (engine.corpUtility?.kind === "run_start_lose_runner_credits_per_tag")
    for (const signal of [
      "condition.runner_has_one_or_more_tags",
      "tag.payoff",
      "tag.runner_credit_loss_payoff",
      "tax.runner_persistent",
    ])
      signals.add(signal);
  for (const followup of engine.successfulRunFollowups ?? []) {
    if (followup.kind === "optional_make_run_after_successful_run")
      signals.add("run.make_run");
    if (
      followup.kind ===
      "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count"
    )
      signals.add("run.successful_run_grip_reset");
    if (followup.kind === "skip_rd_access_add_purgeable_runner_virus_counter")
      for (const signal of ["access.rnd_replacement", "virus.doom_counter"])
        signals.add(signal);
    if (followup.kind === "force_rez_ice_outermost_inward_after_successful_run")
      for (const signal of [
        "economy.corp_credit_denial",
        "ice.force_rez",
        "info.ice_recon",
      ])
        signals.add(signal);
  }
  if (
    engine.virusCounter?.onCorpInstall?.kind ===
    "roll_per_counter_trash_installed_card_and_remove_counter_on_success"
  )
    for (const signal of [
      "install.corp_random_trash",
      "risk.random_outcome",
      "virus.corp_purge_pressure",
    ])
      signals.add(signal);
  for (const access of engine.accessEffects ?? [])
    for (const effect of access.effects) {
      if (
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner"
      )
        for (const signal of [
          "access.corp_net_damage_ambush",
          "access.punish",
          "damage.payoff",
          "ice.corp_self_trash_cost",
          "remote.ambush",
          "risk.trash_own_installed_cards",
        ])
          signals.add(signal);
      if (effect.kind === "trash_installed_runner_hardware_and_programs")
        for (const signal of [
          "access.corp_hardware_trash",
          "access.corp_program_trash",
          "access.punish",
          "condition.runner_has_four_or_more_tags",
          "remote.ambush",
          "tag.payoff",
        ])
          signals.add(signal);
    }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "double_chosen_ice_strength_until_end_of_turn")
        for (const signal of [
          "ice.corp_strength_support",
          "ice.corp_targeted_strength_boost",
          "ice.strength_modifier",
        ])
          signals.add(signal);
      if (effect.kind === "remove_tags") signals.add("tag.removal");
      if (effect.kind === "avoid_next_tag")
        signals.add("defense.next_tag_prevention");
    }
  const pumpAbility = engine.icebreakerAbilities?.find(
    (ability) => ability.kind === "increase_strength",
  );
  if (
    breakerSignalAbility?.kind === "break_subroutine" &&
    breakerSignalAbility.special?.kind ===
      "once_per_run_break_tag_and_all_stealth_loss"
  )
    for (const signal of [
      "breaker.stealth_payment_loss",
      "economy.finite_pool",
    ])
      signals.add(signal);
  if (
    pumpAbility?.kind === "increase_strength" &&
    pumpAbility.duration === "current_turn"
  )
    signals.add("breaker.scaling_strength");
  if (
    breakerSignalAbility?.kind === "break_subroutine" &&
    breakerSignalAbility.matches.kind === "any"
  )
    for (const signal of ["breaker.emergency_coverage", "breaker.universal"])
      signals.add(signal);
  if (
    breakerSignalAbility?.kind === "break_subroutine" &&
    breakerSignalAbility.special?.kind === "run_end_trash_source_if_used"
  )
    signals.add("breaker.self_trash_risk");
  const runnerUtilityKind = engine.runnerUtilityLongtail?.kind;
  if (runnerUtilityKind === "hq_access_expose_all_installed_corp_cards")
    for (const signal of [
      "access.hq_full_reveal",
      "info.expose",
      "info.expose_installed_card",
      "info.hq",
      "info.hq_information",
    ])
      signals.add(signal);
  if (
    runnerUtilityKind === "derez_fully_broken_passed_ice" ||
    runnerUtilityKind === "derez_fully_broken_passed_ice_and_end_run"
  )
    signals.add("ice.derez");
  if (runnerUtilityKind === "access_point_subroutine_modifier")
    for (const signal of [
      "defense.net_damage_prevention",
      "run.break_cost_penalty",
      "subroutine.ap_ignore_non_trace_or_net_damage",
    ])
      signals.add(signal);
  if (runnerUtilityKind === "base_memory_equals_grip_count")
    signals.add("setup.memory");
  const runnerEventKind = engine.runnerEventLongtail?.kind;
  if (runnerEventKind === "trash_grip_search_stack_to_grip_equal_count")
    signals.add("setup.search");
  if (runnerEventKind === "runner_corruption_agenda_point_transfer")
    signals.add("economy.generic");
  if (runnerEventKind === "do_the_drine_unpreventable_core_damage_for_credits")
    signals.add("economy.generic");
  if (runnerEventKind === "three_dice_gain_credits")
    signals.add("economy.generic");
  if (runnerEventKind === "library_search_run")
    for (const signal of [
      "access.hq_multiaccess",
      "access.rnd_multiaccess",
      "run.event_tempo",
    ])
      signals.add(signal);
  if (usesClosedExtendedMechanicalProfile(entry)) {
    if (
      engine.printedSubroutines?.some(
        (subroutine) =>
          subroutine.kind === "damage" || subroutine.kind === "random_damage",
      )
    )
      signals.add("damage.payoff");
    if (engine.fortRunWindows !== undefined) signals.add("ice.future_pressure");
    if (
      engine.modifiers?.some(
        (modifier) =>
          modifier.kind === "break_subroutine_cost" ||
          modifier.kind === "break_ability_use_cost",
      )
    )
      for (const signal of ["run.break_cost_penalty", "tax.runner_persistent"])
        signals.add(signal);
    if (
      pumpAbility?.kind === "increase_strength" &&
      pumpAbility.duration === "current_turn"
    )
      signals.add("breaker.scaling_strength");
    for (const ability of engine.abilities ?? [])
      for (const effect of ability.effects ?? []) {
        if (
          effect.kind !== "make_run" ||
          effect.successfulRunAccessReplacement === undefined
        )
          continue;
        signals.add("run.event_tempo");
        const replacement = effect.successfulRunAccessReplacement;
        if (
          replacement === "private_look_top_rd" ||
          replacement === "reveal_rd_until_agenda_store_in_hq"
        )
          signals.add("info.rnd_topdeck");
        if (
          replacement === "corp_lose_credits" ||
          replacement === "runner_spend_corp_lose_credits"
        )
          signals.add("economy.corp_credit_denial");
        if (replacement === "archives_faceup_to_rd")
          signals.add("archives.corp_recovery");
        if (replacement === "trash_rezzed_ice_on_fort_and_tag_runner")
          signals.add("ice.trash_rezzed");
        if (replacement === "runner_gain_agenda_point")
          signals.add("score.conditional_agenda_point");
      }
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) =>
            effect.kind === "make_run" &&
            effect.corpRezCostSurcharge !== undefined,
        ),
      )
    )
      signals.add("run.event_tempo");
    if (runnerEventKind === "library_search_run") signals.add("run.lock");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "remove_tags"),
      )
    )
      signals.add("defense.tag_prevention");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "draw_cards"),
      )
    )
      signals.add("setup.draw");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some((effect) => effect.kind === "gain_credits"),
      )
    )
      signals.add("economy.burst_credit");
    if (
      engine.lifecycle?.start_of_runner_turn?.some((trigger) =>
        trigger.effects.some((effect) => effect.kind === "gain_credits"),
      )
    )
      for (const signal of ["economy.generic", "economy.turn_start_credit"])
        signals.add(signal);
    if (
      engine.lifecycle?.on_leave_play?.some(
        (effect) => effect.kind === "lose_credits",
      )
    )
      signals.add("risk.leaves_play_loss");
    if (runnerUtilityKind === "trace_attempts_auto_success_add_tag")
      signals.add("risk.self_tag");
    if (runnerUtilityKind === "first_prep_credit_gain_bonus")
      for (const signal of [
        "economy.conditional_burst_credit",
        "economy.generic",
      ])
        signals.add(signal);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "private_look" && effect.zone === "hq",
        ),
      )
    )
      signals.add("info.hq");
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "private_look" && effect.zone === "rd",
        ),
      )
    )
      signals.add("info.rnd_topdeck");
    if (engine.hardwareDeck === true) signals.add("setup.deck_exclusive");
    if (engine.modifiers?.some((modifier) => modifier.kind === "memory_units"))
      signals.add("setup.memory");
    if (engine.hostedProgramCapacity !== undefined)
      signals.add("setup.program_host");
    if (engine.modifiers?.some((modifier) => modifier.kind === "hand_size"))
      signals.add("setup.hand_size");
    if (engine.restrictedHostedCreditSource !== undefined) {
      signals.add("economy.recurring");
      for (const use of engine.restrictedHostedCreditSource.usableFor) {
        if (use === "increase_link") {
          signals.add("economy.recurring_link_credit");
          signals.add("defense.trace_defense");
        }
        if (use === "using_icebreaker_during_run")
          signals.add("economy.recurring_breaker_credit");
      }
    }
    if (engine.damagePreventionSources !== undefined)
      for (const source of engine.damagePreventionSources)
        for (const damageType of source.damageTypes) {
          if (damageType === "net")
            signals.add("defense.net_damage_prevention");
          if (damageType === "meat")
            signals.add("defense.meat_damage_prevention");
          if (damageType === "core")
            signals.add("defense.brain_damage_prevention");
        }
    for (const source of engine.tagPreventionSources ?? []) {
      signals.add("defense.tag_prevention");
      if (source.cost.kind === "credit_and_forgo_next_action")
        signals.add("risk.action_loss");
    }
    if (runnerUtilityKind === "start_turn_random_effect_table")
      for (const signal of [
        "risk.brain_damage_self_inflicted",
        "risk.unpreventable_brain_damage",
      ])
        signals.add(signal);
    if (
      engine.abilities?.some((ability) =>
        ability.effects?.some(
          (effect) => effect.kind === "transfer_hosted_credits",
        ),
      )
    )
      for (const signal of [
        "economy.corp_action_charged_bank",
        "economy.corp_charge_bank",
        "economy.corp_counter_bank",
        "economy.finite_pool",
        "economy.generic",
        "remote.asset_economy",
      ])
        signals.add(signal);
  }
  return [...signals].sort();
}

function closedCurrentRunAdditionalAccess(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): { server: "hq" | "rd"; amount: number } | null {
  const matches = (entry.planning.engine.abilities ?? []).flatMap((ability) =>
    (ability.effects ?? []).flatMap((effect) =>
      effect.kind === "add_current_run_access_count"
        ? [{ ability, effect }]
        : [],
    ),
  );
  if (matches.length === 0) return null;
  if (matches.length !== 1)
    throw new Error("card_spec_unknown_current_run_additional_access_shape");
  const { ability, effect } = matches[0]!;
  const condition = ability.condition;
  const server =
    condition?.kind === "current_run_server" ? condition.server : undefined;
  const costs = Array.isArray(ability.costs) ? ability.costs : [];
  const creditCost = costs.filter((cost) => cost.kind === "credit");
  const trashCost = costs.filter((cost) => cost.kind === "trash_source");
  if (
    ability.kind !== "activated" ||
    ability.timing !== "access_start" ||
    (server !== "hq" && server !== "rd") ||
    effect.server !== server ||
    !Number.isSafeInteger(effect.amount) ||
    effect.amount <= 0 ||
    effect.visibility !== "hidden_info_barrier" ||
    costs.length !== 2 ||
    creditCost.length !== 1 ||
    !Number.isSafeInteger(creditCost[0]?.amount) ||
    (creditCost[0]?.amount ?? 0) <= 0 ||
    trashCost.length !== 1 ||
    trashCost[0]?.amount !== 1
  )
    throw new Error("card_spec_unknown_current_run_additional_access_shape");
  return { server, amount: effect.amount };
}

function derivedTacticSignals(
  entry: ReturnType<typeof cardSpecPlanningCards>[number],
): string[] {
  const engine = entry.planning.engine;
  const signals = new Set<string>();
  const relativeDynamicDamage = engine.relativeIce?.dynamicDamageSubroutine;
  const variableRunLockTrace = engine.printedSubroutines?.find(
    (subroutine) =>
      subroutine.kind === "trace" &&
      engine.variableRez?.kind === "x_strength" &&
      engine.variableRez.traceLimitFromValue === true &&
      subroutine.traceLimit === 0 &&
      subroutine.onSuccess.some((effect) => effect.kind === "end_run") &&
      subroutine.onSuccess.some(
        (effect) =>
          effect.kind === "runner_run_lock_until_action_paid" &&
          effect.amount === 2 &&
          effect.visibility === "public",
      ),
  );
  if (engine.corpRootRezCreditOutcome !== undefined)
    signals.add("economy.corp_credit_burst");
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "rez_cost") signals.add("ice.corp_rez_discount");
    if (modifier.kind === "ice_strength" && entry.definition.side === "corp")
      signals.add("ice.corp_strength_support");
    if (modifier.kind === "ice_strength" && entry.definition.side === "corp")
      signals.add("tax.ice");
    if (modifier.kind === "access_count")
      signals.add(
        `access.${modifier.server === "rd" ? "rnd" : modifier.server}_multiaccess`,
      );
    if (modifier.kind === "agenda_difficulty") {
      const operation =
        modifier.operation === "reduce" ? "discount" : "increase";
      signals.add(`remote.agenda_difficulty_${operation}`);
      signals.add(`score.agenda_difficulty_${operation}`);
      signals.add(
        `score.${modifier.appliesTo.subtype}_difficulty_${operation}`,
      );
    }
  }
  for (const access of engine.accessEffects ?? []) {
    if (access.ignoreIfAccessedFrom?.includes("archives"))
      signals.add("access.archives_safe_exception");
    if (access.revealIfAccessedFrom?.includes("rd"))
      signals.add("access.rnd_reveal_requirement");
    for (const effect of access.effects) {
      if (
        effect.kind === "damage" ||
        effect.kind === "damage_from_source_advancement_counters"
      )
        signals.add(accessDamageAmbushSignal(effect.damageType));
      if (effect.kind === "damage_from_source_advancement_counters")
        signals.add("advance.corp_counter_bank");
    }
  }
  if (engine.variableRez?.kind === "x_strength")
    signals.add("corp_ice.rez_paid_scaling");
  for (const subroutine of engine.printedSubroutines ?? []) {
    if (subroutine.kind === "damage") {
      signals.add("corp_ice.damage_source");
      signals.add(`corp_ice.${subroutine.damageType}_damage`);
      if (
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
        relativeDynamicDamage?.subroutineCapabilityKey ===
          subroutine.capabilityKey
      )
        for (const signal of [
          "corp_ice.outer_ice_scaling",
          "corp_ice.position_scaling",
          "damage.payoff",
        ])
          signals.add(signal);
    }
    if (subroutine.kind === "end_the_run") signals.add("corp_ice.end_run");
    if (subroutine.kind === "corp_gain_credit")
      for (const signal of [
        "corp_ice.credit_gain",
        "economy.corp_credit_burst",
      ])
        signals.add(signal);
    if (subroutine.kind === "runner_lose_credits") {
      signals.add("economy.runner_credit_loss");
      signals.add("tax.runner_credit");
      signals.add("tax.ice");
    }
    if (subroutine.kind === "give_runner_tag") {
      signals.add("corp_ice.tag_source");
      signals.add("tag.source");
    }
  }
  for (const ability of engine.abilities ?? [])
    for (const effect of ability.effects ?? []) {
      if (effect.kind === "gain_credits")
        signals.add(`economy.${effect.recipient}_credit_burst`);
      if (effect.kind === "draw_cards")
        signals.add(`draw.${effect.recipient}_draw`);
      if (effect.kind === "distribute_advancement_counters")
        for (const signal of [
          "advance.corp_counter_placement",
          "advance.score_window_support",
        ])
          signals.add(signal);
      if (effect.kind === "move_advancement_counters")
        for (const signal of [
          "advance.corp_counter_transfer",
          "advance.score_window_support",
        ])
          signals.add(signal);
      if (
        effect.kind === "lose_credits" &&
        effect.recipient === "runner" &&
        ability.condition?.kind === "runner_is_tagged"
      ) {
        signals.add("risk.requires_tagged_runner");
        signals.add("tag.payoff");
      }
    }
  for (const ability of engine.abilities ?? [])
    if (
      ability.effects?.some(
        (effect) => effect.kind === "choose_stack_or_trash_program_install",
      )
    )
      signals.add("setup.search");
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "server_run_start_restriction") {
      signals.add("run.corp_server_lock");
      signals.add("condition.corp_installed_or_advanced_this_fort_last_turn");
    }
  if (
    engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  ) {
    signals.add("score.remote_fort_creation");
    signals.add("score.remote_install_budget");
  }
  if (
    engine.scoredAgenda?.kind ===
    "score_credit_swing_if_corp_credit_threshold_met"
  ) {
    signals.add("risk.requires_corp_credit_threshold");
    signals.add("risk.economy_crash_on_score");
  }
  if (usesClosedExtendedMechanicalProfile(entry)) {
    const tacticFunctionSignals = new Set([
      "access.corp_agenda_steal_replacement",
      "access.corp_delayed_agenda_score",
      "access.corp_hardware_trash",
      "access.corp_brain_damage_ambush",
      "access.corp_meat_damage_ambush",
      "access.corp_net_damage_ambush",
      "access.corp_program_trash",
      "access.corp_runner_agenda_program_install",
      "archives.corp_recovery",
      "condition.runner_attempted_run_last_turn",
      "condition.runner_has_four_or_more_tags",
      "condition.runner_has_one_or_more_tags",
      "corp_ice.brain_damage",
      "corp_ice.end_run",
      "corp_ice.mobile_position_change",
      "corp_ice.multi_end_run",
      "corp_ice.next_ice_break_lock",
      "corp_ice.program_trash",
      "corp_ice.random_or_guessing",
      "corp_ice.rez_economy",
      "corp_ice.self_bounce_or_maintenance_drawback",
      "corp_ice.trace_source",
      "damage.corp_persistent_damage_counter",
      "defense.corp_run_end_counter",
      "defense.virus_counter_defense",
      "draw.corp_draw",
      "draw.corp_recurring",
      "economy.corp_action_charged_bank",
      "economy.corp_counter_bank",
      "hq.corp_hand_filter",
      "hq.corp_hand_refresh",
      "ice.corp_strength_support",
      "ice.corp_targeted_strength_boost",
      "ice.etr",
      "info.reveal_recovered_cards_to_runner",
      "risk.action_loss",
      "risk.brain_damage_self_inflicted",
      "risk.double_operation_action_cost",
      "risk.fragile_delayed_score",
      "risk.leaves_play_loss",
      "risk.program_cleanup_after_mu_loss",
      "risk.program_removal_denies_score",
      "risk.random_outcome",
      "risk.requires_tagged_runner",
      "risk.runner_memory_burden",
      "risk.self_tag",
      "risk.trash_own_installed_cards",
      "risk.unpreventable_brain_damage",
      "rnd.corp_shuffle_hq_into_rd",
      "remote.asset_economy",
      "run.break_cost_penalty",
      "run.corp_end_run_counter",
      "run.corp_redirect",
      "run.successful_run_grip_reset",
      "score.recurring_draw",
      "score.run_end_counter_bank",
      "tag.payoff",
      "tag.runner_credit_loss_payoff",
      "tag.source",
      "tax.runner_persistent",
      "trace.source",
      "virus.corp_counter_clear",
      "virus.corp_counter_prevention",
    ]);
    for (const signal of derivedFunctionSignals(entry))
      if (
        tacticFunctionSignals.has(signal) &&
        !(variableRunLockTrace !== undefined && signal === "ice.etr")
      )
        signals.add(signal);
    if (variableRunLockTrace !== undefined)
      for (const signal of [
        "corp_ice.conditional_end_run",
        "corp_ice.run_lock",
        "corp_ice.trace_source",
        "trace.source",
      ])
        signals.add(signal);
    for (const subroutine of engine.printedSubroutines ?? []) {
      if (subroutine.kind === "damage") signals.add("corp_ice.damage_source");
      if (subroutine.kind === "random_damage")
        signals.add("corp_ice.damage_source");
      if (subroutine.kind === "deflect_run")
        signals.add("corp_ice.encounter_tax");
      if (subroutine.kind === "prohibit_break_next_ice")
        signals.add("corp_ice.run_lock");
    }
    if (engine.corpUtility?.kind === "corp_archives_to_hq")
      for (const signal of ["hq.corp_ice_recovery", "ice.corp_recovery"])
        signals.add(signal);
    if (
      engine.corpUtility?.kind ===
      "draw_corp_cards_then_shuffle_hq_card_into_rd"
    )
      signals.add("rnd.corp_shuffle_hq_into_rnd");
    if (engine.corpUtility?.kind === "corp_draw_extra_then_bottom_one")
      signals.add("draw.corp_recurring");
    if (
      engine.corpUtility?.kind ===
      "runner_memory_limit_modifier_until_end_of_turn"
    )
      for (const signal of [
        "runner.memory_reduction",
        "tag.runner_memory_pressure",
      ])
        signals.add(signal);
  }
  if (
    engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
    engine.relativeIce.strengthBonusPerCount !== undefined
  )
    signals.add("ice.strength_modifier");
  for (const annotation of allPlanningAnnotations(entry))
    if (annotation.kind === "tactic_interpretation")
      signals.add(
        closedPlanningValue(
          annotation.signal,
          KNOWN_PLANNING_TACTIC_SIGNALS,
          "tactic_signal",
        ),
      );
  return [...signals].sort();
}

function valueHintKey(axis: string): keyof AiRuntimeValueHints {
  if (axis === "economy") return "economy";
  if (axis === "remote_root_value") return "remoteRootValue";
  throw new Error(`card_spec_unknown_value_axis: ${axis}`);
}

function derivedActionStrategyEvidence(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
  capabilityKey: string,
  strategyId: string,
  role: string,
  roleDetail: string,
  evidenceAnchor: Extract<
    PlanningInterpretation,
    { kind: "strategy_support" }
  >["evidenceAnchor"],
): string[] {
  const node = addressableEngineNode(engine, capabilityKey);
  if (node === undefined)
    throw new Error(
      `card_spec_action_strategy_capability_missing: ${capabilityKey}`,
    );
  const kind = node.kind;
  let expectedAnchor:
    | NonNullable<
        Extract<
          PlanningInterpretation,
          { kind: "strategy_support" }
        >["evidenceAnchor"]
      >
    | undefined;
  let expectedRole: "anchor_evidence" | "payoff_anchor" | "enabler" | undefined;
  let expectedStrategies: ReadonlySet<string> | undefined;
  const nodeEffects = Array.isArray(node.effects)
    ? node.effects.filter(isRecord)
    : [];
  const nodeCondition = isRecord(node.condition) ? node.condition : undefined;
  const makeRun = nodeEffects.find((effect) => effect.kind === "make_run");
  const trace = nodeEffects.find((effect) => effect.kind === "trace");
  const traceSuccessEffects =
    trace !== undefined && Array.isArray(trace.onSuccess)
      ? trace.onSuccess.filter(isRecord)
      : kind === "trace" && Array.isArray(node.onSuccess)
        ? node.onSuccess.filter(isRecord)
        : [];
  const traceAddsTag = traceSuccessEffects.some(
    (effect) =>
      effect.kind === "add_tags" ||
      effect.kind === "add_tags_by_trace_margin_over_runner_link" ||
      effect.kind === "trash_runner_resource_and_add_tag",
  );
  const addTags = nodeEffects.find((effect) => effect.kind === "add_tags");
  const taggedRunReplacement = nodeEffects.find(
    (effect) =>
      effect.kind === "make_run" &&
      effect.successfulRunAccessReplacement ===
        "trash_rezzed_ice_on_fort_and_tag_runner",
  );
  const taggedFortTrash = nodeEffects.find(
    (effect) =>
      effect.kind ===
      "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
  );
  const taggedPayoffEffect = nodeEffects.some((effect) =>
    ["add_tags", "damage", "lose_credits"].includes(String(effect.kind)),
  );
  if (kind === "tagged_runner_meat_damage_reduce_hand_size_on_success") {
    expectedAnchor = "damage.corp_tagged_meat_payoff";
    expectedRole = "payoff_anchor";
    expectedStrategies = new Set(["corp.damage_kill", "corp.tag_trace_punish"]);
  } else if (
    kind === "on_access" &&
    nodeEffects.some((effect) => effect.kind === "add_tags")
  ) {
    expectedAnchor = "tag.source";
    expectedRole = "anchor_evidence";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (
    (kind === "on_play" || kind === "activated" || kind === "on_access") &&
    trace !== undefined
  ) {
    if (evidenceAnchor === "trace.source") expectedAnchor = evidenceAnchor;
    else if (evidenceAnchor === "tag.source" && traceAddsTag)
      expectedAnchor = evidenceAnchor;
    expectedRole = "anchor_evidence";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (
    (kind === "on_play" || kind === "activated" || kind === "on_access") &&
    nodeCondition?.kind === "runner_is_tagged" &&
    taggedPayoffEffect
  ) {
    if (evidenceAnchor === "tag.payoff") {
      expectedAnchor = evidenceAnchor;
      expectedRole = "payoff_anchor";
    } else if (
      evidenceAnchor === "tag.additional_source" &&
      addTags !== undefined
    ) {
      expectedAnchor = evidenceAnchor;
      expectedRole = "enabler";
    } else if (evidenceAnchor === "tag.source" && addTags !== undefined) {
      expectedAnchor = evidenceAnchor;
      expectedRole = "anchor_evidence";
    }
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (
    kind === "on_play" &&
    (addTags !== undefined ||
      taggedRunReplacement !== undefined ||
      taggedFortTrash !== undefined ||
      makeRun?.successfulRunRunnerTagGain !== undefined ||
      (isRecord(makeRun?.badPublicityRunAftermath) &&
        makeRun.badPublicityRunAftermath.kind ===
          "successful_run_counted_subtypes"))
  ) {
    expectedAnchor = "tag.source";
    expectedRole = "anchor_evidence";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (kind === "on_play" && makeRun !== undefined) {
    const target = isRecord(makeRun.target) ? makeRun.target : undefined;
    const server = target?.server;
    if (server === "hq") expectedAnchor = "access.hq_multiaccess";
    else if (server === "rd") expectedAnchor = "access.rnd_multiaccess";
    expectedRole = "payoff_anchor";
    expectedStrategies =
      server === "hq"
        ? new Set(["runner.hq_pressure", "runner.interface_closeout"])
        : server === "rd"
          ? new Set(["runner.interface_closeout", "runner.rnd_pressure"])
          : undefined;
  } else if (
    kind === "activated" &&
    node.timing === "trace_success_cancel_window"
  ) {
    expectedAnchor = "tag.payoff";
    expectedRole = "payoff_anchor";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (
    kind === "activated" &&
    node.timing === "access_start" &&
    nodeEffects.some((effect) => effect.kind === "add_current_run_access_count")
  ) {
    const condition = isRecord(node.condition) ? node.condition : undefined;
    const server = condition?.server;
    if (server === "hq") expectedAnchor = "access.hq_multiaccess";
    else if (server === "rd") expectedAnchor = "access.rnd_multiaccess";
    expectedRole = "payoff_anchor";
    expectedStrategies =
      server === "hq"
        ? new Set(["runner.hq_pressure", "runner.interface_closeout"])
        : server === "rd"
          ? new Set(["runner.interface_closeout", "runner.rnd_pressure"])
          : undefined;
  } else if (
    typeof node.counterKind === "string" &&
    isRecord(node.addOnSuccessfulRun)
  ) {
    const server = node.addOnSuccessfulRun.server;
    if (server === "hq") expectedAnchor = "access.hq_multiaccess";
    else if (server === "rd") expectedAnchor = "access.rnd_multiaccess";
    expectedRole = "payoff_anchor";
    expectedStrategies =
      server === "hq"
        ? new Set(["runner.hq_pressure", "runner.interface_closeout"])
        : server === "rd"
          ? new Set(["runner.interface_closeout", "runner.rnd_pressure"])
          : undefined;
  }
  if (
    kind === "corp_start_turn_tag_roll_per_runner_run_last_turn" ||
    kind === "runner_corruption_agenda_point_transfer" ||
    kind === "trace_attempts_auto_success_add_tag" ||
    (kind === "break_subroutine" &&
      isRecord(node.special) &&
      node.special.kind === "once_per_run_break_tag_and_all_stealth_loss")
  ) {
    expectedAnchor = "tag.source";
    expectedRole = "anchor_evidence";
  } else if (kind === "end_turn_tag_if_runner_received_tag") {
    expectedAnchor = "tag.additional_source";
    expectedRole = "enabler";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (kind === "encounter_tag" || kind === "runner_draw_tax_tag") {
    expectedAnchor = "tag.source";
    expectedRole = "anchor_evidence";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (
    kind === "runner_memory_limit_modifier_until_end_of_turn" ||
    kind === "run_start_lose_runner_credits_per_tag" ||
    kind === "run_start_tax" ||
    (kind === "on_access" &&
      isRecord(node.condition) &&
      node.condition.kind === "runner_tags_at_least")
  ) {
    expectedAnchor = "tag.payoff";
    expectedRole = "payoff_anchor";
  } else if (
    kind === "trash_runner_resources_if_tagged" ||
    kind === "installed_hardware_trash_by_counter" ||
    kind === "tagged_meat_damage" ||
    kind === "tag_threshold_meat_damage_asset"
  ) {
    expectedAnchor = "tag.payoff";
    expectedRole = "payoff_anchor";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (
    kind === "runner_forgoes_next_action" ||
    kind === "end_the_run_and_runner_forgoes_next_action"
  ) {
    expectedAnchor = "corp_ice.runner_action_loss";
    expectedRole = "anchor_evidence";
    expectedStrategies = new Set(["corp.ice_tax_glacier"]);
  } else if (kind === "trace") {
    if (evidenceAnchor === "trace.source") expectedAnchor = evidenceAnchor;
    else if (evidenceAnchor === "tag.source" && traceAddsTag)
      expectedAnchor = evidenceAnchor;
    expectedRole = "anchor_evidence";
    expectedStrategies = new Set(["corp.tag_trace_punish"]);
  } else if (kind === "library_search_run") {
    expectedRole = "payoff_anchor";
    if (strategyId === "runner.hq_pressure")
      expectedAnchor = "access.hq_multiaccess";
    else if (strategyId === "runner.rnd_pressure")
      expectedAnchor = "access.rnd_multiaccess";
    else if (
      strategyId === "runner.interface_closeout" &&
      (evidenceAnchor === "access.hq_multiaccess" ||
        evidenceAnchor === "access.rnd_multiaccess")
    )
      expectedAnchor = evidenceAnchor;
  }
  const expectedStrategy =
    expectedStrategies ??
    (kind === "library_search_run"
      ? new Set([
          "runner.hq_pressure",
          "runner.interface_closeout",
          "runner.rnd_pressure",
        ])
      : new Set(["corp.tag_trace_punish"]));
  const expectedRoleDetail =
    expectedAnchor === undefined || expectedRole === undefined
      ? undefined
      : `${expectedRole}_${expectedAnchor.replaceAll(".", "_")}`;
  if (
    !expectedStrategy.has(strategyId) ||
    evidenceAnchor !== expectedAnchor ||
    role !== expectedRole ||
    roleDetail !== expectedRoleDetail
  )
    throw new Error(
      `card_spec_action_strategy_binding_mismatch: ${capabilityKey}:${strategyId}`,
    );
  return [`tactic_signal_anchor:${expectedAnchor}`];
}

function addressableEngineNode(
  value: unknown,
  capabilityKey: string,
): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = addressableEngineNode(entry, capabilityKey);
      if (match !== undefined) return match;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  if (value.capabilityKey === capabilityKey) return value;
  for (const entry of Object.values(value)) {
    const match = addressableEngineNode(entry, capabilityKey);
    if (match !== undefined) return match;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function additionalClickAmount(costs: unknown): number {
  if (!isRecord(costs) || costs.additionalClicks === undefined) return 0;
  if (costs.additionalClicks !== 1)
    throw new Error("card_spec_unknown_additional_click_cost");
  return costs.additionalClicks;
}

function requiredFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error(`card_spec_required_number_missing: ${field}`);
  return value;
}

type CardStrategyEvidenceProfile = NonNullable<
  Extract<
    PlanningInterpretation,
    { kind: "strategy_support" }
  >["evidenceProfile"]
>;

function derivedCardStrategyEvidence(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
  strategyId: string,
  role: KnownHintStrategySupportPairRole,
  roleDetail: string,
  profile: CardStrategyEvidenceProfile,
): string[] {
  const accessEffects = engine.accessEffects ?? [];
  const abilities = engine.abilities ?? [];
  const printedSubroutines = engine.printedSubroutines ?? [];
  const modifiers = engine.modifiers ?? [];
  const fortRunWindows = engine.fortRunWindows ?? [];
  const relativeDynamicDamageSubroutine =
    engine.relativeIce?.dynamicDamageSubroutine === undefined
      ? undefined
      : printedSubroutines.find(
          (subroutine) =>
            subroutine.capabilityKey ===
            engine.relativeIce?.dynamicDamageSubroutine
              ?.subroutineCapabilityKey,
        );
  const checked = (
    expectedStrategyId: string,
    expectedRole: KnownHintStrategySupportPairRole,
    expectedRoleDetail: string,
    mechanicalWitness: boolean,
    evidence: readonly string[],
  ): string[] => {
    if (
      strategyId !== expectedStrategyId ||
      role !== expectedRole ||
      roleDetail !== expectedRoleDetail ||
      !mechanicalWitness
    )
      throw new Error(
        `card_spec_invalid_card_strategy_evidence_profile: ${profile}`,
      );
    return [...evidence];
  };
  switch (profile) {
    case "random_recurring_action_mode":
      return checked(
        "corp.action_tempo",
        "utility",
        profile,
        engine.scoredAgenda?.kind ===
          "corp_start_turn_random_restricted_optional_action",
        [
          "action.corp_random_recurring_extra_action",
          "action.corp_install_only_action",
          "economy.corp_credit_action",
          "draw.corp_draw_action",
        ],
      );
    case "tagged_meat_hand_size_pressure":
      return checked(
        "corp.damage_kill",
        "engine_anchor",
        profile,
        engine.scoredAgenda?.kind ===
          "tagged_runner_meat_damage_reduce_hand_size_on_success",
        [
          "damage.corp_tagged_meat_payoff",
          "damage.corp_meat_damage_source",
          "damage.corp_hand_size_pressure_on_successful_damage",
        ],
      );
    case "tagged_runner_punish_payoff":
      return checked(
        "corp.tag_trace_punish",
        "punish_payoff",
        profile,
        engine.scoredAgenda?.kind ===
          "tagged_runner_meat_damage_reduce_hand_size_on_success",
        ["tag.corp_tagged_runner_payoff", "condition.requires_tagged_runner"],
      );
    case "net_damage_steal_tax":
      return checked(
        "corp.damage_kill",
        "punish_payoff",
        profile,
        engine.selfStealCosts?.some(
          (cost) => cost.kind === "current_access_self_steal_cost",
        ) === true &&
          accessEffects.some((access) =>
            access.effects.some(
              (effect) =>
                effect.kind === "damage" && effect.damageType === "net",
            ),
          ),
        [
          "access.corp_net_damage_ambush",
          "damage.corp_net_damage_access_punish",
        ],
      );
    case "agenda_net_damage_ambush":
      return checked(
        "corp.ambush_bluff",
        "punish_payoff",
        profile,
        engine.selfStealCosts?.some(
          (cost) => cost.kind === "current_access_self_steal_cost",
        ) === true &&
          accessEffects.some((access) =>
            access.effects.some(
              (effect) =>
                effect.kind === "damage" && effect.damageType === "net",
            ),
          ),
        [
          "access.corp_net_damage_ambush",
          "access.corp_agenda_steal_tax",
          "access.archives_safe_exception",
          "access.rnd_reveal_requirement",
        ],
      );
    case "access_tag_source":
      return checked(
        "corp.tag_trace_punish",
        "enabler",
        profile,
        accessEffects.some((access) =>
          access.effects.some((effect) => effect.kind === "add_tags"),
        ),
        ["access.corp_tag_ambush", "tag.corp_access_tag_source"],
      );
    case "access_tag_ambush":
      return checked(
        "corp.ambush_bluff",
        "punish_payoff",
        profile,
        accessEffects.some(
          (access) =>
            access.revealIfAccessedFrom?.includes("rd") === true &&
            access.effects.some((effect) => effect.kind === "add_tags"),
        ),
        ["access.corp_tag_ambush", "access.rnd_reveal_requirement"],
      );
    case "damage_conversion_extra_action_bank":
      return checked(
        "corp.action_tempo",
        "enabler",
        profile,
        engine.scoredAgenda?.kind ===
          "corp_damage_replacement_pdca_action_counter",
        [
          "action.corp_damage_conversion_counter_bank",
          "action.corp_counter_to_extra_action",
          "limit.once_per_turn",
        ],
      );
    case "overadvance_extra_action_payoff":
      return checked(
        "corp.overadvance_value",
        "win_condition",
        profile,
        engine.scoredAgenda?.kind === "overadvance_start_of_corp_turn_actions",
        [
          "advance.overadvance_payoff",
          "score.overadvance_bonus",
          "score.overadvance_scaling",
          "action.corp_recurring_extra_action",
        ],
      );
    case "recurring_extra_action_payoff":
      return checked(
        "corp.action_tempo",
        "payoff_anchor",
        profile,
        engine.scoredAgenda?.kind === "overadvance_start_of_corp_turn_actions",
        ["action.corp_recurring_extra_action"],
      );
    case "overadvance_recurring_credit_payoff":
      return checked(
        "corp.overadvance_value",
        "payoff_anchor",
        profile,
        engine.scoredAgenda?.kind === "overadvance_start_of_corp_turn_credits",
        [
          "advance.overadvance_payoff",
          "score.overadvance_bonus",
          "score.overadvance_scaling",
          "economy.corp_recurring_credit",
        ],
      );
    case "program_bounce_ambush":
      return checked(
        "corp.ambush_bluff",
        "punish_payoff",
        profile,
        engine.lifecycle?.on_score?.some(
          (effect) =>
            effect.kind === "trash_corp_installed_cards_in_source_server",
        ) === true &&
          accessEffects.some((access) =>
            access.effects.some(
              (effect) =>
                effect.kind === "return_installed_runner_programs_to_grip",
            ),
          ),
        [
          "access.corp_runner_program_bounce",
          "access.corp_program_disruption",
          "access.agenda_ambush",
          "score.own_fort_trash_on_score",
          "risk.trash_own_fort_on_score",
        ],
      );
    case "one_card_score_closeout":
      return checked(
        "corp.remote_scoring",
        "win_condition",
        profile,
        engine.scoredAgenda?.kind === "fixed_bonus_agenda_points_on_score",
        ["score.bonus_agenda_points", "score.closeout_agenda"],
      );
    case "brain_damage_ice": {
      const fixedBrainDamage = printedSubroutines.some(
        (subroutine) =>
          subroutine.kind === "damage" && subroutine.damageType === "brain",
      );
      const relativeDamage =
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
        relativeDynamicDamageSubroutine?.kind === "damage" &&
        relativeDynamicDamageSubroutine.damageType === "brain";
      return checked(
        "corp.damage_kill",
        "punish_payoff",
        profile,
        fixedBrainDamage || relativeDamage,
        [
          "corp_ice.brain_damage",
          "corp_ice.damage_source",
          ...(relativeDamage ? ["corp_ice.outer_ice_scaling"] : []),
          "damage.payoff",
        ],
      );
    }
    case "position_scaling_net_damage_ice":
      return checked(
        "corp.damage_kill",
        "punish_payoff",
        profile,
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
          relativeDynamicDamageSubroutine?.kind === "damage" &&
          relativeDynamicDamageSubroutine.damageType === "net",
        [
          "corp_ice.damage_source",
          "corp_ice.net_damage",
          "corp_ice.outer_ice_scaling",
          "damage.payoff",
        ],
      );
    case "deep_server_damage_payoff_ice":
      return checked(
        "corp.ice_tax_glacier",
        "payoff_anchor",
        profile,
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
          relativeDynamicDamageSubroutine?.kind === "damage" &&
          relativeDynamicDamageSubroutine.damageType === "net",
        [
          "corp_ice.outer_ice_scaling",
          "corp_ice.position_scaling",
          "corp_ice.net_damage",
        ],
      );
    case "multi_program_trash_tax_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        printedSubroutines.filter(
          (subroutine) => subroutine.kind === "trash_program",
        ).length >= 3 &&
          printedSubroutines.filter(
            (subroutine) => subroutine.kind === "end_the_run",
          ).length >= 2,
        [
          "corp_ice.multi_program_trash",
          "corp_ice.program_trash",
          "corp_ice.multi_end_run",
        ],
      );
    case "future_strength_tax_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        printedSubroutines.some(
          (subroutine) => subroutine.kind === "run_duration_ice_strength",
        ),
        ["corp_ice.future_strength_buff"],
      );
    case "position_scaling_strength_tax_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
          engine.relativeIce.strengthBonusPerCount !== undefined,
        [
          "corp_ice.outer_ice_scaling",
          "corp_ice.position_scaling",
          "ice.strength_modifier",
        ],
      );
    case "rez_paid_scaling_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        engine.variableRez?.kind === "paid_end_the_run_subroutines",
        ["corp_ice.rez_paid_scaling"],
      );
    case "x_strength_trace_ice":
      const runLockTrace = printedSubroutines.find(
        (subroutine) =>
          subroutine.kind === "trace" &&
          subroutine.onSuccess.some((effect) => effect.kind === "end_run") &&
          subroutine.onSuccess.some(
            (effect) =>
              effect.kind === "runner_run_lock_until_action_paid" &&
              effect.amount === 2 &&
              effect.visibility === "public",
          ),
      );
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        engine.variableRez?.kind === "x_strength" &&
          engine.variableRez.traceLimitFromValue === true &&
          runLockTrace?.kind === "trace" &&
          runLockTrace.traceLimit === 0,
        ["corp_ice.rez_paid_scaling", "corp_ice.run_lock"],
      );
    case "position_scaling_trace_tag_tax_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
          engine.relativeIce.dynamicTraceSubroutines?.traceSuccessEffect
            .type === "add_tag",
        [
          "corp_ice.outer_ice_scaling",
          "corp_ice.position_scaling",
          "corp_ice.trace_source",
        ],
      );
    case "position_scaling_trace_tag_source":
      return checked(
        "corp.tag_trace_punish",
        "enabler",
        profile,
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
          engine.relativeIce.dynamicTraceSubroutines?.traceSuccessEffect
            .type === "add_tag",
        [
          "corp_ice.tag_source",
          "corp_ice.trace_source",
          "tag.source",
          "trace.source",
          "corp_ice.outer_ice_scaling",
        ],
      );
    case "paid_end_run_subroutine_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        abilities.some(
          (ability) =>
            ability.kind === "activated" &&
            ability.timing === "corp_encounter" &&
            Array.isArray(ability.costs) &&
            ability.costs.length === 1 &&
            ability.costs[0]?.kind === "credit" &&
            ability.costs[0].amount === 2 &&
            ability.effects?.some(
              (effect) =>
                effect.kind === "add_current_encounter_additional_subroutine" &&
                effect.subroutine.kind === "end_the_run",
            ),
        ),
        ["corp_ice.encounter_paid_subroutine_add"],
      );
    case "position_scaling_tax_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        engine.relativeIce?.kind === "rezzed_ice_outside_this_ice" &&
          engine.relativeIce.strengthBonusPerCount !== undefined,
        [
          "corp_ice.outer_ice_scaling",
          "corp_ice.position_scaling",
          "ice.strength_modifier",
        ],
      );
    case "position_scaling_etr_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        modifiers.some(
          (modifier) =>
            modifier.kind === "additional_subroutine" &&
            modifier.subroutine.kind === "end_the_run",
        ),
        [
          "corp_ice.outer_ice_scaling",
          "corp_ice.position_scaling",
          "corp_ice.end_run",
        ],
      );
    case "pay_or_end_run_ice":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        printedSubroutines.some(
          (subroutine) => subroutine.kind === "end_the_run_unless_runner_pays",
        ),
        ["corp_ice.encounter_tax", "corp_ice.runner_pay_or_end_run"],
      );
    case "retaliatory_node_trash_tag_source":
      return checked(
        "corp.tag_trace_punish",
        "enabler",
        profile,
        abilities.some(
          (ability) =>
            ability.kind === "on_play" &&
            ability.condition?.kind === "runner_trashed_node_last_turn" &&
            ability.effects?.some((effect) => effect.kind === "add_tags"),
        ),
        ["tag.source"],
      );
    case "temporary_free_rez_ice":
      return checked(
        "corp.ice_tax_glacier",
        "enabler",
        profile,
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) => effect.kind === "free_rez_installed_ice_with_counters",
          ),
        ),
        ["ice.corp_free_rez", "ice.corp_temporary_rez"],
      );
    case "scaling_trace_margin_tag_source":
      return checked(
        "corp.tag_trace_punish",
        "enabler",
        profile,
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) =>
              effect.kind === "trace" &&
              effect.onSuccess?.some(
                (success) =>
                  success.kind === "add_tags_by_trace_margin_over_runner_link",
              ),
          ),
        ),
        ["trace.source", "tag.source", "tag.scaling_trace_margin_source"],
      );
    case "installment_free_rez_ice":
      return checked(
        "corp.ice_tax_glacier",
        "enabler",
        profile,
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) =>
              effect.kind === "free_rez_installed_ice_with_counters" &&
              effect.lifecycle === "rent_to_own_start_corp_turn",
          ),
        ),
        ["ice.corp_free_rez", "ice.corp_installment_rez"],
      );
    case "paid_trace_tag_source":
      return checked(
        "corp.tag_trace_punish",
        "enabler",
        profile,
        abilities.some(
          (ability) =>
            ability.kind === "on_play" &&
            ability.effects?.some(
              (effect) =>
                effect.kind === "trace" &&
                effect.additionalPlayCostPerTraceLimitPointAboveZero === 1 &&
                effect.onSuccess?.some(
                  (success) => success.kind === "add_tags",
                ),
            ),
        ),
        ["trace.source", "tag.source"],
      );
    case "resource_install_retaliatory_trace_tag_source":
    case "trace_success_recent_resource_trash": {
      const supportRole =
        profile === "resource_install_retaliatory_trace_tag_source"
          ? "enabler"
          : "support_tool";
      return checked(
        "corp.tag_trace_punish",
        supportRole,
        profile,
        abilities.some(
          (ability) =>
            ability.kind === "on_play" &&
            ability.condition?.kind === "runner_installed_resource_last_turn" &&
            ability.effects?.some(
              (effect) =>
                effect.kind === "trace" &&
                effect.onSuccess?.some(
                  (success) =>
                    success.kind === "trash_runner_resource_and_add_tag",
                ),
            ),
        ),
        [
          "trace.source",
          "tag.source",
          "target.runner_resource_trash",
          "resource.runner_recent_install_trash",
        ],
      );
    }
    case "access_net_damage_payoff_rnd":
      return checked(
        "corp.ambush_bluff",
        "punish_payoff",
        "access_net_damage_payoff",
        accessEffects.some(
          (access) =>
            access.sourceZones.length === 1 &&
            access.sourceZones[0] === "rd" &&
            access.effects.some(
              (effect) =>
                effect.kind === "damage" && effect.damageType === "net",
            ),
        ),
        ["access.corp_rnd_net_damage_ambush", "access.punish"],
      );
    case "access_net_damage_payoff_archives":
      return checked(
        "corp.ambush_bluff",
        "punish_payoff",
        "access_net_damage_payoff",
        accessEffects.some(
          (access) =>
            access.sourceZones.length === 1 &&
            access.sourceZones[0] === "archives" &&
            access.effects.some(
              (effect) =>
                effect.kind === "damage" && effect.damageType === "net",
            ),
        ),
        ["access.corp_archives_net_damage_ambush", "access.punish"],
      );
    case "damage_amplifier":
      return checked(
        "corp.damage_kill",
        "enabler",
        profile,
        engine.corpUtility?.kind === "meat_damage_boost",
        ["damage.corp_damage_amplifier"],
      );
    case "access_counter_credit_loss":
      return checked(
        "corp.ambush_bluff",
        "punish_payoff",
        profile,
        accessEffects.some((access) =>
          access.effects.some(
            (effect) =>
              effect.kind === "add_runner_counter" &&
              effect.counterType === "doppelganger",
          ),
        ) &&
          engine.runnerCounterEffects?.some(
            (counter) => counter.startOfRunnerTurn?.kind === "lose_credits",
          ) === true,
        ["access.corp_credit_loss_counter", "access.punish"],
      );
    case "install_rez_reserve_temporary":
      return checked(
        "corp.economy_rez_reserve",
        "engine_anchor",
        "install_rez_reserve",
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) => effect.kind === "gain_temporary_corp_run_credits",
          ),
        ),
        ["economy.corp_run_temporary_credit"],
      );
    case "install_rez_reserve_counter":
      return checked(
        "corp.economy_rez_reserve",
        "engine_anchor",
        "install_rez_reserve",
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) => effect.kind === "gain_temporary_corp_credits",
          ),
        ),
        ["economy.corp_install_rez_credit", "economy.corp_counter_cashout"],
      );
    case "ice_order_control":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        engine.corpUtility?.kind === "fort_start_reorder_ice",
        ["ice.corp_reorder_fort"],
      );
    case "trace_credit_enabler":
      return checked(
        "corp.tag_trace_punish",
        "enabler",
        profile,
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) => effect.kind === "gain_temporary_trace_credits",
          ),
        ),
        ["trace.corp_credit_support"],
      );
    case "access_window_advancement_enabler":
      return checked(
        "corp.ambush_bluff",
        "enabler",
        profile,
        fortRunWindows.some(
          (window) =>
            window.kind ===
            "add_advancement_counters_after_passing_last_ice_on_this_fort",
        ),
        [
          "advance.corp_counter_placement",
          "advance.access_window_counter_support",
        ],
      );
    case "ice_subroutine_repeat_support":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) => effect.kind === "copy_same_fort_ice_subroutine_for_run",
          ),
        ),
        ["ice.corp_subroutine_repeat"],
      );
    case "gray_ops_agenda_difficulty_discount":
    case "research_agenda_difficulty_discount":
    case "black_ops_agenda_difficulty_discount": {
      const subtype =
        profile === "gray_ops_agenda_difficulty_discount"
          ? "gray_ops"
          : profile === "research_agenda_difficulty_discount"
            ? "research"
            : "black_ops";
      return checked(
        "corp.remote_scoring",
        "scoring_tool",
        profile,
        modifiers.some(
          (modifier) =>
            modifier.kind === "agenda_difficulty" &&
            modifier.appliesTo.subtype === subtype,
        ),
        [
          "remote.agenda_difficulty_discount",
          `score.${subtype}_difficulty_discount`,
        ],
      );
    }
    case "run_spend_cap_tax":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        engine.corpUtility?.kind === "fort_start_runner_spend_cap",
        ["run.corp_spend_cap", "tax.runner_credit"],
      );
    case "access_counter_icebreaker_strength":
      return checked(
        "corp.ambush_bluff",
        "punish_payoff",
        profile,
        accessEffects.some((access) =>
          access.effects.some(
            (effect) =>
              effect.kind === "add_counter_to_all_installed_runner_icebreakers",
          ),
        ),
        ["access.corp_icebreaker_strength_counter", "access.punish"],
      );
    case "remote_content_swap_defense":
      return checked(
        "corp.remote_scoring",
        "defensive_tool",
        profile,
        engine.lifecycle?.on_rez?.some(
          (effect) => effect.kind === "replace_source_fort_cards_from_hq",
        ) === true,
        [
          "hq.corp_installed_card_bounce",
          "install.corp_uninstall_to_hq",
          "remote.content_swap_defense",
        ],
      );
    case "pass_ice_pay_or_end_tax":
      return checked(
        "corp.ice_tax_glacier",
        "tax_tool",
        profile,
        fortRunWindows.some(
          (window) =>
            window.kind ===
            "runner_pay_or_end_run_after_passing_ice_on_this_fort",
        ),
        ["run.corp_pay_or_end_run", "tax.runner_credit"],
      );
    case "pass_ice_pay_or_end_remote_protection":
      return checked(
        "corp.remote_scoring",
        "defensive_tool",
        profile,
        fortRunWindows.some(
          (window) =>
            window.kind ===
            "runner_pay_or_end_run_after_passing_ice_on_this_fort",
        ),
        ["run.corp_pay_or_end_run", "remote.scoring_protection"],
      );
    case "run_temporary_credit_reserve":
      return checked(
        "corp.economy_rez_reserve",
        "support_tool",
        profile,
        abilities.some((ability) =>
          ability.effects?.some(
            (effect) =>
              effect.kind ===
              "remove_same_fort_advancement_counters_for_run_credits",
          ),
        ),
        [
          "economy.corp_run_temporary_credit",
          "economy.corp_counter_cashout",
          "risk.temporary_credit_drawback",
        ],
      );
    case "central_multiaccess_reduction":
      return checked(
        "corp.central_stabilize",
        "defensive_tool",
        profile,
        accessEffects.some((access) =>
          access.effects.some(
            (effect) => effect.kind === "reduce_current_access_queue",
          ),
        ),
        ["access.corp_central_access_reduction"],
      );
    case "remote_run_control":
      return checked(
        "corp.remote_scoring",
        "defensive_tool",
        profile,
        engine.corpUtility?.kind === "start_run_redirect_to_source_fort",
        ["run.corp_redirect", "remote.scoring_protection"],
      );
    default:
      throw new Error(
        `card_spec_invalid_card_strategy_evidence_profile: ${profile as string}`,
      );
  }
}

function derivedStrategyEvidence(
  engine: ReturnType<
    typeof cardSpecPlanningCards
  >[number]["planning"]["engine"],
  strategyId?: string,
): string[] {
  const printed = engine.printedSubroutines ?? [];
  const traces = printed.filter((subroutine) => subroutine.kind === "trace");
  const traceDamageTypes = new Set(
    traces.flatMap((trace) =>
      trace.onSuccess.flatMap((outcome) =>
        outcome.kind === "preventable_damage"
          ? [outcome.damageType]
          : outcome.kind === "unpreventable_meat_damage"
            ? ["meat" as const]
            : [],
      ),
    ),
  );
  const hasTraceEndRun = traces.some((trace) =>
    trace.onSuccess.some((outcome) => outcome.kind === "end_run"),
  );
  const hasTraceRunLock = traces.some((trace) =>
    trace.onSuccess.some(
      (outcome) => outcome.kind === "runner_run_lock_until_action_paid",
    ),
  );
  const hasBreakLock = printed.some(
    (subroutine) => subroutine.kind === "prohibit_break_next_ice",
  );
  const hasDeflect = printed.some(
    (subroutine) => subroutine.kind === "deflect_run",
  );
  const hasRunDurationJackOutLock = printed.some(
    (subroutine) => subroutine.kind === "run_duration_cannot_jack_out",
  );
  if (strategyId === "corp.damage_kill" && traceDamageTypes.size > 0)
    return [
      "corp_ice.damage_source",
      ...[...traceDamageTypes].map(
        (damageType) => `corp_ice.${damageType}_damage`,
      ),
      "damage.payoff",
    ];
  if (
    strategyId === "corp.ice_tax_glacier" &&
    (hasTraceEndRun || hasTraceRunLock)
  )
    return [
      "corp_ice.trace_source",
      ...(hasTraceEndRun ? ["corp_ice.conditional_end_run", "ice.etr"] : []),
      ...(hasTraceRunLock ? ["corp_ice.run_lock", "run.lock"] : []),
      "trace.source",
    ];
  if (strategyId === "corp.ice_tax_glacier" && hasBreakLock)
    return ["corp_ice.next_ice_break_lock", "corp_ice.run_lock"];
  if (strategyId === "corp.ice_tax_glacier" && hasRunDurationJackOutLock)
    return ["corp_ice.jack_out_lock", "run.lock"];
  if (hasDeflect) {
    if (strategyId === "corp.ice_tax_glacier")
      return ["corp_ice.encounter_tax", "run.corp_redirect"];
    if (
      strategyId === "corp.remote_scoring" ||
      strategyId === "corp.central_stabilize"
    )
      return ["run.corp_redirect"];
  }
  if (
    strategyId === "corp.ice_tax_glacier" &&
    engine.fortRunWindows?.some(
      (window) =>
        window.kind === "move_self_to_outermost_position_on_other_fort",
    )
  )
    return [
      "corp_ice.mobile_position_change",
      "corp_ice.multi_end_run",
      "corp_ice.end_run",
    ];
  const destructiveAccess = engine.accessEffects?.flatMap(
    (access) => access.effects,
  );
  if (
    destructiveAccess?.some(
      (effect) =>
        effect.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
    )
  )
    return strategyId === "corp.ambush_bluff"
      ? ["remote.ambush", "access.corp_net_damage_ambush", "access.punish"]
      : ["access.corp_net_damage_ambush", "damage.payoff"];
  if (
    destructiveAccess?.some(
      (effect) =>
        effect.kind === "trash_installed_runner_hardware_and_programs",
    )
  )
    return strategyId === "corp.ambush_bluff"
      ? [
          "remote.ambush",
          "access.corp_hardware_trash",
          "access.corp_program_trash",
          "access.punish",
        ]
      : [
          "condition.runner_has_four_or_more_tags",
          "tag.payoff",
          "access.corp_hardware_trash",
          "access.corp_program_trash",
        ];
  const evidence = new Set<string>();
  const add = (...signals: string[]) =>
    signals.forEach((signal) => evidence.add(signal));
  const abilityEffects = (engine.abilities ?? []).flatMap(
    (ability) => ability.effects ?? [],
  );
  const accessEffects = (engine.accessEffects ?? []).flatMap(
    (access) => access.effects,
  );
  const printedKinds = new Set<string>(
    printed.map((subroutine) => subroutine.kind),
  );
  const scoredKind = engine.scoredAgenda?.kind;
  if (
    strategyId === "corp.deck_recycle_engine" &&
    scoredKind === "shuffle_hq_archives_into_rd_then_draw"
  )
    add("deck.corp_recycle", "draw.corp_action", "archives.corp_recycle");
  if (
    strategyId === "corp.central_stabilize" &&
    scoredKind === "shuffle_selected_hq_agendas_into_rd_gain_credits"
  )
    add("hq.corp_agenda_flood_control", "rnd.corp_agenda_recycle");
  if (
    strategyId === "corp.draw_engine" &&
    scoredKind === "corp_start_turn_optional_draw" &&
    abilityEffects.some((effect) => effect.kind === "draw_cards")
  )
    add("draw.corp_recurring", "score.recurring_draw");
  if (
    strategyId === "corp.overadvance_value" &&
    scoredKind === "overadvance_bonus_agenda_points"
  )
    add("score.overadvance_bonus", "score.agenda_point_payoff");
  if (
    strategyId === "corp.action_tempo" &&
    engine.lifecycle?.start_of_corp_turn?.some((entry) =>
      entry.effects.some(
        (effect) =>
          effect.kind === "gain_actions" && effect.recipient === "controller",
      ),
    )
  )
    add("action.corp_recurring", "score.extra_action_engine");
  if (strategyId === "corp.damage_kill") {
    if (scoredKind === "meat_damage_bonus") add("damage.corp_meat_amplifier");
    if (
      (engine.abilities ?? []).some(
        (ability) =>
          ability.condition?.kind === "runner_is_tagged" &&
          ability.effects.some((effect) => effect.kind === "damage"),
      )
    )
      add("condition.runner_tagged", "damage.corp_tagged_payoff");
    if (
      printed.some(
        (subroutine) =>
          subroutine.kind === "damage" ||
          subroutine.kind === "random_damage" ||
          subroutine.kind === "next_encounter_unless_fully_break_damage",
      )
    )
      add("corp_ice.damage_source", "damage.payoff");
    if (
      engine.uniqueDirectLongtail?.kind === "tagged_meat_damage" ||
      engine.uniqueDirectLongtail?.kind === "tag_threshold_meat_damage_asset"
    )
      add("condition.runner_tagged", "damage.corp_tagged_meat_payoff");
    if (
      accessEffects.some(
        (effect) =>
          effect.kind === "damage" ||
          effect.kind === "damage_from_source_advancement_counters",
      )
    )
      add("access.corp_damage_ambush", "damage.payoff");
  }
  if (strategyId === "corp.ice_tax_glacier") {
    if (
      [
        "select_rezzed_ice_mark_modifier",
        "score_rez_installed_ice_at_no_cost",
        "choose_fort_ice_strength_bonus",
        "reveal_top_rd_install_and_rez_ice_trash_rest",
      ].includes(String(scoredKind))
    )
      add("ice.corp_defense_support", "tax.ice");
    if (
      [
        "run_duration_encounter_cost_or_end_run",
        "run_duration_ice_strength",
        "runner_run_lock_actions",
        "prohibit_break_and_jack_out_next_ice",
        "runner_forgoes_next_action",
        "end_the_run_and_runner_forgoes_next_action",
        "run_duration_additional_subroutine",
        "random_resume_from_rezzed_ice_back_or_jack_out",
        "run_duration_jack_out_cost",
        "run_duration_trash_program_after_passing_rezzed_ice_unless_jack_out",
        "run_duration_break_subroutine_cost",
      ].some((kind) => printedKinds.has(kind))
    )
      add("corp_ice.encounter_tax", "tax.ice");
    if (
      engine.hiddenReplacementLongtail?.kind ===
      "conceal_and_reorder_installed_ice"
    )
      add("ice.corp_reorder", "defense.corp_hidden_ice");
    if (
      engine.fortRunWindows?.some((window) =>
        [
          "temporary_hq_ice_encounter_after_successful_run",
          "install_hq_ice_innermost_after_successful_run",
          "discounted_rez_ice_on_this_fort",
          "swap_unrezzed_fort_ice_with_hq_ice",
        ].includes(window.kind),
      )
    )
      add("ice.corp_fort_defense", "tax.ice");
  }
  if (strategyId === "corp.fast_advance") {
    if (
      abilityEffects.some((effect) =>
        [
          "move_advancement_counters",
          "distribute_advancement_counters",
        ].includes(effect.kind),
      )
    )
      add("advance.counter_manipulation", "score.fast_advance_support");
    if (
      (engine.abilities ?? []).some(
        (ability) =>
          ability.condition?.kind === "source_has_advancement_counters" &&
          ability.effects.some((effect) => effect.kind === "gain_actions"),
      ) ||
      abilityEffects.some((effect) => effect.kind === "gain_actions")
    )
      add("action.corp_burst", "score.fast_advance_action_support");
  }
  if (strategyId === "corp.asset_economy") {
    if (
      abilityEffects.some((effect) =>
        [
          "add_hosted_credits",
          "take_hosted_credits",
          "gain_credits_per_advancement_counter_on_source",
        ].includes(effect.kind),
      ) ||
      engine.lifecycle?.on_rez?.some(
        (effect) => effect.kind === "add_hosted_credits",
      ) ||
      engine.remainingReplacementLongtail?.kind ===
        "basic_credit_diversion_to_recurring_credits"
    )
      add("economy.corp_installed_engine", "economy.corp_recurring");
  }
  if (strategyId === "corp.ambush_bluff") {
    if (
      accessEffects.some((effect) =>
        [
          "trash_installed_runner_cards",
          "damage",
          "damage_from_source_advancement_counters",
          "add_runner_counter",
        ].includes(effect.kind),
      )
    )
      add("remote.ambush", "access.punish");
  }
  if (strategyId === "corp.remote_scoring") {
    if (
      [
        "score_rez_installed_ice_at_no_cost",
        "choose_fort_ice_strength_bonus",
      ].includes(String(scoredKind))
    )
      add("score.remote_defense", "ice.corp_defense_support");
    if (
      abilityEffects.some(
        (effect) => effect.kind === "distribute_advancement_counters",
      )
    )
      add("advance.counter_distribution", "score.remote_advancement_support");
    if (
      engine.hiddenReplacementLongtail?.kind ===
      "delayed_agenda_access_replacement"
    )
      add("access.corp_agenda_delay", "score.remote_window");
    if (
      engine.fortRunWindows?.some((window) =>
        [
          "temporary_hq_ice_encounter_after_successful_run",
          "install_hq_ice_innermost_after_successful_run",
          "roll_die_on_pass_rezzed_ice_on_same_fort",
        ].includes(window.kind),
      )
    )
      add("score.remote_defense", "ice.corp_fort_defense");
    if (
      engine.fortCapacityModifiers?.some(
        (modifier) =>
          modifier.kind === "additional_agenda_or_node_slot_inside_fort",
      )
    )
      add("score.remote_capacity", "remote.corp_slot_expansion");
  }
  if (strategyId === "corp.tag_trace_punish") {
    const traceEffects = abilityEffects.filter(
      (effect) => effect.kind === "trace",
    );
    if (
      traceEffects.some((effect) =>
        effect.onSuccess.some((entry) => entry.kind === "add_tags"),
      ) ||
      printed.some(
        (subroutine) =>
          subroutine.kind === "trace" &&
          subroutine.onSuccess.some((effect) => effect.kind === "add_tags"),
      ) ||
      accessEffects.some(
        (effect) =>
          effect.kind === "trace" &&
          effect.onSuccess.some((entry) => entry.kind === "add_tags"),
      )
    )
      add("trace.source", "tag.source");
    if (
      (engine.abilities ?? []).some(
        (ability) =>
          ability.condition?.kind === "runner_is_tagged" &&
          ability.effects.some((effect) =>
            ["add_tags", "damage", "lose_credits"].includes(effect.kind),
          ),
      ) ||
      engine.accessEffects?.some(
        (access) =>
          access.condition?.kind === "runner_is_tagged" &&
          access.effects.some((effect) => effect.kind === "damage"),
      )
    )
      add("condition.runner_tagged", "tag.payoff");
    if (
      [
        "trash_runner_resources_if_tagged",
        "installed_hardware_trash_by_counter",
        "encounter_tag",
        "end_turn_tag_if_runner_received_tag",
        "recurring_trace_credit_pool",
      ].includes(String(engine.corpUtility?.kind)) ||
      [
        "runner_draw_tax_tag",
        "trace_bit_counter_pool_asset",
        "link_reduction_counter_upgrade",
      ].includes(String(engine.remainingReplacementLongtail?.kind)) ||
      ["tagged_meat_damage", "tag_threshold_meat_damage_asset"].includes(
        String(engine.uniqueDirectLongtail?.kind),
      ) ||
      engine.fortRunWindows?.some(
        (window) => window.kind === "corp_trace_bits_during_runs_on_this_fort",
      )
    )
      add("tag.trace_typed_support");
  }
  for (const scored of engine.scoredAgenda === undefined
    ? []
    : [engine.scoredAgenda]) {
    if (scored.kind === "add_counters_on_score")
      add(
        "score.run_end_counter_bank",
        "run.corp_end_run_counter",
        "defense.corp_run_end_counter",
      );
    if (scored.kind === "purge_runner_virus_counters_and_prevent_next")
      add(
        "virus.corp_counter_clear",
        "virus.corp_counter_prevention",
        "defense.virus_counter_defense",
      );
    if (scored.kind === "corp_start_turn_mandatory_draw")
      add("draw.corp_recurring", "score.recurring_draw");
  }
  if (engine.agendaAccessReplacement?.kind === "install_as_runner_program")
    add(
      "access.corp_agenda_steal_replacement",
      "risk.fragile_delayed_score",
      "risk.program_removal_denies_score",
    );
  for (const utility of engine.corpUtility === undefined
    ? []
    : [engine.corpUtility]) {
    if (utility.kind === "corp_archives_to_hq")
      add(
        "archives.corp_recovery",
        "hq.corp_ice_recovery",
        "ice.corp_recovery",
        "info.reveal_recovered_cards_to_runner",
      );
    if (utility.kind === "corp_start_turn_tag_roll_per_runner_run_last_turn")
      add("condition.runner_attempted_run_last_turn", "tag.source");
    if (utility.kind === "corp_draw_extra_then_bottom_one")
      add("draw.corp_draw", "draw.corp_recurring", "hq.corp_hand_filter");
    if (
      utility.kind === "run_start_lose_runner_credits_per_tag" ||
      utility.kind === "run_start_tax"
    )
      add("tag.payoff", "tag.runner_credit_loss_payoff");
    if (utility.kind === "runner_memory_limit_modifier_until_end_of_turn")
      add(
        "tag.payoff",
        "tag.runner_memory_pressure",
        "runner.memory_reduction",
      );
  }
  for (const followup of engine.successfulRunFollowups ?? [])
    if (
      followup.kind ===
      "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count"
    )
      add("run.successful_run_grip_reset");
  for (const modifier of engine.modifiers ?? []) {
    if (modifier.kind === "install_cost")
      evidence.add(
        modifier.operation === "reduce"
          ? "setup.install_discount"
          : "tax.corp_ice_install",
      );
    if (modifier.kind === "rez_cost") evidence.add("ice.corp_rez_discount");
    if (modifier.kind === "ice_strength") {
      evidence.add("ice.corp_strength_support");
      evidence.add("tax.ice");
    }
    if (modifier.kind === "additional_subroutine") evidence.add("tax.ice");
    if (
      modifier.kind === "break_ability_use_cost" ||
      modifier.kind === "break_subroutine_cost"
    )
      evidence.add("tax.ice");
    if (modifier.kind === "steal_cost") {
      evidence.add("access.agenda_steal_tax");
      evidence.add("tax.remote");
    }
    if (modifier.kind === "trash_cost") evidence.add("access.trash_tax");
    if (modifier.kind === "agenda_difficulty") {
      const operation =
        modifier.operation === "reduce" ? "discount" : "increase";
      evidence.add(`score.agenda_difficulty_${operation}`);
      evidence.add(
        `score.${modifier.appliesTo.subtype}_difficulty_${operation}`,
      );
    }
  }
  for (const access of engine.accessEffects ?? []) {
    const accessDamageEffects = access.effects.filter(
      (effect) =>
        effect.kind === "damage" ||
        effect.kind === "damage_from_source_advancement_counters",
    );
    if (accessDamageEffects.length > 0) {
      for (const effect of accessDamageEffects)
        evidence.add(accessDamageAmbushSignal(effect.damageType));
      if (strategyId === "corp.ambush_bluff") evidence.add("access.punish");
      if (strategyId === "corp.damage_kill") evidence.add("damage.payoff");
    } else if (
      access.effects.some(
        (effect) =>
          effect.kind ===
          "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
      )
    ) {
      evidence.add("remote.ambush");
      evidence.add("access.corp_net_damage_ambush");
      if (strategyId === "corp.ambush_bluff") evidence.add("access.punish");
      if (strategyId === "corp.damage_kill") evidence.add("damage.payoff");
    } else if (
      access.effects.some(
        (effect) =>
          effect.kind === "trash_installed_runner_hardware_and_programs",
      )
    ) {
      add(
        "remote.ambush",
        "access.corp_hardware_trash",
        "access.corp_program_trash",
      );
      if (strategyId === "corp.ambush_bluff") evidence.add("access.punish");
      if (access.condition?.kind === "runner_tags_at_least")
        add("condition.runner_has_four_or_more_tags", "tag.payoff");
    }
  }
  for (const ability of engine.abilities ?? [])
    if (
      ability.effects?.some(
        (effect) =>
          effect.kind === "double_chosen_ice_strength_until_end_of_turn",
      )
    )
      add("ice.corp_targeted_strength_boost", "ice.corp_strength_support");
  const extendedPrintedEvidence = (engine.printedSubroutines ?? []).some(
    (subroutine) =>
      subroutine.kind === "random_damage" ||
      subroutine.kind === "trace" ||
      subroutine.kind === "prohibit_break_next_ice" ||
      subroutine.kind === "deflect_run" ||
      subroutine.kind === "end_the_run_and_trash_source_at_end_of_turn" ||
      subroutine.kind === "trash_program",
  );
  if (extendedPrintedEvidence)
    for (const subroutine of engine.printedSubroutines ?? []) {
      if (subroutine.kind === "damage") {
        add(
          "corp_ice.damage_source",
          `corp_ice.${subroutine.damageType}_damage`,
        );
        if (strategyId === "corp.damage_kill") evidence.add("damage.payoff");
      }
      if (subroutine.kind === "random_damage")
        add(
          "corp_ice.brain_damage",
          "corp_ice.damage_source",
          "damage.payoff",
          "risk.random_outcome",
        );
      if (subroutine.kind === "end_the_run") evidence.add("corp_ice.end_run");
      if (subroutine.kind === "prohibit_break_next_ice")
        add("corp_ice.next_ice_break_lock", "corp_ice.run_lock");
      if (subroutine.kind === "deflect_run")
        add("corp_ice.encounter_tax", "run.corp_redirect");
    }
  if (
    (engine.printedSubroutines ?? []).filter(
      (subroutine) => subroutine.kind === "end_the_run",
    ).length > 1
  )
    add("corp_ice.multi_end_run");
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "move_self_to_outermost_position_on_other_fort")
      add("corp_ice.mobile_position_change");
  for (const counter of engine.runnerCounterEffects ?? [])
    if (counter.runStart?.kind === "damage")
      add("damage.corp_persistent_damage_counter");
  if (
    engine.scoredAgenda?.kind ===
    "score_install_hq_cards_into_new_remote_then_rez"
  ) {
    evidence.add("score.remote_fort_creation");
    evidence.add("score.remote_install_budget");
  }
  for (const window of engine.fortRunWindows ?? [])
    if (window.kind === "server_run_start_restriction") {
      evidence.add("run.corp_server_lock");
      evidence.add("condition.corp_installed_or_advanced_this_fort_last_turn");
    }
  if (engine.variableRez?.kind === "x_strength")
    evidence.add("corp_ice.rez_paid_scaling");
  if (
    engine.abilities?.some(
      (ability) =>
        ability.condition?.kind === "runner_is_tagged" &&
        ability.effects?.some(
          (effect) =>
            effect.kind === "lose_credits" && effect.recipient === "runner",
        ),
    )
  ) {
    evidence.add("punish.payoff");
    evidence.add("tag.payoff");
  }
  if (strategyId !== undefined && evidence.size === 0)
    throw new Error(
      `card_spec_strategy_support_evidence_missing: ${strategyId}`,
    );
  return [...evidence].sort();
}
