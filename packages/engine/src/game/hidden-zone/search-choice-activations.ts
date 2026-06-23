import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import {
  buildLookTopStackTakeMatchingChoice,
  buildLookTopStackTakeMatchingPayload,
  buildMysteryBoxCorpReviewChoice,
  buildMysteryBoxInstallChoice,
  buildSearchStackInstallChoice,
  buildSearchStackInstallPayload,
  buildSearchStackToGripChoice,
  buildSearchStackToGripPayload,
  buildSearchTrashToGripChoice,
  buildSearchTrashToGripPayload,
  buildSelfModifyingCodeSearchInstallChoice,
  buildSneakPreviewSourceChoice,
  buildSneakPreviewSourceChoicePayload,
} from "./search-choice-builders";
import {
  buildMysteryBoxNoInstallResolvedPayload,
  createMysteryBoxNoInstallIntent,
} from "./search-install-intents";
import {
  applyMysteryBoxOncePerRunPlan,
  createMysteryBoxOncePerRunPlan,
} from "./post-install-side-effects";

type HiddenZonePayload = Record<string, string | number | boolean>;
type SearchToGripFilter = "program" | "any_card";
type SearchInstallCost = "normal" | "free";
type SearchInstallSourceZone = "heap" | "stack";
type RunnerSearchCardType = "program" | "event" | "hardware" | "resource";

export type HiddenZoneSearchActivationBaseHost = {
  state: Pick<
    GameState,
    "runner" | "pendingChoice" | "stateVersion" | "run" | "randomCounter"
  >;
  constants: {
    aujourdOuiResourceCardId: CardDefinitionId;
    mysteryBoxId: CardDefinitionId;
    selfModifyingCodeId: CardDefinitionId;
    shortCircuitResourceCardId: CardDefinitionId;
    sneakPreviewId: CardDefinitionId;
  };
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    isUniqueRunnerDefinitionInstalled: (definition: CardDefinition) => boolean;
  };
  install: {
    canInstallRunnerProgramFromZone: (
      cardId: CardInstanceId,
      sourceZone: SearchInstallSourceZone,
      installCost: SearchInstallCost,
    ) => boolean;
  };
  runnerMemoryLimit: () => number;
  shuffleRunnerStack: (purpose: string) => void;
};

export type HiddenZoneSearchActivationHost =
  HiddenZoneSearchActivationBaseHost & {
    legalAction: LegalAction;
  };

export type HiddenZoneSearchActivationResult = {
  publicPayload: HiddenZonePayload;
};

export type HiddenZoneSearchActivationHandlerResult = {
  handled: boolean;
  stateChanged?: boolean;
  resolvedPayload?: HiddenZonePayload;
  shufflePerformed?: boolean;
};

export function startRunnerStackSearchChoiceActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourcePrefix?: string;
    choiceIdPrefix?: string;
    filter?: { cardType?: CardDefinition["type"] | "any" };
  } = {},
): void {
  const state = host.state;
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourcePrefix = input.sourcePrefix ?? "v098.search_stack";
  const choiceIdPrefix = input.choiceIdPrefix ?? "v098_search_stack";
  const cardTypeFilter = input.filter?.cardType ?? "program";
  const hasSearchableCard = state.runner.stack.some((cardId) =>
    runnerStackSearchCardMatchesFilter(host, cardId, cardTypeFilter),
  );
  if (!hasSearchableCard)
    throw new Error(
      cardTypeFilter === "program"
        ? "Keine suchbare Programmkarte im Stack."
        : "Keine suchbare Karte im Stack.",
    );
  state.pendingChoice = {
    choiceId: `${choiceIdPrefix}_${state.stateVersion + 1}`,
    side: "runner",
    source: `${sourcePrefix}:${state.stateVersion + 1}`,
    prompt: "Stack durchsuchen",
    kind: "select_cards",
    options: state.runner.stack.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      const selectable = runnerStackSearchCardMatchesFilter(
        host,
        cardId,
        cardTypeFilter,
      );
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
        ...(!selectable ? { selectable: false } : {}),
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function startSearchTrashToGripActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    filter: SearchToGripFilter;
  },
): HiddenZoneSearchActivationResult {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const targets = searchTrashToGripTargets(host, input.filter);
  if (targets.length === 0)
    throw new Error("Im Trash liegt keine suchbare Karte.");
  host.state.pendingChoice = buildSearchTrashToGripChoice({
    stateVersion: host.state.stateVersion,
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
    filter: input.filter,
    options: host.state.runner.heap
      .slice()
      .sort()
      .map((cardId) => {
        const definition = host.cards.definitionFor(cardId);
        const selectable = targets.includes(cardId);
        return {
          id: `card_${cardId}`,
          label: definition.title,
          publicLabel: definition.title,
          value: cardId,
          ...(!selectable ? { selectable: false } : {}),
        };
      }),
  });
  const payload = buildSearchTrashToGripPayload({
    sourceDefinitionId: input.sourceDefinitionId,
    filter: input.filter,
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

export function startSearchStackToGripActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    filter: SearchToGripFilter;
    revealToCorp: boolean;
    shuffleAfterwards: true;
  },
): HiddenZoneSearchActivationResult {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const targets = searchStackToGripTargets(host, input.filter);
  if (targets.length === 0)
    throw new Error("Im Stack liegt keine suchbare Karte.");
  host.state.pendingChoice = buildSearchStackToGripChoice({
    stateVersion: host.state.stateVersion,
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
    filter: input.filter,
    revealToCorp: input.revealToCorp,
    shuffleAfterwards: input.shuffleAfterwards,
    options: host.state.runner.stack.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      const selectable = targets.includes(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
        ...(!selectable ? { selectable: false } : {}),
      };
    }),
  });
  const payload = buildSearchStackToGripPayload({
    sourceDefinitionId: input.sourceDefinitionId,
    filter: input.filter,
    revealToCorp: input.revealToCorp,
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

export function startLookTopStackTakeMatchingActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    count: number;
    allowedTypes: readonly RunnerSearchCardType[];
    costPerTaken: number;
    revealTakenToCorp: true;
    shuffleRemainder: true;
  },
): HiddenZoneSearchActivationResult {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const topCards = host.state.runner.stack.slice(
    0,
    Math.max(0, Math.floor(input.count)),
  );
  if (topCards.length === 0) throw new Error("Der Stack ist leer.");
  const allowed = new Set(input.allowedTypes);
  const maxAffordable =
    input.costPerTaken <= 0
      ? topCards.length
      : Math.floor(host.state.runner.credits / input.costPerTaken);
  host.state.pendingChoice = buildLookTopStackTakeMatchingChoice({
    stateVersion: host.state.stateVersion,
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
    count: input.count,
    allowedTypes: input.allowedTypes,
    costPerTaken: input.costPerTaken,
    revealTakenToCorp: input.revealTakenToCorp,
    shuffleRemainder: input.shuffleRemainder,
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      const selectable = cardTypeMatchesSearchTypes(definition.type, allowed);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
        ...(!selectable ? { selectable: false } : {}),
      };
    }),
    maxSelections: Math.min(
      lookTopStackTakeMatchingTargets(host, input.count, input.allowedTypes)
        .length,
      maxAffordable,
    ),
  });
  const payload = buildLookTopStackTakeMatchingPayload({
    sourceDefinitionId: input.sourceDefinitionId,
    privateLookCount: topCards.length,
    costPerTaken: input.costPerTaken,
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

export function startSearchStackInstallActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    filter: "program";
    installCost: SearchInstallCost;
    shuffleAfterwards: true;
  },
): HiddenZoneSearchActivationResult {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const targets = searchStackInstallTargets(
    host,
    input.filter,
    input.installCost,
  );
  if (targets.length === 0)
    throw new Error("Im Stack liegt kein legal installierbares Programm.");
  host.state.pendingChoice = buildSearchStackInstallChoice({
    stateVersion: host.state.stateVersion,
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
    filter: input.filter,
    installCost: input.installCost,
    shuffleAfterwards: input.shuffleAfterwards,
    options: host.state.runner.stack.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      const selectable = targets.includes(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
        ...(!selectable ? { selectable: false } : {}),
      };
    }),
  });
  const payload = buildSearchStackInstallPayload({
    sourceDefinitionId: input.sourceDefinitionId,
    filter: input.filter,
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

export function startStackOrTrashProgramInstallActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    installCost: "free";
    shuffleStackIfSearched: true;
    returnInstalledCardToGripAtEndOfTurn: true;
  },
): HiddenZoneSearchActivationResult {
  if (
    input.installCost !== "free" ||
    input.shuffleStackIfSearched !== true ||
    input.returnInstalledCardToGripAtEndOfTurn !== true
  )
    throw new Error("Diese Programminstallation ist nicht unterstuetzt.");
  startSneakPreviewSourceActivation(host, {
    sourcePrefix: "p3_38.stack_or_trash_program_install",
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
  });
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_38_stack_or_trash_program_install_source_choice",
    sourceDefinitionId: input.sourceDefinitionId,
    temporaryReturnAtEndOfTurn: true,
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

export function startLookTopStackShowToCorpThenInstallMatchingActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    count: 5;
    allowedTypes: readonly "program"[];
    installCost: "free";
    trashSourceIfInstalled: true;
    shuffleAfterwards: true;
  },
): HiddenZoneSearchActivationResult {
  if (
    input.count !== 5 ||
    input.installCost !== "free" ||
    input.trashSourceIfInstalled !== true ||
    input.shuffleAfterwards !== true ||
    input.allowedTypes.some((type) => type !== "program")
  )
    throw new Error("Diese Stack-Reveal-Installation ist nicht unterstuetzt.");
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  requireRun(host);
  const topCards = host.state.runner.stack.slice(0, input.count);
  if (topCards.length === 0) throw new Error("Der Stack ist leer.");
  const installableProgramIds =
    lookTopStackShowToCorpThenInstallMatchingTargets(
      host,
      input.count,
      input.allowedTypes,
      input.installCost,
    );
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_38_look_top_stack_show_to_corp_then_install_matching",
    sourceDefinitionId: input.sourceDefinitionId,
    revealCount: topCards.length,
    shownCardDefinitionIds: topCards
      .map((cardId) => host.cards.definitionFor(cardId).id)
      .join(","),
    revealedCardDefinitionIds: topCards
      .map((cardId) => host.cards.definitionFor(cardId).id)
      .join(","),
    revealedProgramCount: topCards.filter(
      (cardId) => host.cards.definitionFor(cardId).type === "program",
    ).length,
    programFound: installableProgramIds.length > 0,
    choiceVisibility: "corp_review",
    shufflePerformed: false,
  };
  host.state.pendingChoice = buildMysteryBoxCorpReviewChoice({
    stateVersion: host.state.stateVersion,
    sourceCardId: input.sourceCardId,
    sourceDefinitionId: input.sourceDefinitionId,
    topCards,
    programFound: installableProgramIds.length > 0,
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `shown_${cardId}`,
        label: definition.title,
        publicLabel: definition.title,
        value: cardId,
        selectable: false,
      };
    }),
  });
  return { publicPayload: host.legalAction.payload as HiddenZonePayload };
}

export function startAujourdOuiTop5Activation(
  host: HiddenZoneSearchActivationHost,
  sourceCardId: CardInstanceId,
): void {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  if (
    !host.state.runner.rig.resources.includes(sourceCardId) ||
    host.cards.definitionFor(sourceCardId).id !==
      host.constants.aujourdOuiResourceCardId
  ) {
    throw new Error("Aujourd'Oui ist nicht mehr installiert.");
  }
  const topCards = host.state.runner.stack.slice(0, 5);
  if (topCards.length === 0) throw new Error("Der Stack ist leer.");
  const selectableProgramCount = topCards.filter(
    (cardId) => host.cards.definitionFor(cardId).type === "program",
  ).length;
  const maxSelections = Math.min(
    selectableProgramCount,
    host.state.runner.credits,
  );
  host.state.pendingChoice = {
    choiceId: `v1911_aujourdoui_top5_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v1911.aujourdoui_top5:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Top 5 nach Programmen prüfen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      const selectable = definition.type === "program" && maxSelections > 0;
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
        ...(!selectable ? { selectable: false } : {}),
      };
    }),
    minSelections: 0,
    maxSelections,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
    stackSearchResolution: {
      reveal: "public",
      destination: "grip",
      shuffleAfter: true,
      publicRevealKind: "reveal",
    },
    cardSearchPresentation: {
      sourceZone: "stack",
      selectableFilter: "program",
      reveal: "public",
      destination: "grip",
      shuffleAfter: true,
      publicRevealKind: "reveal",
      showNonMatchingCards: true,
    },
  };
}

export function startSelfModifyingCodeStackActivation(
  host: HiddenZoneSearchActivationHost,
  sourceCardId: CardInstanceId,
): void {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const hasSearchableCard = host.state.runner.stack.some((cardId) =>
    runnerStackSearchCardMatchesFilter(host, cardId, "program"),
  );
  if (!hasSearchableCard)
    throw new Error("Keine suchbare Programmkarte im Stack.");
  host.state.pendingChoice = buildSelfModifyingCodeSearchInstallChoice({
    stateVersion: host.state.stateVersion,
    sourceCardId,
    options: host.state.runner.stack.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      const selectable = runnerStackSearchCardMatchesFilter(
        host,
        cardId,
        "program",
      );
      return {
        id: `card_${cardId}`,
        label: definition.title,
        value: cardId,
        ...(!selectable ? { selectable: false } : {}),
      };
    }),
  });
}

export function sneakPreviewInstallableProgramIds(
  host: HiddenZoneSearchActivationBaseHost,
  zone: SearchInstallSourceZone,
): CardInstanceId[] {
  const source =
    zone === "heap" ? host.state.runner.heap : host.state.runner.stack;
  return source.filter((cardId) => {
    const definition = host.cards.definitionFor(cardId);
    const uniqueBlocked =
      host.cards.isUniqueRunnerDefinitionInstalled(definition);
    return (
      definition.type === "program" &&
      !uniqueBlocked &&
      host.state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
        host.runnerMemoryLimit()
    );
  });
}

export function sneakPreviewSourceOptions(
  host: HiddenZoneSearchActivationBaseHost,
): ChoiceRequest["options"] {
  const options: ChoiceRequest["options"] = [];
  if (sneakPreviewInstallableProgramIds(host, "heap").length > 0)
    options.push({ id: "source_heap", label: "Heap", value: "heap" });
  if (sneakPreviewInstallableProgramIds(host, "stack").length > 0)
    options.push({ id: "source_stack", label: "Stack", value: "stack" });
  return options;
}

export function startSneakPreviewSourceActivation(
  host: HiddenZoneSearchActivationHost,
  input: {
    sourcePrefix?: string;
    sourceCardId?: CardInstanceId;
    sourceDefinitionId?: CardDefinitionId;
  } = {},
): void {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  const options = sneakPreviewSourceOptions(host);
  if (options.length === 0)
    throw new Error(
      "Sneak Preview findet kein legal installierbares Programm.",
    );
  host.state.pendingChoice = buildSneakPreviewSourceChoice({
    stateVersion: host.state.stateVersion,
    sourcePrefix: input.sourcePrefix ?? "v1911.sneak_preview",
    sourceCardId: input.sourceCardId,
    sourceDefinitionId:
      input.sourceDefinitionId ?? host.constants.sneakPreviewId,
    options,
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    ...buildSneakPreviewSourceChoicePayload(),
  };
}

export function handleTopFiveProgramInstallActivation(
  host: HiddenZoneSearchActivationHost,
): HiddenZoneSearchActivationHandlerResult {
  if (host.legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Mystery Box nutzen.");
  const run = requireRun(host);
  const sourceCardId = String(
    host.legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  if (!host.state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Mystery Box ist nicht installiert.");
  if (host.cards.definitionFor(sourceCardId).id !== host.constants.mysteryBoxId)
    throw new Error("Die Mystery-Box-Faehigkeit passt nicht zur Karte.");
  const oncePerRunPlan = createMysteryBoxOncePerRunPlan({
    sourceCardId,
    usedSourceIdsThisRun: run.mysteryBoxUsedSourceIdsThisRun ?? [],
  });
  const topCards = host.state.runner.stack.slice(0, 5);
  if (topCards.length === 0) throw new Error("Der Stack ist leer.");
  const programIds = topCards.filter(
    (cardId) => host.cards.definitionFor(cardId).type === "program",
  );
  applyMysteryBoxOncePerRunPlan(oncePerRunPlan, {
    markUsedThisRun: (usedSourceIds) => {
      run.mysteryBoxUsedSourceIdsThisRun = usedSourceIds;
    },
  });
  if (programIds.length === 0) {
    host.shuffleRunnerStack(
      `v1915.mystery_box.shuffle.no_program.${sourceCardId}.${run.runId}`,
    );
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      ...buildMysteryBoxNoInstallResolvedPayload(
        createMysteryBoxNoInstallIntent({
          sourceCardId,
          topCardIds: topCards,
          programCandidateIds: programIds,
        }),
        { randomCounterAfter: host.state.randomCounter },
      ),
    };
    return {
      handled: true,
      stateChanged: true,
      resolvedPayload: host.legalAction.payload as HiddenZonePayload,
      shufflePerformed: true,
    };
  }
  host.state.pendingChoice = buildMysteryBoxInstallChoice({
    stateVersion: host.state.stateVersion,
    sourceCardId,
    topCards,
    options: programIds.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
  });
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    programFound: true,
    choiceVisibility: "public",
  };
  return {
    handled: true,
    stateChanged: true,
    resolvedPayload: host.legalAction.payload as HiddenZonePayload,
  };
}

export function searchTrashToGripTargets(
  host: HiddenZoneSearchActivationBaseHost,
  filter: SearchToGripFilter,
): CardInstanceId[] {
  return host.state.runner.heap
    .filter((cardId) => {
      if (filter === "any_card") return true;
      return host.cards.definitionFor(cardId).type === "program";
    })
    .sort();
}

export function searchStackToGripTargets(
  host: HiddenZoneSearchActivationBaseHost,
  filter: SearchToGripFilter,
): CardInstanceId[] {
  return host.state.runner.stack.filter((cardId) => {
    if (filter === "any_card") return true;
    return host.cards.definitionFor(cardId).type === "program";
  });
}

export function runnerProgramInstallFromZoneTargets(
  host: HiddenZoneSearchActivationBaseHost,
  zone: SearchInstallSourceZone,
  installCost: SearchInstallCost,
): CardInstanceId[] {
  const source =
    zone === "heap" ? host.state.runner.heap : host.state.runner.stack;
  return source.filter((cardId) =>
    host.install.canInstallRunnerProgramFromZone(cardId, zone, installCost),
  );
}

export function searchStackInstallTargets(
  host: HiddenZoneSearchActivationBaseHost,
  filter: "program",
  installCost: SearchInstallCost,
): CardInstanceId[] {
  if (filter !== "program") return [];
  return runnerProgramInstallFromZoneTargets(host, "stack", installCost);
}

export function stackOrTrashProgramInstallTargets(
  host: HiddenZoneSearchActivationBaseHost,
  installCost: "free",
): CardInstanceId[] {
  return [
    ...runnerProgramInstallFromZoneTargets(host, "heap", installCost),
    ...runnerProgramInstallFromZoneTargets(host, "stack", installCost),
  ];
}

export function lookTopStackShowToCorpThenInstallMatchingTargets(
  host: HiddenZoneSearchActivationBaseHost,
  count: 5,
  allowedTypes: readonly "program"[],
  installCost: "free",
): CardInstanceId[] {
  if (count !== 5 || installCost !== "free") return [];
  const allowed = new Set(allowedTypes);
  return host.state.runner.stack
    .slice(0, count)
    .filter(
      (cardId) =>
        allowed.has("program") &&
        host.install.canInstallRunnerProgramFromZone(
          cardId,
          "stack",
          installCost,
        ),
    );
}

export function lookTopStackTakeMatchingTargets(
  host: HiddenZoneSearchActivationBaseHost,
  count: number,
  allowedTypes: readonly RunnerSearchCardType[],
): CardInstanceId[] {
  const allowed = new Set(allowedTypes);
  return host.state.runner.stack
    .slice(0, Math.max(0, Math.floor(count)))
    .filter((cardId) =>
      cardTypeMatchesSearchTypes(
        host.cards.definitionFor(cardId).type,
        allowed,
      ),
    );
}

function runnerStackSearchCardMatchesFilter(
  host: HiddenZoneSearchActivationBaseHost,
  cardId: CardInstanceId,
  cardTypeFilter: CardDefinition["type"] | "any",
): boolean {
  if (cardTypeFilter === "any") return true;
  return host.cards.definitionFor(cardId).type === cardTypeFilter;
}

function cardTypeMatchesSearchTypes(
  cardType: CardDefinition["type"],
  allowed: ReadonlySet<RunnerSearchCardType>,
): boolean {
  return (
    (cardType === "program" ||
      cardType === "event" ||
      cardType === "hardware" ||
      cardType === "resource") &&
    allowed.has(cardType)
  );
}

function requireRun(
  host: HiddenZoneSearchActivationHost,
): NonNullable<GameState["run"]> {
  if (!host.state.run) throw new Error("Es läuft kein Run.");
  return host.state.run;
}
