export type ProgressDeltaLabel =
  | "progress_access"
  | "progress_trash"
  | "progress_steal"
  | "progress_score"
  | "progress_flatline"
  | "progress_coverage_install"
  | "progress_reachability_improved"
  | "progress_server_protected"
  | "progress_economy_converted"
  | "no_progress_plausible"
  | "no_progress_stale";

export type ProgressDeltaAction = {
  index?: number;
  side?: string;
  actionType: string;
  targetServerId?: string;
  planKind?: string;
  reasonCode?: string;
  evidence?: readonly string[];
  debugFacts?: readonly string[];
  qualityTags?: readonly string[];
  runnerSetupMissingCoverageTypes?: readonly string[];
  runnerCoverageImproved?: boolean;
  runnerRemoteTrashTaken?: boolean;
  advancedAgendaStolen?: boolean;
  corpScoreTerminalScoreTaken?: boolean;
  corpScoreTerminalAdvanceTaken?: boolean;
  protectBeforeAdvance?: boolean;
  corpScoreTerminalWindowScoreLegal?: boolean;
  corpScoreTerminalWindowAdvanceToScoreLegal?: boolean;
  corpScoreTerminalWindowAgendaInstallLegal?: boolean;
  corpCreditsBelowCheapestRelevantRez?: boolean;
  corpCreditsBelowEstimatedCentralRezNeed?: boolean;
  corpCannotRezAnyNewlyInstalledIce?: boolean;
  corpEconomyBeforeScorePlausibleRezOrAdvanceReserve?: boolean;
  runnerEconomyTakenToReachRunReserve?: boolean;
  runnerReservePreservingEconomy?: boolean;
  runnerBelowReserveBefore?: boolean;
  runnerBelowReserveAfter?: boolean;
  runnerPressureReadyTrue?: boolean;
  actionAlternatives?: readonly unknown[];
};

export type ProgressDeltaWindowSummary = {
  within5: ProgressDeltaLabel[];
  within10: ProgressDeltaLabel[];
  within20: ProgressDeltaLabel[];
};

export type ProgressDeltaLabelResult = {
  index: number;
  label: ProgressDeltaLabel;
  primaryProgress: boolean;
  followUp: ProgressDeltaWindowSummary;
  rationale: string;
};

const DIRECT_PROGRESS_LABELS: ProgressDeltaLabel[] = [
  "progress_access",
  "progress_trash",
  "progress_steal",
  "progress_score",
  "progress_flatline",
  "progress_coverage_install",
  "progress_reachability_improved",
  "progress_server_protected",
];

export function labelProgressDeltaWindow(
  actions: readonly ProgressDeltaAction[],
): ProgressDeltaLabelResult[] {
  const primary = actions.map((action, offset) =>
    labelProgressDeltaAction(action, actions, offset),
  );
  return primary.map((result, offset) => ({
    ...result,
    followUp: {
      within5: directLabelsInWindow(primary, offset, 5),
      within10: directLabelsInWindow(primary, offset, 10),
      within20: directLabelsInWindow(primary, offset, 20),
    },
  }));
}

export function labelProgressDeltaAction(
  action: ProgressDeltaAction,
  window: readonly ProgressDeltaAction[] = [action],
  offset = 0,
): ProgressDeltaLabelResult {
  const direct = directProgressLabel(action);
  if (direct) {
    return resultFor(action, offset, direct, true, rationaleForDirect(direct));
  }

  if (isEconomyAction(action) && hasFutureProgress(window, offset, 20)) {
    return resultFor(
      action,
      offset,
      "progress_economy_converted",
      true,
      "Economy action converted into side-safe progress inside the 20-action follow-up window.",
    );
  }

  if (isPlausibleNoProgress(action)) {
    return resultFor(
      action,
      offset,
      "no_progress_plausible",
      false,
      "No immediate progress, but visible reserve, coverage, protection, or affordability evidence keeps the action plausible.",
    );
  }

  return resultFor(
    action,
    offset,
    "no_progress_stale",
    false,
    "No immediate progress and no side-safe evidence for reserve, coverage, protection, or conversion.",
  );
}

export function isDirectProgressLabel(label: ProgressDeltaLabel): boolean {
  return DIRECT_PROGRESS_LABELS.includes(label);
}

function directProgressLabel(
  action: ProgressDeltaAction,
): ProgressDeltaLabel | undefined {
  const text = actionText(action);
  if (action.actionType === "access_card") return "progress_access";
  if (action.actionType === "trash_accessed_card" || action.runnerRemoteTrashTaken) {
    return "progress_trash";
  }
  if (action.actionType === "steal_agenda" || action.advancedAgendaStolen) {
    return "progress_steal";
  }
  if (
    action.actionType === "score_agenda" ||
    action.corpScoreTerminalScoreTaken ||
    action.corpScoreTerminalAdvanceTaken ||
    (action.actionType === "advance_card" &&
      (action.corpScoreTerminalWindowScoreLegal ||
        action.corpScoreTerminalWindowAdvanceToScoreLegal))
  ) {
    return "progress_score";
  }
  if (actionTextHasFlatlineSignal(text)) return "progress_flatline";
  if (isCoverageInstall(action)) return "progress_coverage_install";
  if (isReachabilityImprovement(action)) return "progress_reachability_improved";
  if (isServerProtection(action)) return "progress_server_protected";
  return undefined;
}

function isCoverageInstall(action: ProgressDeltaAction): boolean {
  if (action.runnerCoverageImproved) return true;
  if (action.side !== "runner") return false;
  if (!["install_card", "play_event", "activated_card_ability"].includes(action.actionType)) {
    return false;
  }
  const text = actionText(action);
  return (
    (action.runnerSetupMissingCoverageTypes?.length ?? 0) > 0 ||
    actionTextHasCoverageInstallSignal(text)
  );
}

function isReachabilityImprovement(action: ProgressDeltaAction): boolean {
  if (
    [
      "start_run",
      "continue_run",
      "break_subroutine",
      "pump_breaker",
      "jack_out",
    ].includes(action.actionType)
  ) {
    return action.actionType !== "jack_out";
  }
  return actionTextHasReachabilitySignal(actionText(action));
}

function isServerProtection(action: ProgressDeltaAction): boolean {
  if (action.protectBeforeAdvance) return true;
  if (action.side !== "corp") return false;
  if (!["install_card", "rez_ice", "advance_card"].includes(action.actionType)) {
    return false;
  }
  return actionTextHasServerProtectionSignal(actionText(action));
}

function hasFutureProgress(
  window: readonly ProgressDeltaAction[],
  offset: number,
  lookahead: number,
): boolean {
  for (
    let index = offset + 1;
    index < Math.min(window.length, offset + lookahead + 1);
    index += 1
  ) {
    const action = window[index];
    if (!action) continue;
    const label = directProgressLabel(action);
    if (label && isDirectProgressLabel(label)) return true;
  }
  return false;
}

function isEconomyAction(action: ProgressDeltaAction): boolean {
  return (
    action.actionType === "gain_credit" ||
    actionTextHasEconomySignal(actionText(action))
  );
}

function isPlausibleNoProgress(action: ProgressDeltaAction): boolean {
  if (
    action.runnerEconomyTakenToReachRunReserve ||
    action.runnerReservePreservingEconomy ||
    action.runnerBelowReserveBefore ||
    action.runnerBelowReserveAfter ||
    (action.runnerSetupMissingCoverageTypes?.length ?? 0) > 0 ||
    action.corpCreditsBelowCheapestRelevantRez ||
    action.corpCreditsBelowEstimatedCentralRezNeed ||
    action.corpCannotRezAnyNewlyInstalledIce ||
    action.corpEconomyBeforeScorePlausibleRezOrAdvanceReserve ||
    action.corpScoreTerminalWindowScoreLegal ||
    action.corpScoreTerminalWindowAdvanceToScoreLegal ||
    action.corpScoreTerminalWindowAgendaInstallLegal
  ) {
    return true;
  }
  return actionTextHasPlausibleNoProgressSignal(actionText(action));
}

function directLabelsInWindow(
  labels: readonly ProgressDeltaLabelResult[],
  offset: number,
  lookahead: number,
): ProgressDeltaLabel[] {
  const unique = new Set<ProgressDeltaLabel>();
  for (
    let index = offset + 1;
    index < Math.min(labels.length, offset + lookahead + 1);
    index += 1
  ) {
    const entry = labels[index];
    if (!entry) continue;
    const label = entry.label;
    if (isDirectProgressLabel(label)) unique.add(label);
  }
  return [...unique];
}

function resultFor(
  action: ProgressDeltaAction,
  offset: number,
  label: ProgressDeltaLabel,
  primaryProgress: boolean,
  rationale: string,
): ProgressDeltaLabelResult {
  return {
    index: action.index ?? offset,
    label,
    primaryProgress,
    followUp: { within5: [], within10: [], within20: [] },
    rationale,
  };
}

function rationaleForDirect(label: ProgressDeltaLabel): string {
  switch (label) {
    case "progress_access":
      return "Access action creates direct run payoff visibility.";
    case "progress_trash":
      return "Trash action converts access into board or economy pressure.";
    case "progress_steal":
      return "Steal action converts access into agenda points.";
    case "progress_score":
      return "Corp action advances or completes a scoreline.";
    case "progress_flatline":
      return "Action is tied to a terminal flatline payoff.";
    case "progress_coverage_install":
      return "Runner action improves visible breaker or coverage readiness.";
    case "progress_reachability_improved":
      return "Run action improves or continues server reachability.";
    case "progress_server_protected":
      return "Corp action improves visible scoring or central protection.";
    default:
      return "Progress label is direct.";
  }
}

function actionText(action: ProgressDeltaAction): string {
  return [
    action.planKind,
    action.reasonCode,
    ...(action.evidence ?? []),
    ...(action.debugFacts ?? []),
    ...(action.qualityTags ?? []),
  ]
    .filter(Boolean)
    .join("|")
    .toLocaleLowerCase("en-US");
}

function actionTextHasFlatlineSignal(text: string): boolean {
  const tokens = progressActionTextTokens(text);
  return (
    tokens.includes("flatline") ||
    progressTokensIncludePhrase(tokens, ["tag", "punish", "terminal"])
  );
}

function actionTextHasCoverageInstallSignal(text: string): boolean {
  const tokens = progressActionTextTokens(text);
  return progressTokensIncludeAny(tokens, [
    "coverage",
    "breaker",
    "decoder",
    "fracter",
    "killer",
    "icebreaker",
  ]);
}

function actionTextHasReachabilitySignal(text: string): boolean {
  const tokens = progressActionTextTokens(text);
  return (
    tokens.includes("reachability") ||
    progressTokensIncludePhrase(tokens, ["known", "path"]) ||
    progressTokensIncludePhrase(tokens, ["access", "path"]) ||
    progressTokensIncludePhrase(tokens, ["continue", "chain"])
  );
}

function actionTextHasServerProtectionSignal(text: string): boolean {
  const tokens = progressActionTextTokens(text);
  return (
    progressTokensIncludeAny(tokens, [
      "protect",
      "protection",
      "remote",
      "central",
      "ice",
      "rez",
    ]) || progressTokensIncludePhrase(tokens, ["score", "remote"])
  );
}

function actionTextHasEconomySignal(text: string): boolean {
  const tokens = progressActionTextTokens(text);
  return progressTokensIncludeAny(tokens, [
    "economy",
    "credit",
    "credits",
    "funding",
  ]);
}

function actionTextHasPlausibleNoProgressSignal(text: string): boolean {
  const tokens = progressActionTextTokens(text);
  return (
    progressTokensIncludeAny(tokens, [
      "reserve",
      "coverage",
      "afford",
      "protect",
      "rez",
      "scoreline",
    ]) ||
    progressTokensIncludePhrase(tokens, ["funding", "need"]) ||
    progressTokensIncludePhrase(tokens, ["known", "unaffordable", "path"])
  );
}

function progressActionTextTokens(text: string): string[] {
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

function progressTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((token, offset) => tokens[index + offset] === token),
  );
}

function progressTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}
