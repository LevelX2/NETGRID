import { type AiDecisionInput } from "@netgrid/shared";
import { currentRunPathContext } from "../../run-analysis/current-run-path-context";
import {
  assessRandomBreakOrDamageRiskForVisibleRunPath,
  randomBreakOrDamageRiskCanCarryRunPath,
} from "../../actions/risk-action-projection";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import {
  ActiveRunnerRunRoot,
  RunnerRunOrigin,
} from "../../plans/runner-run-origin-contract";
import {
  type RunnerInformationBoundaryReassessmentSignal,
  type RunnerPlanDomain,
  type RunnerPressureSignal,
  type RunnerRemoteContestSignal,
  type RunnerRunAccessCommitmentSignal,
  type RunnerRunRiskContractSignal,
} from "../../plans/runner-tactical-plan-contracts";
import { uniqueBy } from "../../runtime/collection";
import {
  currentEncounteredIceCard,
  currentEncounterUnbrokenSubroutineIndexes,
  currentRunRemainingIce,
} from "../../runtime/current-encounter";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../../visible-run-analysis";
import { reservedAccessTrashCredits } from "./run-window-access";
import { runnerRunRiskContractReassessment } from "./run-window-assessment";
import {
  knownPathAfterDamageBudget,
  runnerConfirmedDamageRequiredHandFloor,
  runnerVisibleLethalIceDamageAssessment,
} from "../../runner-damage-threat-assessment";

export function activeRunRootPlan(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
): ActiveRunnerRunRoot | undefined {
  const serverId = input.playerView.run?.attackedServerId;
  if (!previous || !serverId) return undefined;
  const candidates = [
    previous.instances.find(
      (instance) =>
        instance.instanceId === previous.executorInstanceId &&
        instance.target?.kind === "server" &&
        instance.target.id === serverId,
    ),
    previous.instances.find(
      (instance) =>
        instance.instanceId === previous.rootForegroundInstanceId &&
        instance.moduleId === "runner.convert_run_window" &&
        instance.target?.kind === "server" &&
        instance.target.id === serverId,
    ),
    ...previous.instances.filter(
      (instance) =>
        instance.target?.kind === "server" &&
        instance.target.id === serverId &&
        (instance.moduleId === "runner.pressure_central" ||
          instance.moduleId === "runner.contest_remote"),
    ),
  ].filter((instance) => instance !== undefined);
  const root = candidates[0];
  if (!root) return undefined;
  const runOrigin = runOriginFromModuleState(root.moduleState);
  const accessCommitment = accessCommitmentFromModuleState(root.moduleState);
  const moduleState = root.moduleState as {
    kind?: unknown;
    signal?: unknown;
  };
  const restrictedRunBinding =
    root.moduleId === "runner.convert_run_window" &&
    moduleState.kind === "run_window" &&
    (moduleState.signal as { purposeCode?: unknown } | undefined)
      ?.purposeCode === "continue_engine_restricted_run_sequence"
      ? (structuredClone(
          moduleState.signal,
        ) as RunnerPlanDomain["runWindows"][number])
      : undefined;
  const parentBinding =
    root.moduleId === "runner.pressure_central" &&
    moduleState.kind === "central_pressure" &&
    moduleState.signal &&
    typeof moduleState.signal === "object"
      ? {
          moduleId: "runner.pressure_central" as const,
          signal: structuredClone(moduleState.signal) as RunnerPressureSignal,
        }
      : root.moduleId === "runner.contest_remote" &&
          moduleState.kind === "remote_contest" &&
          moduleState.signal &&
          typeof moduleState.signal === "object"
        ? {
            moduleId: "runner.contest_remote" as const,
            signal: structuredClone(
              moduleState.signal,
            ) as RunnerRemoteContestSignal,
          }
        : undefined;
  return {
    instanceId: root.instanceId,
    ...runOrigin,
    ...(accessCommitment ? { accessCommitment } : {}),
    ...(parentBinding ? { parentBinding } : {}),
    ...(restrictedRunBinding ? { restrictedRunBinding } : {}),
  };
}

function runOriginFromModuleState(moduleState: unknown): RunnerRunOrigin {
  if (!moduleState || typeof moduleState !== "object") return {};
  const signal = (moduleState as { signal?: unknown }).signal;
  if (!signal || typeof signal !== "object") return {};
  const purpose = (signal as { purpose?: unknown }).purpose;
  const encounterCreditSpendLimit = (
    signal as { encounterCreditSpendLimit?: unknown }
  ).encounterCreditSpendLimit;
  const informationBoundaryReassessment = (
    signal as { informationBoundaryReassessment?: unknown }
  ).informationBoundaryReassessment;
  const runRiskContract = (signal as { runRiskContract?: unknown })
    .runRiskContract;
  const postBreakTrashCommitment = (signal as RunnerPressureSignal)
    .postBreakTrashCommitment;
  return {
    ...(postBreakTrashCommitment
      ? { postBreakTrashCommitment: structuredClone(postBreakTrashCommitment) }
      : {}),
    ...(purpose === "access" ||
    purpose === "multiaccess" ||
    purpose === "information" ||
    purpose === "contest"
      ? { purpose }
      : {}),
    ...(typeof encounterCreditSpendLimit === "number" &&
    Number.isFinite(encounterCreditSpendLimit) &&
    encounterCreditSpendLimit >= 0
      ? { encounterCreditSpendLimit }
      : {}),
    ...(isRunnerInformationBoundaryReassessment(informationBoundaryReassessment)
      ? {
          informationBoundaryReassessment: structuredClone(
            informationBoundaryReassessment,
          ),
        }
      : {}),
    ...(isRunnerRunRiskContract(runRiskContract)
      ? { runRiskContract: structuredClone(runRiskContract) }
      : {}),
  };
}

export function reassessActiveInformationRunParent(
  input: AiDecisionInput,
  root: ActiveRunnerRunRoot | undefined,
): ActiveRunnerRunRoot | undefined {
  const run = input.playerView.run;
  const encounteredIce = currentEncounteredIceCard(input);
  if (
    !root?.parentBinding ||
    !run ||
    run.phase !== "encounter_ice" ||
    !encounteredIce ||
    encounteredIce.known !== true ||
    encounteredIce.rezzed !== true ||
    !encounteredIce.effectiveRunQuote ||
    (root.purpose !== "information" &&
      root.informationBoundaryReassessment?.startedAsInformation !== true)
  ) {
    return root;
  }

  // The card quote describes the whole ICE. Only the engine's current
  // continuation knows which subroutines still need to be paid for.
  // A payment/choice interruption retains its bound parent until that
  // continuation is offered again.
  if (
    !input.legalActions.some(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    )
  )
    return root;
  const unbroken = currentEncounterUnbrokenSubroutineIndexes(input);
  const remainingEncounter = {
    ...encounteredIce,
    effectiveRunQuote: {
      ...encounteredIce.effectiveRunQuote,
      subroutines: encounteredIce.effectiveRunQuote.subroutines.filter(
        (_, index) => unbroken.has(index),
      ),
    },
  };
  const remainingIce = uniqueBy(
    [...currentRunRemainingIce(input), remainingEncounter],
    (ice) => ice.instanceId,
  );
  const pathBeforeDamageBudget = assessKnownRezzedIcePath(
    remainingIce,
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits +
        Math.max(0, input.playerView.run?.badPublicityCredits ?? 0),
      input.playerView.own.rig ?? [],
    ),
    input.playerView.servers.find(
      (server) => server.id === run.attackedServerId,
    )?.root ?? [],
    input.playerView.opponent.credits,
    currentRunPathContext(input),
  );
  const knownPath = pathBeforeDamageBudget.knownPathBlockedOnlyByDamage
    ? knownPathAfterDamageBudget(
        pathBeforeDamageBudget,
        !runnerVisibleLethalIceDamageAssessment(input, remainingIce, {
          generalCredits: pathBeforeDamageBudget.creditsAfterPath,
          ...(pathBeforeDamageBudget.paidSubroutineBreaks
            ? {
                paidSubroutineBreaks:
                  pathBeforeDamageBudget.paidSubroutineBreaks,
              }
            : {}),
          requiredHandFloor: runnerConfirmedDamageRequiredHandFloor(input),
          ...(pathBeforeDamageBudget.fullyBrokenIceInstanceIds
            ? {
                fullyBrokenIceInstanceIds:
                  pathBeforeDamageBudget.fullyBrokenIceInstanceIds,
              }
            : {}),
        }),
      )
    : pathBeforeDamageBudget;
  const unknownIceCount = remainingIce.filter(
    (ice) =>
      ice.known !== true ||
      ice.rezzed !== true ||
      ice.effectiveRunQuote === undefined,
  ).length;
  const knownPathCost = Math.max(0, knownPath.visibleBreakCost ?? 0);
  const reservedCredits =
    root.accessCommitment?.intendedAction === "trash"
      ? reservedAccessTrashCredits(input, root.accessCommitment)
      : 0;
  const fundingGap = Math.max(0, reservedCredits - knownPath.creditsAfterPath);
  const unavoidableHazardCount = Math.max(
    0,
    knownPath.unavoidableVisibleIceHazardCount ?? 0,
  );
  const parentSignal = root.parentBinding.signal;
  const marginalValue = Number(parentSignal.marginalValue);
  const payoff = root.accessCommitment?.payoff;
  const conditionalRiskRoute = assessRandomBreakOrDamageRiskForVisibleRunPath(
    input,
    {
      targetServerId: run.attackedServerId,
      visibleIce: remainingIce,
      ...(payoff ? { accessPayoff: payoff } : {}),
      scoreThreat: payoff === "score_threat",
    },
  );
  // The same canonical damage-risk quote that admits the run also owns
  // conditional reachability after an information boundary. A deterministic
  // breaker quote alone cannot disprove an admissible probabilistic route.
  const probabilisticPathReachable =
    randomBreakOrDamageRiskCanCarryRunPath(conditionalRiskRoute);
  const knownPathReachable =
    knownPath.canReachAccess || probabilisticPathReachable;
  const hasConcretePayoff =
    payoff === "agenda" ||
    payoff === "score_threat" ||
    payoff === "trash_affordable" ||
    payoff === "access_bonus";
  const hasSpeculativeInformationValue =
    Number.isFinite(marginalValue) &&
    marginalValue > 0 &&
    knownPath.creditsAfterPath > 0;
  const hasMaterialPayoff = hasConcretePayoff || hasSpeculativeInformationValue;
  const convert =
    knownPathReachable &&
    unknownIceCount === 0 &&
    fundingGap === 0 &&
    unavoidableHazardCount === 0 &&
    hasMaterialPayoff;
  const nextPurpose = convert
    ? root.parentBinding.moduleId === "runner.contest_remote"
      ? ("contest" as const)
      : ("access" as const)
    : ("information" as const);
  const decision = convert
    ? root.parentBinding.moduleId === "runner.contest_remote"
      ? ("convert_to_contest" as const)
      : ("convert_to_access" as const)
    : ("retain_information" as const);
  // The entry quote is the accepted risk baseline, not a permanently locked
  // credit amount. Revealed ICE and spent Corp rez credits can reduce the
  // reserve while the same run is still in progress.
  const currentRisk = runnerRunRiskContractReassessment(input, root);
  if (root.runRiskContract && !currentRisk?.currentReserveQuote) {
    // Keep the binding for the run owner's structured fail-closed assessment.
    return root;
  }
  const preservedRunReserve = Math.max(
    0,
    currentRisk?.currentReserveQuote?.requiredCredits ?? 0,
  );
  const knownEncounterPathFitsBoundRunBudget =
    knownPathReachable &&
    fundingGap === 0 &&
    knownPath.creditsAfterPath >= preservedRunReserve;
  const encounterBudget =
    convert || knownEncounterPathFitsBoundRunBudget
      ? knownPathCost
      : Math.min(
          Math.max(0, root.encounterCreditSpendLimit ?? 0),
          Math.max(0, input.playerView.own.credits),
        );
  const evidenceCodes = [
    "runner_information_boundary_reassessment",
    `runner_information_boundary_previous_purpose:${root.purpose ?? "information"}`,
    `runner_information_boundary_next_purpose:${nextPurpose}`,
    `runner_information_boundary_decision:${decision}`,
    `runner_information_boundary_known_path_cost:${knownPathCost}`,
    `runner_information_boundary_known_path_reachable:${knownPathReachable}`,
    `runner_information_boundary_probabilistic_path_reachable:${probabilisticPathReachable}`,
    ...(conditionalRiskRoute?.evidence ?? []),
    `runner_information_boundary_unknown_ice:${unknownIceCount}`,
    `runner_information_boundary_credits_after_path:${knownPath.creditsAfterPath}`,
    `runner_information_boundary_reserved_credits:${reservedCredits}`,
    `runner_information_boundary_funding_gap:${fundingGap}`,
    `runner_information_boundary_unavoidable_hazards:${unavoidableHazardCount}`,
    `runner_information_boundary_preserved_run_reserve:${preservedRunReserve}`,
    `runner_information_boundary_known_encounter_fits_run_budget:${knownEncounterPathFitsBoundRunBudget}`,
    `runner_information_boundary_payoff:${payoff ?? "parent_marginal_value"}`,
    `runner_information_boundary_encounter_budget:${encounterBudget}`,
  ];
  const reassessment: RunnerInformationBoundaryReassessmentSignal = {
    startedAsInformation: true,
    previousPurpose: root.purpose ?? "information",
    nextPurpose,
    decision,
    boundaryKind: "visible_ice_path_changed",
    observedAtStateVersion: input.playerView.stateVersion,
    observedIceInstanceId: encounteredIce.instanceId,
    knownPathCost,
    knownPathReachable,
    unknownIceCount,
    runnerCreditsBeforeQuote: input.playerView.own.credits,
    creditsAfterKnownPath: knownPath.creditsAfterPath,
    reservedCredits,
    fundingGap,
    unavoidableHazardCount,
    remainingClicks: input.playerView.own.clicks,
    encounterBudget,
    evidenceCodes,
  };
  const reboundSignal = {
    ...parentSignal,
    purpose: nextPurpose,
    encounterCreditSpendLimit: encounterBudget,
    informationBoundaryReassessment: reassessment,
    evidenceCode: `runner_information_boundary_parent_requoted:${decision}`,
  };

  return {
    ...root,
    purpose: nextPurpose,
    encounterCreditSpendLimit: encounterBudget,
    informationBoundaryReassessment: reassessment,
    parentBinding:
      root.parentBinding.moduleId === "runner.pressure_central"
        ? {
            moduleId: "runner.pressure_central",
            signal: reboundSignal as RunnerPressureSignal,
          }
        : {
            moduleId: "runner.contest_remote",
            signal: reboundSignal as RunnerRemoteContestSignal,
          },
  };
}

function isRunnerInformationBoundaryReassessment(
  value: unknown,
): value is RunnerInformationBoundaryReassessmentSignal {
  if (!value || typeof value !== "object") return false;
  const candidate =
    value as Partial<RunnerInformationBoundaryReassessmentSignal>;
  return (
    candidate.startedAsInformation === true &&
    candidate.boundaryKind === "visible_ice_path_changed" &&
    typeof candidate.observedAtStateVersion === "number" &&
    typeof candidate.observedIceInstanceId === "string" &&
    typeof candidate.knownPathReachable === "boolean" &&
    typeof candidate.knownPathCost === "number" &&
    Number.isFinite(candidate.knownPathCost) &&
    typeof candidate.fundingGap === "number" &&
    Number.isFinite(candidate.fundingGap) &&
    typeof candidate.unavoidableHazardCount === "number" &&
    Number.isFinite(candidate.unavoidableHazardCount) &&
    Array.isArray(candidate.evidenceCodes)
  );
}

function isRunnerRunRiskContract(
  value: unknown,
): value is RunnerRunRiskContractSignal {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RunnerRunRiskContractSignal>;
  const quote = candidate.reserveQuote;
  return (
    candidate.schemaVersion === "runner-run-risk-contract-v1" &&
    typeof candidate.serverId === "string" &&
    typeof candidate.observedAtStateVersion === "number" &&
    (candidate.runCommitment === "probe_only" ||
      candidate.runCommitment === "full_path") &&
    typeof candidate.unrezzedIceRisk === "number" &&
    Number.isFinite(candidate.unrezzedIceRisk) &&
    typeof candidate.visibleDuringRunRezSupport === "boolean" &&
    quote !== undefined &&
    typeof quote.requiredCredits === "number" &&
    Number.isFinite(quote.requiredCredits) &&
    typeof quote.requiredHandBuffer === "number" &&
    Number.isFinite(quote.requiredHandBuffer) &&
    Array.isArray(candidate.evidenceCodes)
  );
}

function accessCommitmentFromModuleState(
  moduleState: unknown,
): RunnerRunAccessCommitmentSignal | undefined {
  if (!moduleState || typeof moduleState !== "object") return undefined;
  const signal = (moduleState as { signal?: unknown }).signal;
  if (!signal || typeof signal !== "object") return undefined;
  const commitment = (
    signal as { accessCommitment?: RunnerRunAccessCommitmentSignal }
  ).accessCommitment;
  if (
    !commitment ||
    !Array.isArray(commitment.knownTargetDefinitionIds) ||
    !(
      commitment.trashBudget === "unknown" ||
      commitment.trashBudget === "not_applicable" ||
      (typeof commitment.trashBudget === "number" &&
        Number.isFinite(commitment.trashBudget) &&
        commitment.trashBudget >= 0)
    )
  ) {
    return undefined;
  }
  return structuredClone(commitment);
}
