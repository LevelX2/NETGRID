import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { runnerNoRunEconomyCommitmentScoreComponents as buildRunnerNoRunEconomyCommitmentScoreComponents } from "./runner-economy-commitment-score";
import { rolesMatch } from "./role-match";

type RunnerNoRunEconomyCommitmentStatus =
  | "inactive"
  | "install_ready"
  | "install_deferred"
  | "active_unrealized"
  | "active_partially_realized"
  | "active_realized";

type RunnerNoRunEconomyCommitmentAssessment = {
  active: boolean;
  status: RunnerNoRunEconomyCommitmentStatus;
  source: string;
  commitmentStrength: number;
  realizedValueEstimate: number;
  expectedFutureValue: number;
  runBreaksCommitment: boolean;
  noRunCommitmentPenalty: number;
  runOverride?: string;
};

export type RunnerNoRunEconomyContextDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  hintEffectsForDefinition: (definitionId: string) => readonly unknown[];
  mechanicsForDefinition: (definitionId: string) => readonly string[];
  rulesTextForDefinition: (definitionId: string) => string | undefined;
  runnerBankCommitmentRunOverride: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  isRunnerRigInstallAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export type RunnerNoRunEconomyContext = {
  runnerNoRunEconomyCommitmentScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  runnerNoRunEconomyCommitmentEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
};

export function createRunnerNoRunEconomyContext(
  dependencies: RunnerNoRunEconomyContextDependencies,
): RunnerNoRunEconomyContext {
  function runnerNoRunEconomyCommitmentScoreComponents(
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent[] {
    return buildRunnerNoRunEconomyCommitmentScoreComponents(input, action, {
      assessment: runnerNoRunEconomyCommitmentAssessment,
      evidence: runnerNoRunEconomyCommitmentEvidence,
      isInstallAction: isRunnerNoRunEconomyInstallAction,
      isRigInstallAction: dependencies.isRunnerRigInstallAction,
    });
  }

  function runnerNoRunEconomyCommitmentEvidence(
    input: AiDecisionInput,
    action: LegalAction,
  ): string[] {
    if (input.side !== "runner" || action.side !== "runner") return [];
    const assessment = runnerNoRunEconomyCommitmentAssessment(input, action);
    if (!assessment.active && assessment.status === "inactive") return [];
    return [
      `noRunEconomyCommitmentActive:${assessment.active}`,
      `noRunEconomySource:${assessment.source}`,
      `commitmentStrength:${assessment.commitmentStrength}`,
      `realizedValueEstimate:${assessment.realizedValueEstimate}`,
      `expectedFutureValue:${assessment.expectedFutureValue}`,
      `runBreaksCommitment:${assessment.runBreaksCommitment}`,
      `noRunCommitmentPenalty:${assessment.noRunCommitmentPenalty}`,
      `noRunCommitmentStatus:${assessment.status}`,
      ...(action.type === "start_run" && assessment.runOverride
        ? [`why_run_allowed_despite_conference:${assessment.runOverride}`]
        : action.type === "start_run" && assessment.runBreaksCommitment
          ? ["why_run_deferred_for_conference:low_value_run"]
          : []),
      ...(isRunnerNoRunEconomyInstallAction(input, action) &&
      assessment.status === "install_deferred"
        ? ["why_conference_install_deferred:no_setup_window"]
        : []),
    ];
  }

  function runnerNoRunEconomyCommitmentAssessment(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerNoRunEconomyCommitmentAssessment {
    const installCard = isRunnerNoRunEconomyInstallAction(input, action)
      ? dependencies.findVisibleCard(input, action.source)
      : undefined;
    const installedSources = runnerNoRunEconomyInstalledSources(input);
    const sourceCard = installedSources[0] ?? installCard;
    const source = sourceCard?.definitionId ?? "no_run_economy";
    const expectedValue = sourceCard
      ? runnerNoRunEconomyExpectedCredits(sourceCard.definitionId)
      : 0;
    const realizedValueEstimate = sourceCard
      ? runnerNoRunEconomyRealizedCredits(input, sourceCard.definitionId)
      : 0;
    const expectedFutureValue = Math.max(
      0,
      expectedValue - realizedValueEstimate,
    );
    const runOverride =
      action.type === "start_run"
        ? dependencies.runnerBankCommitmentRunOverride(input, action)
        : undefined;
    const runBreaksCommitment =
      action.type === "start_run" && installedSources.length > 0;
    const active = Boolean(sourceCard);
    const commitmentStrength = active
      ? Math.max(1, Math.min(3, expectedFutureValue + 1))
      : 0;
    const noRunCommitmentPenalty =
      expectedFutureValue > 0 ? -(1400 + expectedFutureValue * 500) : -850;

    if (!active) {
      return {
        active: false,
        status: "inactive",
        source,
        commitmentStrength,
        realizedValueEstimate,
        expectedFutureValue,
        runBreaksCommitment,
        noRunCommitmentPenalty: 0,
        ...(runOverride ? { runOverride } : {}),
      };
    }

    if (installCard) {
      const setupWindow = runnerNoRunEconomyInstallHasSetupWindow(
        input,
        action,
      );
      return {
        active: setupWindow,
        status: setupWindow ? "install_ready" : "install_deferred",
        source,
        commitmentStrength: setupWindow ? 2 : 1,
        realizedValueEstimate,
        expectedFutureValue,
        runBreaksCommitment,
        noRunCommitmentPenalty: setupWindow ? -900 : -1450,
        ...(runOverride ? { runOverride } : {}),
      };
    }

    return {
      active,
      status:
        expectedFutureValue <= 0
          ? "active_realized"
          : realizedValueEstimate > 0
            ? "active_partially_realized"
            : "active_unrealized",
      source,
      commitmentStrength,
      realizedValueEstimate,
      expectedFutureValue,
      runBreaksCommitment,
      noRunCommitmentPenalty,
      ...(runOverride ? { runOverride } : {}),
    };
  }

  function isRunnerNoRunEconomyInstallAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    if (
      input.side !== "runner" ||
      action.side !== "runner" ||
      action.type !== "install_card"
    )
      return false;
    return runnerCardHasNoRunEconomyCommitment(
      dependencies.findVisibleCard(input, action.source)?.definitionId,
    );
  }

  function runnerNoRunEconomyInstalledSources(
    input: AiDecisionInput,
  ): VisibleCard[] {
    return (input.playerView.own.rig ?? []).filter((card) =>
      runnerCardHasNoRunEconomyCommitment(card.definitionId),
    );
  }

  function runnerCardHasNoRunEconomyCommitment(
    definitionId: string | undefined,
  ): boolean {
    if (!definitionId) return false;
    const effectTargets = dependencies
      .hintEffectsForDefinition(definitionId)
      .map((effect) => stringRecordValue(effect, "target") ?? "")
      .filter(Boolean);
    const mechanics = dependencies.mechanicsForDefinition(definitionId);
    const hasTurnStartEconomy =
      effectTargets.includes("economy.turn_start_credit") ||
      rolesMatch(mechanics, ["start_of_turn_credit_gain"]);
    const hasRunDrawback =
      effectTargets.includes("risk.ends_on_run") ||
      rolesMatch(mechanics, ["trash_on_run"]);
    return hasTurnStartEconomy && hasRunDrawback;
  }

  function runnerNoRunEconomyExpectedCredits(
    definitionId: string | undefined,
  ): number {
    if (!definitionId) return 0;
    const text = dependencies.rulesTextForDefinition(definitionId) ?? "";
    const parsed = expectedStartOfTurnCreditGain(text);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
  }

  function runnerNoRunEconomyRealizedCredits(
    input: AiDecisionInput,
    definitionId: string | undefined,
  ): number {
    if (!definitionId) return 0;
    let realized = 0;
    for (const event of input.eventTail) {
      const resolvedEffects = event.publicPayload?.resolvedEffects;
      if (!Array.isArray(resolvedEffects)) continue;
      for (const effect of resolvedEffects) {
        const sourceDefinitionId = stringRecordValue(
          effect,
          "sourceDefinitionId",
        );
        const reason = stringRecordValue(effect, "reason");
        const kind = stringRecordValue(effect, "kind");
        const amount = numberRecordValue(effect, "amount");
        if (
          sourceDefinitionId === definitionId &&
          kind === "gain_credits" &&
          reason === "start_of_turn" &&
          amount !== undefined
        ) {
          realized += amount;
        }
      }
    }
    return Math.max(0, Math.floor(realized));
  }

  function runnerNoRunEconomyInstallHasSetupWindow(
    input: AiDecisionInput,
    action: LegalAction,
  ): boolean {
    if (input.playerView.own.clicks < 2) return false;
    if (
      input.legalActions.some(
        (candidate) =>
          candidate.type === "start_run" &&
          Boolean(
            dependencies.runnerBankCommitmentRunOverride(input, candidate),
          ),
      )
    )
      return false;
    const hasLowValueRun = input.legalActions.some(
      (candidate) =>
        candidate.type === "start_run" &&
        !dependencies.runnerBankCommitmentRunOverride(input, candidate),
    );
    const hasSetupAlternative = input.legalActions.some((candidate) => {
      if (candidate.actionId === action.actionId) return false;
      return (
        candidate.type === "gain_credit" ||
        candidate.type === "draw_card" ||
        dependencies.isRunnerRigInstallAction(input, candidate)
      );
    });
    return hasSetupAlternative || !hasLowValueRun;
  }

  return {
    runnerNoRunEconomyCommitmentScoreComponents,
    runnerNoRunEconomyCommitmentEvidence,
  };
}

function stringRecordValue(value: unknown, key: string): string | undefined {
  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : undefined;
}

function numberRecordValue(value: unknown, key: string): number | undefined {
  const record = value as Record<string, unknown>;
  return typeof record[key] === "number" ? record[key] : undefined;
}

function expectedStartOfTurnCreditGain(text: string): number {
  const tokens = rulesTextTokens(text);
  for (const [index, token] of tokens.entries()) {
    if (token !== "gain") continue;
    const amount = positiveIntegerTokenValue(tokens[index + 1]);
    const creditToken = tokens[index + 2];
    if (
      amount !== undefined &&
      (creditToken === "credit" || creditToken === "credits") &&
      tokensIncludePhraseAfter(tokens, index + 3, ["start", "of"])
    ) {
      return amount;
    }
  }
  return 0;
}

function rulesTextTokens(text: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const character of text.toLocaleLowerCase("en-US")) {
    if (isAsciiLetterOrDigit(character)) {
      current += character;
    } else if (current.length > 0) {
      tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "0" && character <= "9")
  );
}

function positiveIntegerTokenValue(
  token: string | undefined,
): number | undefined {
  if (
    token === undefined ||
    token.length === 0 ||
    ![...token].every((character) => character >= "0" && character <= "9")
  ) {
    return undefined;
  }
  const parsed = Number(token);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function tokensIncludePhraseAfter(
  tokens: readonly string[],
  startIndex: number,
  phrase: readonly string[],
): boolean {
  for (
    let index = startIndex;
    index <= tokens.length - phrase.length;
    index += 1
  ) {
    if (phrase.every((token, offset) => tokens[index + offset] === token)) {
      return true;
    }
  }
  return false;
}
