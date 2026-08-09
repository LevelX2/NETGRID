#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const HINT_PATH = path.join(REPO_ROOT, "data/ai/ai-card-hints-active.json");
const GENERATED_HINT_PATH = path.join(
  REPO_ROOT,
  "data/ai/cs06-ai-hints-generated.json",
);
const MIGRATED_CARD_IDS = new Set(
  JSON.parse(fs.readFileSync(GENERATED_HINT_PATH, "utf8")).cardIds ?? [],
);

const profile = (input) => ({
  class: input.class,
  timing: input.timing,
  recipient: input.recipient,
  restriction: input.restriction ?? "unrestricted",
  reliability: input.reliability,
  sourceResource: input.sourceResource,
  expiresAt: input.expiresAt,
  ...(input.amount !== undefined ? { amount: input.amount } : {}),
  amountKind: input.amountKind ?? "fixed",
  bankable: input.bankable ?? false,
  repeatable: input.repeatable ?? false,
  ...(input.actionTypes ? { actionTypes: input.actionTypes } : {}),
});

const EXACT_PROFILES = new Map(
  Object.entries({
    "onr_v1_117_valu-pak-software-bundle": [
      profile({
        class: "restricted_gain",
        timing: "immediate",
        recipient: "runner",
        restriction: "program_install_only",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 5,
        actionTypes: ["install_card"],
      }),
    ],
    "onr_v1_171_preying-mantis": [
      profile({
        class: "recurring_gain",
        timing: "immediate",
        recipient: "runner",
        reliability: "conditional",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_v1_172_quest-for-cattekin": [
      profile({
        class: "random_gain",
        timing: "start_of_turn",
        recipient: "runner",
        restriction: "random_action",
        reliability: "random",
        sourceResource: "die_roll",
        expiresAt: "persistent",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_v1_187_wilson-weeflerunner-apprentice": [
      profile({
        class: "restricted_gain",
        timing: "immediate",
        recipient: "runner",
        restriction: "run_only",
        reliability: "conditional",
        sourceResource: "source_card",
        expiresAt: "resolution",
        amount: 1,
        repeatable: true,
        actionTypes: ["start_run"],
      }),
    ],
    "onr_v1_192_corporate-boon": [
      profile({
        class: "finite_bank",
        timing: "scored_activated",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "counter",
        expiresAt: "source_leaves_play",
        amount: 1,
        bankable: true,
        repeatable: true,
      }),
    ],
    "onr_v1_218_subsidiary-branch": [
      profile({
        class: "recurring_gain",
        timing: "start_of_turn",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "source_leaves_play",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_v1_289_edgerunner-inc-temps": [
      profile({
        class: "restricted_gain",
        timing: "immediate",
        recipient: "corp",
        restriction: "install_only",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 3,
        actionTypes: ["install_card"],
      }),
    ],
    "onr_v1_297_overtime-incentives": [
      profile({
        class: "immediate_gain",
        timing: "immediate",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 2,
      }),
    ],
    onr_v1_331_nevinyrral: [
      profile({
        class: "recurring_gain",
        timing: "start_of_turn",
        recipient: "corp",
        reliability: "conditional",
        sourceResource: "source_card",
        expiresAt: "source_leaves_play",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_v1_334_pacifica-regional-ai": [
      profile({
        class: "finite_bank",
        timing: "immediate",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "advancement_counter",
        expiresAt: "source_leaves_play",
        amount: 1,
        bankable: true,
        repeatable: true,
      }),
    ],
    "onr_v1_335_remote-facility": [
      profile({
        class: "immediate_gain",
        timing: "on_rez",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "side_turn_end",
        amount: 1,
      }),
      profile({
        class: "recurring_gain",
        timing: "start_of_turn",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "source_card",
        expiresAt: "source_leaves_play",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_proteus_001_ai-board-member": [
      profile({
        class: "random_gain",
        timing: "start_of_turn",
        recipient: "corp",
        restriction: "random_action",
        reliability: "random",
        sourceResource: "die_roll",
        expiresAt: "side_turn_end",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_proteus_006_please-dont-choke-anyone": [
      profile({
        class: "finite_bank",
        timing: "scored_activated",
        recipient: "corp",
        reliability: "conditional",
        sourceResource: "damage_counter",
        expiresAt: "source_leaves_play",
        amount: 1,
        bankable: true,
        repeatable: true,
      }),
    ],
    "onr_proteus_007_project-venice": [
      profile({
        class: "recurring_gain",
        timing: "start_of_turn",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "overadvance_counter",
        expiresAt: "source_leaves_play",
        amountKind: "dynamic",
        repeatable: true,
      }),
    ],
    "onr_proteus_046_corporate-guard-r-temps": [
      profile({
        class: "future_recurring_gain",
        timing: "future_turn_start",
        recipient: "corp",
        reliability: "guaranteed",
        sourceResource: "credits_x",
        expiresAt: "duration_end",
        amount: 1,
      }),
    ],
    "onr_proteus_099_viral-pipeline": [
      profile({
        class: "action_cost",
        timing: "persistent",
        recipient: "corp",
        restriction: "purge_only",
        reliability: "conditional",
        sourceResource: "virus_state",
        expiresAt: "resolution",
        amount: 3,
        repeatable: true,
        actionTypes: ["purge_virus_counters"],
      }),
      profile({
        class: "action_loss",
        timing: "start_of_turn",
        recipient: "corp",
        reliability: "conditional",
        sourceResource: "virus_state",
        expiresAt: "side_turn_end",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_proteus_131_bargain-with-viacox": [
      profile({
        class: "mandatory_gain",
        timing: "start_of_turn",
        recipient: "runner",
        restriction: "mandatory_random_action",
        reliability: "mandatory",
        sourceResource: "die_roll",
        expiresAt: "resolution",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_proteus_144_lucidrinetm-drip-feed": [
      profile({
        class: "recurring_gain",
        timing: "start_of_turn",
        recipient: "runner",
        reliability: "conditional",
        sourceResource: "counter",
        expiresAt: "side_turn_end",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_classic_051_vintage-camaro": [
      profile({
        class: "action_debt",
        timing: "prevention_window",
        recipient: "runner",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "debt_paid",
        amount: 1,
        repeatable: true,
      }),
    ],
    "onr_v1_022_emergency-self-construct": [
      profile({
        class: "action_loss",
        timing: "persistent",
        recipient: "runner",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "persistent",
        amount: 1,
      }),
    ],
    "onr_v1_078_arasaka-owns-you": [
      profile({
        class: "action_debt",
        timing: "prevention_window",
        recipient: "runner",
        reliability: "guaranteed",
        sourceResource: "replacement_effect",
        expiresAt: "debt_paid",
        amount: 4,
      }),
    ],
    "onr_v1_271_tko-2-0": [
      profile({
        class: "action_loss",
        timing: "encounter",
        recipient: "runner",
        reliability: "conditional",
        sourceResource: "encounter_effect",
        expiresAt: "side_turn_end",
        amount: 1,
        repeatable: true,
      }),
    ],
  }),
);

function inferredProfiles(card) {
  const profiles = [];
  for (const effect of card.effects ?? []) {
    if (effect.kind === "delayed_penalty" && effect.resource === "actions") {
      profiles.push(
        profile({
          class: "action_cost",
          timing: "persistent",
          recipient: effect.scope,
          restriction: "purge_only",
          reliability: "conditional",
          sourceResource: "virus_state",
          expiresAt: "resolution",
          amount: Math.abs(effect.amount ?? 0),
          repeatable: true,
          actionTypes: ["purge_virus_counters"],
        }),
      );
      continue;
    }
    if (effect.kind === "run_lock" && effect.resource === "actions") {
      profiles.push(
        profile({
          class: "action_lock",
          timing: "encounter",
          recipient: effect.scope,
          restriction: "run_only",
          reliability: "conditional",
          sourceResource: "encounter_effect",
          expiresAt: "resolution",
          amountKind: "dynamic",
          repeatable: true,
          actionTypes: ["start_run"],
        }),
      );
      continue;
    }
    if (
      effect.kind === "action_penalty" &&
      (effect.resource === "actions" || effect.target === "action_loss")
    ) {
      profiles.push(
        profile({
          class: "action_loss",
          timing: effect.timing === "encounter" ? "encounter" : "persistent",
          recipient: effect.scope,
          reliability: "conditional",
          sourceResource: "source_card",
          expiresAt:
            effect.timing === "persistent" ? "persistent" : "side_turn_end",
          ...(typeof effect.amount === "number"
            ? { amount: Math.abs(effect.amount) }
            : { amountKind: "dynamic" }),
          repeatable: effect.timing === "persistent",
        }),
      );
      continue;
    }
    if (
      effect.kind !== "extra_action" &&
      !(effect.kind === "action_economy" && effect.resource === "actions")
    )
      continue;
    const signals = [
      ...(card.tacticSignals ?? []),
      ...(card.riskTags ?? []),
    ].join(" ");
    const random = /random/.test(`${effect.target ?? ""} ${signals}`);
    const mandatory = /mandatory/.test(`${effect.target ?? ""} ${signals}`);
    const restriction = /install_only/.test(signals)
      ? "install_only"
      : /run_only|extra_run_action/.test(`${effect.target ?? ""} ${signals}`)
        ? "run_only"
        : random
          ? "random_action"
          : "unrestricted";
    const recurring = ["start_of_turn", "corp_turn", "persistent"].includes(
      effect.timing,
    );
    profiles.push(
      profile({
        class: mandatory
          ? "mandatory_gain"
          : random
            ? "random_gain"
            : recurring
              ? "recurring_gain"
              : restriction !== "unrestricted"
                ? "restricted_gain"
                : "immediate_gain",
        timing:
          effect.timing === "start_of_turn" ||
          effect.timing === "corp_turn" ||
          effect.timing === "persistent"
            ? "start_of_turn"
            : effect.timing === "scored_activated"
              ? "scored_activated"
              : "immediate",
        recipient: effect.scope,
        restriction,
        reliability: mandatory
          ? "mandatory"
          : random
            ? "random"
            : "conditional",
        sourceResource: random ? "die_roll" : "source_card",
        expiresAt: recurring ? "source_leaves_play" : "side_turn_end",
        ...(typeof effect.amount === "number"
          ? { amount: Math.abs(effect.amount) }
          : { amountKind: random ? "random" : "dynamic" }),
        repeatable: recurring || effect.repeatable === true,
        ...(restriction === "install_only"
          ? { actionTypes: ["install_card"] }
          : restriction === "run_only"
            ? { actionTypes: ["start_run"] }
            : {}),
      }),
    );
  }
  return profiles;
}

function normalizeHints(data) {
  for (const card of data.cards ?? [])
    if (MIGRATED_CARD_IDS.has(card.cardId))
      throw new Error(
        `Raw action-capacity normalizer cannot own migrated CardSpec hint ${card.cardId}.`,
      );
  for (const cardId of EXACT_PROFILES.keys())
    if (MIGRATED_CARD_IDS.has(cardId))
      throw new Error(
        `Raw action-capacity profile cannot target migrated CardSpec hint ${cardId}.`,
      );
  for (const card of data.cards ?? []) {
    const profiles = EXACT_PROFILES.get(card.cardId) ?? inferredProfiles(card);
    if (profiles.length > 0) card.actionCapacityProfiles = profiles;
    else delete card.actionCapacityProfiles;
  }

  const pacifica = data.cards.find(
    (card) => card.cardId === "onr_v1_334_pacifica-regional-ai",
  );
  const pacificaAction = pacifica?.effects?.find(
    (effect) => effect.kind === "extra_action",
  );
  if (pacificaAction) {
    pacificaAction.amount = 1;
    pacificaAction.finite = true;
    pacificaAction.repeatable = true;
    pacificaAction.resource = "actions";
  }

  const arasaka = data.cards.find(
    (card) => card.cardId === "onr_v1_078_arasaka-owns-you",
  );
  const arasakaAction = arasaka?.effects?.find(
    (effect) => effect.kind === "action_penalty",
  );
  if (arasakaAction) {
    arasakaAction.amount = 4;
    arasakaAction.resource = "actions";
  }

  return data;
}

const original = fs.readFileSync(HINT_PATH, "utf8");
const normalized = `${JSON.stringify(normalizeHints(JSON.parse(original)), null, 2)}\n`;

if (process.argv.includes("--check")) {
  if (normalized !== original) {
    console.error(
      "Action-capacity hints are not normalized. Run normalize:ai-action-capacity-hints.",
    );
    process.exitCode = 1;
  }
} else {
  fs.writeFileSync(HINT_PATH, normalized, "utf8");
}
