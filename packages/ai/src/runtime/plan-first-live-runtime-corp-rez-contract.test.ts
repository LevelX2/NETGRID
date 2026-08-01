import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";

describe("plan-first Corp conditional root-rez contract", () => {
  it("selects an exact guaranteed root-rez credit conversion as a P3 Corp Economy plan", () => {
    resetResidentPlanPortfolioMemory();
    const input = rootRezEconomyInput("guaranteed");

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "rez-economy-root",
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P3",
        "plan_assessment_evidence:corp_engine_certified_immediate_root_rez_credit_conversion",
        "plan_scheduler:route:corp_window.rez:plan:corp.economy:economy-campaign%3Aeconomy-root",
      ]),
    );
  });

  it.each([
    ["missing", "missing"],
    ["Runner-interruptible", "runner_interruptible"],
    ["nonpositive", "nonpositive"],
    ["malformed", "malformed"],
  ] as const)(
    "fails closed for a %s root-rez credit outcome and leaves decline_rez as P6 window pass",
    (_label, outcome) => {
      resetResidentPlanPortfolioMemory();
      const input = rootRezEconomyInput(outcome);

      const decision = liveContext().chooseSemanticRuntimeAction(input, {});

      expect(decision).toMatchObject({
        actionId: "decline-rez",
        reasonCode: "plan_first.corp.defend_servers",
        fallbackUsed: false,
      });
      expect(decision.evidence).toEqual(
        expect.arrayContaining([
          "plan_priority_class:P6",
          "plan_assessment_evidence:visible_rez_window_decline_without_defense_threat",
        ]),
      );
    },
  );

  it("does not infer a Chester Mix continuation without a future engine quote", () => {
    resetResidentPlanPortfolioMemory();
    const chester = corpUpgrade(
      "chester",
      "onr_v1_352_chester-mix",
      "Chester Mix",
    );
    const ice = corpIce("data-wall", "onr_v1_237_data-wall", "Data Wall");
    const rezChester = rezAction(chester, "rez-chester");
    const installIce = legalAction(
      "install-hq-ice",
      "corp",
      "install_card",
      "Install Data Wall protecting HQ",
      { credits: 1, clicks: 1 },
      {
        source: ice.instanceId,
        payload: {
          cardId: ice.instanceId,
          serverId: "hq",
          placement: "ice",
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCardId: ice.instanceId,
          postInstallRezQuoteTargetServerId: "hq",
          postInstallRezQuoteProjectedServerId: "hq",
          postInstallRezQuoteExpiresAtStateVersion: 1,
          postInstallRezQuoteBaseCredits: 3,
          postInstallRezQuoteFinalCredits: 3,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = corpInput([rezChester, installIce, endTurn()]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [ice];
    input.playerView.servers = [
      server(
        "hq",
        [corpIce("existing-hq-ice", "onr_v1_237_data-wall", "Data Wall", true)],
        [chester],
      ),
      server("rd"),
      server("archives"),
    ];

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError("missing_plan_module_coverage");
  });

  it("marks Chester Mix nonproductive without a bound productive same-fort ICE route", () => {
    resetResidentPlanPortfolioMemory();
    const chester = corpUpgrade(
      "chester",
      "onr_v1_352_chester-mix",
      "Chester Mix",
    );
    const gainCredit = legalAction(
      "gain-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = corpInput([
      rezAction(chester, "rez-chester"),
      gainCredit,
      endTurn(),
    ]);
    input.playerView.servers = [
      server("hq", [], [chester]),
      server("rd"),
      server("archives"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: gainCredit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("declines Dr. Dreff without an engine-certified future-encounter rez quote", () => {
    resetResidentPlanPortfolioMemory();
    const input = drDreffInput({
      attackedServerId: "remote_1",
      dreffServerId: "remote_1",
      iceIndex: 0,
      hqIce: [corpIce("data-wall", "onr_v1_237_data-wall", "Data Wall")],
      credits: 0,
    });

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "decline-rez",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:visible_rez_window_decline_without_defense_threat",
      ]),
    );
  });

  it.each([
    {
      label: "an earlier ICE window",
      attackedServerId: "remote_1",
      dreffServerId: "remote_1",
      iceIndex: 1,
      hqIce: [corpIce("data-wall", "onr_v1_237_data-wall", "Data Wall")],
      credits: 0,
    },
    {
      label: "a run on another fort",
      attackedServerId: "remote_2",
      dreffServerId: "remote_1",
      iceIndex: 0,
      hqIce: [corpIce("data-wall", "onr_v1_237_data-wall", "Data Wall")],
      credits: 0,
    },
    {
      label: "no visible HQ ICE",
      attackedServerId: "remote_1",
      dreffServerId: "remote_1",
      iceIndex: 0,
      hqIce: [],
      credits: 4,
    },
    {
      label: "only unaffordable visible HQ ICE",
      attackedServerId: "remote_1",
      dreffServerId: "remote_1",
      iceIndex: 0,
      hqIce: [
        corpIce(
          "haunting-inquisition",
          "onr_v1_247_haunting-inquisition",
          "Haunting Inquisition",
        ),
      ],
      credits: 3,
    },
  ] satisfies Array<DrDreffInputParams & { label: string }>)(
    "does not create a Dr. Dreff rez route for $label",
    (variant) => {
      resetResidentPlanPortfolioMemory();
      const input = drDreffInput(variant);

      expect(
        liveContext().chooseSemanticRuntimeAction(input, {}),
      ).toMatchObject({
        actionId: "decline-rez",
        fallbackUsed: false,
      });
    },
  );

  it("rezzes Jenny Jett in the last relevant window on her own fort", () => {
    resetResidentPlanPortfolioMemory();
    const input = jennyJettInput({
      iceIndex: 0,
      installedIceCount: 1,
      credits: 2,
    });

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "rez-jenny",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "corp_rez_fort_run_support_same_fort_run_with_affordable_hq_ice_install",
        ),
      ]),
    );
  });

  it("defers Jenny Jett before the last relevant ICE window", () => {
    resetResidentPlanPortfolioMemory();
    const input = jennyJettInput({
      iceIndex: 1,
      installedIceCount: 2,
      credits: 10,
      quote: "missing",
    });

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "decline-rez",
      fallbackUsed: false,
    });
  });

  it("declines Jenny Jett when the exact Engine quote is unpayable", () => {
    resetResidentPlanPortfolioMemory();
    const input = jennyJettInput({
      iceIndex: 0,
      installedIceCount: 5,
      credits: 4,
    });

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "decline-rez",
      fallbackUsed: false,
    });
  });

  it("declines Jenny Jett when the exact Engine quote is missing", () => {
    resetResidentPlanPortfolioMemory();
    const input = jennyJettInput({
      iceIndex: 0,
      installedIceCount: 1,
      credits: 10,
      quote: "missing",
    });

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "decline-rez",
      fallbackUsed: false,
    });
  });

  it.each([
    {
      label: "schema version mismatch",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteSchemaVersion =
          "stale-fort-run-quote";
      },
    },
    {
      label: "mechanic kind mismatch",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteKind =
          "different-fort-run-mechanic";
      },
    },
    {
      label: "incomplete quote",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteComplete = false;
      },
    },
    {
      label: "source card mismatch",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteSourceCardInstanceId =
          "other-jenny";
      },
    },
    {
      label: "target server mismatch",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteTargetServerId = "rd";
      },
    },
    {
      label: "stale state version",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteStateVersion = 0;
      },
    },
    {
      label: "stale action id",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteActionId =
          "stale-rez-jenny";
      },
    },
    {
      label: "rez credit mismatch",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteRezCredits = 0;
        payload.cardImplementationFortRunRezSupportQuoteTotalCredits = 1;
      },
    },
    {
      label: "inconsistent total",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteTotalCredits = 3;
      },
    },
    {
      label: "inconsistent payable verdict",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteTotalCreditsPayable = false;
      },
    },
    {
      label: "no certified HQ ICE",
      mutate: (payload: NonNullable<LegalAction["payload"]>) => {
        payload.cardImplementationFortRunRezSupportQuoteHasOwnHqIce = false;
      },
    },
  ])("declines Jenny Jett for $label", ({ mutate }) => {
    resetResidentPlanPortfolioMemory();
    const input = jennyJettInput({
      iceIndex: 0,
      installedIceCount: 1,
      credits: 10,
    });
    const rezJenny = input.legalActions.find(
      (action) => action.actionId === "rez-jenny",
    );
    if (!rezJenny?.payload) throw new Error("Jenny quote fixture missing");
    mutate(rezJenny.payload);

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "decline-rez",
      fallbackUsed: false,
    });
  });

  it("routes Encoder Inc. only when a visible installed code gate makes its exact rez productive", () => {
    resetResidentPlanPortfolioMemory();
    const encoder = visibleCard("encoder", "corp", "asset", {
      definitionId: "onr_v1_320_encoder-inc",
      title: "Encoder, Inc.",
      rezzed: false,
    });
    const input = corpInput([
      rezAction(encoder, "rez-encoder"),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
        credits: 0,
        clicks: 1,
      }),
    ]);
    input.playerView.servers = [
      server("hq", [
        corpIce("quandary", "onr_v1_261_quandary", "Quandary", true),
      ]),
      server("rd"),
      server("archives"),
      server("remote_1", [], [encoder]),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "rez-encoder",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("disposes Encoder Inc. exactly when no installed code gate can use it", () => {
    resetResidentPlanPortfolioMemory();
    const encoder = visibleCard("encoder", "corp", "asset", {
      definitionId: "onr_v1_320_encoder-inc",
      title: "Encoder, Inc.",
      rezzed: false,
    });
    const gainCredit = legalAction(
      "gain-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = corpInput([
      rezAction(encoder, "rez-encoder"),
      gainCredit,
      endTurn(),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [encoder]),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: gainCredit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("rezes a fort-bound stealth-credit lockout through the exact Defense-plan route", () => {
    resetResidentPlanPortfolioMemory();
    const lockout = corpUpgrade(
      "fort-stealth-lockout",
      "onr_v1_373_twenty-four-hour-surveillance",
      "Fort Stealth Lockout",
    );
    const input = corpInput(
      [rezAction(lockout, "rez-fort-stealth-lockout", 1), declineRez()],
      "run.approach_ice",
    );
    input.playerView.own.credits = 13;
    input.playerView.opponent.rig = [
      runnerStealthCreditPool("stealth-pool", 6),
    ];
    input.playerView.run = activeRun("hq", 0);
    input.playerView.servers = [
      server(
        "hq",
        [corpIce("hq-ice", "onr_v1_237_data-wall", "Data Wall", true)],
        [lockout],
      ),
      server("rd"),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "rez-fort-stealth-lockout",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.defend_servers",
        expect.stringContaining("plan_step_id:"),
        "plan_assessment_evidence:corp_rez_fort_stealth_credit_lockout_blocks_visible_credits:6",
      ]),
    );
  });

  it.each([
    {
      label: "when the Runner has no visible usable stealth credits",
      rig: [] as VisibleCard[],
      runServerId: "hq" as const,
    },
    {
      label: "when the current run attacks another fort",
      rig: [runnerStealthCreditPool("stealth-pool", 6)],
      runServerId: "remote_1" as const,
    },
  ])(
    "declines a fort-bound stealth-credit lockout $label",
    ({ rig, runServerId }) => {
      resetResidentPlanPortfolioMemory();
      const lockout = corpUpgrade(
        "fort-stealth-lockout",
        "onr_v1_373_twenty-four-hour-surveillance",
        "Fort Stealth Lockout",
      );
      const input = corpInput(
        [rezAction(lockout, "rez-fort-stealth-lockout", 1), declineRez()],
        "run.approach_ice",
      );
      input.playerView.own.credits = 13;
      input.playerView.opponent.rig = rig;
      input.playerView.run = activeRun(runServerId, 0);
      input.playerView.servers = [
        server(
          "hq",
          [corpIce("hq-ice", "onr_v1_237_data-wall", "Data Wall", true)],
          [lockout],
        ),
        server("rd"),
        server("archives"),
        ...(runServerId === "remote_1" ? [server("remote_1")] : []),
      ];

      const decision = liveContext().chooseSemanticRuntimeAction(input, {});

      expect(decision).toMatchObject({
        actionId: "decline-rez",
        reasonCode: "plan_first.corp.defend_servers",
        fallbackUsed: false,
      });
      expect(decision.evidence).toEqual(
        expect.arrayContaining([
          "plan_module:corp.defend_servers",
          "plan_scheduler:route:corp_window.decline_rez:plan:corp.defend_servers:server-defense-portfolio",
        ]),
      );
    },
  );

  it.each([
    {
      label: "during the Corp main phase",
      timingPoint: "corp_action.main" as const,
      includeDecline: false,
    },
    {
      label: "during a run rez window",
      timingPoint: "run.approach_ice" as const,
      includeDecline: true,
    },
  ])(
    "does not rez zero-counter Pacifica Regional AI $label",
    ({ timingPoint, includeDecline }) => {
      resetResidentPlanPortfolioMemory();
      const pacifica = visibleCard("pacifica", "corp", "asset", {
        definitionId: "onr_v1_334_pacifica-regional-ai",
        title: "Pacifica Regional AI",
        rezzed: false,
        advancementCounters: 0,
      });
      const alternative = includeDecline
        ? declineRez()
        : legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
            credits: 0,
            clicks: 1,
          });
      const input = corpInput(
        [
          rezAction(pacifica, "rez-pacifica"),
          alternative,
          ...(includeDecline ? [] : [endTurn()]),
        ],
        timingPoint,
      );
      input.playerView.servers = [
        server("hq"),
        server("rd"),
        server("archives"),
        server("remote_1", [], [pacifica]),
      ];
      if (includeDecline) {
        input.playerView.run = activeRun("remote_1", 0);
      }

      expect(
        liveContext().chooseSemanticRuntimeAction(input, {}),
      ).toMatchObject({
        actionId: alternative.actionId,
        fallbackUsed: false,
      });
    },
  );

  it("routes Data Masons only through visible installed Wall support", () => {
    resetResidentPlanPortfolioMemory();
    const dataMasons = visibleCard("data-masons", "corp", "asset", {
      definitionId: "onr_v1_317_data-masons",
      title: "Data Masons",
      rezzed: false,
    });
    const input = corpInput([
      rezAction(dataMasons, "rez-data-masons"),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
        credits: 0,
        clicks: 1,
      }),
    ]);
    input.playerView.servers = [
      server("hq", [
        corpIce("data-wall", "onr_v1_237_data-wall", "Data Wall", true),
      ]),
      server("rd"),
      server("archives"),
      server("remote_1", [], [dataMasons]),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "rez-data-masons",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("keeps productive Data Masons executable when central ICE allocation is unknown", () => {
    resetResidentPlanPortfolioMemory();
    const dataMasons = visibleCard("data-masons", "corp", "asset", {
      definitionId: "onr_v1_317_data-masons",
      title: "Data Masons",
      rezzed: false,
    });
    const rdIce = corpIce("rd-data-wall", "onr_v1_237_data-wall", "Data Wall");
    const installCentralIce = (serverId: "hq" | "rd") =>
      legalAction(
        `install-${serverId}-ice`,
        "corp",
        "install_card",
        `Install Data Wall protecting ${serverId.toUpperCase()}`,
        { credits: serverId === "rd" ? 1 : 0, clicks: 1 },
        {
          source: rdIce.instanceId,
          payload: {
            cardId: rdIce.instanceId,
            serverId,
            placement: "ice",
            postInstallRezQuoteComplete: true,
            postInstallRezQuoteCardId: rdIce.instanceId,
            postInstallRezQuoteTargetServerId: serverId,
            postInstallRezQuoteProjectedServerId: serverId,
            postInstallRezQuoteExpiresAtStateVersion: 1,
            postInstallRezQuoteBaseCredits: 3,
            postInstallRezQuoteFinalCredits: 3,
            postInstallRezQuoteMandatoryAgendaPointCost: 0,
          },
        },
      );
    const input = corpInput([
      rezAction(dataMasons, "rez-data-masons"),
      installCentralIce("hq"),
      installCentralIce("rd"),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
        credits: 0,
        clicks: 1,
      }),
      endTurn(),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [rdIce];
    input.playerView.corpCentralAccessQuotes = ["hq", "rd"].map((serverId) => ({
      serverId: serverId as "hq" | "rd",
      stateVersion: 1,
      complete: true as const,
      effectiveAccessCount: 1,
      isMultiaccess: false,
      sourceDefinitionIds: [],
      serverBoundEffects: [],
    }));
    input.playerView.servers = [
      server("hq", [
        corpIce("installed-wall", "onr_v1_237_data-wall", "Data Wall", true),
      ]),
      server("rd"),
      server("archives"),
      server("remote_1", [], [dataMasons]),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "rez-data-masons",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P5",
        expect.stringContaining(
          "corp_rez_structured_ice_support_matches:installed-wall",
        ),
      ]),
    );
  });

  it("routes Tesseract only for an upcoming ICE encounter on its exact fort", () => {
    resetResidentPlanPortfolioMemory();
    const tesseract = corpUpgrade(
      "tesseract",
      "onr_v1_370_tesseract-fort-construction",
      "Tesseract Fort Construction",
    );
    const input = corpInput(
      [rezAction(tesseract, "rez-tesseract"), declineRez()],
      "run.approach_ice",
    );
    input.playerView.run = activeRun("remote_1", 0);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [corpIce("remote-ice", "onr_v1_237_data-wall", "Data Wall")],
        [tesseract],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "rez-tesseract",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("declines Tesseract after the run has passed the last ICE", () => {
    resetResidentPlanPortfolioMemory();
    const tesseract = corpUpgrade(
      "tesseract",
      "onr_v1_370_tesseract-fort-construction",
      "Tesseract Fort Construction",
    );
    const input = corpInput(
      [rezAction(tesseract, "rez-tesseract"), declineRez()],
      "run.movement_rez_window",
    );
    input.playerView.run = {
      ...activeRun("remote_1", 0),
      phase: "movement",
      position: { kind: "server", serverId: "remote_1" },
    };
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [corpIce("remote-ice", "onr_v1_237_data-wall", "Data Wall", true)],
        [tesseract],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "decline-rez",
      fallbackUsed: false,
    });
  });

  it("routes persistent fort-wide ICE strength support through the exact defended fort", () => {
    resetResidentPlanPortfolioMemory();
    const interfaceRoutines = corpUpgrade(
      "interface-routines",
      "onr_v1_350_antiquated-interface-routines",
      "Antiquated Interface Routines",
    );
    const input = corpInput([
      rezAction(interfaceRoutines, "rez-interface-routines"),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
        credits: 0,
        clicks: 1,
      }),
    ]);
    input.playerView.servers = [
      server(
        "hq",
        [corpIce("hq-ice", "onr_v1_237_data-wall", "Data Wall", true)],
        [interfaceRoutines],
      ),
      server("rd"),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "rez-interface-routines",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "corp_rez_establishes_persistent_exact_fort_ice_strength_support",
        ),
      ]),
    );
  });

  it("selects a productive fort-wide rez action through the global defense allocation", () => {
    resetResidentPlanPortfolioMemory();
    const interfaceRoutines = corpUpgrade(
      "interface-routines",
      "onr_v1_350_antiquated-interface-routines",
      "Antiquated Interface Routines",
    );
    const rdIce = corpIce("rd-data-wall", "onr_v1_237_data-wall", "Data Wall");
    const installRdIce = legalAction(
      "install-rd-ice",
      "corp",
      "install_card",
      "Install Data Wall protecting R&D",
      { credits: 1, clicks: 1 },
      {
        source: rdIce.instanceId,
        payload: {
          cardId: rdIce.instanceId,
          serverId: "rd",
          placement: "ice",
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteCardId: rdIce.instanceId,
          postInstallRezQuoteTargetServerId: "rd",
          postInstallRezQuoteProjectedServerId: "rd",
          postInstallRezQuoteExpiresAtStateVersion: 1,
          postInstallRezQuoteBaseCredits: 3,
          postInstallRezQuoteFinalCredits: 3,
          postInstallRezQuoteMandatoryAgendaPointCost: 0,
        },
      },
    );
    const input = corpInput([
      rezAction(interfaceRoutines, "rez-interface-routines"),
      installRdIce,
      endTurn(),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [rdIce];
    input.playerView.opponent.agendaPoints =
      input.playerView.agendaPointsToWin - 1;
    input.playerView.servers = [
      server(
        "hq",
        [corpIce("hq-ice", "onr_v1_237_data-wall", "Data Wall", true)],
        [interfaceRoutines],
      ),
      server("rd"),
      server("archives"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "rez-interface-routines",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("disposes fort-wide ICE strength support without ICE on its exact fort", () => {
    resetResidentPlanPortfolioMemory();
    const interfaceRoutines = corpUpgrade(
      "interface-routines",
      "onr_v1_350_antiquated-interface-routines",
      "Antiquated Interface Routines",
    );
    const gainCredit = legalAction(
      "gain-credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = corpInput([
      rezAction(interfaceRoutines, "rez-interface-routines"),
      gainCredit,
      endTurn(),
    ]);
    input.playerView.servers = [
      server("hq", [], [interfaceRoutines]),
      server("rd"),
      server("archives"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: gainCredit.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("disposes a fort ICE swap when HQ has no affordable visible improvement", () => {
    resetResidentPlanPortfolioMemory();
    const grid = corpUpgrade(
      "singapore-grid",
      "onr_v1_369_singapore-city-grid",
      "Singapore City Grid",
    );
    grid.rezzed = true;
    const currentIce = corpIce(
      "current-fatal-attractor",
      "onr_v1_242_fatal-attractor",
      "Fatal Attractor",
    );
    currentIce.strength = 4;
    currentIce.rulesText = "Do 3 Net damage.";
    const sameIce = corpIce(
      "hq-fatal-attractor",
      "onr_v1_242_fatal-attractor",
      "Fatal Attractor",
    );
    sameIce.strength = 4;
    sameIce.rulesText = "Do 3 Net damage.";
    const input = corpInput(
      [iceSwapAction(grid), declineRez()],
      "run.approach_ice",
    );
    input.playerView.own.credits = 6;
    input.playerView.own.gripOrHq = [sameIce];
    input.playerView.run = activeRun("hq", 0);
    input.playerView.servers = [
      server("hq", [currentIce], [grid]),
      server("rd"),
      server("archives"),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: "decline-rez",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("declines a fort ICE swap without an engine-certified rez quote", () => {
    resetResidentPlanPortfolioMemory();
    const grid = corpUpgrade(
      "singapore-grid",
      "onr_v1_369_singapore-city-grid",
      "Singapore City Grid",
    );
    grid.rezzed = true;
    const currentIce = corpIce("current-filter", "onr_v1_244_filter", "Filter");
    currentIce.strength = 0;
    currentIce.rulesText = "End the run.";
    const replacementIce = corpIce(
      "hq-data-naga",
      "onr_v1_235_data-naga",
      "Data Naga",
    );
    replacementIce.strength = 5;
    replacementIce.rezCost = 9;
    replacementIce.rulesText = "Trash a program. End the run.";
    const input = corpInput(
      [iceSwapAction(grid), declineRez()],
      "run.approach_ice",
    );
    input.playerView.own.credits = 10;
    input.playerView.own.gripOrHq = [replacementIce];
    input.playerView.run = activeRun("hq", 0);
    input.playerView.servers = [
      server("hq", [currentIce], [grid]),
      server("rd"),
      server("archives"),
    ];

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: "decline-rez",
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:visible_rez_window_decline_without_defense_threat",
      ]),
    );
  });
});

type DrDreffInputParams = {
  attackedServerId: "remote_1" | "remote_2";
  dreffServerId: "remote_1" | "remote_2";
  iceIndex: number;
  hqIce: VisibleCard[];
  credits: number;
};

function drDreffInput(params: DrDreffInputParams): AiDecisionInput {
  const dreff = corpUpgrade("dr-dreff", "onr_v1_358_dr-dreff", "Dr. Dreff");
  const input = corpInput(
    [rezAction(dreff, "rez-dr-dreff"), declineRez()],
    "run.approach_ice",
  );
  input.playerView.own.credits = params.credits;
  input.playerView.own.gripOrHq = params.hqIce;
  input.playerView.run = activeRun(params.attackedServerId, params.iceIndex);
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      [
        corpIce("remote-1-inner", "onr_v1_237_data-wall", "Data Wall", true),
        ...(params.iceIndex > 0
          ? [
              corpIce(
                "remote-1-outer",
                "onr_v1_237_data-wall",
                "Data Wall",
                true,
              ),
            ]
          : []),
      ],
      params.dreffServerId === "remote_1" ? [dreff] : [],
    ),
    server(
      "remote_2",
      [corpIce("remote-2-inner", "onr_v1_237_data-wall", "Data Wall", true)],
      params.dreffServerId === "remote_2" ? [dreff] : [],
    ),
  ];
  return input;
}

function jennyJettInput(params: {
  iceIndex: number;
  installedIceCount: number;
  credits: number;
  quote?: "exact" | "missing";
}): AiDecisionInput {
  const jenny = corpUpgrade("jenny", "onr_v1_359_jenny-jett", "Jenny Jett");
  const hqIce = corpIce(
    "haunting-inquisition",
    "onr_v1_247_haunting-inquisition",
    "Haunting Inquisition",
  );
  const rezJenny = rezAction(jenny, "rez-jenny", 1);
  if (params.quote !== "missing") {
    const totalCredits = 1 + params.installedIceCount;
    rezJenny.payload = {
      ...(rezJenny.payload ?? {}),
      cardImplementationFortRunRezSupportQuoteSchemaVersion:
        "corp-fort-run-rez-support-quote-v1",
      cardImplementationFortRunRezSupportQuoteKind:
        "install_hq_ice_innermost_after_successful_run",
      cardImplementationFortRunRezSupportQuoteComplete: true,
      cardImplementationFortRunRezSupportQuoteSourceCardInstanceId:
        jenny.instanceId,
      cardImplementationFortRunRezSupportQuoteTargetServerId: "remote_1",
      cardImplementationFortRunRezSupportQuoteStateVersion: 1,
      cardImplementationFortRunRezSupportQuoteActionId: rezJenny.actionId,
      cardImplementationFortRunRezSupportQuoteRezCredits: 1,
      cardImplementationFortRunRezSupportQuoteInstallCredits:
        params.installedIceCount,
      cardImplementationFortRunRezSupportQuoteFollowupCredits:
        params.installedIceCount,
      cardImplementationFortRunRezSupportQuoteTotalCredits: totalCredits,
      cardImplementationFortRunRezSupportQuoteTotalCreditsPayable:
        params.credits >= totalCredits,
      cardImplementationFortRunRezSupportQuoteHasOwnHqIce: true,
    };
  }
  const input = corpInput([rezJenny, declineRez()], "run.approach_ice");
  input.playerView.own.credits = params.credits;
  input.playerView.own.gripOrHq = [hqIce];
  input.playerView.run = activeRun("remote_1", params.iceIndex);
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server(
      "remote_1",
      Array.from({ length: params.installedIceCount }, (_entry, index) =>
        corpIce(
          `remote-ice-${index}`,
          "onr_v1_237_data-wall",
          "Data Wall",
          true,
        ),
      ),
      [jenny],
    ),
  ];
  return input;
}

function corpInput(
  actions: LegalAction[],
  timingPoint: PlayerView["timingPoint"] = "corp_action.main",
  stateVersion = 1,
): AiDecisionInput {
  const timedActions = actions.map((action) => ({
    ...action,
    timingPoint,
    expiresAtStateVersion: stateVersion,
  }));
  const input = aiInput("corp", timedActions);
  for (const action of timedActions) {
    action.expiresAtStateVersion = stateVersion;
  }
  input.playerView.stateVersion = stateVersion;
  input.playerView.timingPoint = timingPoint;
  input.playerView.legalActions = timedActions;
  input.legalActions = timedActions;
  return input;
}

function activeRun(
  attackedServerId: "hq" | "remote_1" | "remote_2",
  iceIndex: number,
): NonNullable<PlayerView["run"]> {
  return {
    runId: "corp-rez-contract-run",
    attackedServerId,
    phase: "approach_ice",
    position: {
      kind: "ice",
      serverId: attackedServerId,
      iceIndex,
    },
    successful: false,
  };
}

function corpUpgrade(
  instanceId: string,
  definitionId: string,
  title: string,
): VisibleCard {
  return visibleCard(instanceId, "corp", "upgrade", {
    definitionId,
    title,
    rezzed: false,
  });
}

function corpIce(
  instanceId: string,
  definitionId: string,
  title: string,
  rezzed = false,
): VisibleCard {
  return visibleCard(instanceId, "corp", "ice", {
    definitionId,
    title,
    rezzed,
  });
}

function runnerStealthCreditPool(
  instanceId: string,
  amount: number,
): VisibleCard {
  return visibleCard(instanceId, "runner", "program", {
    definitionId: "onr_v1_011_cloak",
    title: "Visible Stealth Credit Pool",
    subtypes: ["stealth"],
    counterDisplays: [
      {
        id: `${instanceId}-recurring`,
        amount,
        displayKind: "recurring_credit",
        label: "Recurring credits",
        ariaLabel: "Recurring credits",
        creditPool: {
          kind: "recurring_credit",
          uses: ["using_icebreaker_during_run_non_noisy"],
        },
      },
    ],
  });
}

function corpAsset(
  instanceId: string,
  definitionId: string,
  title: string,
): VisibleCard {
  return visibleCard(instanceId, "corp", "asset", {
    definitionId,
    title,
    rezzed: false,
  });
}

function rootRezEconomyInput(
  outcome:
    | "guaranteed"
    | "missing"
    | "runner_interruptible"
    | "nonpositive"
    | "malformed",
): AiDecisionInput {
  const asset = corpAsset(
    "economy-root",
    "simple_economy_asset",
    "Simple Economy Asset",
  );
  const rezCredits = outcome === "nonpositive" ? 3 : 1;
  const rez = legalAction(
    "rez-economy-root",
    "corp",
    "rez_card",
    "Rez Simple Economy Asset",
    { credits: rezCredits },
    {
      source: asset.instanceId,
      payload: {
        cardId: asset.instanceId,
        rootRez: true,
        serverId: "remote_1",
        ...(outcome === "missing"
          ? {}
          : {
              rootRezCreditOutcomeQuoteSchemaVersion:
                "corp-root-rez-credit-outcome-quote-v1",
              rootRezCreditOutcomeQuoteComplete: true,
              rootRezCreditOutcomeQuoteSourceCardInstanceId: asset.instanceId,
              rootRezCreditOutcomeQuoteTargetServerId: "remote_1",
              rootRezCreditOutcomeQuoteStateVersion: 2,
              rootRezCreditOutcomeQuoteTimingPoint: "run.movement_rez_window",
              rootRezCreditOutcomeQuoteActionId:
                outcome === "malformed" ? "stale-action" : "rez-economy-root",
              rootRezCreditOutcomeQuoteResolution:
                outcome === "runner_interruptible"
                  ? "runner_interruptible"
                  : "guaranteed",
              rootRezCreditOutcomeQuoteGrossCreditGain: 3,
              rootRezCreditOutcomeQuoteRezCredits: rezCredits,
              rootRezCreditOutcomeQuoteNetCreditGain: 3 - rezCredits,
            }),
      },
    },
  );
  const input = corpInput([rez, declineRez()], "run.movement_rez_window", 2);
  input.playerView.own.credits = 5;
  input.playerView.run = {
    runId: "root-rez-economy-run",
    attackedServerId: "remote_1",
    phase: "movement",
    position: { kind: "server", serverId: "remote_1" },
    successful: false,
  };
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server("remote_1", [], [asset]),
  ];
  return input;
}

function rezAction(
  card: VisibleCard,
  actionId: string,
  credits = 0,
): LegalAction {
  return legalAction(
    actionId,
    "corp",
    "rez_card",
    `Rez ${card.title}`,
    { credits },
    {
      source: card.instanceId,
      payload: { cardId: card.instanceId },
    },
  );
}

function declineRez(): LegalAction {
  return legalAction(
    "decline-rez",
    "corp",
    "decline_rez",
    "Do not rez",
    { credits: 0 },
    { source: "game_rule" },
  );
}

function iceSwapAction(card: VisibleCard): LegalAction {
  return legalAction(
    "trigger-ice-swap",
    "corp",
    "trigger_ability",
    "Swap unrezzed fort ICE with HQ ICE",
    { credits: 0 },
    {
      source: card.instanceId,
      payload: {
        cardId: card.instanceId,
        serverId: "hq",
        abilityId: "hq_ice_swap",
        effectKind: "hidden_zone",
      },
    },
  );
}

function endTurn(): LegalAction {
  return legalAction(
    "end-turn",
    "corp",
    "end_turn",
    "End turn",
    { credits: 0 },
    { source: "game_rule" },
  );
}

function liveContext() {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 5,
      fundingNeed: true,
      evidence: ["test_visible_funding_need"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  const context = createSemanticRuntimeDecisionContext(dependencies);
  return {
    chooseSemanticRuntimeAction: (
      input: Parameters<typeof context.chooseSemanticRuntimeAction>[0],
      options: Parameters<typeof context.chooseSemanticRuntimeAction>[1],
    ) =>
      context.chooseSemanticRuntimeAction(input, {
        corpTurnPlannerMode: "legacy_compare",
        ...options,
      }),
  };
}
