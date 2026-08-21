import { capabilityKey, cardDefinitionId, type CardSpec } from "../..";

const fortActivityGate = capabilityKey("fort_activity_gate");

export const cardSpec = {
  schemaVersion: "card-spec-v1",
  identity: {
    cardDefinitionId: cardDefinitionId("onr_v1_368_roving-submarine"),
    title: "Roving Submarine",
    side: "corp",
    cardType: "upgrade",
  },
  text: {
    schemaVersion: "canonical-card-text-v1",
    rulesText:
      "Install only inside a subsidiary data fort. This fort may be run only if you installed or advanced a card inside or on this fort during your last turn.\nRez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.",
  },
  rules: {
    schemaVersion: "card-rules-v1",
    references: [
      { source: "card_text", reference: "onr_v1_368_roving-submarine" },
    ],
  },
  engine: {
    schemaVersion: "card-mechanical-spec-v1",
    characteristics: {
      faction: "onr1996_neutral",
      subtypes: ["region"],
      numeric: {
        installCost: null,
        memoryCost: null,
        rezCost: 3,
        trashCost: 0,
        advancementRequirement: null,
        agendaPoints: null,
      },
      playCost: null,
      strength: { kind: "not_applicable" },
    },
    installCapabilities: [
      {
        kind: "install_only_inside_subsidiary_data_fort",
        visibility: "public",
      },
      {
        kind: "rez_on_install",
        installOnlyIfRezAffordable: true,
        visibility: "public",
      },
    ],
    fortRunWindows: [
      {
        capabilityKey: fortActivityGate,
        addressability: ["plan", "quote", "debug"],
        kind: "server_run_start_restriction",
        timing: "run_start_legal",
        target: "source_fort",
        condition:
          "corp_installed_or_advanced_on_target_server_during_latest_corp_turn",
        visibility: "public",
      },
    ],
  },
  planningAnnotations: {
    schemaVersion: "card-planning-annotations-v1",
    card: [
      { kind: "strategy_anchor", strategyKey: "corp.remote_scoring" },
      {
        kind: "line_support",
        lineKey: "corp.remote_scoring",
        support: "supports",
      },
      { kind: "strategic_role", role: "defensive_tool" },
      { kind: "plan_role", role: "remote_upgrade_agenda_support" },
      {
        kind: "remote_role",
        role: "scoring_protection",
        threatLevel: "medium",
      },
      {
        kind: "strategy_support",
        strategyKey: "corp.remote_scoring",
        role: "defensive_tool",
        roleDetail: "conditional_server_lock",
        confidence: "medium",
        rationale:
          "Conditional run lock can protect a dormant or staged remote.",
      },
      {
        kind: "value_interpretation",
        axis: "remote_root_value",
        rating: "low",
      },
    ],
  },
  printings: [
    {
      schemaVersion: "printing-spec-v1",
      printingId: "onr_v1_368_roving-submarine",
      setId: "originalset-v1",
      collectorNumber: "368",
      rarity: "rare",
    },
  ],
  publication: { schemaVersion: "card-publication-v1", status: "active" },
} satisfies CardSpec;
