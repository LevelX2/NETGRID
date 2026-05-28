import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import prettier from "prettier";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REVIEW_DATE = "2026-05-25";
const SCHEMA_VERSION = "ai-generated-fact-migration-priority-v1";
const COMPILED_INDEX_REPORT_PATH =
  "docs/reviews/ai/ai-hint-compiled-index-pilot-report-2026-05-25.json";
const DERIVED_FACTS_REPORT_PATH =
  "docs/reviews/ai/ai-derived-basic-facts-gate-2026-05-25.json";
const PILOT_CARDS_PATH =
  "data/ai/ai-derived-basic-facts-pilot-cards-2026-05-25.json";
const ACTIVE_HINTS_PATH = "data/ai/ai-card-hints-active.json";
const OVERLAY_PATHS = [
  "data/ai/hints/overlays/onr-v1/corp/upgrades.json",
  "data/ai/hints/overlays/onr-v1/runner/programs.json",
];
const DEFAULT_REPORT_PATH =
  "docs/reviews/ai/ai-generated-fact-migration-priority-report-2026-05-25.json";

const MECHANICAL_FIELDS = [
  "effects",
  "conditions",
  "costProfile",
  "breakerProfile",
  "remoteRole",
  "targetProfiles",
];

const BATCH7_CORP_ICE_PRIORITY_POLICY = Object.fromEntries(
  [
    [
      "onr_v1_222_ball-and-chain",
      "Run-duration encounter tax is derivable, but actual path cost remains effectiveRunQuote/LegalAction context.",
    ],
    [
      "onr_v1_225_canis-major",
      "Run-duration ICE-strength modifier is derivable, but concrete break cost remains board and encounter context.",
    ],
    [
      "onr_v1_226_canis-minor",
      "Run-duration ICE-strength modifier is derivable, but concrete break cost remains board and encounter context.",
    ],
    [
      "onr_v1_224_bolter-cluster",
      "Damage plus next-ICE break prohibition is derivable, with later-encounter/runpath context required.",
    ],
    [
      "onr_v1_258_neural-blade",
      "Damage plus next-ICE break prohibition is derivable, with later-encounter/runpath context required.",
    ],
    [
      "onr_v1_268_shock-r",
      "Next-ICE break/jack-out restriction is derivable, but must not become current ICE self-safety.",
    ],
    [
      "onr_v1_243_fetch-4-0-1",
      "Trace-to-tag ICE subroutine is derivable, with trace success remaining runtime context.",
    ],
    [
      "onr_v1_249_hunter",
      "Trace-to-tag ICE subroutine is derivable, with trace success remaining runtime context.",
    ],
    [
      "onr_v1_236_data-raven",
      "Trace-to-tag plus hosted counter punishment is derivable, but generated facts cannot assert current counter state.",
    ],
    [
      "onr_v1_223_banpei",
      "Program-trash plus ETR subroutines are derivable, while target selection remains encounter context.",
    ],
    [
      "onr_v1_228_cinderella",
      "Trace-success hardware trash, unpreventable meat damage and ETR are derivable with trace/prevention context.",
    ],
    [
      "onr_v1_231_cortical-scrub",
      "Damage plus ETR are derivable, while the legacy active hint shape requires read-only normalization.",
    ],
    [
      "onr_v1_227_cerberus",
      "Damage, trace/counter context and ETR are derivable, but no current counter state is generated.",
    ],
    [
      "onr_v1_235_data-naga",
      "Program-trash plus ETR subroutines are derivable, while target selection remains encounter context.",
    ],
    [
      "onr_v1_242_fatal-attractor",
      "Next-encounter damage-unless-fully-break effect is derivable and runpath-context dependent.",
    ],
    [
      "onr_v1_251_jack-attack",
      "No-jack-out plus trace-to-tag mechanics are derivable, while actual run choices stay runtime-owned.",
    ],
    [
      "onr_v1_255_mastiff",
      "Damage, strength modifier, trace/counter context and ETR are derivable with encounter and effectiveRunQuote context.",
    ],
    [
      "onr_v1_234_data-darts",
      "Damage plus next-ICE break prohibition is derivable, with later-encounter/runpath context required.",
    ],
    [
      "onr_v1_260_pocket-virtual-reality",
      "Trace-to-tag and trace-only credits are derivable, while trace bidding remains LegalAction/engine context.",
    ],
    [
      "onr_v1_246_fragmentation-storm",
      "Trace-success program trash/run-lock plus ETR are derivable, while target and action-payment context stays runtime-owned.",
    ],
    [
      "onr_v1_248_homewrecker",
      "Trace-success hardware trash, unpreventable meat damage and ETR are derivable with trace/prevention context.",
    ],
    [
      "onr_v1_221_asp",
      "Trace-success run-lock plus ETR are derivable, while no action legality is generated.",
    ],
    [
      "onr_v1_240_fang",
      "Trace-success run-lock plus ETR are derivable, while no action legality is generated.",
    ],
    [
      "onr_v1_241_fang-2-0",
      "Trace-success run-lock plus ETR are derivable, while no action legality is generated.",
    ],
  ].map(([cardId, rationale]) => [
    cardId,
    {
      migrationPriority: "P1",
      migrationRisk: "medium",
      fieldCategories: [
        "safe_generated_now",
        "generated_with_board_context",
        "generated_with_descriptor_limitations",
        "legacy_keep_for_compat",
      ],
      recommendedMigrationBatch: 7,
      rationale,
    },
  ]),
);

const BATCH8_CORP_ECONOMY_PRIORITY_POLICY = Object.fromEntries(
  [
    [
      "onr_v1_300_project-consultants",
      "Advance-burst counters are derivable, but target legality and score-conversion timing remain LegalAction and board context.",
    ],
    [
      "onr_v1_298_planning-consultants",
      "R&D top reorder is derivable as hidden-zone context without generated hidden order.",
    ],
    [
      "onr_v1_304_systematic-layoffs",
      "Advance-burst counters are derivable, but target legality and score-conversion timing remain LegalAction and board context.",
    ],
    [
      "onr_v1_305_team-restructuring",
      "Advancement-counter distribution is derivable, but concrete score windows remain engine/board context.",
    ],
    [
      "onr_v1_295_night-shift",
      "Operation economy and draw are mechanically derivable and low ambiguity.",
    ],
    [
      "onr_v1_297_overtime-incentives",
      "Operation extra actions are derivable, while action use remains LegalAction context.",
    ],
    [
      "onr_v1_296_off-site-backups",
      "Archives-to-HQ recovery is derivable, but hidden card identities remain runtime-only.",
    ],
    [
      "onr_v1_303_silver-lining-recovery-protocol",
      "Variable recovery economy is derivable, with prior stolen-agenda counters remaining history context.",
    ],
    [
      "onr_v1_194_corporate-downsizing",
      "HQ-agenda reveal economy is derivable, but generated facts cannot contain hidden HQ agenda identity.",
    ],
    [
      "onr_v1_196_corporate-war",
      "Threshold-gated credit swing is derivable, while current credit state remains board context.",
    ],
    [
      "onr_v1_203_hostile-takeover",
      "When-scored credit gain is deterministic and low-risk.",
    ],
    [
      "onr_v1_212_priority-requisition",
      "When-scored free ICE rez is derivable, with target selection and rez legality staying engine-owned.",
    ],
    [
      "onr_v1_216_security-purge",
      "R&D top reveal/install/rez effect is derivable as hidden-zone context without generated R&D order.",
    ],
    [
      "onr_v1_197_data-fort-reclamation",
      "Temporary credits plus HQ-based remote build are derivable, while hidden HQ choice remains LegalAction context.",
    ],
    [
      "onr_v1_219_superior-net-barriers",
      "Wall strength and reveal-for-credits effects are derivable, but board/rezzed state remains context.",
    ],
    [
      "onr_v1_200_encryption-breakthrough",
      "Code-gate strength and reveal-for-credits effects are derivable, but board/rezzed state remains context.",
    ],
    [
      "onr_v1_211_polymer-breakthrough",
      "Start-of-turn credit economy is derivable, with score/persistence context explicit.",
    ],
    [
      "onr_v1_218_subsidiary-branch",
      "Start-of-turn action gain is derivable, with concrete action use staying LegalAction context.",
    ],
    [
      "onr_v1_206_marine-arcology",
      "Scored-agenda economy action is already mechanical and remains score-area LegalAction gated.",
    ],
    [
      "onr_v1_188_ai-chief-financial-officer",
      "Shuffle/draw score-area effect is derivable without hidden HQ, Archives or R&D order data.",
    ],
    [
      "onr_v1_204_ice-transmutation",
      "Rezzed-ICE modifier is derivable, but target selection and board state remain context.",
    ],
    [
      "onr_v1_215_security-net-optimization",
      "Fort ICE strength modifier is derivable, with selected-server board context explicit.",
    ],
    [
      "onr_v1_190_bioweapons-engineering",
      "Persistent meat-damage modifier is derivable, while concrete damage resolution remains engine context.",
    ],
    [
      "onr_v1_191_black-ice-quality-assurance",
      "Black-ICE strength modifier is derivable, while active scored state remains board context.",
    ],
    [
      "onr_v1_189_artificial-security-directors",
      "Agenda-difficulty modifier is derivable as score-conversion support, not score_now strategy.",
    ],
    [
      "onr_v1_201_executive-extraction",
      "Agenda-difficulty modifier is derivable as score-conversion support, not score_now strategy.",
    ],
    [
      "onr_v1_202_genetics-visionary-acquisition",
      "Agenda-difficulty modifier is derivable as score-conversion support, not score_now strategy.",
    ],
    [
      "onr_v1_195_corporate-retreat",
      "Score-area economy action is derivable, while disable-on-install/rez state remains engine context.",
    ],
    [
      "onr_v1_198_detroit-police-contract",
      "Finite hosted credit pool and start-turn payout are derivable, with remaining pool state engine-owned.",
    ],
    [
      "onr_v1_209_political-coup",
      "Finite hosted credit pool and score-area payout are derivable, with remaining pool state engine-owned.",
    ],
  ].map(([cardId, rationale]) => [
    cardId,
    {
      migrationPriority: "P1",
      migrationRisk: "medium",
      fieldCategories: [
        "safe_generated_now",
        "generated_with_board_context",
        "generated_with_descriptor_limitations",
        "legacy_keep_for_compat",
      ],
      recommendedMigrationBatch: 8,
      rationale,
    },
  ]),
);

const BATCH9_CORP_NODES_PRIORITY_POLICY = Object.fromEntries(
  [
    [
      "onr_v1_308_acme-savings-and-loan",
      "Remote economy/debt context is derivable, while current credit and debt state remain board-owned.",
    ],
    [
      "onr_v1_309_bbs-whispering-campaign",
      "Finite hosted economy pool is derivable, while remaining credits stay board-owned.",
    ],
    [
      "onr_v1_311_braindance-campaign",
      "Finite/start-turn hosted economy is derivable, while remaining credits stay board-owned.",
    ],
    [
      "onr_v1_310_blood-cat",
      "Trace-to-tag node mechanics are derivable, with trace success staying runtime context.",
    ],
    [
      "onr_v1_313_city-surveillance",
      "Runner-draw payment-or-tag pressure is derivable, but no guaranteed tag is generated.",
    ],
    [
      "onr_v1_314_corporate-negotiating-center",
      "Remote support context is derivable only as board/LegalAction-gated utility.",
    ],
    [
      "onr_v1_315_corprunners-shattered-remains",
      "Advanceable hardware-trash ambush is derivable, with access and counter context explicit.",
    ],
    [
      "onr_v1_354_crybaby",
      "On-access counter/link penalty ambush is derivable without asserting current counter state.",
    ],
    [
      "onr_v1_321_esa-contract",
      "Remote draw utility is derivable, while use timing remains LegalAction context.",
    ],
    [
      "onr_v1_322_euromarket-consortium",
      "Draw and hand-size support are derivable, with rezzed board context explicit.",
    ],
    [
      "onr_v1_323_experimental-ai",
      "Advanceable program-trash ambush is derivable, with access and counter context explicit.",
    ],
    [
      "onr_v1_324_fortress-architects",
      "ICE install discount is derivable, with rezzed board context explicit.",
    ],
    [
      "onr_v1_325_hacker-tracker-central",
      "Trace-credit support is derivable, while trace bidding and current pool state remain runtime context.",
    ],
    [
      "onr_v1_326_holovid-campaign",
      "Finite/start-turn hosted economy is derivable, while remaining credits stay board-owned.",
    ],
    [
      "onr_v1_327_i-got-a-rock",
      "Tagged-runner damage payoff is derivable, with runner-tagged and damage-resolution context explicit.",
    ],
    [
      "onr_v1_328_information-laundering",
      "Advanceable counter-to-credit economy is derivable, with variable amount context explicit.",
    ],
    [
      "onr_v1_329_investment-firm",
      "Credit-diversion pool and recurring payout are derivable, while current pool state remains board-owned.",
    ],
    [
      "onr_v1_332_newsgroup-taunting",
      "Run-start payment tax is derivable, but concrete remote safety remains run/board context.",
    ],
    [
      "onr_v1_333_omniscience-foundation",
      "Tag amplification is derivable, with runner-tagged context explicit.",
    ],
    [
      "onr_v1_334_pacifica-regional-ai",
      "Advancement-counter action gain is derivable, while action use remains LegalAction context.",
    ],
    [
      "onr_v1_335_remote-facility",
      "Start-turn action gain/remote capacity is derivable, with board context explicit.",
    ],
    [
      "onr_v1_336_rescheduler",
      "HQ shuffle/draw utility is derivable as hidden-zone context without hidden identities.",
    ],
    [
      "onr_v1_337_rockerboy-promotion",
      "Hosted action economy pool is derivable, while remaining credits stay board-owned.",
    ],
    [
      "onr_v1_338_rustbelt-hq-branch",
      "Corp hand-size support is derivable, with rezzed board context explicit.",
    ],
    [
      "onr_v1_339_schlaghund",
      "Tagged-runner damage payoff is derivable, with runner-tagged/random outcome context explicit.",
    ],
    [
      "onr_v1_340_setup",
      "On-access damage ambush is derivable, with access context explicit.",
    ],
    [
      "onr_v1_342_solo-squad",
      "Tagged-runner damage action is derivable, with runner-tagged and LegalAction context explicit.",
    ],
    [
      "onr_v1_343_south-african-mining-corp",
      "Action economy is derivable, while action use remains LegalAction context.",
    ],
    [
      "onr_v1_344_spinn-public-relations",
      "Hosted start-turn/action economy pool is derivable, while remaining credits stay board-owned.",
    ],
    [
      "onr_v1_287_datapool-by-zetatech",
      "Tagged-runner tag operation is derivable, while playability remains LegalAction context.",
    ],
    [
      "onr_v1_293_netwatch-credit-voucher",
      "Tagged-runner tag plus economy is derivable, while playability remains LegalAction context.",
    ],
    [
      "onr_v1_286_corporate-detective-agency",
      "Tagged-runner resource trash is derivable, with target selection staying runtime-owned.",
    ],
    [
      "onr_v1_299_power-grid-overload",
      "Tagged-runner hardware trash is derivable, with target selection staying runtime-owned.",
    ],
    [
      "onr_v1_307_urban-renewal",
      "Tagged-runner meat damage is derivable, while damage resolution remains engine-owned.",
    ],
    [
      "onr_v1_306_trojan-horse",
      "Tagged-runner punish operation is derivable, while playability remains LegalAction context.",
    ],
    [
      "onr_v1_294_new-blood",
      "Conceal/reorder installed ICE is derivable as hidden-zone context only.",
    ],
    [
      "onr_v1_316_cowboy-sysop",
      "Installed-card-to-HQ utility is derivable as hidden-zone context only.",
    ],
    [
      "onr_v1_368_roving-submarine",
      "Remote run-window restriction is derivable, but current run legality stays engine-owned.",
    ],
    [
      "onr_v1_362_new-galveston-city-grid",
      "Asset/upgrade trash-cost tax is derivable, with access/trash context explicit.",
    ],
    [
      "onr_v1_360_jerusalem-city-grid",
      "Fort wall rez discount/strength support is derivable, with rezzed board context explicit.",
    ],
    [
      "onr_v1_369_singapore-city-grid",
      "Fort ICE swap is derivable as run/hidden-zone context only.",
    ],
    [
      "onr_v1_352_chester-mix",
      "Fort ICE install discount is derivable, with rezzed board context explicit.",
    ],
    [
      "onr_v1_364_omni-kismet-ph-d",
      "Fort ICE swap is derivable as run/hidden-zone context only.",
    ],
    [
      "onr_v1_358_dr-dreff",
      "Temporary HQ-ICE encounter is derivable as run/hidden-zone context only.",
    ],
    [
      "onr_v1_346_vacant-soulkiller",
      "Advanceable damage ambush is derivable, with access and counter context explicit.",
    ],
  ].map(([cardId, rationale]) => [
    cardId,
    {
      migrationPriority: "P1",
      migrationRisk: "medium",
      fieldCategories: [
        "safe_generated_now",
        "generated_with_board_context",
        "generated_with_descriptor_limitations",
        "legacy_keep_for_compat",
      ],
      recommendedMigrationBatch: 9,
      rationale,
    },
  ]),
);

const BATCH10_RUNNER_SURVIVAL_PRIORITY_POLICY = Object.fromEntries(
  [
    [
      "onr_v1_004_bakdoor",
      "Base-link and link boost mechanics are derivable, but actual trace outcome remains LegalAction/trace-window context.",
    ],
    [
      "onr_v1_022_emergency-self-construct",
      "Flatline replacement, brain-damage cleanup and persistent penalties are derivable, but generated facts cannot assert current flatline safety.",
    ],
    [
      "onr_v1_023_evil-twin",
      "Sentry breaker and net/brain prevention are derivable as separate facts, with break/prevention legality remaining runtime-owned.",
    ],
    [
      "onr_v1_028_force-shield",
      "Per-turn net/brain damage prevention is derivable, with damage/prevention window and turn-limit context explicit.",
    ],
    [
      "onr_v1_038_joan-of-arc",
      "Program-trash prevention is derivable, scoped to other installed programs with payment/window context retained.",
    ],
    [
      "onr_v1_051_rabbit",
      "Trace-limit reduction is derivable as trace defense, but does not guarantee trace success.",
    ],
    [
      "onr_v1_061_shield",
      "Per-turn net damage prevention is derivable, with damage/prevention window and turn-limit context explicit.",
    ],
    [
      "onr_v1_063_signpost",
      "Post-bid link boost is derivable as trace defense, while actual trace outcome remains engine-owned.",
    ],
    [
      "onr_v1_079_bodyweight-synthetic-blood",
      "Burst draw is derivable as hand-refill support without hidden stack identity.",
    ],
    [
      "onr_v1_116_total-genetic-retrofit",
      "Tag removal and next-tag avoidance are derivable, with tagged-runner and prevention-window context retained.",
    ],
    [
      "onr_v1_133_militech-mram-chip",
      "Installed hand-size increase is derivable as survival context without hidden hand contents.",
    ],
    [
      "onr_v1_134_mram-chip",
      "Installed hand-size increase is derivable as survival context without hidden hand contents.",
    ],
    [
      "onr_v1_135_nasuko-cycle",
      "Paid tag avoidance is derivable, with prevention-window and payment context retained.",
    ],
    [
      "onr_v1_157_crash-everett-inventive-fixer",
      "Extra draw and choose-trash/top replacement are derivable without hidden stack or grip identity.",
    ],
    [
      "onr_v1_161_fall-guy",
      "Trash-to-avoid-tag is derivable, with prevention-window and cost context retained.",
    ],
  ].map(([cardId, rationale]) => [
    cardId,
    {
      migrationPriority: "P1",
      migrationRisk: "medium",
      fieldCategories: [
        "safe_generated_now",
        "generated_with_board_context",
        "generated_with_descriptor_limitations",
        "legacy_keep_for_compat",
      ],
      recommendedMigrationBatch: 10,
      rationale,
    },
  ]),
);

const BATCH11_TAG_PUNISH_PRIORITY_POLICY = Object.fromEntries(
  [
    [
      "onr_v1_213_private-cybernet-police",
      "Scored agenda Trace 5 into tag source is derivable, but trace success and score-area action legality remain engine/LegalAction context.",
    ],
    [
      "onr_v1_301_punitive-counterstrike",
      "Tagged-runner meat-damage payoff is derivable, but visible tag state, prevention and playability remain LegalAction/board context.",
    ],
  ].map(([cardId, rationale]) => [
    cardId,
    {
      migrationPriority: "P1",
      migrationRisk: "medium",
      fieldCategories: [
        "safe_generated_now",
        "generated_with_board_context",
        "generated_with_descriptor_limitations",
        "legacy_keep_for_compat",
      ],
      recommendedMigrationBatch: 11,
      rationale,
    },
  ]),
);

const BATCH12_RUNNER_ECONOMY_PRIORITY_POLICY = Object.fromEntries(
  [
    [
      "onr_v1_045_newsgroup-filter",
      "Activated Runner credit gain is derivable action economy, but click availability and action choice remain LegalAction/consumer context.",
    ],
    [
      "onr_v1_087_forgotten-backup-chip",
      "Trash-to-grip program recovery is derivable by zone/target class, but generated facts must not expose hidden heap or grip identity.",
    ],
    [
      "onr_v1_089_gideons-pawnshop",
      "Trash-to-grip recovery is derivable by zone/target class, but generated facts must not expose hidden heap or grip identity.",
    ],
    [
      "onr_v1_093_if-you-want-it-done-right",
      "Top-stack selection is derivable as search/topdeck context, but hidden stack order and card identity remain hidden-zone context.",
    ],
    [
      "onr_v1_095_jack-n-joe",
      "Burst draw is mechanically derivable, while actual hand value remains hidden state and setup valuation remains strategy/consumer context.",
    ],
    [
      "onr_v1_097_livewires-contacts",
      "Burst Runner credit gain is mechanically derivable, while tempo valuation remains strategy/consumer context.",
    ],
    [
      "onr_v1_099_mantis-fixer-at-large",
      "Stack-to-grip search is derivable by zone/target class, but generated facts must not expose hidden stack order or card identity.",
    ],
    [
      "onr_v1_103_organ-donor",
      "Grip-trash economy is derivable as gain-per-trashed-card, but downside, hand quality and hidden grip identity remain context.",
    ],
    [
      "onr_v1_108_score",
      "Burst Runner credit gain is mechanically derivable, while action timing and tempo valuation remain strategy/consumer context.",
    ],
    [
      "onr_v1_114_temple-microcode-outlet",
      "Program search-to-grip is derivable by zone/target class, but generated facts must not expose hidden stack order or card identity.",
    ],
    [
      "onr_v1_131_microtech-backup-drive",
      "Program-trash replacement and recovery are derivable as installed-hardware context, but hosted-card identity remains hidden/runtime context.",
    ],
    [
      "onr_v1_154_broker",
      "Hosted-credit put/take abilities are derivable finite action economy, but current hosted pool and once-per-turn choice remain board/LegalAction context.",
    ],
    [
      "onr_v1_168_loan-from-chiba",
      "Install burst credits are derivable only with debt/downside and delayed-penalty context; migration must not collapse the card into pure economy.",
    ],
    [
      "onr_v1_176_the-shell-traders",
      "Delayed no-cost install support is derivable as install-discount context, but hidden hand choice and install legality remain runtime context.",
    ],
    [
      "onr_v1_177_the-short-circuit",
      "Activated program search is derivable by action and stack context, but generated facts must not expose hidden stack identity.",
    ],
    [
      "onr_v1_178_short-term-contract",
      "Hosted-credit depot and A: take credits are derivable finite action economy; remaining pool stays board state and must not become infinite economy.",
    ],
  ].map(([cardId, rationale]) => [
    cardId,
    {
      migrationPriority: "P1",
      migrationRisk: "medium",
      fieldCategories: [
        "safe_generated_now",
        "generated_with_board_context",
        "generated_with_descriptor_limitations",
        "legacy_keep_for_compat",
      ],
      recommendedMigrationBatch: 12,
      rationale,
    },
  ]),
);

const PRIORITY_POLICY = {
  ...BATCH7_CORP_ICE_PRIORITY_POLICY,
  ...BATCH8_CORP_ECONOMY_PRIORITY_POLICY,
  ...BATCH9_CORP_NODES_PRIORITY_POLICY,
  ...BATCH10_RUNNER_SURVIVAL_PRIORITY_POLICY,
  ...BATCH11_TAG_PUNISH_PRIORITY_POLICY,
  ...BATCH12_RUNNER_ECONOMY_PRIORITY_POLICY,
  "onr_v1_017_deep-thought": {
    migrationPriority: "P2",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Topdeck information is mechanically derivable, but the strategic R&D pressure value stays overlay-only.",
  },
  "onr_v1_041_microtech-ai-interface": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "R&D top manipulation is mechanically derivable, but generated facts must not become hidden R&D order knowledge.",
  },
  "onr_v1_085_executive-wiretaps": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "HQ multiaccess is mechanically derivable, while successful-run/access legality remains engine context.",
  },
  "onr_v1_084_edited-shipping-manifests": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "HQ access replacement, economy and self-tag are derivable, but must not be normalized to normal access or automatic value.",
  },
  "onr_v1_081_custodial-position": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "R&D multiaccess is mechanically derivable, while access value and hidden-zone state remain runtime/consumer context.",
  },
  "onr_v1_024_expert-schedule-analyzer": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Post-access HQ information is derivable, but generated facts must not contain hidden HQ identities.",
  },
  onr_v1_008_boardwalk: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "HQ-info counters are derivable, while random HQ reveal and virus-counter thresholds remain context-gated.",
  },
  "onr_v1_062_shredder-uplink-protocol": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Archive-run to HQ-success access replacement is derivable and must stay distinct from normal Archives access.",
  },
  "onr_v1_032_i-spy": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Successful-run expose counter is derivable as remote information; target choice and board visibility remain context.",
  },
  onr_v1_042_mouse: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Activated installed-card expose is a stable mechanical information fact.",
  },
  onr_v1_058_seeya: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Activated installed-card expose is a stable mechanical information fact with payment context.",
  },
  onr_v1_065_smarteye: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Approach-ICE expose is derivable, but actual encounter timing and hidden ICE identity remain LegalAction/runtime context.",
  },
  "onr_v1_037_japanese-water-torture": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 2,
    rationale:
      "Breaker coverage and forgo_actions side effect are exact implementation facts and low-risk generated candidates.",
  },
  onr_v1_039_krash: {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: ["safe_generated_now", "legacy_keep_for_compat"],
    recommendedMigrationBatch: 2,
    rationale:
      "Universal breaker profile is an exact mechanical fact and should not need long-term manual duplication.",
  },
  onr_v1_074_worm: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Wall breaker coverage and break/pump costs are stable generated facts; concrete encounter legality remains effectiveRunQuote context.",
  },
  "onr_v1_047_pile-driver": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Wall breaker coverage is stable, while stealth_loss must stay a side-effect fact rather than normal credit cost.",
  },
  onr_v1_014_codecracker: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts.",
  },
  onr_v1_016_cyfermaster: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts; printed trademark suffix is normalized by cardId.",
  },
  onr_v1_052_raffles: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts.",
  },
  onr_v1_054_raptor: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  onr_v1_060_shaka: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_006_black-dahlia": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_040_loony-goon": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  onr_v1_007_blink: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Universal random breaker coverage is mechanically derivable, but random_failure and once-per-subroutine must not become deterministic break safety.",
  },
  onr_v1_019_dropp: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Universal breaker coverage is derivable, but ends_run_after_use must remain a side effect and not be lost in normalization.",
  },
  onr_v1_056_replicator: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Trace-subroutine breaker coverage is stable and must remain distinct from universal coverage.",
  },
  onr_v1_055_reflector: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "AP-special breaker coverage is derivable, but stun/hellbolt/knockout specificity remains a descriptor limitation.",
  },
  "onr_v1_002_ai-boon": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Sentry breaker coverage is derivable, but random run-start strength must remain random-context only.",
  },
  "onr_v1_005_bartmoss-memorial-icebreaker": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Universal breaker coverage is derivable, but random self-trash risk must remain a side effect and not deterministic safety.",
  },
  onr_v1_070_tinweasel: {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage is stable; no-pump text remains comparison context.",
  },
  "onr_v1_073_wizards-book": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Code-gate breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_072_wild-card": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale: "Sentry breaker coverage and costs are stable generated facts.",
  },
  "onr_v1_043_mystery-box": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 2,
    rationale:
      "Search, top-five target profile, free install and once-per-run are derivable, but install legality still belongs to LegalActions.",
  },
  onr_v1_048_poltergeist: {
    migrationPriority: "P2",
    migrationRisk: "low",
    fieldCategories: ["safe_generated_now", "legacy_keep_for_compat"],
    recommendedMigrationBatch: 2,
    rationale:
      "Dedicated trash-credit facts are mechanical and stable, but currently less critical than active consumer-facing effect classes.",
  },
  "onr_v1_050_r-and-d-protocol-files": {
    migrationPriority: "P2",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 6,
    rationale:
      "Topdeck info and access replacement are mechanical, but the successful-run condition must remain LegalAction-gated.",
  },
  "onr_v1_057_scatter-shot": {
    migrationPriority: "P2",
    migrationRisk: "low",
    fieldCategories: ["safe_generated_now", "legacy_keep_for_compat"],
    recommendedMigrationBatch: 2,
    rationale:
      "Dedicated trash-credit facts are mechanical and stable, but currently less critical than active consumer-facing effect classes.",
  },
  "onr_v1_059_self-modifying-code": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 2,
    rationale:
      "Search and targetProfiles.installCost=normal are now aligned; actual installation still remains LegalAction-gated.",
  },
  "onr_v1_192_corporate-boon": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda activated extra-action facts are deterministic and high-value for later generated mechanical fields.",
  },
  "onr_v1_193_corporate-coup": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda counter-economy facts are deterministic and high-value for later generated mechanical fields.",
  },
  "onr_v1_199_employee-empowerment": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda draw facts are deterministic and high-value for later generated mechanical fields.",
  },
  "onr_v1_207_netwatch-operations-office": {
    migrationPriority: "P0",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda trace/tag facts are derivable, but trace success must stay runtime/LegalAction context.",
  },
  "onr_v1_208_on-call-solo-team": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda tagged-runner damage payoff has clear active consumer value and low semantic ambiguity.",
  },
  "onr_v1_210_political-overthrow": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda economy action is deterministic and a good first-batch generated mechanical field.",
  },
  "onr_v1_217_strike-force-kali": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Scored-agenda tagged-runner damage payoff has clear active consumer value and low semantic ambiguity.",
  },
  onr_v1_274_tutor: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 4,
    rationale:
      "Future-run ICE pressure is mechanically recognizable, but the current derived fact remains coarse and encounter-state dependent.",
  },
  "onr_v1_276_viral-15": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 4,
    rationale:
      "Future-run program trash and jack-out tax are useful, but should wait for stronger future-run descriptor handling.",
  },
  onr_v1_277_virizz: {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 4,
    rationale:
      "Future-run tax is mechanically recognizable, but the current derived fact remains coarse and encounter-state dependent.",
  },
  "onr_v1_283_audit-of-call-records": {
    migrationPriority: "P0",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Trace/tag operation facts are clear generated candidates, with trace success remaining runtime context.",
  },
  "onr_v1_284_chance-observation": {
    migrationPriority: "P0",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Trace/tag operation facts are clear generated candidates, with trace success remaining runtime context.",
  },
  "onr_v1_285_closed-accounts": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Tagged-runner counter-economy payoff is exact, consumer-relevant and low ambiguity.",
  },
  "onr_v1_302_scorched-earth": {
    migrationPriority: "P0",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 1,
    rationale:
      "Tagged-runner damage payoff is exact, consumer-relevant and low ambiguity.",
  },
  "onr_v1_355_crystal-palace-station-grid": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 3,
    rationale:
      "Run tax is mechanical, but remote-protection value and active/rezzed context must remain board-aware.",
  },
  "onr_v1_366_red-herrings": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "overlay_only",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 3,
    rationale:
      "Agenda steal tax and access condition are mechanical, but remote-protection value remains contextual overlay.",
  },
  "onr_v1_370_tesseract-fort-construction": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Additional fort ICE subroutine is mechanically derivable, but active/rezzed/server context must remain board-aware.",
  },
  "onr_v1_361_namatoki-plaza": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Remote capacity and score-support mechanics are derivable, while actual remote safety remains board and server context.",
  },
  "onr_v1_359_jenny-jett": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Successful-run future-encounter support is mechanically recognizable, but hidden HQ choice and runpath context stay runtime-owned.",
  },
  "onr_v1_363_olivia-salazar": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "During-run source-bound rez discount is mechanical, but payment and temporary derez legality remain engine context.",
  },
  "onr_v1_367_rio-de-janeiro-city-grid": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "generated_with_board_context",
      "generated_with_descriptor_limitations",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Pass-rezzed-ICE random stop pressure is mechanically derivable, but concrete random outcome and path impact stay runtime context.",
  },
  "onr_v1_317_data-masons": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Wall rez discount and wall strength modifiers are stable generated ICE-modifier facts.",
  },
  "onr_v1_350_antiquated-interface-routines": {
    migrationPriority: "P1",
    migrationRisk: "low",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Same-fort ICE strength modifier is mechanically derivable and low-risk when board/server context remains explicit.",
  },
  "onr_v1_312_chicago-branch": {
    migrationPriority: "P1",
    migrationRisk: "medium",
    fieldCategories: [
      "safe_generated_now",
      "generated_with_board_context",
      "legacy_keep_for_compat",
    ],
    recommendedMigrationBatch: 5,
    rationale:
      "Activated advancement-counter placement is a stable mechanical score-acceleration fact; closeout valuation stays strategic.",
  },
};

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

async function stableStringify(value) {
  return prettier.format(JSON.stringify(value, null, 2), { parser: "json" });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

async function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(repoPath(relativePath)), { recursive: true });
  fs.writeFileSync(
    repoPath(relativePath),
    await stableStringify(value),
    "utf8",
  );
}

function sortStrings(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function countBy(values) {
  return Object.fromEntries(
    [
      ...values.reduce(
        (counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1),
        new Map(),
      ),
    ].sort(([left], [right]) => left.localeCompare(right)),
  );
}

function orderedCounts(counts, keys) {
  return Object.fromEntries(keys.map((key) => [key, counts[key] ?? 0]));
}

function overlayMap() {
  const map = new Map();
  for (const overlayPath of OVERLAY_PATHS) {
    const json = readJson(overlayPath);
    for (const card of json.cards ?? []) {
      map.set(card.cardId, {
        path: overlayPath,
        fields: Object.keys(card.overlay ?? {}).sort(),
      });
    }
  }
  return map;
}

function activeMechanicalFields(activeHint) {
  return MECHANICAL_FIELDS.filter((field) => activeHint?.[field] !== undefined);
}

function warningGroups(card) {
  return Object.fromEntries(
    [...(card.warnings ?? [])]
      .reduce(
        (counts, warning) =>
          counts.set(
            warning.classification,
            (counts.get(warning.classification) ?? 0) + 1,
          ),
        new Map(),
      )
      .entries(),
  );
}

function doNotMigrateFields(card, activeHint, overlay) {
  const fields = ["aiSupportStatus", "roles", "planRoles"];
  for (const field of [
    "requiredMechanics",
    "valueHints",
    "riskTags",
    "scenarioRefs",
  ]) {
    if (activeHint?.[field] !== undefined) fields.push(field);
  }
  fields.push(...(overlay?.fields ?? []));
  if (card.strategyFieldsFromOverlay?.length > 0)
    fields.push(...card.strategyFieldsFromOverlay);
  return sortStrings(fields);
}

export function buildGeneratedFactMigrationPriorityReport() {
  const compiledReport = readJson(COMPILED_INDEX_REPORT_PATH);
  const derivedReport = readJson(DERIVED_FACTS_REPORT_PATH);
  const pilotCards = readJson(PILOT_CARDS_PATH);
  const activeHints = readJson(ACTIVE_HINTS_PATH);
  const activeHintById = new Map(
    (activeHints.cards ?? []).map((hint) => [hint.cardId, hint]),
  );
  const derivedById = new Map(
    (derivedReport.cards ?? []).map((card) => [card.cardId, card]),
  );
  const overlayById = overlayMap();

  const candidateIds = sortStrings(
    (compiledReport.migrationCandidates ?? []).map((card) => card.cardId),
  );
  const cards = candidateIds.map((cardId) => {
    const compiledCard = compiledReport.cards.find(
      (card) => card.cardId === cardId,
    );
    const derivedCard = derivedById.get(cardId);
    const activeHint = activeHintById.get(cardId);
    const overlay = overlayById.get(cardId);
    const policy = PRIORITY_POLICY[cardId];
    if (!compiledCard || !derivedCard || !activeHint || !policy) {
      throw new Error(`Missing migration priority input for ${cardId}`);
    }
    return {
      cardId,
      title: compiledCard.title,
      side: compiledCard.side,
      cardType: compiledCard.cardType,
      migrationPriority: policy.migrationPriority,
      migrationRisk: policy.migrationRisk,
      fieldCategories: sortStrings(policy.fieldCategories),
      generatedFields: sortStrings(compiledCard.generatedFields ?? []),
      generatedMechanicalFacts: sortStrings(
        compiledCard.mechanicalFactsFromGenerated ?? [],
      ),
      monolithFields: activeMechanicalFields(activeHint),
      duplicatedActiveMechanicalFields: sortStrings(
        compiledCard.duplicatedActiveMechanicalFields ?? [],
      ),
      generatedOnlyFields: sortStrings(compiledCard.generatedOnlyFields ?? []),
      overlayFields: sortStrings(overlay?.fields ?? []),
      warningGroups: warningGroups(compiledCard),
      recommendedNextAction: compiledCard.recommendedNextAction,
      migrationReadiness: compiledCard.migrationReadiness,
      recommendedMigrationBatch: policy.recommendedMigrationBatch,
      rationale: policy.rationale,
      doNotMigrateFields: doNotMigrateFields(compiledCard, activeHint, overlay),
      derivedRationale: derivedCard.rationale,
    };
  });

  const batchPlan = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((batch) => ({
    batch,
    title: {
      1: "Scored-agenda and tag/trace/punish generated facts",
      2: "BreakerProfile, targetProfiles and dedicated credits",
      3: "RemoteRole run_tax and agenda_steal_tax",
      4: "Future-run and future-encounter ICE facts",
      5: "Remaining longtail mechanical facts",
      6: "Runner info, central pressure and access replacement",
      7: "Corp ICE longtail, future, trace, damage and ETR",
      8: "Corp economy, operation and advance-burst score conversion support",
      9: "Corp nodes, assets, ambush and economy remotes",
      10: "Runner prevention, damage and survival tools",
      11: "Corp tag/punish funnel cross-batch closeout",
      12: "Runner economy, resource, hardware and setup longtail",
    }[batch],
    cardIds: cards
      .filter((card) => card.recommendedMigrationBatch === batch)
      .map((card) => card.cardId),
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: REVIEW_DATE,
    taskId: "Aufgabe 002",
    sourceReport: COMPILED_INDEX_REPORT_PATH,
    sources: {
      compiledIndexReport: COMPILED_INDEX_REPORT_PATH,
      derivedFactsReport: DERIVED_FACTS_REPORT_PATH,
      pilotCards: PILOT_CARDS_PATH,
      manualOverlays: OVERLAY_PATHS,
      activeHints: ACTIVE_HINTS_PATH,
    },
    mode: "read-only prioritization; no active hint migration, no runtime compile, no planner or consumer binding",
    candidateCount: cards.length,
    priorityCounts: orderedCounts(
      countBy(cards.map((card) => card.migrationPriority)),
      ["P0", "P1", "P2", "P3"],
    ),
    fieldCategoryCounts: countBy(cards.flatMap((card) => card.fieldCategories)),
    riskCounts: orderedCounts(
      countBy(cards.map((card) => card.migrationRisk)),
      ["low", "medium", "high"],
    ),
    batchPlan,
    cards,
  };
}

function parseArgs(argv) {
  const options = {
    check: false,
    write: false,
    json: false,
    reportPath: DEFAULT_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--write") options.write = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--report") {
      index += 1;
      if (!argv[index]) throw new Error("--report requires a path");
      options.reportPath = argv[index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.check && !options.write && !options.json) options.check = true;
  return options;
}

export async function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const report = buildGeneratedFactMigrationPriorityReport();
  const serializedReport = await stableStringify(report);

  if (options.write) await writeJson(options.reportPath, report);

  if (options.check) {
    const reportPath = repoPath(options.reportPath);
    if (!fs.existsSync(reportPath)) {
      throw new Error(
        `Committed generated-fact migration priority report is missing: ${options.reportPath}`,
      );
    }
    const committedReport = fs.readFileSync(reportPath, "utf8");
    if (committedReport !== serializedReport) {
      throw new Error(
        `Generated migration priority report differs from committed ${options.reportPath}. Run node scripts/check-ai-generated-fact-migration-priority.mjs --write.`,
      );
    }
  }

  if (options.json) {
    process.stdout.write(serializedReport);
  } else {
    process.stdout.write(
      `AI_GENERATED_FACT_MIGRATION_PRIORITY OK candidates=${report.candidateCount} P0=${report.priorityCounts.P0 ?? 0} P1=${report.priorityCounts.P1 ?? 0} P2=${report.priorityCounts.P2 ?? 0} P3=${report.priorityCounts.P3 ?? 0}\n`,
    );
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
