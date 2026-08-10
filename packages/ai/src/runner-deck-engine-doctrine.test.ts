import { describe, expect, it } from "vitest";
import standardDeckCatalog from "../../../data/decks/standard-deck-catalog-1.0.0.json";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import { buildRunnerDeckEngineDoctrine } from "./runner-deck-engine-doctrine";
import { AI_HINTS_BY_CARD, type AiCardHint } from "./ai-hints";

describe("runner deck engine doctrine", () => {
  it("derives the Shell-game engine generically from providers and dependencies", () => {
    const doctrine = buildRunnerDeckEngineDoctrine(
      standardDeck("standard_runner_rent_i_con_shellspiel_2026_07_17"),
    );

    expect(doctrine).toBeDefined();
    expect(
      doctrine?.providers
        .filter((provider) =>
          provider.capabilities.includes("runner.coverage.breaker"),
        )
        .map((provider) => provider.cardId),
    ).toEqual(["onr_classic_031_rent-i-con"]);
    expect(
      doctrine?.dependencies.find(
        (entry) => entry.dependencyId === "runner.dependency.breaker_coverage",
      ),
    ).toMatchObject({
      distinctProviderDefinitions: 1,
      providerCopies: 3,
      criticality: "single_definition",
    });
    expect(coherentLineIds(doctrine)).toEqual(
      expect.arrayContaining([
        "runner.engine.consumption_recovery",
        "runner.engine.delayed_install",
        "runner.engine.compatible_recurring_economy",
        "runner.engine.throughput_until_ready",
      ]),
    );
    expect(
      doctrine?.developmentTendencies.find(
        (entry) =>
          entry.tendencyId ===
          "runner.development.throughput_until_dependency_ready",
      ),
    ).toMatchObject({
      strength: "high",
      ownerModuleId: "runner.develop_board_and_hand",
      exitConditionIds: ["required_dependency_ready"],
    });
    expect(
      doctrine?.planContributions.map((entry) => entry.ownerModuleId),
    ).toEqual(
      expect.arrayContaining([
        "runner.rig_and_coverage",
        "runner.develop_board_and_hand",
        "runner.shell_traders_pipeline",
      ]),
    );
  });

  it("distinguishes additive staging cadence from redundant recovery copies", () => {
    const doctrine = buildRunnerDeckEngineDoctrine(
      standardDeck("standard_runner_rent_i_con_shellspiel_2026_07_17"),
    );
    const shell = doctrine?.providers.find(
      (provider) => provider.cardId === "onr_v1_176_the-shell-traders",
    );
    const junkyard = doctrine?.providers.find(
      (provider) => provider.cardId === "onr_v1_165_junkyard-bbs",
    );

    expect(shell).toMatchObject({
      copies: 3,
      additivity: "additive_by_trigger_cadence",
    });
    expect(junkyard).toMatchObject({
      copies: 1,
      additivity: "redundant_by_default",
    });
  });

  it("does not invent staging or recovery when the matching provider is absent", () => {
    const base = standardDeck(
      "standard_runner_rent_i_con_shellspiel_2026_07_17",
    );
    const withoutShell = removeCards(base, ["onr_v1_176_the-shell-traders"]);
    const withoutRecovery = removeCards(base, [
      "onr_v1_165_junkyard-bbs",
      "onr_v1_089_gideons-pawnshop",
      "onr_v1_087_forgotten-backup-chip",
    ]);

    expect(
      lineStatus(
        buildRunnerDeckEngineDoctrine(withoutShell),
        "runner.engine.delayed_install",
      ),
    ).toBe("supported");
    expect(
      lineStatus(
        buildRunnerDeckEngineDoctrine(withoutRecovery),
        "runner.engine.consumption_recovery",
      ),
    ).toBe("supported");
  });

  it("keeps a conventional stable breaker package out of recycle mode", () => {
    const doctrine = buildRunnerDeckEngineDoctrine({
      deckSnapshotId: "conventional-stable-breakers",
      side: "runner",
      cards: [
        { cardId: "onr_v1_014_codecracker", quantity: 2 },
        { cardId: "onr_v1_021_dwarf", quantity: 2 },
        { cardId: "onr_v1_039_krash", quantity: 2 },
      ],
    });

    expect(lineStatus(doctrine, "runner.engine.persistent_rig")).toBe(
      "coherent",
    );
    expect(lineStatus(doctrine, "runner.engine.consumption_recovery")).not.toBe(
      "coherent",
    );
  });

  it("does not mistake bypass or unrestricted recurring economy for breaker support", () => {
    const doctrine = buildRunnerDeckEngineDoctrine({
      deckSnapshotId: "bypass-and-generic-economy",
      side: "runner",
      cards: [
        { cardId: "onr_v1_111_social-engineering", quantity: 3 },
        { cardId: "onr_v1_154_broker", quantity: 3 },
      ],
    });

    expect(
      doctrine?.providers.some((provider) =>
        provider.capabilities.includes("runner.coverage.breaker"),
      ),
    ).toBe(false);
    expect(
      doctrine?.providers.some((provider) =>
        provider.capabilities.includes("runner.economy.recurring_breaker"),
      ),
    ).toBe(false);
    expect(
      lineStatus(doctrine, "runner.engine.compatible_recurring_economy"),
    ).not.toBe("coherent");
  });

  it("binds recovery and compatible recurring economy only from structured facts", () => {
    const recoveryId = "test-structured-top-trash-recovery";
    const breakerCreditId = "test-structured-non-noisy-breaker-credit";
    const legacyOnlyId = "test-legacy-runner-support-signals";
    const doctrine = withAiHints(
      [
        structuredHint(recoveryId, "resource", {
          kind: "card_recovery",
          timing: "action",
          scope: "heap",
          resource: "cards",
          target: "move_top_trash_to_grip",
          amount: 1,
          finite: true,
        }),
        structuredHint(breakerCreditId, "program", {
          kind: "recurring_economy",
          timing: "persistent",
          scope: "runner",
          resource: "credits",
          target: "non_noisy_icebreaker",
          amount: 2,
          repeatable: true,
        }),
        {
          ...structuredHint(legacyOnlyId, "resource"),
          roles: ["trash_recovery", "icebreaker_support"],
          functionSignals: [
            "setup.top_trash_recovery",
            "economy.recurring",
          ],
        },
      ],
      () =>
        buildRunnerDeckEngineDoctrine({
          deckSnapshotId: "structured-runner-provider-witnesses",
          side: "runner",
          cards: [recoveryId, breakerCreditId, legacyOnlyId].map((cardId) => ({
            cardId,
            quantity: 1,
          })),
        }),
    );

    expect(
      doctrine?.providers.find((provider) => provider.cardId === recoveryId)
        ?.capabilities,
    ).toContain("runner.recovery.program_or_hardware");
    expect(
      doctrine?.providers.find(
        (provider) => provider.cardId === breakerCreditId,
      )?.capabilities,
    ).toContain("runner.economy.recurring_breaker");
    const legacyOnlyProvider = doctrine?.providers.find(
      (provider) => provider.cardId === legacyOnlyId,
    );
    expect(legacyOnlyProvider?.capabilities).not.toContain(
      "runner.recovery.program_or_hardware",
    );
    expect(legacyOnlyProvider?.capabilities).not.toContain(
      "runner.economy.recurring_breaker",
    );
  });

  it("keeps sparse throughput support below high-strength development", () => {
    const doctrine = buildRunnerDeckEngineDoctrine({
      deckSnapshotId: "sparse-throughput",
      side: "runner",
      cards: [
        { cardId: "onr_v1_021_dwarf", quantity: 2 },
        { cardId: "onr_v1_114_temple-microcode-outlet", quantity: 1 },
      ],
    });

    expect(
      doctrine?.developmentTendencies.find(
        (entry) =>
          entry.tendencyId ===
          "runner.development.throughput_until_dependency_ready",
      )?.strength,
    ).toBe("medium");
  });
});

function standardDeck(standardDeckId: string): AiDeckStrategyDeckSnapshot {
  const deck = standardDeckCatalog.decks.find(
    (entry) => entry.standardDeckId === standardDeckId,
  );
  if (!deck) throw new Error(`Missing standard deck ${standardDeckId}`);
  return {
    deckSnapshotId: `${deck.standardDeckId}:${deck.version}`,
    side: deck.side as "runner" | "corp",
    formatProfileId: deck.formatProfileId,
    cards: deck.cards.map((entry) => ({ ...entry })),
  };
}

function structuredHint(
  cardId: string,
  cardType: string,
  effect?: NonNullable<AiCardHint["effects"]>[number],
): AiCardHint {
  return {
    cardId,
    side: "runner",
    cardType,
    roles: [],
    planRoles: [],
    aiSupportStatus: "ai_supported",
    ...(effect ? { effects: [effect] } : {}),
  };
}

function withAiHints<T>(hints: readonly AiCardHint[], run: () => T): T {
  const previous = new Map(
    hints.map((hint) => [hint.cardId, AI_HINTS_BY_CARD.get(hint.cardId)]),
  );
  for (const hint of hints) AI_HINTS_BY_CARD.set(hint.cardId, hint);
  try {
    return run();
  } finally {
    for (const hint of hints) {
      const prior = previous.get(hint.cardId);
      if (prior) AI_HINTS_BY_CARD.set(hint.cardId, prior);
      else AI_HINTS_BY_CARD.delete(hint.cardId);
    }
  }
}

function removeCards(
  snapshot: AiDeckStrategyDeckSnapshot,
  cardIds: string[],
): AiDeckStrategyDeckSnapshot {
  return {
    ...snapshot,
    deckSnapshotId: `${snapshot.deckSnapshotId}:without:${cardIds.join(",")}`,
    cards: snapshot.cards.filter((entry) => !cardIds.includes(entry.cardId)),
  };
}

function coherentLineIds(
  doctrine: ReturnType<typeof buildRunnerDeckEngineDoctrine>,
): string[] {
  return (
    doctrine?.engineLines
      .filter((entry) => entry.status === "coherent")
      .map((entry) => entry.lineId) ?? []
  );
}

function lineStatus(
  doctrine: ReturnType<typeof buildRunnerDeckEngineDoctrine>,
  lineId: NonNullable<
    ReturnType<typeof buildRunnerDeckEngineDoctrine>
  >["engineLines"][number]["lineId"],
): "unsupported" | "supported" | "coherent" | undefined {
  return doctrine?.engineLines.find((entry) => entry.lineId === lineId)?.status;
}
