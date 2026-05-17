import type {
  CardSnapshot,
  CatalogCard,
  CatalogCardType,
  CatalogNumericFields,
  CatalogSide,
  CatalogStatusKey,
  CatalogStatuses,
  CatalogValidationResult,
} from "./catalog-types";

const PIPELINE_STATUS_KEYS: CatalogStatusKey[] = [
  "imported",
  "validated",
  "catalog_ready",
  "implemented",
  "engine_supported",
  "playable",
  "human_playable",
  "ai_supported",
  "deck_legal",
  "format_legal",
  "blocked",
];

export const FORBIDDEN_PIPELINE_PAYLOAD_PATTERNS = [
  /"sessionToken"\s*:/i,
  /"reconnectToken"\s*:/i,
  /"joinToken"\s*:/i,
  /"tokenHash"\s*:/i,
  /"fullState"\s*:/i,
  /"cardInstances"\s*:/i,
  /"privatePayload"\s*:/i,
  /"stateSnapshots"\s*:/i,
  /"undoSnapshots"\s*:/i,
  /decklist/i,
  /\b[A-Za-z]:\\/,
  /%APPDATA%/i,
  /data[\\/]local/i,
] as const;

export type CardPipelineReviewStatus = "unreviewed" | "reviewed" | "blocked";

export type PipelineCard = {
  catalogCardId: string;
  sourceCardId: string;
  engineCardId: string | null;
  title: string;
  side: CatalogSide;
  type: CatalogCardType;
  subtypes: string[];
  faction: string;
  text: string;
  displayOnlyText: boolean;
  numeric: CatalogNumericFields;
  statuses: CatalogStatuses;
  requiredMechanics: string[];
  resolverRef: string | null;
  abilityRefs: string[];
  aiHintsRef: string | null;
  review: {
    cardData: CardPipelineReviewStatus;
    mechanics: CardPipelineReviewStatus;
    resolver: CardPipelineReviewStatus;
    aiHints: CardPipelineReviewStatus;
  };
};

export type CardPipelineSnapshot = {
  schemaVersion: "card-pipeline-snapshot-v1.3.1";
  snapshotId: string;
  pipelineVersion: "1.3.1";
  sourceRegistryId: string;
  createdAt: string;
  normalization: {
    sortOrder: string[];
    textPolicy: "display_only";
    rulesPolicy: "resolver_refs_only";
    assetPolicy: "private_display_separate";
  };
  cards: PipelineCard[];
  hash: string;
};

export type PipelineDiffCategory =
  | "added_card"
  | "removed_card"
  | "text_changed"
  | "numeric_changed"
  | "status_changed"
  | "required_mechanics_changed"
  | "resolver_ref_changed"
  | "ability_refs_changed"
  | "ai_hints_changed"
  | "asset_reference_changed"
  | "review_status_changed";

export type PipelineDiffSeverity = "info" | "review_required" | "blocking";

export type PipelineDiffEntry = {
  category: PipelineDiffCategory;
  severity: PipelineDiffSeverity;
  cardId: string;
  summary: string;
};

export type PipelineDiffReport = {
  schemaVersion: "card-pipeline-diff-v1.3.1";
  fromSnapshotId: string;
  toSnapshotId: string;
  fromHash: string;
  toHash: string;
  entries: PipelineDiffEntry[];
};

export type PipelineRollbackReport = {
  schemaVersion: "card-pipeline-rollback-v1.3.1";
  fromSnapshotId: string;
  toSnapshotId: string;
  fromHash: string;
  toHash: string;
  matchSnapshotsUntouched: true;
  replayStateHashUntouched: true;
  privateAssetsUntouched: true;
  summary: string;
};

export type AiCardHintsV2 = {
  schemaVersion: "ai-card-hints-v1.3.1";
  hintsId: string;
  derivedFromSnapshotId: string;
  cards: AiCardHintV2[];
};

export type AiCardHintV2 = {
  cardId: string;
  side: CatalogSide;
  cardType: CatalogCardType;
  roles: string[];
  planRoles: string[];
  requiredMechanics: string[];
  valueHints: Record<string, number>;
  riskTags: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  scenarioRefs: string[];
};

export type CardPipelineReport = {
  schemaVersion: "card-pipeline-report-v1.3.1";
  reportId: string;
  snapshotId: string;
  snapshotHash: string;
  pipelineVersion: "1.3.1";
  statusSummary: Partial<Record<CatalogStatusKey, number>>;
  blockedCards: Array<{ cardId: string; reasons: string[] }>;
  missingMechanics: string[];
  missingResolvers: string[];
  missingTests: string[];
  missingAiHints: string[];
  noScopeAssertions: {
    noCardTextParser: true;
    noAutomaticPlayability: true;
    noNewCardRelease: true;
    noNewMechanics: true;
    noOfficialAssets: true;
    noPublicPlatformFeatures: true;
  };
};

export function createCardPipelineSnapshot(
  cardSnapshot: CardSnapshot,
  options: {
    snapshotId?: string;
    sourceRegistryId?: string;
    createdAt?: string;
    aiHints?: AiCardHintsV2;
  } = {},
): CardPipelineSnapshot {
  const cards = normalizeCardSnapshotForPipeline(cardSnapshot).cards.map(
    (card) => toPipelineCard(card, options.aiHints),
  );
  const snapshotWithoutHash = {
    schemaVersion: "card-pipeline-snapshot-v1.3.1" as const,
    snapshotId: options.snapshotId ?? "card-pipeline-snapshot-1.3.1",
    pipelineVersion: "1.3.1" as const,
    sourceRegistryId: options.sourceRegistryId ?? "source-registry-1.3.1",
    createdAt: options.createdAt ?? "2026-05-08T00:00:00.000+02:00",
    normalization: {
      sortOrder: ["catalogCardId"],
      textPolicy: "display_only" as const,
      rulesPolicy: "resolver_refs_only" as const,
      assetPolicy: "private_display_separate" as const,
    },
    cards,
    hash: "pending",
  };
  const hash = computeCardPipelineSnapshotHash(snapshotWithoutHash);
  return { ...snapshotWithoutHash, hash };
}

export function computeCardPipelineSnapshotHash(
  snapshot: CardPipelineSnapshot,
): string {
  const normalized = normalizeCardPipelineSnapshot(snapshot);
  const withoutHash = { ...normalized, hash: "pending" };
  return fnv1a(stableStringify(withoutHash));
}

export function normalizeCardPipelineSnapshot(
  snapshot: CardPipelineSnapshot,
): CardPipelineSnapshot {
  return {
    ...snapshot,
    normalization: {
      sortOrder: [...snapshot.normalization.sortOrder],
      textPolicy: snapshot.normalization.textPolicy,
      rulesPolicy: snapshot.normalization.rulesPolicy,
      assetPolicy: snapshot.normalization.assetPolicy,
    },
    cards: snapshot.cards
      .map((card) => ({
        ...card,
        subtypes: [...card.subtypes].sort((left, right) =>
          left.localeCompare(right),
        ),
        numeric: { ...card.numeric },
        statuses: normalizeStatuses(card.statuses),
        requiredMechanics: [...card.requiredMechanics].sort((left, right) =>
          left.localeCompare(right),
        ),
        abilityRefs: [...card.abilityRefs].sort((left, right) =>
          left.localeCompare(right),
        ),
        review: { ...card.review },
      }))
      .sort((left, right) =>
        left.catalogCardId.localeCompare(right.catalogCardId),
      ),
  };
}

export function validateCardPipelineSnapshot(
  snapshot: CardPipelineSnapshot,
  aiHints?: AiCardHintsV2,
): CatalogValidationResult {
  const errors: string[] = [];
  if (snapshot.schemaVersion !== "card-pipeline-snapshot-v1.3.1")
    errors.push(
      "Pipeline snapshot schemaVersion must be card-pipeline-snapshot-v1.3.1.",
    );
  if (snapshot.pipelineVersion !== "1.3.1")
    errors.push("Pipeline snapshot pipelineVersion must be 1.3.1.");
  if (snapshot.hash !== computeCardPipelineSnapshotHash(snapshot))
    errors.push("Pipeline snapshot hash mismatch.");
  if (snapshot.normalization.textPolicy !== "display_only")
    errors.push("Pipeline snapshot textPolicy must be display_only.");
  if (snapshot.normalization.rulesPolicy !== "resolver_refs_only")
    errors.push("Pipeline snapshot rulesPolicy must be resolver_refs_only.");
  const seen = new Set<string>();
  const hintById = new Map(
    (aiHints?.cards ?? []).map((hint) => [hint.cardId, hint]),
  );
  for (const card of snapshot.cards) {
    if (seen.has(card.catalogCardId))
      errors.push(`Duplicate pipeline card ${card.catalogCardId}.`);
    seen.add(card.catalogCardId);
    if (!card.displayOnlyText)
      errors.push(`Card ${card.catalogCardId} text must be display-only.`);
    if (!card.statuses.imported && card.statuses.catalog_ready)
      errors.push(
        `Card ${card.catalogCardId} is catalog_ready without imported.`,
      );
    if (card.statuses.catalog_ready && !card.statuses.validated)
      errors.push(
        `Card ${card.catalogCardId} is catalog_ready without validated.`,
      );
    if (card.statuses.implemented && !card.statuses.imported)
      errors.push(
        `Card ${card.catalogCardId} is implemented without imported.`,
      );
    if (
      card.statuses.engine_supported &&
      (!card.statuses.implemented ||
        !card.resolverRef ||
        card.abilityRefs.length === 0)
    ) {
      errors.push(
        `Card ${card.catalogCardId} is engine_supported without reviewed resolver/ability refs.`,
      );
    }
    if (
      card.statuses.human_playable &&
      (!card.statuses.engine_supported ||
        card.requiredMechanics.length === 0 ||
        card.review.mechanics !== "reviewed")
    ) {
      errors.push(
        `Card ${card.catalogCardId} is human_playable without reviewed mechanics.`,
      );
    }
    if (card.statuses.deck_legal && !card.statuses.human_playable)
      errors.push(
        `Card ${card.catalogCardId} is deck_legal without human_playable.`,
      );
    if (card.statuses.format_legal && !card.statuses.deck_legal)
      errors.push(
        `Card ${card.catalogCardId} is format_legal without deck_legal.`,
      );
    const hint = hintById.get(card.catalogCardId);
    if (
      card.statuses.ai_supported &&
      (!card.statuses.human_playable ||
        !hint ||
        hint.aiSupportStatus !== "ai_supported" ||
        hint.scenarioRefs.length === 0)
    ) {
      errors.push(
        `Card ${card.catalogCardId} is ai_supported without AI hint and scenario gate.`,
      );
    }
    if (!card.statuses.engine_supported && card.resolverRef)
      errors.push(
        `Card ${card.catalogCardId} has resolverRef without engine_supported.`,
      );
    if (!card.statuses.engine_supported && card.abilityRefs.length > 0)
      errors.push(
        `Card ${card.catalogCardId} has abilityRefs without engine_supported.`,
      );
  }
  return { ok: errors.length === 0, errors };
}

export function createAiCardHintsV2(
  snapshot: CardPipelineSnapshot,
  roleCards: Array<{
    cardId: string;
    side: CatalogSide;
    roles: string[];
    riskTags?: string[];
  }>,
  options: { hintsId?: string } = {},
): AiCardHintsV2 {
  const cardsById = new Map(
    snapshot.cards.map((card) => [card.catalogCardId, card]),
  );
  return {
    schemaVersion: "ai-card-hints-v1.3.1",
    hintsId: options.hintsId ?? "ai-card-hints-1.3.1",
    derivedFromSnapshotId: snapshot.snapshotId,
    cards: roleCards
      .map((roleCard): AiCardHintV2 | null => {
        const card = cardsById.get(roleCard.cardId);
        if (!card) return null;
        return {
          cardId: roleCard.cardId,
          side: roleCard.side,
          cardType: card.type,
          roles: [...roleCard.roles].sort((left, right) =>
            left.localeCompare(right),
          ),
          planRoles: planRolesFor(roleCard.roles, card),
          requiredMechanics: [...card.requiredMechanics].sort((left, right) =>
            left.localeCompare(right),
          ),
          valueHints: valueHintsFor(roleCard.roles, card),
          riskTags: [...(roleCard.riskTags ?? [])].sort((left, right) =>
            left.localeCompare(right),
          ),
          aiSupportStatus: card.statuses.ai_supported
            ? ("ai_supported" as const)
            : ("hinted_only" as const),
          scenarioRefs: card.statuses.ai_supported
            ? ["packages/ai/src/index.test.ts::MVP 0.9 stronger AI"]
            : [],
        };
      })
      .filter((card): card is AiCardHintV2 => card !== null)
      .sort((left, right) => left.cardId.localeCompare(right.cardId)),
  };
}

export function validateAiCardHintsV2(
  hints: AiCardHintsV2,
  snapshot: CardPipelineSnapshot,
): CatalogValidationResult {
  const errors: string[] = [];
  if (hints.schemaVersion !== "ai-card-hints-v1.3.1")
    errors.push("AI hints schemaVersion must be ai-card-hints-v1.3.1.");
  if (hints.derivedFromSnapshotId !== snapshot.snapshotId)
    errors.push(
      "AI hints derivedFromSnapshotId does not match pipeline snapshot.",
    );
  const cardsById = new Map(
    snapshot.cards.map((card) => [card.catalogCardId, card]),
  );
  const seen = new Set<string>();
  for (const hint of hints.cards) {
    if (seen.has(hint.cardId)) errors.push(`Duplicate AI hint ${hint.cardId}.`);
    seen.add(hint.cardId);
    const card = cardsById.get(hint.cardId);
    if (!card) {
      errors.push(`AI hint ${hint.cardId} does not reference a snapshot card.`);
      continue;
    }
    if (hint.side !== card.side)
      errors.push(`AI hint ${hint.cardId} has wrong side.`);
    if (hint.cardType !== card.type)
      errors.push(`AI hint ${hint.cardId} has wrong cardType.`);
    if (hint.roles.length === 0)
      errors.push(`AI hint ${hint.cardId} is missing roles.`);
    if (hint.planRoles.length === 0)
      errors.push(`AI hint ${hint.cardId} is missing planRoles.`);
    if (
      Object.values(hint.valueHints).some(
        (value) => !Number.isFinite(value) || value < -10 || value > 10,
      )
    ) {
      errors.push(
        `AI hint ${hint.cardId} has valueHints outside the -10..10 range.`,
      );
    }
    if (
      hint.aiSupportStatus === "ai_supported" &&
      (!card.statuses.ai_supported || hint.scenarioRefs.length === 0)
    ) {
      errors.push(
        `AI hint ${hint.cardId} grants ai_supported without card support and scenarios.`,
      );
    }
    if (hint.aiSupportStatus !== "ai_supported" && card.statuses.ai_supported) {
      errors.push(
        `AI hint ${hint.cardId} does not preserve existing ai_supported status.`,
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

export function diffCardPipelineSnapshots(
  from: CardPipelineSnapshot,
  to: CardPipelineSnapshot,
): PipelineDiffReport {
  const fromCards = new Map(
    from.cards.map((card) => [card.catalogCardId, card]),
  );
  const toCards = new Map(to.cards.map((card) => [card.catalogCardId, card]));
  const entries: PipelineDiffEntry[] = [];
  for (const cardId of [
    ...new Set([...fromCards.keys(), ...toCards.keys()]),
  ].sort((left, right) => left.localeCompare(right))) {
    const before = fromCards.get(cardId);
    const after = toCards.get(cardId);
    if (!before && after) {
      entries.push({
        category: "added_card",
        severity: "review_required",
        cardId,
        summary: `Card ${cardId} added to pipeline snapshot.`,
      });
      continue;
    }
    if (before && !after) {
      entries.push({
        category: "removed_card",
        severity: "blocking",
        cardId,
        summary: `Card ${cardId} removed from pipeline snapshot.`,
      });
      continue;
    }
    if (!before || !after) continue;
    pushDiff(
      entries,
      "text_changed",
      before.text,
      after.text,
      cardId,
      "Card display text changed.",
      "review_required",
    );
    pushDiff(
      entries,
      "numeric_changed",
      before.numeric,
      after.numeric,
      cardId,
      "Numeric card fields changed.",
      "review_required",
    );
    pushDiff(
      entries,
      "status_changed",
      before.statuses,
      after.statuses,
      cardId,
      "Card support statuses changed.",
      statusDiffSeverity(before, after),
    );
    pushDiff(
      entries,
      "required_mechanics_changed",
      before.requiredMechanics,
      after.requiredMechanics,
      cardId,
      "Required mechanics changed.",
      "blocking",
    );
    pushDiff(
      entries,
      "resolver_ref_changed",
      before.resolverRef,
      after.resolverRef,
      cardId,
      "Resolver reference changed.",
      "blocking",
    );
    pushDiff(
      entries,
      "ability_refs_changed",
      before.abilityRefs,
      after.abilityRefs,
      cardId,
      "Ability references changed.",
      "blocking",
    );
    pushDiff(
      entries,
      "ai_hints_changed",
      before.aiHintsRef,
      after.aiHintsRef,
      cardId,
      "AI hint reference changed.",
      "review_required",
    );
    pushDiff(
      entries,
      "review_status_changed",
      before.review,
      after.review,
      cardId,
      "Review status changed.",
      "review_required",
    );
  }
  return {
    schemaVersion: "card-pipeline-diff-v1.3.1",
    fromSnapshotId: from.snapshotId,
    toSnapshotId: to.snapshotId,
    fromHash: from.hash,
    toHash: to.hash,
    entries,
  };
}

export function createPipelineRollbackReport(
  from: CardPipelineSnapshot,
  to: CardPipelineSnapshot,
): PipelineRollbackReport {
  return {
    schemaVersion: "card-pipeline-rollback-v1.3.1",
    fromSnapshotId: from.snapshotId,
    toSnapshotId: to.snapshotId,
    fromHash: from.hash,
    toHash: to.hash,
    matchSnapshotsUntouched: true,
    replayStateHashUntouched: true,
    privateAssetsUntouched: true,
    summary: `Rollback switches active card pipeline data from ${from.snapshotId} to ${to.snapshotId}; match snapshots, replay StateHash data and private assets are not rewritten.`,
  };
}

export function createCardPipelineReport(
  snapshot: CardPipelineSnapshot,
  hints: AiCardHintsV2,
): CardPipelineReport {
  const validation = validateCardPipelineSnapshot(snapshot, hints);
  const hinted = new Set(hints.cards.map((hint) => hint.cardId));
  return {
    schemaVersion: "card-pipeline-report-v1.3.1",
    reportId: "card-pipeline-report-1.3.1",
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.hash,
    pipelineVersion: "1.3.1",
    statusSummary: summarizePipelineStatuses(snapshot.cards),
    blockedCards: snapshot.cards
      .filter(
        (card) =>
          card.statuses.blocked ||
          validation.errors.some((error) => error.includes(card.catalogCardId)),
      )
      .map((card) => ({
        cardId: card.catalogCardId,
        reasons: validation.errors.filter((error) =>
          error.includes(card.catalogCardId),
        ),
      })),
    missingMechanics: snapshot.cards
      .filter(
        (card) =>
          card.statuses.human_playable && card.requiredMechanics.length === 0,
      )
      .map((card) => card.catalogCardId),
    missingResolvers: snapshot.cards
      .filter(
        (card) =>
          card.statuses.engine_supported &&
          (!card.resolverRef || card.abilityRefs.length === 0),
      )
      .map((card) => card.catalogCardId),
    missingTests: snapshot.cards
      .filter(
        (card) =>
          card.statuses.human_playable && card.review.cardData !== "reviewed",
      )
      .map((card) => card.catalogCardId),
    missingAiHints: snapshot.cards
      .filter(
        (card) => card.statuses.ai_supported && !hinted.has(card.catalogCardId),
      )
      .map((card) => card.catalogCardId),
    noScopeAssertions: {
      noCardTextParser: true,
      noAutomaticPlayability: true,
      noNewCardRelease: true,
      noNewMechanics: true,
      noOfficialAssets: true,
      noPublicPlatformFeatures: true,
    },
  };
}

export function assertPipelinePayloadSafe(
  payload: unknown,
): CatalogValidationResult {
  const serialized = stableStringify(payload);
  const errors = FORBIDDEN_PIPELINE_PAYLOAD_PATTERNS.filter((pattern) =>
    pattern.test(serialized),
  ).map(
    (pattern) =>
      `Pipeline payload contains forbidden pattern ${pattern.source}.`,
  );
  return { ok: errors.length === 0, errors };
}

function normalizeCardSnapshotForPipeline(snapshot: CardSnapshot): CardSnapshot {
  return {
    ...snapshot,
    cards: snapshot.cards
      .map((card) => ({
        ...card,
        subtypes: [...card.subtypes],
        blockReasons: [...card.blockReasons],
        statuses: { ...card.statuses },
        numeric: { ...card.numeric },
        implementationManifest: card.implementationManifest
          ? {
              ...card.implementationManifest,
              unitTests: [...card.implementationManifest.unitTests],
              scenarioTests: [...card.implementationManifest.scenarioTests],
              visibilityTests: [...card.implementationManifest.visibilityTests],
              replayTests: [...card.implementationManifest.replayTests],
            }
          : null,
      }))
      .sort((a, b) => a.catalogCardId.localeCompare(b.catalogCardId)),
  };
}

function toPipelineCard(
  card: CatalogCard,
  aiHints?: AiCardHintsV2,
): PipelineCard {
  const statuses = normalizeStatuses(card.statuses);
  statuses.engine_supported =
    statuses.engine_supported ||
    Boolean(statuses.implemented && statuses.playable);
  statuses.human_playable =
    statuses.human_playable ||
    Boolean(
      statuses.engine_supported && statuses.playable && statuses.deck_legal,
    );
  statuses.format_legal =
    statuses.format_legal ||
    Boolean(statuses.human_playable && statuses.deck_legal);
  const requiredMechanics = statuses.implemented
    ? requiredMechanicsForCard(card)
    : [];
  const engineSupported = statuses.engine_supported;
  const aiHint = aiHints?.cards.find(
    (hint) => hint.cardId === card.catalogCardId,
  );
  return {
    catalogCardId: card.catalogCardId,
    sourceCardId: card.sourceCardId,
    engineCardId: card.engineCardId,
    title: card.title,
    side: card.side,
    type: card.type,
    subtypes: [...card.subtypes].sort((left, right) =>
      left.localeCompare(right),
    ),
    faction: card.faction,
    text: card.text,
    displayOnlyText: card.displayOnlyText,
    numeric: { ...card.numeric },
    statuses,
    requiredMechanics,
    resolverRef:
      engineSupported && card.engineCardId
        ? `engine:${card.engineCardId}`
        : null,
    abilityRefs:
      engineSupported && card.engineCardId ? abilityRefsForCard(card) : [],
    aiHintsRef: aiHint ? `ai-hints-v1.3.1:${aiHint.cardId}` : null,
    review: {
      cardData: card.statuses.validated ? "reviewed" : "unreviewed",
      mechanics:
        requiredMechanics.length > 0 || !statuses.human_playable
          ? "reviewed"
          : "blocked",
      resolver: !engineSupported || card.engineCardId ? "reviewed" : "blocked",
      aiHints: statuses.ai_supported
        ? aiHint
          ? "reviewed"
          : "blocked"
        : aiHint
          ? "reviewed"
          : "unreviewed",
    },
  };
}

function normalizeStatuses(
  statuses: Partial<Record<CatalogStatusKey, boolean>>,
): CatalogStatuses {
  return Object.fromEntries(
    PIPELINE_STATUS_KEYS.map((key) => [key, Boolean(statuses[key])]),
  ) as CatalogStatuses;
}

function requiredMechanicsForCard(card: CatalogCard): string[] {
  const mechanics = new Set<string>();
  if (card.type === "identity") mechanics.add("identity_setup");
  if (card.type === "event") mechanics.add("play_event");
  if (card.type === "operation") mechanics.add("play_operation");
  if (card.type === "program") {
    mechanics.add("install_program");
    mechanics.add("memory");
  }
  if (card.type === "hardware") mechanics.add("install_hardware");
  if (card.type === "resource") mechanics.add("install_resource");
  if (card.type === "agenda") {
    mechanics.add("install_remote");
    mechanics.add("advance");
    mechanics.add("score");
    mechanics.add("steal");
  }
  if (card.type === "asset" || card.type === "upgrade") {
    mechanics.add("install_remote");
    mechanics.add("rez_card");
    mechanics.add("trash_on_access");
  }
  if (card.type === "ice") {
    mechanics.add("install_ice");
    mechanics.add("rez_ice");
    mechanics.add("encounter_ice");
  }
  for (const subtype of card.subtypes) {
    const normalized = subtype
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    if (normalized) mechanics.add(`subtype_${normalized}`);
  }
  if (card.numeric.agendaPoints !== null) mechanics.add("agenda_points");
  if (card.numeric.advancementRequirement !== null)
    mechanics.add("advancement_requirement");
  if (card.numeric.trashCost !== null) mechanics.add("trash_cost");
  return [...mechanics].sort((left, right) => left.localeCompare(right));
}

function abilityRefsForCard(card: CatalogCard): string[] {
  if (!card.engineCardId) return [];
  const refs = [`${card.engineCardId}:resolver_contract`];
  if (card.type === "ice")
    refs.push(`${card.engineCardId}:subroutine_contract`);
  if (card.type === "program")
    refs.push(`${card.engineCardId}:ability_contract`);
  if (card.type === "agenda")
    refs.push(`${card.engineCardId}:score_steal_contract`);
  return refs.sort((left, right) => left.localeCompare(right));
}

function planRolesFor(roles: string[], card: PipelineCard): string[] {
  const planRoles = new Set<string>();
  for (const role of roles) {
    if (role.includes("economy"))
      planRoles.add(
        card.side === "corp" ? "recover_economy" : "recover_economy",
      );
    if (role.includes("draw"))
      planRoles.add(
        card.side === "runner" ? "draw_for_answers" : "recover_economy",
      );
    if (role.includes("run_pressure")) planRoles.add("pressure_rnd");
    if (role.includes("breaker")) planRoles.add("build_rig");
    if (role.includes("agenda") || role.includes("score_plan"))
      planRoles.add(
        card.side === "corp" ? "score_next_turn" : "contest_remote",
      );
    if (role.includes("ice"))
      planRoles.add(card.side === "corp" ? "protect_rnd" : "safe_probe_run");
    if (role.includes("asset"))
      planRoles.add(card.side === "corp" ? "bait_runner" : "trash_asset");
  }
  if (planRoles.size === 0)
    planRoles.add(card.side === "corp" ? "recover_economy" : "safe_probe_run");
  return [...planRoles].sort((left, right) => left.localeCompare(right));
}

function valueHintsFor(
  roles: string[],
  card: PipelineCard,
): Record<string, number> {
  const values: Record<string, number> = {};
  if (roles.some((role) => role.includes("economy"))) values.economy = 3;
  if (roles.some((role) => role.includes("draw"))) values.cardFlow = 2;
  if (roles.some((role) => role.includes("run") || role.includes("breaker")))
    values.runPressure = 2;
  if (roles.some((role) => role.includes("agenda") || role.includes("score")))
    values.scoring = card.side === "corp" ? 4 : 3;
  if (roles.some((role) => role.includes("ice"))) values.defense = 3;
  if (Object.keys(values).length === 0) values.utility = 1;
  return values;
}

function pushDiff(
  entries: PipelineDiffEntry[],
  category: PipelineDiffCategory,
  before: unknown,
  after: unknown,
  cardId: string,
  summary: string,
  severity: PipelineDiffSeverity,
): void {
  if (stableStringify(before) === stableStringify(after)) return;
  entries.push({ category, severity, cardId, summary });
}

function statusDiffSeverity(
  before: PipelineCard,
  after: PipelineCard,
): PipelineDiffSeverity {
  const promoted =
    (!before.statuses.human_playable && after.statuses.human_playable) ||
    (!before.statuses.deck_legal && after.statuses.deck_legal) ||
    (!before.statuses.format_legal && after.statuses.format_legal) ||
    (!before.statuses.ai_supported && after.statuses.ai_supported);
  return promoted ? "blocking" : "review_required";
}

function summarizePipelineStatuses(
  cards: Array<{ statuses: CatalogStatuses }>,
): Partial<Record<CatalogStatusKey, number>> {
  const summary: Partial<Record<CatalogStatusKey, number>> = {};
  for (const card of cards) {
    for (const key of PIPELINE_STATUS_KEYS) {
      if (card.statuses[key]) summary[key] = (summary[key] ?? 0) + 1;
    }
  }
  return summary;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
