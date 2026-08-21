import { describe, expect, it } from "vitest";
import {
  canonicalCapabilityId,
  type CapabilityKey,
  type EngineCardView,
} from "@netgrid/cards/engine";
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { buildLegalAction } from "../game/turn/action-builders";
import {
  activatedAbilityBindingForLegalAction,
  activatedAbilityBindingForPersistedIdentity,
  activatedAbilityBindingPayload,
  activatedAbilityBindingsForDefinition,
  assertAbilityRefMatchesActivatedBinding,
  CardCapabilityBindingError,
  endOfRunnerTurnAbilityBindingForLegalAction,
  onPlayAbilityForCapabilityIdentity,
  type CardCapabilityAuthoritySources,
} from "./card-capability-binding";

const definition = {
  id: "test_card",
  title: "Test Card",
  side: "runner",
  type: "resource",
} as CardDefinition;

function activated(key: string, amount: number) {
  return {
    kind: "activated" as const,
    timing: "runner_main" as const,
    costs: [],
    effects: [
      {
        kind: "gain_credits" as const,
        recipient: "runner" as const,
        amount,
        visibility: "public" as const,
      },
    ],
    capabilityKey: key as CapabilityKey,
    addressability: ["action" as const, "plan" as const],
  };
}

function engineCard(
  abilities: readonly ReturnType<typeof activated>[],
): EngineCardView {
  return {
    schemaVersion: "engine-card-view-v1",
    cardDefinitionId: definition.id,
    side: "runner",
    cardType: "resource",
    engine: {
      schemaVersion: "card-mechanical-spec-v1",
      characteristics: {
        faction: "test",
        subtypes: [],
        numeric: {
          installCost: 0,
          memoryCost: null,
          rezCost: null,
          trashCost: null,
          advancementRequirement: null,
          agendaPoints: null,
        },
        playCost: { kind: "fixed", credits: 0 },
        strength: { kind: "not_applicable" },
      },
      abilities,
    },
    cardRulesFingerprint: "test-rules",
  } as EngineCardView;
}

function sources(input: {
  engine?: EngineCardView;
}): CardCapabilityAuthoritySources {
  return {
    engineCardForDefinitionId: () => input.engine,
  };
}

function action(
  payload: LegalAction["payload"],
  abilityRef?: LegalAction["abilityRef"],
): LegalAction {
  return {
    actionId: "test-action",
    side: "runner",
    type: "activated_card_ability",
    label: "Test",
    source: "source" as CardInstanceId,
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 4,
    ...(payload ? { payload } : {}),
    ...(abilityRef ? { abilityRef } : {}),
  };
}

describe("stable CardSpec capability binding", () => {
  it("normalizes a malformed canonical quote identity under CardSpec authority", () => {
    const card = engineCard([]) as EngineCardView & {
      engine: { abilities: unknown[] };
    };
    card.engine.abilities = [
      {
        kind: "on_play",
        capabilityKey: "play" as CapabilityKey,
        addressability: ["quote"],
        costs: "printed",
        effects: [],
      },
    ];
    expect(() =>
      onPlayAbilityForCapabilityIdentity(
        definition,
        {
          kind: "card_spec_capability_key",
          sourceCapabilityId: "bad/id",
        },
        sources({ engine: card }),
      ),
    ).not.toThrow();
    expect(
      onPlayAbilityForCapabilityIdentity(
        definition,
        {
          kind: "card_spec_capability_key",
          sourceCapabilityId: "bad/id",
        },
        sources({ engine: card }),
      ),
    ).toBeUndefined();
  });

  it("fails closed when a definition has no CardSpec authority", () => {
    expect(
      activatedAbilityBindingsForDefinition(definition, sources({})),
    ).toEqual([]);
    expect(() =>
      activatedAbilityBindingForLegalAction(
        definition,
        action({}),
        sources({}),
      ),
    ).toThrowError(/keine CardSpec-Mechanikautoritaet/);
  });

  it("keeps canonical identity and action IDs stable across array reordering", () => {
    const first = activated("gain", 1);
    const second = activated("draw", 2);
    const firstBindings = activatedAbilityBindingsForDefinition(
      definition,
      sources({ engine: engineCard([first, second]) }),
    );
    const reordered = activatedAbilityBindingsForDefinition(
      definition,
      sources({ engine: engineCard([second, first]) }),
    );
    expect(
      firstBindings
        .map(
          (binding) =>
            binding.kind === "card_spec_capability_key" &&
            binding.sourceAbilityId,
        )
        .sort(),
    ).toEqual(
      reordered
        .map(
          (binding) =>
            binding.kind === "card_spec_capability_key" &&
            binding.sourceAbilityId,
        )
        .sort(),
    );
    const state = {
      stateVersion: 4,
      timingPoint: "runner_action.main",
    } as GameState;
    const ids = firstBindings.map(
      (binding) =>
        buildLegalAction(
          state,
          "runner",
          "activated_card_ability",
          "Test",
          "source",
          [],
          { cardId: "source", ...activatedAbilityBindingPayload(binding) },
        ).actionId,
    );
    const reorderedIds = reordered.map(
      (binding) =>
        buildLegalAction(
          state,
          "runner",
          "activated_card_ability",
          "Test",
          "source",
          [],
          { cardId: "source", ...activatedAbilityBindingPayload(binding) },
        ).actionId,
    );
    expect(new Set(ids).size).toBe(2);
    expect(ids.sort()).toEqual(reorderedIds.sort());
  });

  it("requires the exact canonical payload and AbilityRef without index fallback", () => {
    const registry = sources({ engine: engineCard([activated("gain", 1)]) });
    const sourceAbilityId = canonicalCapabilityId(
      definition.id,
      "gain" as CapabilityKey,
    );
    const exact = action(
      {
        cardImplementationAbility: "activated",
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey: "gain",
        cardImplementationAbilityId: sourceAbilityId,
      },
      { sourceCardInstanceId: "source" as CardInstanceId, sourceAbilityId },
    );
    const binding = activatedAbilityBindingForLegalAction(
      definition,
      exact,
      registry,
    );
    assertAbilityRefMatchesActivatedBinding(
      exact,
      "source" as CardInstanceId,
      binding,
    );
    for (const payload of [
      {},
      { ...exact.payload, cardImplementationAbilityIndex: 0 },
      { ...exact.payload, cardImplementationAbilityKey: "missing" },
      {
        ...exact.payload,
        cardImplementationAbilityId: "other_card:gain",
      },
    ])
      expect(() =>
        activatedAbilityBindingForLegalAction(
          definition,
          action(payload),
          registry,
        ),
      ).toThrowError(CardCapabilityBindingError);
    expect(() =>
      assertAbilityRefMatchesActivatedBinding(
        {
          ...exact,
          abilityRef: {
            sourceCardInstanceId: "other" as CardInstanceId,
            sourceAbilityId,
          },
        },
        "source" as CardInstanceId,
        binding,
      ),
    ).toThrowError(CardCapabilityBindingError);
  });

  it("rejects ambiguous keys and stale persisted identities", () => {
    const duplicated = sources({
      engine: engineCard([activated("gain", 1), activated("gain", 2)]),
    });
    const sourceAbilityId = canonicalCapabilityId(
      definition.id,
      "gain" as CapabilityKey,
    );
    expect(() =>
      activatedAbilityBindingForLegalAction(
        definition,
        action({
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "gain",
          cardImplementationAbilityId: sourceAbilityId,
        }),
        duplicated,
      ),
    ).toThrowError(/mehrdeutig/);
    expect(() =>
      activatedAbilityBindingForPersistedIdentity(
        definition,
        { sourceAbilityId: "test_card:missing" },
        sources({ engine: engineCard([activated("gain", 1)]) }),
      ),
    ).toThrowError(/existiert nicht/);
  });

  it("binds canonical lifecycle and on-play quote capabilities without an index", () => {
    const sourceAbilityId = canonicalCapabilityId(
      definition.id,
      "end-turn" as CapabilityKey,
    );
    const view = engineCard([]) as unknown as EngineCardView;
    (view.engine as Record<string, unknown>).lifecycle = {
      end_of_runner_turn: [
        {
          effects: [],
          capabilityKey: "end-turn",
          addressability: ["action"],
        },
      ],
    };
    (view.engine as Record<string, unknown>).abilities = [
      {
        kind: "on_play",
        costs: "printed",
        effects: [],
        capabilityKey: "play",
        addressability: ["quote"],
      },
    ];
    const registry = sources({ engine: view });
    expect(
      endOfRunnerTurnAbilityBindingForLegalAction(
        definition,
        action({
          cardImplementationCapabilityBindingKind: "card_spec_capability_key",
          cardImplementationAbilityKey: "end-turn",
          cardImplementationAbilityId: sourceAbilityId,
        }),
        registry,
      ),
    ).toMatchObject({ kind: "card_spec_capability_key", sourceAbilityId });
    expect(
      onPlayAbilityForCapabilityIdentity(
        definition,
        {
          kind: "card_spec_capability_key",
          sourceCapabilityId: "test_card:play",
        },
        registry,
      ),
    ).toMatchObject({ kind: "on_play" });
    expect(
      onPlayAbilityForCapabilityIdentity(
        definition,
        {
          kind: "card_spec_capability_key",
          sourceCapabilityId: "test_card:missing",
        },
        registry,
      ),
    ).toBeUndefined();
  });
});
