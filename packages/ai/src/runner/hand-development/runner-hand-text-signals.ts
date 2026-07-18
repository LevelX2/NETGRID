export function runnerHandTextHasRiskyBreakerSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["blink", "random", "roll"]) ||
    runnerHandTokensIncludePhrase(tokens, ["self", "damage"]) ||
    runnerHandTokensIncludeInOrder(tokens, "suffer", "damage") ||
    runnerHandTokensIncludeInOrder(tokens, "take", "damage") ||
    runnerHandTokensIncludeInOrder(tokens, "do", "damage")
  );
}

export function runnerHandTextHasDamagePreventionSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeInOrder(tokens, "prevent", "damage") ||
    runnerHandTokensIncludePhrase(tokens, ["damage", "prevention"]) ||
    runnerHandTokensIncludeInOrder(tokens, "avoid", "damage")
  );
}

export function runnerHandTextHasHandSizeSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["hand", "size"]) ||
    runnerHandTokensIncludePhrase(tokens, ["max", "hand"]) ||
    runnerHandTokensIncludePhrase(tokens, ["maximum", "hand"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hand", "limit"]) ||
    runnerHandTokensIncludePhrase(tokens, ["grip", "size"])
  );
}

export function runnerHandTextHasAbsoluteLinkSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["base", "link"]) ||
    runnerHandTokensIncludePhrase(tokens, ["link", "strength"]) ||
    runnerHandTokensIncludeInOrder(tokens, "gain", "link") ||
    runnerHandTokensIncludeNumberBefore(tokens, "link")
  );
}

export function runnerHandTextHasTemporaryCounterSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "counter",
    "temporary",
    "recurring",
    "stored",
  ]);
}
export function runnerHandTextHasBreakerStrengthSupportSignal(
  text: string,
): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["breaker", "icebreaker"]) &&
    runnerHandTokensIncludeAny(tokens, ["strength", "pump", "boost"]) &&
    !runnerHandTokensIncludeInOrder(tokens, "break", "subroutine")
  );
}
export function runnerHandTextHasIceStrengthReductionSignal(
  text: string,
): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["ice"]) &&
    runnerHandTokensIncludeAny(tokens, ["strength"]) &&
    runnerHandTokensIncludeAny(tokens, [
      "reduce",
      "reduced",
      "reduction",
      "modifier",
    ])
  );
}

export function runnerHandTextHasRecurringBreakerEconomySignal(
  text: string,
): boolean {
  const tokens = runnerHandTextTokens(text);
  const renewablePool =
    runnerHandTokensIncludeAny(tokens, ["recurring"]) ||
    (runnerHandTokensIncludeAny(tokens, ["replace", "replenish", "refill"]) &&
      runnerHandTokensIncludePhrase(tokens, [
        "start",
        "of",
        "your",
        "next",
        "turn",
      ]));
  return (
    renewablePool &&
    runnerHandTokensIncludeAny(tokens, [
      "bit",
      "bits",
      "credit",
      "credits",
      "economy",
    ]) &&
    runnerHandTokensIncludeAny(tokens, ["breaker", "icebreaker"])
  );
}

export function runnerHandTextHasMemorySupportSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["memory", "mu"]) ||
    runnerHandTokensIncludePhrase(tokens, ["memory", "support"]) ||
    runnerHandTokensIncludePhrase(tokens, ["mem", "chip"])
  );
}

export function runnerHandTextHasBankToolSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["broker", "bank"]) ||
    runnerHandTokensIncludePhrase(tokens, ["bank", "tool"]) ||
    runnerHandTokensIncludePhrase(tokens, ["stored", "credits"]) ||
    runnerHandTokensIncludePhrase(tokens, ["counter", "bank"]) ||
    runnerHandTokensIncludePhrase(tokens, ["temporary", "resource", "bank"])
  );
}

export function runnerHandTextHasEconomyToolSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, [
      "economy",
      "credit",
      "credits",
      "bits",
      "loan",
      "savings",
    ]) || runnerHandTokensIncludeInOrder(tokens, "gain", "credit")
  );
}

export function runnerHandTextHasActionEconomySignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["action", "economy"]) ||
    runnerHandTokensIncludeInOrder(tokens, "action", "credits") ||
    runnerHandTokensIncludeInOrder(tokens, "action", "credit")
  );
}

export function runnerHandTextHasDrawOrSearchSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["search", "draw", "tutor"]) ||
    runnerHandTokensIncludePhrase(tokens, ["draw", "or", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "draw"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "search"])
  );
}

export function runnerHandTextHasDefenseSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["defense", "tag", "link"]) ||
    runnerHandTokensIncludeInOrder(tokens, "prevent", "damage") ||
    runnerHandTokensIncludePhrase(tokens, ["damage", "prevention"]) ||
    runnerHandTokensIncludePhrase(tokens, ["net", "damage"]) ||
    runnerHandTokensIncludePhrase(tokens, ["meat", "damage"]) ||
    runnerHandTokensIncludePhrase(tokens, ["program", "trash", "prevention"]) ||
    runnerHandTokensIncludePhrase(tokens, ["program", "backup"]) ||
    runnerHandTokensIncludeInOrder(tokens, "remove", "tag") ||
    runnerHandTokensIncludePhrase(tokens, ["hand", "size"])
  );
}

export function runnerHandTextHasAccessPayoffSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, [
      "multiaccess",
      "interface",
      "access",
      "expose",
      "exposes",
      "reveal",
      "reveals",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["access", "payoff"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hidden", "zone", "tool"]) ||
    runnerHandTokensIncludePhrase(tokens, ["installed", "corp", "card"]) ||
    runnerHandTokensIncludePhrase(tokens, ["r", "d"]) ||
    runnerHandTokensIncludePhrase(tokens, ["rd", "pressure"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hq", "pressure"]) ||
    runnerHandTokensIncludePhrase(tokens, ["trash", "support"]) ||
    runnerHandTokensIncludePhrase(tokens, ["remote", "contest"])
  );
}

export function runnerHandTextHasRunEventSignal(text: string): boolean {
  return (
    runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
      "run",
      "bypass",
      "access",
      "approach",
    ]) ||
    runnerHandTokensIncludePhrase(runnerHandTextTokens(text), ["jack", "out"])
  );
}

export function runnerHandTextHasRepeatUsefulSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, [
      "counter",
      "temporary",
      "virus",
      "recurring",
      "multiaccess",
      "memory",
      "broker",
      "bank",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["stored", "credits"]) ||
    runnerHandTokensIncludeInOrder(tokens, "prevent", "damage") ||
    runnerHandTokensIncludePhrase(tokens, ["damage", "prevention"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hand", "size"])
  );
}

export function runnerHandTextHasPlayableSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "install",
    "play",
    "trigger",
    "action",
  ]);
}

export function runnerHandTextHasRecoveryUtilitySignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["trash", "recovery"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "recovery"]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "setup",
      "top",
      "trash",
      "recovery",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["search", "trash"]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "top",
      "card",
      "from",
      "your",
      "trash",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["trash", "into", "your", "hand"]) ||
    runnerHandTokensIncludePhrase(tokens, ["heap", "recovery"])
  );
}

export function runnerHandTextHasProgramSearchUtilitySignal(
  text: string,
): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["program", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "program", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "search",
      "your",
      "stack",
      "for",
      "a",
      "program",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["program", "cards"])
  );
}

export function runnerHandTextHasStackSearchUtilitySignal(
  text: string,
): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["stack", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["search", "stack"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "stack", "filter"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "card", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "setup",
      "prep",
      "resource",
      "search",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "hardware", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "top",
      "four",
      "cards",
      "of",
      "your",
      "stack",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "top",
      "five",
      "cards",
      "of",
      "your",
      "stack",
    ])
  );
}

export function runnerHandTextHasHiddenZoneSearchSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  const hiddenZone =
    runnerHandTokensIncludePhrase(tokens, ["hidden", "zone", "tool"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hidden", "runner", "resource"]) ||
    runnerHandTokensIncludePhrase(tokens, ["resource", "hidden"]);
  return (
    hiddenZone &&
    runnerHandTokensIncludeAny(tokens, ["search", "recovery", "stack", "trash"])
  );
}

export function runnerHandTextHasWallCoverageSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "fracter",
    "wall",
    "barrier",
  ]);
}

export function runnerHandTextHasCodeGateCoverageSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["decoder", "codegate"]) ||
    runnerHandTokensIncludePhrase(tokens, ["code", "gate"])
  );
}

export function runnerHandTextHasSentryCoverageSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "killer",
    "sentry",
  ]);
}

export function runnerHandTextHasApCoverageSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["ap"]) ||
    runnerHandTokensIncludePhrase(tokens, ["anti", "personnel"])
  );
}

export function runnerHandTextHasTraceCoverageSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "trace",
    "traces",
  ]);
}

export function runnerHandTextHasVisibleThreatSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "damage",
    "tag",
    "flatline",
    "trace",
  ]);
}

export function runnerHandTextHasIceSubroutineBreakSignal(
  text: string,
): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeInOrder(tokens, "break", "subroutine") ||
    runnerHandTokensIncludeInOrder(tokens, "breaks", "subroutine")
  );
}

export function runnerHandTextTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function runnerHandTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

export function runnerHandTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((token, offset) => tokens[index + offset] === token),
  );
}

export function runnerHandTokensIncludeInOrder(
  tokens: readonly string[],
  first: string,
  second: string,
): boolean {
  const firstIndex = tokens.indexOf(first);
  return firstIndex >= 0 && tokens.indexOf(second, firstIndex + 1) >= 0;
}

export function runnerHandTokensIncludeNumberBefore(
  tokens: readonly string[],
  tokenAfterNumber: string,
): boolean {
  return tokens.some(
    (token, index) =>
      runnerHandTokenIsDigits(token) && tokens[index + 1] === tokenAfterNumber,
  );
}

export function runnerHandTokenIsDigits(token: string): boolean {
  for (const character of token) {
    if (character < "0" || character > "9") return false;
  }
  return token.length > 0;
}
