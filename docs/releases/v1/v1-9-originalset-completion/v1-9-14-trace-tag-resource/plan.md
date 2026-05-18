# V1.9.14 Detailed Plan - Trace, Link, Tags und Resource-Tag-Interaktionen

Stand: 2026-05-13
Status: implementing
Primaerer Agent: release-implementation-agent

## Zielbild

V1.9.14 aktiviert genau den Trace-/Link-/Tag- und Resource-Tag-Slice aus der V1.9.10-bis-V1.9.xx-Completion-Matrix. Der Release nutzt die vorhandenen Trace-/Tag-/Resource-Grundlagen und erweitert sie nur fuer die Zielkarten.

## Kartenliste

| Karte | ID | Seite | Typ | Primaerer Pfad |
| --- | --- | --- | --- | --- |
| Ramming Piston | `onr_v1_053_ramming-piston` | Runner | Program | Trace/Link |
| Replicator | `onr_v1_056_replicator` | Runner | Program | Trace/Link |
| Signpost | `onr_v1_063_signpost` | Runner | Program | Trace/Link, side-safe reveal |
| Total Genetic Retrofit | `onr_v1_116_total-genetic-retrofit` | Runner | Event | Tag avoidance / prevention |
| "Armadillo" Armored Road Home | `onr_v1_120_armadillo-armored-road-home` | Runner | Hardware | Tag avoidance, meat-damage overlap |
| "Drifter" Mobile Environment | `onr_v1_126_drifter-mobile-environment` | Runner | Hardware | Tag interaction |
| Microtech 'Trode Set | `onr_v1_132_microtech-trode-set` | Runner | Hardware | Trace/Link, net-damage overlap |
| Broker | `onr_v1_154_broker` | Runner | Resource | Resource-tag interaction |
| Crash Everett, Inventive Fixer | `onr_v1_157_crash-everett-inventive-fixer` | Runner | Resource | Resource action |
| Field Reporter for Ice and Data | `onr_v1_162_field-reporter-for-ice-and-data` | Runner | Resource | Resource action |
| Hell's Run | `onr_v1_164_hells-run` | Runner | Resource | Resource action |
| Junkyard BBS | `onr_v1_165_junkyard-bbs` | Runner | Resource | Resource action |
| Karl de Veres, Corporate Stooge | `onr_v1_166_karl-de-veres-corporate-stooge` | Runner | Resource | Resource action |
| Leland, Corporate Bodyguard | `onr_v1_167_leland-corporate-bodyguard` | Runner | Resource | Tag/damage protection |
| Short-Term Contract | `onr_v1_178_short-term-contract` | Runner | Resource | Resource action |
| The Springboard | `onr_v1_181_the-springboard` | Runner | Resource | Trace/Link, side-safe reveal |
| Technician Lover | `onr_v1_183_technician-lover` | Runner | Resource | Resource action |
| Asp | `onr_v1_221_asp` | Corp | ICE | Trace subroutine |
| Cinderella | `onr_v1_228_cinderella` | Corp | ICE | Trace and meat-damage overlap |
| Fang | `onr_v1_240_fang` | Corp | ICE | Trace / end-the-run |
| Fang 2.0 | `onr_v1_241_fang-2-0` | Corp | ICE | Trace |
| Homewrecker | `onr_v1_248_homewrecker` | Corp | ICE | Trace and meat-damage overlap |
| Pocket Virtual Reality | `onr_v1_260_pocket-virtual-reality` | Corp | ICE | Trace, tags, counters |
| Rex | `onr_v1_264_rex` | Corp | ICE | Trace |
| Power Grid Overload | `onr_v1_299_power-grid-overload` | Corp | Operation | Tag condition |

## Umsetzungsschnitte

1. Planungs- und Scope-Freeze:
   - Requirements, Spezifikation, Testmatrix und Requirements Review versionieren.
   - Keine Runtime-/Katalog-/AI-Promotion vor Engine- und Gate-Nachweis.

2. Engine-Baseline:
   - Zielkarten als Runtime-Definitionen vorbereiten.
   - Trace-/Link-/Bid-Fenster nur ueber LegalActions fuehren.
   - Tag- und Resource-Interaktionen eng typisieren.

3. Side-sichere Sonderpfade:
   - Hidden-Zone-Bezuege nur ueber V1.9.11-Pfade.
   - Damage-Ueberlappungen nur ueber V1.9.13-Pfade.
   - Counter-Bezuege nur ueber V1.9.12-typed-counter-Vertraege.

4. Releaseabschluss:
   - Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints und AI-Smokes erstellen.
   - Webclient-Version erst nach gruenem Gate auf `V1.9.14` anheben.
   - Final Review mit Visibility-, Replay-/StateHash-, stale-/illegal-action- und AI-Nachweis abschliessen.

## No-Scope

- Keine V1.9.15+-Karten.
- Keine generische `trigger_ability`-Freischaltung.
- Keine automatische KI-Freigabe ohne AI-Hints und AI-Smokes.
- Keine offiziellen Assets, externen Kartendatenbank-Abhaengigkeiten oder V2.x-Produktfeatures.
