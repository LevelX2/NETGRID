/**
 * Reports CardImplementation coverage for the original set.
 *
 * Coverage is metadata for planning, audits, and tests. It must not influence
 * runtime legality or execute card behavior; implemented behavior comes from
 * the registry and the ability-engine runtime.
 */
import type { CardDefinitionId } from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "./registry";

export type CardImplementationCoverageStatus =
  | "implemented"
  | "partial_implementation"
  | "legacy_engine_special_case"
  | "no_engine_behavior_required"
  | "pending_implementation";

export type CardImplementationCoverageEntry = {
  cardDefinitionId: CardDefinitionId;
  status: CardImplementationCoverageStatus;
  reason: string;
  currentLocations?: string[];
};

const IMPLEMENTED_REZ_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_INSTALL_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_STEAL_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_TRASH_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_BREAK_SUBROUTINE_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ICE_STRENGTH_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ADDITIONAL_SUBROUTINE_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_PRINTED_SUBROUTINE_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/corp/ice";

const IMPLEMENTED_RUNNER_COUNTER_EFFECT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/corp/ice";

const IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ON_PLAY_EFFECT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ACTIVATED_ABILITY_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ACCESS_EFFECT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_RESTRICTED_HOSTED_CREDIT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_DAMAGE_PREVENTION_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_TAG_TRASH_PREVENTION_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_CARD_LOCATION_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, string>
> = {
  "onr_v1_045_newsgroup-filter":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/newsgroup-filter.ts",
  "onr_v1_003_baedekers-net-map":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/baedekers-net-map.ts",
  "onr_v1_004_bakdoor":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/bakdoor.ts",
  "onr_v1_011_cloak":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/cloak.ts",
  "onr_v1_035_invisibility":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/invisibility.ts",
  "onr_v1_048_poltergeist":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/poltergeist.ts",
  "onr_v1_057_scatter-shot":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/scatter-shot.ts",
  "onr_v1_063_signpost":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/signpost.ts",
  "onr_v1_071_vewy-vewy-quiet":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/vewy-vewy-quiet.ts",
  "onr_v1_075_zetatech-software-installer":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/zetatech-software-installer.ts",
  "onr_v1_028_force-shield":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/force-shield.ts",
  "onr_v1_061_shield":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/shield.ts",
  "onr_v1_038_joan-of-arc":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/joan-of-arc.ts",
  "onr_v1_119_arasaka-portable-prototype":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/arasaka-portable-prototype.ts",
  "onr_v1_120_armadillo-armored-road-home":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/armadillo-armored-road-home.ts",
  "onr_v1_121_armored-fridge":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/armored-fridge.ts",
  "onr_v1_122_artemis-2020":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/artemis-2020.ts",
  "onr_v1_148_access-through-alpha":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/access-through-alpha.ts",
  "onr_v1_149_access-to-arasaka":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/access-to-arasaka.ts",
  "onr_v1_150_access-to-kiribati":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/access-to-kiribati.ts",
  "onr_v1_152_back-door-to-hilliard":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/back-door-to-hilliard.ts",
  "onr_v1_153_back-door-to-orbital-air":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/back-door-to-orbital-air.ts",
  "onr_v1_181_the-springboard":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/the-springboard.ts",
  "onr_v1_185_trauma-team":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/trauma-team.ts",
  "onr_v1_124_corolla-speed-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/corolla-speed-chip.ts",
  "onr_v1_126_drifter-mobile-environment":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/drifter-mobile-environment.ts",
  "onr_v1_125_dermatech-bodyplating":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/dermatech-bodyplating.ts",
  "onr_v1_128_green-knight-surge-buffers":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/green-knight-surge-buffers.ts",
  "onr_v1_135_nasuko-cycle":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/nasuko-cycle.ts",
  "onr_v1_136_pandoras-deck":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/pandoras-deck.ts",
  "onr_v1_137_parraline-5750":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/parraline-5750.ts",
  "onr_v1_138_pk-6089a":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/pk-6089a.ts",
  "onr_v1_140_raven-microcyb-eagle":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/raven-microcyb-eagle.ts",
  "onr_v1_141_raven-microcyb-owl":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/raven-microcyb-owl.ts",
  "onr_v1_143_techtronica-utility-suit":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/techtronica-utility-suit.ts",
  "onr_v1_133_militech-mram-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/militech-mram-chip.ts",
  "onr_v1_134_mram-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/mram-chip.ts",
  "onr_v1_144_tycho-mem-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/tycho-mem-chip.ts",
  "onr_v1_145_wutech-mem-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/wutech-mem-chip.ts",
  "onr_v1_146_zetatech-mem-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/zetatech-mem-chip.ts",
  "onr_v1_147_zz22-speed-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/zz22-speed-chip.ts",
  "onr_v1_154_broker":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/broker.ts",
  "onr_v1_079_bodyweight-synthetic-blood":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/bodyweight-synthetic-blood.ts",
  "onr_v1_081_custodial-position":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/custodial-position.ts",
  "onr_v1_084_edited-shipping-manifests":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/edited-shipping-manifests.ts",
  "onr_v1_085_executive-wiretaps":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/executive-wiretaps.ts",
  "onr_v1_087_forgotten-backup-chip":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/forgotten-backup-chip.ts",
  "onr_v1_089_gideons-pawnshop":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/gideons-pawnshop.ts",
  "onr_v1_091_hunt-club-bbs":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/hunt-club-bbs.ts",
  "onr_v1_092_ice-and-datas-guide-to-the-net":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/ice-and-datas-guide-to-the-net.ts",
  "onr_v1_093_if-you-want-it-done-right":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/if-you-want-it-done-right.ts",
  "onr_v1_096_kilroy-was-here":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/kilroy-was-here.ts",
  "onr_v1_099_mantis-fixer-at-large":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/mantis-fixer-at-large.ts",
  "onr_v1_102_open-ended-mileage-program":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/open-ended-mileage-program.ts",
  "onr_v1_105_priority-wreck":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/priority-wreck.ts",
  "onr_v1_110_sneak-preview":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/sneak-preview.ts",
  "onr_v1_095_jack-n-joe":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/jack-n-joe.ts",
  "onr_v1_097_livewires-contacts":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/livewires-contacts.ts",
  "onr_v1_106_private-ldl-access":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/private-ldl-access.ts",
  "onr_v1_107_romp-through-hq":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/romp-through-hq.ts",
  onr_v1_108_score:
    "packages/engine/src/card-implementations/onr-v1/runner/preps/score.ts",
  "onr_v1_114_temple-microcode-outlet":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/temple-microcode-outlet.ts",
  "onr_v1_118_weather-to-finance-pipe":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/weather-to-finance-pipe.ts",
  "onr_v1_116_total-genetic-retrofit":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/total-genetic-retrofit.ts",
  "onr_v1_024_expert-schedule-analyzer":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/expert-schedule-analyzer.ts",
  "onr_v1_042_mouse":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/mouse.ts",
  "onr_v1_041_microtech-ai-interface":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/microtech-ai-interface.ts",
  "onr_v1_043_mystery-box":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/mystery-box.ts",
  "onr_v1_050_r-and-d-protocol-files":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/r-d-protocol-files.ts",
  "onr_v1_059_self-modifying-code":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/self-modifying-code.ts",
  "onr_v1_058_seeya":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/seeya.ts",
  "onr_v1_062_shredder-uplink-protocol":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/shredder-uplink-protocol.ts",
  "onr_v1_129_hq-interface":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/hq-interface.ts",
  "onr_v1_139_r-and-d-interface":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/r-d-interface.ts",
  "onr_v1_142_record-reconstructor":
    "packages/engine/src/card-implementations/onr-v1/runner/hardware/record-reconstructor.ts",
  "onr_v1_151_aujourdoui":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/aujourdhui.ts",
  "onr_v1_163_floating-runner-bbs":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/floating-runner-bbs.ts",
  "onr_v1_164_hells-run":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/hells-run.ts",
  "onr_v1_165_junkyard-bbs":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/junkyard-bbs.ts",
  "onr_v1_158_danshis-second-id":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/danshis-second-id.ts",
  "onr_v1_161_fall-guy":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/fall-guy.ts",
  "onr_v1_167_leland-corporate-bodyguard":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/leland-corporate-bodyguard.ts",
  "onr_v1_169_n-e-t-o":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/n-e-t-o.ts",
  "onr_v1_170_nomad-allies":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/nomad-allies.ts",
  "onr_v1_175_ronin-around":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/ronin-around.ts",
  "onr_v1_174_rigged-investments":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/rigged-investments.ts",
  "onr_v1_177_the-short-circuit":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/the-short-circuit.ts",
  "onr_v1_178_short-term-contract":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/short-term-contract.ts",
  "onr_v1_179_silicon-saloon-franchise":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/silicon-saloon-franchise.ts",
  "onr_v1_184_top-runners-conference":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/top-runners-conference.ts",
  "onr_v1_183_technician-lover":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/technician-lover.ts",
  "onr_v1_186_umbrella-policy":
    "packages/engine/src/card-implementations/onr-v1/runner/resources/umbrella-policy.ts",
  "onr_v1_189_artificial-security-directors":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/artificial-security-directors.ts",
  "onr_v1_191_black-ice-quality-assurance":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/black-ice-quality-assurance.ts",
  "onr_v1_193_corporate-coup":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/corporate-coup.ts",
  "onr_v1_198_detroit-police-contract":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/detroit-police-contract.ts",
  "onr_v1_201_executive-extraction":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/executive-extraction.ts",
  "onr_v1_202_genetics-visionary-acquisition":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/genetics-visionary-acquisition.ts",
  "onr_v1_205_main-office-relocation":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/main-office-relocation.ts",
  "onr_v1_206_marine-arcology":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/marine-arcology.ts",
  "onr_v1_207_netwatch-operations-office":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/netwatch-operations-office.ts",
  "onr_v1_208_on-call-solo-team":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/on-call-solo-team.ts",
  "onr_v1_209_political-coup":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/political-coup.ts",
  "onr_v1_210_political-overthrow":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/political-overthrow.ts",
  "onr_v1_211_polymer-breakthrough":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/polymer-breakthrough.ts",
  "onr_v1_213_private-cybernet-police":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/private-cybernet-police.ts",
  "onr_v1_217_strike-force-kali":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/strike-force-kali.ts",
  "onr_v1_218_subsidiary-branch":
    "packages/engine/src/card-implementations/onr-v1/corp/agendas/subsidiary-branch.ts",
  "onr_v1_221_asp":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/asp.ts",
  "onr_v1_223_banpei":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/banpei.ts",
  "onr_v1_224_bolter-cluster":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/bolter-cluster.ts",
  "onr_v1_225_canis-major":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/canis-major.ts",
  "onr_v1_226_canis-minor":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/canis-minor.ts",
  "onr_v1_227_cerberus":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/cerberus.ts",
  "onr_v1_229_code-corpse":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/code-corpse.ts",
  "onr_v1_230_cortical-scanner":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/cortical-scanner.ts",
  "onr_v1_231_cortical-scrub":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/cortical-scrub.ts",
  "onr_v1_232_crystal-wall":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/crystal-wall.ts",
  "onr_v1_233_d-arc-knight":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/d-arc-knight.ts",
  "onr_v1_234_data-darts":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/data-darts.ts",
  "onr_v1_235_data-naga":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/data-naga.ts",
  "onr_v1_236_data-raven":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/data-raven.ts",
  "onr_v1_237_data-wall":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/data-wall.ts",
  "onr_v1_238_data-wall-2-0":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/data-wall-2-0.ts",
  "onr_v1_239_endless-corridor":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/endless-corridor.ts",
  "onr_v1_240_fang":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/fang.ts",
  "onr_v1_241_fang-2-0":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/fang-2-0.ts",
  "onr_v1_243_fetch-4-0-1":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/fetch-4-0-1.ts",
  "onr_v1_244_filter":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/filter.ts",
  "onr_v1_245_fire-wall":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/fire-wall.ts",
  "onr_v1_246_fragmentation-storm":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/fragmentation-storm.ts",
  "onr_v1_249_hunter":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/hunter.ts",
  "onr_v1_250_ice-pick-willie":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/ice-pick-willie.ts",
  "onr_v1_251_jack-attack":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/jack-attack.ts",
  "onr_v1_252_keeper":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/keeper.ts",
  "onr_v1_253_laser-wire":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/laser-wire.ts",
  "onr_v1_254_liche":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/liche.ts",
  "onr_v1_255_mastiff":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/mastiff.ts",
  "onr_v1_256_mazer":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/mazer.ts",
  "onr_v1_257_nerve-labyrinth":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/nerve-labyrinth.ts",
  "onr_v1_258_neural-blade":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/neural-blade.ts",
  "onr_v1_259_in-the-face":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/pi-in-the-face.ts",
  "onr_v1_261_quandary":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/quandary.ts",
  "onr_v1_262_razor-wire":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/razor-wire.ts",
  "onr_v1_263_reinforced-wall":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/reinforced-wall.ts",
  "onr_v1_264_rex":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/rex.ts",
  "onr_v1_265_rock-is-strong":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/rock-is-strong.ts",
  "onr_v1_266_scramble":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/scramble.ts",
  "onr_v1_267_sentinels-prime":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/sentinels-prime.ts",
  "onr_v1_268_shock-r":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/shock-r.ts",
  "onr_v1_269_shotgun-wire":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/shotgun-wire.ts",
  "onr_v1_270_sleeper":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/sleeper.ts",
  "onr_v1_273_triggerman":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/triggerman.ts",
  "onr_v1_274_tutor":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/tutor.ts",
  "onr_v1_277_virizz":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/virizz.ts",
  "onr_v1_278_wall-of-ice":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/wall-of-ice.ts",
  "onr_v1_279_wall-of-static":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/wall-of-static.ts",
  "onr_v1_280_zombie":
    "packages/engine/src/card-implementations/onr-v1/corp/ice/zombie.ts",
  "onr_v1_281_accounts-receivable":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/accounts-receivable.ts",
  "onr_v1_282_annual-reviews":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/annual-reviews.ts",
  "onr_v1_283_audit-of-call-records":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/audit-of-call-records.ts",
  "onr_v1_284_chance-observation":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/chance-observation.ts",
  "onr_v1_285_closed-accounts":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/closed-accounts.ts",
  "onr_v1_287_datapool-by-zetatech":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/datapool-by-zetatech.ts",
  "onr_v1_288_day-shift":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/day-shift.ts",
  "onr_v1_290_efficiency-experts":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/efficiency-experts.ts",
  "onr_v1_291_falsified-transactions-expert":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/falsified-transactions-expert.ts",
  "onr_v1_292_management-shake-up":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/management-shake-up.ts",
  "onr_v1_293_netwatch-credit-voucher":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/netwatch-credit-voucher.ts",
  "onr_v1_295_night-shift":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/night-shift.ts",
  "onr_v1_300_project-consultants":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/project-consultants.ts",
  "onr_v1_301_punitive-counterstrike":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/punitive-counterstrike.ts",
  "onr_v1_302_scorched-earth":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/scorched-earth.ts",
  "onr_v1_304_systematic-layoffs":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/systematic-layoffs.ts",
  "onr_v1_305_team-restructuring":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/team-restructuring.ts",
  "onr_v1_307_urban-renewal":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/urban-renewal.ts",
  "onr_v1_309_bbs-whispering-campaign":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/bbs-whispering-campaign.ts",
  "onr_v1_310_blood-cat":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/blood-cat.ts",
  "onr_v1_311_braindance-campaign":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/braindance-campaign.ts",
  "onr_v1_312_chicago-branch":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/chicago-branch.ts",
  "onr_v1_314_corporate-negotiating-center":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/corporate-negotiating-center.ts",
  "onr_v1_317_data-masons":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/data-masons-hosting.ts",
  "onr_v1_318_department-of-truth-enhancement":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/department-of-truth-enhancement.ts",
  "onr_v1_320_encoder-inc":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/encoder-inc.ts",
  "onr_v1_321_esa-contract":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/esa-contract.ts",
  "onr_v1_324_fortress-architects":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/fortress-architects.ts",
  "onr_v1_326_holovid-campaign":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/holovid-campaign.ts",
  "onr_v1_328_information-laundering":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/information-laundering.ts",
  "onr_v1_334_pacifica-regional-ai":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/pacifica-regional-ai.ts",
  "onr_v1_341_skalderviken-sa-beta-test-site":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/skalderviken-sa-beta-test-site.ts",
  "onr_v1_342_solo-squad":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/solo-squad.ts",
  "onr_v1_343_south-african-mining-corp":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/south-african-mining-corp.ts",
  "onr_v1_337_rockerboy-promotion":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/rockerboy-promotion.ts",
  "onr_v1_335_remote-facility":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/remote-facility.ts",
  "onr_v1_338_rustbelt-hq-branch":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/rustbelt-hq-branch.ts",
  "onr_v1_344_spinn-public-relations":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/spinn-public-relations.ts",
  "onr_v1_347_vapor-ops":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/vapor-ops.ts",
  "onr_v1_315_corprunners-shattered-remains":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/corprunners-shattered-remains.ts",
  "onr_v1_323_experimental-ai":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/experimental-ai.ts",
  "onr_v1_340_setup":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/setup.ts",
  "onr_v1_345_trap":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/trap.ts",
  "onr_v1_346_vacant-soulkiller":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/vacant-soulkiller.ts",
  "onr_v1_348_virus-test-site":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/virus-test-site.ts",
  "onr_v1_350_antiquated-interface-routines":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/antiquated-interface-routines.ts",
  "onr_v1_352_chester-mix":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/chester-mix.ts",
  "onr_v1_355_crystal-palace-station-grid":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/crystal-palace-station-grid.ts",
  "onr_v1_356_dedicated-response-team":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/dedicated-response-team.ts",
  "onr_v1_357_dieter-esslin":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/dieter-esslin.ts",
  "onr_v1_360_jerusalem-city-grid":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/jerusalem-city-grid.ts",
  "onr_v1_362_new-galveston-city-grid":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/new-galveston-city-grid.ts",
  "onr_v1_366_red-herrings":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/red-herrings.ts",
  "onr_v1_370_tesseract-fort-construction":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/tesseract-fort-construction.ts",
  "onr_v1_374_washington-d-c-city-grid":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/washington-d-c-city-grid.ts",
};

function implementedCoverageFor(
  implementation: (typeof CARD_IMPLEMENTATIONS)[number],
): CardImplementationCoverageEntry {
  const reasons: string[] = [];
  const currentLocations = new Set<string>();

  if (implementation.modifiers?.some((modifier) => modifier.kind === "rez_cost")) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp rez-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_REZ_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "ice_strength")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp ICE-strength modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_ICE_STRENGTH_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "install_cost")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp install-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_INSTALL_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "steal_cost")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive access agenda steal-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_STEAL_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "additional_subroutine",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive additional-subroutine modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_ADDITIONAL_SUBROUTINE_MODIFIER_LOCATION);
  }
  if (implementation.modifiers?.some((modifier) => modifier.kind === "hand_size")) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive hand-size modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "memory_units")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive memory-unit modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "agenda_difficulty",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive agenda-difficulty modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "trash_cost")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive access trash-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_TRASH_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "break_subroutine_cost",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive break-subroutine-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_BREAK_SUBROUTINE_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "access_count")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive access-count modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (implementation.advanceable) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for installed before/after-rez advanceable behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACTIVATED_ABILITY_LOCATION);
  }
  if (implementation.accessHooks?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for access-context hook behavior.",
    );
    currentLocations.add(IMPLEMENTED_ON_PLAY_EFFECT_LOCATION);
  }
  if (implementation.accessEffects?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Corp access-effect behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACCESS_EFFECT_LOCATION);
  }
  if (implementation.printedSubroutines?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for printed ICE subroutine behavior.",
    );
    currentLocations.add(IMPLEMENTED_PRINTED_SUBROUTINE_LOCATION);
  }
  if (implementation.runnerCounterEffects?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Runner trace-counter lifecycle and removal behavior.",
    );
    currentLocations.add(IMPLEMENTED_RUNNER_COUNTER_EFFECT_LOCATION);
  }
  if (implementation.abilities?.some((ability) => ability.kind === "on_play")) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for printed-cost on-play effect behavior.",
    );
    currentLocations.add(IMPLEMENTED_ON_PLAY_EFFECT_LOCATION);
  }
  if (
    implementation.abilities?.some((ability) => ability.kind === "activated")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for activated main-action ability behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACTIVATED_ABILITY_LOCATION);
  }
  if (implementation.restrictedHostedCreditSource) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for restricted hosted-credit source behavior.",
    );
    currentLocations.add(IMPLEMENTED_RESTRICTED_HOSTED_CREDIT_LOCATION);
  }
  if (implementation.installAdditionalCosts?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition declares additional install cost behavior.",
    );
    currentLocations.add(IMPLEMENTED_RESTRICTED_HOSTED_CREDIT_LOCATION);
  }
  if (implementation.damagePreventionSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for damage-prevention source behavior.",
    );
    currentLocations.add(IMPLEMENTED_DAMAGE_PREVENTION_LOCATION);
  }
  if (implementation.flatlineReplacementSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for flatline-replacement source behavior.",
    );
    currentLocations.add(IMPLEMENTED_DAMAGE_PREVENTION_LOCATION);
  }
  if (implementation.tagPreventionSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for tag-prevention source behavior.",
    );
    currentLocations.add(IMPLEMENTED_TAG_TRASH_PREVENTION_LOCATION);
  }
  if (implementation.trashPreventionSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for installed Runner trash-prevention source behavior.",
    );
    currentLocations.add(IMPLEMENTED_TAG_TRASH_PREVENTION_LOCATION);
  }

  return {
    cardDefinitionId: implementation.cardDefinitionId,
    status: "implemented",
    reason:
      reasons.join(" ") ||
      "Engine-local CardImplementationDefinition exists for card behavior.",
    currentLocations: [
      IMPLEMENTED_CARD_LOCATION_BY_DEFINITION_ID[
        implementation.cardDefinitionId
      ] ?? [...currentLocations][0],
    ].filter((location): location is string => Boolean(location)),
  };
}

const IMPLEMENTED_COVERAGE_ENTRIES: CardImplementationCoverageEntry[] =
  CARD_IMPLEMENTATIONS.map(implementedCoverageFor);

export const CARD_IMPLEMENTATION_COVERAGE_OVERRIDES: readonly CardImplementationCoverageEntry[] =
  [
    {
      cardDefinitionId: "onr_v1_363_olivia-salazar",
      status: "legacy_engine_special_case",
      reason:
        "Optional timed Corp rez-cost ability with source validation, once-per-run state and temporary derez; not yet migrated to CardImplementationDefinition.",
      currentLocations: [
        "packages/engine/src/ability-engine/cost-pipeline.ts",
        "packages/engine/src/index.ts::corpApproachActions",
        "packages/engine/src/index.ts::rezCard",
      ],
    },
    {
      cardDefinitionId: "onr_v1_068_startup-immolator",
      status: "legacy_engine_special_case",
      reason:
        "Runner installed-program ability pays the passed ICE rez cost and trashes it after fully broken pass-ice timing; not yet migrated to CardImplementationDefinition.",
      currentLocations: [
        "packages/engine/src/index.ts::startupImmolatorActions",
        "packages/engine/src/index.ts::useStartupImmolator",
        "packages/engine/src/mechanics/longtail-card-effects.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_173_restrictive-net-zoning",
      status: "legacy_engine_special_case",
      reason:
        "Server-bound install-cost modifier and selected-server state are still implemented in legacy engine paths.",
      currentLocations: ["packages/engine/src/index.ts"],
    },
    {
      cardDefinitionId: "onr_v1_039_krash",
      status: "legacy_engine_special_case",
      reason:
        "Run-duration breaker strength modifier is still stored in RunState and reconstructed by ActiveModifier query.",
      currentLocations: [
        "packages/engine/src/index.ts",
        "packages/engine/src/ability-engine/active-modifiers.ts",
      ],
    },
  ];

function pendingCoverageFor(
  cardDefinitionId: CardDefinitionId,
): CardImplementationCoverageEntry {
  return {
    cardDefinitionId,
    status: "pending_implementation",
    reason:
      "Known card has not yet been explicitly classified beyond the default conservative coverage status.",
  };
}

export const CARD_IMPLEMENTATION_COVERAGE_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, CardImplementationCoverageEntry>
> = {
  ...Object.fromEntries(
    Object.keys(DEMO_CARDS_BY_ID).map((cardDefinitionId) => [
      cardDefinitionId,
      pendingCoverageFor(cardDefinitionId),
    ]),
  ),
  ...Object.fromEntries(
    IMPLEMENTED_COVERAGE_ENTRIES.map((entry) => [
      entry.cardDefinitionId,
      entry,
    ]),
  ),
  ...Object.fromEntries(
    CARD_IMPLEMENTATION_COVERAGE_OVERRIDES.map((entry) => [
      entry.cardDefinitionId,
      entry,
    ]),
  ),
};

export const CARD_IMPLEMENTATION_COVERAGE_ENTRIES: readonly CardImplementationCoverageEntry[] =
  Object.values(CARD_IMPLEMENTATION_COVERAGE_BY_DEFINITION_ID).filter(
    (entry): entry is CardImplementationCoverageEntry => Boolean(entry),
  );

/**
 * Returns the current coverage status for a card definition id.
 */
export function cardImplementationCoverageForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationCoverageEntry | undefined {
  return CARD_IMPLEMENTATION_COVERAGE_BY_DEFINITION_ID[definitionId];
}
