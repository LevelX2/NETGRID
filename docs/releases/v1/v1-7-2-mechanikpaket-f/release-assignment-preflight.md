# V1.7.2 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen (Requirements-Freeze Eingang)

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- `docs/releases/v1/v1-7-1-mechanikpaket-e/plan-to-v1-8-1.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`

## Ergebnis

- Geplanter V1.7.2-Korb laut Matrix: 28 Karten
- Als V1.7.2-Kern implementiert: 5 Karten
- Deferred in V1.7.2: 23 Karten

## Kernkorb (freigabefähig)

1. `onr_v1_283_audit-of-call-records`
2. `onr_v1_284_chance-observation`
3. `onr_v1_286_corporate-detective-agency`
4. `onr_v1_158_danshis-second-id`
5. `onr_v1_179_silicon-saloon-franchise`

## Freigabe-Matrix je Karte

| Nr | CardId | Name | Entscheidung | Begründung |
| --- | --- | --- | --- | --- |
| 053 | onr_v1_053_ramming-piston | Ramming Piston | deferred | Breaker-/Stealth-Sonderkostenpfad nicht im V1.7.2-Kern; Fokus auf Trace/Tag/Resource/ActionEconomy. |
| 056 | onr_v1_056_replicator | Replicator | deferred | Breaker-Spezialfall „trace subroutines only“ außerhalb des V1.7.2-Kernkorridors. |
| 126 | onr_v1_126_drifter-mobile-environment | "Drifter" Mobile Environment | deferred | Hosted-Credit-Refresh-Spezialpfad bleibt Folgegate. |
| 154 | onr_v1_154_broker | Broker | deferred | Resource-Counter-Lifecycle mit Doppelaktion bleibt Folgegate. |
| 157 | onr_v1_157_crash-everett-inventive-fixer | Crash Everett, Inventive Fixer | deferred | Draw-Replacement-/Choice-Interaktion außerhalb des Kernkorridors. |
| 158 | onr_v1_158_danshis-second-id | Danshi's Second ID | freigabefähig | Kernkorb V1.7.2; tag-removal-action ohne Credit-Kosten im legal-action-only Pfad. |
| 162 | onr_v1_162_field-reporter-for-ice-and-data | Field Reporter for Ice and Data | deferred | End-of-turn-Corp-rez-Zählung bleibt Folgegate. |
| 164 | onr_v1_164_hells-run | Hell's Run | deferred | Link-Credit-Refresh-Spezialpfad bleibt Folgegate. |
| 165 | onr_v1_165_junkyard-bbs | Junkyard BBS | deferred | Heap-to-hand-Resource-Ability bleibt Folgegate. |
| 166 | onr_v1_166_karl-de-veres-corporate-stooge | Karl de Veres, Corporate Stooge | deferred | Erfolgsrun-Economy-Trigger nicht Teil des V1.7.2-Kernkorridors. |
| 178 | onr_v1_178_short-term-contract | Short-Term Contract | deferred | Counter-Lifecycle-/Auto-trash-Spezialfall bleibt Folgegate. |
| 179 | onr_v1_179_silicon-saloon-franchise | Silicon Saloon Franchise | freigabefähig | Kernkorb V1.7.2; action-economy-Modifier über installierte Resource-Action (Klick -> Credit+Draw). |
| 183 | onr_v1_183_technician-lover | Technician Lover | deferred | R&D-look/Reveal-Spezialpfad bleibt Folgegate. |
| 207 | onr_v1_207_netwatch-operations-office | Netwatch Operations Office | deferred | Scored-Agenda-Trace-Aktivierung auf V1.8.0 verschoben. |
| 213 | onr_v1_213_private-cybernet-police | Private Cybernet Police | deferred | Scored-Agenda-Trace-Aktivierung auf V1.8.0 verschoben. |
| 236 | onr_v1_236_data-raven | Data Raven | deferred | Counter-Abhängigkeit zu V1.8.1 laut Detailplanung. |
| 240 | onr_v1_240_fang | Fang | deferred | Run-lock-Folgezustand „cannot run again until pay“ bleibt Folgegate. |
| 241 | onr_v1_241_fang-2-0 | Fang 2.0 | deferred | Run-lock-Folgezustand „cannot run again until pay“ bleibt Folgegate. |
| 243 | onr_v1_243_fetch-4-0-1 | Fetch 4.0.1 | deferred | Bereits in V1.2.3 freigegeben; keine zusätzliche V1.7.2-Releaseaufnahme. |
| 251 | onr_v1_251_jack-attack | Jack Attack | deferred | Jack-out-Lock-Effekt bleibt Folgegate. |
| 260 | onr_v1_260_pocket-virtual-reality | Pocket Virtual Reality | deferred | Counter-Abhängigkeit zu V1.8.1 laut Detailplanung. |
| 264 | onr_v1_264_rex | Rex | deferred | Run-lock-Folgezustand „cannot run again until pay“ bleibt Folgegate. |
| 271 | onr_v1_271_tko-2-0 | TKO 2.0 | deferred | Offener Mechanikhinweis (`geprüft`), persistenter Action-Loss-Effekt fehlt. |
| 283 | onr_v1_283_audit-of-call-records | Audit of Call Records | freigabefähig | Kernkorb V1.7.2; trace-basierte Tag-Line mit Last-Turn-Run-Attempt-Gate. |
| 284 | onr_v1_284_chance-observation | Chance Observation | freigabefähig | Kernkorb V1.7.2; trace-basierte Tag-Line mit Last-Turn-Run-Attempt-Gate. |
| 286 | onr_v1_286_corporate-detective-agency | Corporate Detective Agency | freigabefähig | Kernkorb V1.7.2; tagged runner -> deterministic resource trash without additional costs. |
| 299 | onr_v1_299_power-grid-overload | Power Grid Overload | deferred | Variable Hardware-Destruction (`X`) bleibt Folgegate. |
| 306 | onr_v1_306_trojan-horse | Trojan Horse | deferred | Bereits in V1.2.3 freigegeben; keine zusätzliche V1.7.2-Releaseaufnahme. |

## Deferred-Regel

Karten außerhalb des Kernkorbs bleiben in V1.7.2 deferred, wenn mindestens eine Bedingung gilt:

- zusätzliche Abhängigkeit zu V1.8.0 (Agenda-/Scored-Static-Folgepfade)
- zusätzliche Abhängigkeit zu V1.8.1 (Counter/Virus/Purge-Folgepfade)
- offener Mechanikhinweis (`geprüft`)
- bereits in früherem Release freigegeben (kein doppelter Runtime-Release)
- verbleibender Spezialeffekt außerhalb des deterministischen V1.7.2-Kernkorridors

## Offene-Mechanik-Entscheidung in V1.7.2

- `onr_v1_271_tko-2-0`: deferred (offener Mechanikhinweis `geprüft`, persistenter Action-Loss-Effekt nicht im Kernrelease).
- `onr_v1_236_data-raven`: deferred (Counter-/Persistent-Tag-Abhängigkeit zu V1.8.1).
