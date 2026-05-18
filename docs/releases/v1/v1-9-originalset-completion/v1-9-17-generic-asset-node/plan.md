# V1.9.17 Detailed Plan - Generische Asset/Node-Fähigkeiten

Status: frozen for implementation
Stand: 2026-05-13
Primärer Agent: release-implementation-agent

## Zielbild

V1.9.17 schaltet genau 18 Corp-Asset-/Node-Karten aus dem lokalen O:NR-v1-Originalset kontrolliert frei. Der Release bündelt generische Asset-/Node-Fähigkeiten, Campaign-/Economy-Surfaces, einfache Sysop-/AI-Assets sowie Asset-Überlappungen mit Hosting, Trace, Recurring, Hidden-Zone, Ambush, Tags und Damage.

Kartentexte sind display-only. Rules Engine, LegalActions, applyAction, Visibility, Replay, StateHash und KI bleiben die Autorität.

## Zielkarten

| Karte | ID | Kernfamilien |
| --- | --- | --- |
| BBS Whispering Campaign | `onr_v1_309_bbs-whispering-campaign` | generic_asset_node, campaign_economy, hosting |
| Blood Cat | `onr_v1_310_blood-cat` | generic_asset_node, trace, ai_asset_node |
| Braindance Campaign | `onr_v1_311_braindance-campaign` | generic_asset_node, campaign_economy, hosting, recurring |
| Corporate Negotiating Center | `onr_v1_314_corporate-negotiating-center` | generic_asset_node, economy, hidden-zone, recurring |
| Cowboy Sysop | `onr_v1_316_cowboy-sysop` | generic_asset_node, installed-card uninstall |
| Department of Truth Enhancement | `onr_v1_318_department-of-truth-enhancement` | generic_asset_node, gray_ops, hosting |
| Disinfectant, Inc. | `onr_v1_319_disinfectant-inc` | generic_asset_node, virus/counter/purge/prevention |
| ESA Contract | `onr_v1_321_esa-contract` | generic_asset_node, draw/economy |
| Holovid Campaign | `onr_v1_326_holovid-campaign` | generic_asset_node, campaign_economy, hosting, recurring |
| Investment Firm | `onr_v1_329_investment-firm` | generic_asset_node, transactions, recurring |
| Krumz | `onr_v1_330_krumz` | generic_asset_node, trace, hosting, ai_asset_node |
| Omniscience Foundation | `onr_v1_333_omniscience-foundation` | generic_asset_node, gray_ops |
| Rescheduler | `onr_v1_336_rescheduler` | generic_asset_node, hidden-zone |
| Rockerboy Promotion | `onr_v1_337_rockerboy-promotion` | generic_asset_node, campaign_economy, hosting |
| Setup! | `onr_v1_340_setup` | generic_asset_node, access, hidden-zone, ambush, net damage |
| Solo Squad | `onr_v1_342_solo-squad` | generic_asset_node, meat damage |
| Spinn Public Relations | `onr_v1_344_spinn-public-relations` | generic_asset_node, transactions, campaign, hosting, recurring |
| TRAP! | `onr_v1_345_trap` | generic_asset_node, access, hidden-zone, tag, ambush, net damage |

## Umsetzungsschnitt

1. WIP-Planung und No-Promotion-Guard: Zielkarten als V1.9.17-WIP erfassen, aber nicht in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` oder AI-Approval aufnehmen.
2. Runtime-WIP: Für alle 18 Karten lokale `CardDefinition`s mit finalen display-only Texten, Kosten, Trash-Kosten und Mechanikmarkern ergänzen.
3. Engine-Smoke: Definitionen, Status, finalen Text ohne `WIP` und No-Scope-Guard gegen V1.9.18 prüfen.
4. Catalog-Smoke: WIP-Zielmenge prüfen und sicherstellen, dass keine V1.9.17-Karte release-promotet ist.
5. Folgearbeit: konkrete LegalAction-/applyAction-Pfade für Asset-Ability, Ambush, Hidden-Zone, Recurring und Damage ergänzen; danach Manifest/Coverage/AI-Hints/Smokes finalisieren.

## Out of Scope

- Keine V1.9.18+-Karten.
- Keine V2.x-Features, Public-Plattform, offiziellen Assets oder externen Kartendatenquellen.
- Keine Freigabe als `human_playable`, `deck_legal` oder `ai_supported` ohne vollständige Engine-, Visibility-, Replay-/StateHash-, Daten- und KI-Gates.

## Risiken

- Hidden-Zone-Leak bei Corporate Negotiating Center, Rescheduler, Setup! und TRAP!.
- Ambush-/Access-Timing bei Setup! und TRAP!.
- Scheinfreigabe durch `playable_mvp`-Definitionen ohne Catalog-/AI-Gate.
- KI-Hänger bei späteren Choice-Fenstern.

## Gate

V1.9.17 ist erst abgeschlossen, wenn alle 18 Karten Engine-/LegalAction-abgedeckt, side-sicher sichtbar, replay-/StateHash-stabil, in Manifest/Coverage/Szenarien/AI-Hints/AI-Smokes finalisiert, im Catalog als releasefähig geführt, im Webclient mit `V1.9.17` sichtbar und durch vollständige Pflichtchecks verifiziert sind.
