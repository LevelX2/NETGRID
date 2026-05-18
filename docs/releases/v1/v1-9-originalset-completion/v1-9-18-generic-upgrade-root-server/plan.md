# V1.9.18 Detailed Plan - Generische Upgrade-, Root-, Grid- und Server-Fähigkeiten

Status: frozen for WIP implementation
Stand: 2026-05-13
Primärer Agent: release-implementation-agent

## Zielbild

V1.9.18 schaltet genau 15 Corp-Upgrade-/Root-/Grid-Karten aus dem lokalen O:NR-v1-Originalset kontrolliert frei. Der Release bündelt servergebundene Upgrade-Effekte, City-Grid-/Root-Surfaces sowie Überlappungen mit Trace, Access/Breach, Ambush, Tags, Damage, Counter und Run-Flow.

Kartentexte sind display-only. Rules Engine, LegalActions, applyAction, Visibility, Replay, StateHash und KI bleiben die Autorität.

## Zielkarten

| Karte | ID | Kernfamilien |
| --- | --- | --- |
| Crybaby | `onr_v1_354_crybaby` | upgrade_root_server, trace, access, counter, ambush |
| Crystal Palace Station Grid | `onr_v1_355_crystal-palace-station-grid` | upgrade_root_server, city_grid, counter |
| Dedicated Response Team | `onr_v1_356_dedicated-response-team` | upgrade_root_server, access_ambush, meat_damage, tags |
| Dieter Esslin | `onr_v1_357_dieter-esslin` | upgrade_root_server, access, hidden_zone, net_damage |
| Dr. Dreff | `onr_v1_358_dr-dreff` | upgrade_root_server, run_flow, counter |
| Jenny Jett | `onr_v1_359_jenny-jett` | upgrade_root_server |
| Namatoki Plaza | `onr_v1_361_namatoki-plaza` | upgrade_root_server |
| New Galveston City Grid | `onr_v1_362_new-galveston-city-grid` | upgrade_root_server, city_grid, hidden_zone |
| Omni Kismet, Ph.D. | `onr_v1_364_omni-kismet-ph-d` | upgrade_root_server, tags |
| Paris City Grid | `onr_v1_365_paris-city-grid` | upgrade_root_server, city_grid, trace, tags |
| Red Herrings | `onr_v1_366_red-herrings` | upgrade_root_server, access_breach |
| Singapore City Grid | `onr_v1_369_singapore-city-grid` | upgrade_root_server, city_grid |
| Tesseract Fort Construction | `onr_v1_370_tesseract-fort-construction` | upgrade_root_server |
| Turbeau Delacroix | `onr_v1_372_turbeau-delacroix` | upgrade_root_server, trace, run_flow, access, tags, ambush |
| Twenty-Four-Hour Surveillance | `onr_v1_373_twenty-four-hour-surveillance` | upgrade_root_server, stealth |

## Umsetzungsschnitt

1. WIP-Planung und No-Promotion-Guard: Zielkarten als V1.9.18-WIP erfassen, aber nicht in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` oder AI-Approval aufnehmen.
2. Runtime-WIP: Für alle 15 Karten lokale `CardDefinition`s mit finalen display-only Texten, Rez-/Trash-Kosten und Mechanikmarkern ergänzen.
3. Engine-Smoke: Definitionen, Status, finalen Text ohne `WIP` und No-Scope-Guard gegen V1.9.19 prüfen.
4. Catalog-Smoke: WIP-Zielmenge prüfen und sicherstellen, dass keine V1.9.18-Karte release-promotet ist.
5. Folgearbeit: konkrete LegalAction-/applyAction-Pfade für Root-/Grid-/Server-Modifier, Access-/Ambush-, Trace-, Tag-, Damage- und Counter-Pfade ergänzen; danach Manifest/Coverage/AI-Hints/Smokes finalisieren.

## Out of Scope

- Keine V1.9.19+-Karten.
- Keine V2.x-Features, Public-Plattform, offiziellen Assets oder externen Kartendatenquellen.
- Keine Freigabe als `human_playable`, `deck_legal` oder `ai_supported` ohne vollständige Engine-, Visibility-, Replay-/StateHash-, Daten- und KI-Gates.

## Gate

V1.9.18 ist erst abgeschlossen, wenn alle 15 Karten Engine-/LegalAction-abgedeckt, side-sicher sichtbar, replay-/StateHash-stabil, in Manifest/Coverage/Szenarien/AI-Hints/AI-Smokes finalisiert, im Catalog als releasefähig geführt, im Webclient mit `V1.9.18` sichtbar und durch vollständige Pflichtchecks verifiziert sind.
