import type {
  PlayerView,
  TraceSuccessEffect,
  VisibleCard,
  VisibleCorpIcePostRezRunQuote,
  VisibleEffectiveIceRunQuote,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildAiDecisionInputDto } from "./input-dto";

describe("AI input DTO effective ICE run quote contract", () => {
  it("deep-copies the exhaustive current-state quote and drops unknown nested fields", () => {
    const quote = validEffectiveRunQuote();
    const raw = quote as unknown as Record<string, unknown>;
    raw.hiddenRootCardId = "secret-root-card";
    const subroutine = quote.subroutines[0] as unknown as Record<
      string,
      unknown
    >;
    subroutine.hiddenSubroutineCardId = "secret-subroutine-card";
    (subroutine.traceSuccessEffect as unknown as Record<string, unknown>)[
      "hiddenTraceTarget"
    ] = "secret-trace-target";
    (subroutine.unbrokenRunEffect as unknown as Record<string, unknown>)[
      "hiddenRunState"
    ] = "secret-run-state";
    (
      quote.conditionalEncounterEffects![0] as unknown as Record<
        string,
        unknown
      >
    )["hiddenConditionalChoice"] = "secret-choice";
    const view = playerView("runner", rezzedIce(quote));

    const sanitized =
      buildInput(view).playerView.servers[0]?.ice[0]?.effectiveRunQuote;

    expect(sanitized).toEqual(validEffectiveRunQuote());
    expect(sanitized).not.toBe(quote);
    expect(sanitized?.subroutines).not.toBe(quote.subroutines);
    expect(sanitized?.subroutines[0]?.traceSuccessEffect).not.toBe(
      quote.subroutines[0]?.traceSuccessEffect,
    );
    expect(sanitized?.subroutines[0]?.unbrokenRunEffect).not.toBe(
      quote.subroutines[0]?.unbrokenRunEffect,
    );
    expect(sanitized?.conditionalEncounterEffects).not.toBe(
      quote.conditionalEncounterEffects,
    );
    expect(JSON.stringify(sanitized)).not.toContain("secret-");
  });

  it("preserves the exact public run and quote for an unrezzed temporary encounter", () => {
    const quote = validEffectiveRunQuote();
    const encounteredIce = {
      ...baseIce(),
      rezzed: false,
      effectiveRunQuote: quote,
    };
    const view = playerView("corp", encounteredIce);
    view.run = {
      runId: "run_temporary_encounter",
      attackedServerId: "hq",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "hq", iceIndex: 0 },
      encounteredIce,
      successful: false,
    };

    expect(buildInput(view).playerView.run).toMatchObject({
      runId: "run_temporary_encounter",
      encounteredIce: {
        instanceId: ICE_ID,
        rezzed: false,
        effectiveRunQuote: validEffectiveRunQuote(),
      },
    });
  });

  it("applies the same exhaustive sanitizer inside the post-rez wrapper", () => {
    const quote = validEffectiveRunQuote();
    const wrapper: VisibleCorpIcePostRezRunQuote = {
      context: "installed_post_rez",
      cardId: ICE_ID,
      iceDefinitionId: ICE_DEFINITION_ID,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: STATE_VERSION,
      complete: true,
      effectiveRunQuote: quote,
    };
    (wrapper as unknown as Record<string, unknown>)["hiddenWrapperCard"] =
      "secret-wrapper-card";
    (quote.subroutines[0] as unknown as Record<string, unknown>)[
      "hiddenNestedCard"
    ] = "secret-nested-card";
    const view = playerView("corp", unrezzedIce(wrapper));

    const sanitized =
      buildInput(view).playerView.servers[0]?.ice[0]?.effectivePostRezRunQuote;

    expect(sanitized).toEqual({
      context: "installed_post_rez",
      cardId: ICE_ID,
      iceDefinitionId: ICE_DEFINITION_ID,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: STATE_VERSION,
      complete: true,
      effectiveRunQuote: validEffectiveRunQuote(),
    });
    expect(sanitized).not.toBe(wrapper);
    expect(sanitized?.complete && sanitized.effectiveRunQuote).not.toBe(quote);
    expect(JSON.stringify(sanitized)).not.toContain("secret-");
  });

  it.each(validTraceSuccessEffects())(
    "preserves and allowlists trace-success union $type",
    (effect) => {
      const quote = validEffectiveRunQuote();
      quote.subroutines[0]!.traceSuccessEffect = {
        ...effect,
        hiddenTraceCardId: "secret-trace-card",
      } as unknown as TraceSuccessEffect;
      const sanitized = buildInput(playerView("runner", rezzedIce(quote)))
        .playerView.servers[0]?.ice[0]?.effectiveRunQuote;

      expect(sanitized?.subroutines[0]?.traceSuccessEffect).toEqual(effect);
      expect(sanitized?.subroutines[0]?.traceSuccessEffect).not.toBe(
        quote.subroutines[0]?.traceSuccessEffect,
      );
      expect(JSON.stringify(sanitized)).not.toContain("hiddenTraceCardId");
    },
  );

  it.each(malformedQuoteCases())(
    "drops malformed current-state and post-rez quotes: $label",
    ({ mutate }) => {
      const currentQuote = validEffectiveRunQuote();
      mutate(currentQuote as unknown as Record<string, unknown>);
      const current = buildInput(playerView("runner", rezzedIce(currentQuote)));
      expect(
        current.playerView.servers[0]?.ice[0]?.effectiveRunQuote,
      ).toBeUndefined();

      const postRezQuote = validEffectiveRunQuote();
      mutate(postRezQuote as unknown as Record<string, unknown>);
      const postRez = buildInput(
        playerView(
          "corp",
          unrezzedIce({
            context: "installed_post_rez",
            cardId: ICE_ID,
            iceDefinitionId: ICE_DEFINITION_ID,
            targetServerId: "hq",
            projectedServerId: "hq",
            expiresAtStateVersion: STATE_VERSION,
            complete: true,
            effectiveRunQuote: postRezQuote,
          }),
        ),
      );
      expect(
        postRez.playerView.servers[0]?.ice[0]?.effectivePostRezRunQuote,
      ).toBeUndefined();
    },
  );

  it.each([
    ["unknown incomplete reason", { complete: false, reason: "guess" }],
    ["missing completeness discriminator", { complete: undefined }],
    ["negative state binding", { expiresAtStateVersion: -1 }],
    ["new-remote server", { targetServerId: "new_remote" }],
  ] as const)("drops a malformed post-rez wrapper with %s", (_label, patch) => {
    const wrapper = {
      context: "installed_post_rez",
      cardId: ICE_ID,
      iceDefinitionId: ICE_DEFINITION_ID,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: STATE_VERSION,
      complete: true,
      effectiveRunQuote: validEffectiveRunQuote(),
      ...patch,
    } as unknown as VisibleCorpIcePostRezRunQuote;
    const view = playerView("corp", unrezzedIce(wrapper));

    expect(
      buildInput(view).playerView.servers[0]?.ice[0]?.effectivePostRezRunQuote,
    ).toBeUndefined();
  });

  it("preserves the bound on-rez lifecycle blocker only in the Corp view", () => {
    const wrapper: VisibleCorpIcePostRezRunQuote = {
      context: "installed_post_rez",
      cardId: ICE_ID,
      iceDefinitionId: ICE_DEFINITION_ID,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: STATE_VERSION,
      complete: false,
      reason: "on_rez_lifecycle_projection_required",
    };

    expect(
      buildInput(playerView("corp", unrezzedIce(wrapper))).playerView.servers[0]
        ?.ice[0]?.effectivePostRezRunQuote,
    ).toEqual(wrapper);
    expect(
      buildInput(playerView("runner", unrezzedIce(wrapper))).playerView
        .servers[0]?.ice[0]?.effectivePostRezRunQuote,
    ).toBeUndefined();
  });

  it("drops the Corp-private post-rez wrapper from a Runner view", () => {
    const wrapper: VisibleCorpIcePostRezRunQuote = {
      context: "installed_post_rez",
      cardId: ICE_ID,
      iceDefinitionId: ICE_DEFINITION_ID,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: STATE_VERSION,
      complete: true,
      effectiveRunQuote: validEffectiveRunQuote(),
    };
    const view = playerView("runner", unrezzedIce(wrapper));

    expect(
      buildInput(view).playerView.servers[0]?.ice[0]?.effectivePostRezRunQuote,
    ).toBeUndefined();
  });
});

const ICE_ID = "ice-1";
const ICE_DEFINITION_ID = "ice-definition-1";
const STATE_VERSION = 12;

function validEffectiveRunQuote(): VisibleEffectiveIceRunQuote {
  return {
    iceInstanceId: ICE_ID,
    iceDefinitionId: ICE_DEFINITION_ID,
    effectiveStrength: 4,
    subroutines: [
      {
        id: "trace-and-deflect",
        type: "initiate_trace",
        amount: 2,
        damageType: "net",
        traceLimit: 3,
        runFutureStrengthCancelPaymentAmount: 1,
        traceSuccessEffect: {
          type: "add_tag_and_counter",
          tagAmount: 1,
          counterType: "trace_tag_counter",
          amount: 2,
        },
        deflectorTarget: "any_data_fort",
        deflectorCost: 2,
        deflectorAutoBreakIfNoTarget: true,
        breakTags: ["trace", "end_the_run"],
        sourceDefinitionId: "dynamic-source-definition",
        sourceTitle: "Dynamic Source",
        dynamicSourceKind: "additional_subroutine",
        unbrokenRunEffect: {
          addsFutureEndTheRunSubroutines: 1,
          increasesFutureBreakCostPerSubroutine: 2,
          increasesFutureIceStrength: 3,
          preventsFutureBreaking: true,
          addsFutureEncounterCost: 4,
          preventsJackOut: true,
          causesDamageOrProgramTrash: true,
          createsRunLockOrActionTax: 2,
        },
      },
    ],
    breakSubroutineAdditionalCostPerSubroutine: 2,
    breakSubroutineCostSourceDefinitionIds: ["modifier-z", "modifier-a"],
    breakSubroutineCostSourceTitles: ["Modifier Z", "Modifier A"],
    encounterTemporaryTraceCredits: 3,
    conditionalEncounterEffects: [
      { kind: "corp_paid_add_end_the_run_subroutine", creditCost: 2 },
      {
        kind: "random_strength_or_derez_auto_pass",
        dieFaces: 6,
        autoPassResult: 6,
        maxStrengthBonus: 5,
      },
    ],
  };
}

function validTraceSuccessEffects(): TraceSuccessEffect[] {
  return [
    { type: "add_tag", amount: 1 },
    { type: "net_damage", amount: 2 },
    { type: "add_tags_by_trace_margin_over_runner_link" },
    { type: "add_counter", counterType: "power", amount: 3 },
    {
      type: "add_tag_and_counter",
      tagAmount: 1,
      counterType: "trace_tag_counter",
      amount: 2,
    },
    { type: "end_run_and_run_lock", amount: 1 },
    { type: "end_run_trash_program_and_run_lock", amount: 1 },
    {
      type: "end_run_trash_hardware_and_unpreventable_meat_damage",
      amount: 2,
    },
    {
      type: "trash_runner_resource_and_add_tag",
      targetCardInstanceId: "visible-installed-resource",
    },
    { type: "none" },
  ];
}

function malformedQuoteCases(): Array<{
  label: string;
  mutate: (quote: Record<string, unknown>) => void;
}> {
  const subroutine = (quote: Record<string, unknown>) =>
    (quote.subroutines as Array<Record<string, unknown>>)[0]!;
  const unbroken = (quote: Record<string, unknown>) =>
    subroutine(quote).unbrokenRunEffect as Record<string, unknown>;
  return [
    { label: "blank ICE id", mutate: (quote) => (quote.iceInstanceId = " ") },
    {
      label: "negative effective strength",
      mutate: (quote) => (quote.effectiveStrength = -1),
    },
    {
      label: "non-finite effective strength",
      mutate: (quote) => (quote.effectiveStrength = Number.POSITIVE_INFINITY),
    },
    {
      label: "fractional break surcharge",
      mutate: (quote) =>
        (quote.breakSubroutineAdditionalCostPerSubroutine = 0.5),
    },
    {
      label: "negative encounter trace credits",
      mutate: (quote) => (quote.encounterTemporaryTraceCredits = -1),
    },
    {
      label: "non-array subroutines",
      mutate: (quote) => (quote.subroutines = {}),
    },
    {
      label: "unknown subroutine type",
      mutate: (quote) => (subroutine(quote).type = "hidden_effect"),
    },
    {
      label: "blank subroutine id",
      mutate: (quote) => (subroutine(quote).id = ""),
    },
    {
      label: "negative subroutine amount",
      mutate: (quote) => (subroutine(quote).amount = -1),
    },
    {
      label: "unknown subroutine damage type",
      mutate: (quote) => (subroutine(quote).damageType = "hidden_damage"),
    },
    {
      label: "fractional base trace",
      mutate: (quote) => (subroutine(quote).traceLimit = 1.5),
    },
    {
      label: "non-finite trace bid limit",
      mutate: (quote) => (subroutine(quote).traceLimit = Number.NaN),
    },
    {
      label: "negative future-strength cancel payment",
      mutate: (quote) =>
        (subroutine(quote).runFutureStrengthCancelPaymentAmount = -1),
    },
    {
      label: "unknown trace-success union member",
      mutate: (quote) =>
        (subroutine(quote).traceSuccessEffect = { type: "hidden_trace" }),
    },
    {
      label: "negative trace-success amount",
      mutate: (quote) =>
        (subroutine(quote).traceSuccessEffect = {
          type: "add_tag",
          amount: -1,
        }),
    },
    {
      label: "unknown trace-success counter",
      mutate: (quote) =>
        (subroutine(quote).traceSuccessEffect = {
          type: "add_counter",
          counterType: "hidden_counter",
          amount: 1,
        }),
    },
    {
      label: "negative trace-success counter amount",
      mutate: (quote) =>
        (subroutine(quote).traceSuccessEffect = {
          type: "add_counter",
          counterType: "power",
          amount: -1,
        }),
    },
    {
      label: "negative trace-success tag amount",
      mutate: (quote) =>
        (subroutine(quote).traceSuccessEffect = {
          type: "add_tag_and_counter",
          tagAmount: -1,
          counterType: "power",
          amount: 1,
        }),
    },
    {
      label: "blank trace-success resource target",
      mutate: (quote) =>
        (subroutine(quote).traceSuccessEffect = {
          type: "trash_runner_resource_and_add_tag",
          targetCardInstanceId: "",
        }),
    },
    {
      label: "unknown deflector target",
      mutate: (quote) => (subroutine(quote).deflectorTarget = "hidden_server"),
    },
    {
      label: "negative deflector cost",
      mutate: (quote) => (subroutine(quote).deflectorCost = -1),
    },
    {
      label: "non-boolean deflector auto-break",
      mutate: (quote) =>
        (subroutine(quote).deflectorAutoBreakIfNoTarget = "true"),
    },
    {
      label: "malformed break tags",
      mutate: (quote) => (subroutine(quote).breakTags = ["trace", ""]),
    },
    {
      label: "blank dynamic source id",
      mutate: (quote) => (subroutine(quote).sourceDefinitionId = ""),
    },
    {
      label: "blank dynamic source title",
      mutate: (quote) => (subroutine(quote).sourceTitle = " "),
    },
    {
      label: "unknown dynamic source kind",
      mutate: (quote) =>
        (subroutine(quote).dynamicSourceKind = "hidden_dynamic_source"),
    },
    ...[
      "addsFutureEndTheRunSubroutines",
      "increasesFutureBreakCostPerSubroutine",
      "increasesFutureIceStrength",
      "addsFutureEncounterCost",
      "createsRunLockOrActionTax",
    ].map((field) => ({
      label: `negative unbroken ${field}`,
      mutate: (quote: Record<string, unknown>) => {
        unbroken(quote)[field] = -1;
      },
    })),
    {
      label: "non-boolean unbroken prevention flag",
      mutate: (quote) => (unbroken(quote).preventsFutureBreaking = "true"),
    },
    {
      label: "non-boolean unbroken jack-out flag",
      mutate: (quote) => (unbroken(quote).preventsJackOut = 1),
    },
    {
      label: "non-boolean unbroken damage flag",
      mutate: (quote) => (unbroken(quote).causesDamageOrProgramTrash = 1),
    },
    {
      label: "unknown conditional-effect union member",
      mutate: (quote) =>
        (quote.conditionalEncounterEffects = [{ kind: "hidden_effect" }]),
    },
    {
      label: "malformed break-cost source ids",
      mutate: (quote) =>
        (quote.breakSubroutineCostSourceDefinitionIds = ["visible", ""]),
    },
    {
      label: "negative conditional-effect credit cost",
      mutate: (quote) =>
        (quote.conditionalEncounterEffects = [
          { kind: "corp_paid_add_end_the_run_subroutine", creditCost: -1 },
        ]),
    },
    {
      label: "invalid conditional-effect die contract",
      mutate: (quote) =>
        (quote.conditionalEncounterEffects = [
          {
            kind: "random_strength_or_derez_auto_pass",
            dieFaces: 6,
            autoPassResult: 5,
            maxStrengthBonus: 5,
          },
        ]),
    },
  ];
}

function rezzedIce(quote: VisibleEffectiveIceRunQuote): VisibleCard {
  return {
    ...baseIce(),
    rezzed: true,
    effectiveRunQuote: quote,
  };
}

function unrezzedIce(quote: VisibleCorpIcePostRezRunQuote): VisibleCard {
  return {
    ...baseIce(),
    rezzed: false,
    effectivePostRezRunQuote: quote,
  };
}

function baseIce(): VisibleCard {
  return {
    instanceId: ICE_ID,
    definitionId: ICE_DEFINITION_ID,
    title: "Visible ICE",
    known: true,
    type: "ice",
    owner: "corp",
    controller: "corp",
  };
}

function playerView(side: "corp" | "runner", ice: VisibleCard): PlayerView {
  return {
    side,
    stateVersion: STATE_VERSION,
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    activeSide: side,
    phase: "action",
    own: {
      identity: identity(side),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 40,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: identity(side === "corp" ? "runner" : "corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      coreDamage: 0,
      deckCount: 40,
      discardCount: 0,
      discardCards: [],
      scoreArea: [],
      rig: [],
      memoryUsed: 0,
      memoryLimit: 4,
    },
    servers: [{ id: "hq", label: "HQ", ice: [ice], root: [] }],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  } as unknown as PlayerView;
}

function identity(side: "corp" | "runner"): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    known: true,
    type: "identity",
    owner: side,
    controller: side,
  };
}

function buildInput(view: PlayerView) {
  return buildAiDecisionInputDto({
    side: view.side,
    playerView: view,
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "effective-run-quote-dto",
    decisionId: `effective-run-quote-dto:${view.side}:1`,
    actionNumber: 1,
    profileId: "effective-run-quote-dto-test",
  });
}
