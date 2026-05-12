# V1.9.13 Detailed Plan - Damage, Prevention, Avoid und Replacement Longtail

Stand: 2026-05-13
Status: implementing
Primaerer Agent: release-implementation-agent

## Zielbild

V1.9.13 aktiviert genau den Damage-/Prevention-/Avoid-/Replacement-Longtail aus der V1.9.10-bis-V1.9.xx-Completion-Matrix. Der Release baut auf vorhandenen Damage-, Event-Modification-, Replacement-, Hidden-Zone-, Counter- und Core-Damage-Grundlagen auf und erweitert sie nur fuer die Zielkarten.

## Kartenliste

| Karte | ID | Seite | Typ | Primaerer Pfad |
| --- | --- | --- | --- | --- |
| Joan of Arc | `onr_v1_038_joan-of-arc` | Runner | Program | Damage prevention / avoid |
| Armored Fridge | `onr_v1_121_armored-fridge` | Runner | Hardware | Meat damage prevention, counters |
| Full Body Conversion | `onr_v1_127_full-body-conversion` | Runner | Hardware | Meat damage prevention |
| "Green Knight" Surge Buffers | `onr_v1_128_green-knight-surge-buffers` | Runner | Hardware | Net damage prevention, side-safe reveal |
| Lifesaver Nanosurgeons | `onr_v1_130_lifesaver-nanosurgeons` | Runner | Hardware | Core/brain damage mitigation |
| Nasuko Cycle | `onr_v1_135_nasuko-cycle` | Runner | Hardware | Prevention/avoid |
| R&D Interface | `onr_v1_139_r-and-d-interface` | Runner | Hardware | Prevention/avoid |
| Techtronica Utility Suit | `onr_v1_143_techtronica-utility-suit` | Runner | Hardware | Prevention/avoid |
| Code Viral Cache | `onr_v1_155_code-viral-cache` | Runner | Resource | Prevention/avoid, counters |
| Fall Guy | `onr_v1_161_fall-guy` | Runner | Resource | Prevention/avoid |
| Nomad Allies | `onr_v1_170_nomad-allies` | Runner | Resource | Prevention/avoid |
| Trauma Team | `onr_v1_185_trauma-team` | Runner | Resource | Meat damage prevention, counters |
| Umbrella Policy | `onr_v1_186_umbrella-policy` | Runner | Resource | Prevention/avoid |
| Wilson, Weeflerunner Apprentice | `onr_v1_187_wilson-weeflerunner-apprentice` | Runner | Resource | Meat damage prevention |
| Bolter Cluster | `onr_v1_224_bolter-cluster` | Corp | ICE | Net damage subroutine, side-safe reveal/counter |
| Data Darts | `onr_v1_234_data-darts` | Corp | ICE | Net damage subroutine, side-safe reveal |
| Neural Blade | `onr_v1_258_neural-blade` | Corp | ICE | Net damage subroutine, side-safe reveal/counter |

## Umsetzungsschnitte

1. Planungs- und Scope-Freeze:
   - Requirements, Spezifikation, Testmatrix und Requirements Review versionieren.
   - Keine Runtime-/Katalog-/AI-Promotion vor Engine- und Gate-Nachweis.

2. Engine-Baseline:
   - Zielkarten als Runtime-Definitionen vorbereiten.
   - Bestehende Damage-, Event-Modification- und Replacement-Fenster wiederverwenden.
   - LegalAction-only fuer Prevent/Avoid/Pass/Accept-Entscheidungen.

3. Side-sichere Sonderpfade:
   - Hidden-Zone-Bezuege nur ueber V1.9.11-Pfade.
   - Counter-Bezuege nur ueber V1.9.12-typed-counter-Vertraege.
   - Core-/Brain-Damage-Folgen nur ueber bestehende Handlimit-/Damage-State-Felder.

4. Releaseabschluss:
   - Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints und AI-Smokes erstellen.
   - Webclient-Version erst nach gruenem Gate auf `V1.9.13` anheben.
   - Final Review mit Visibility-, Replay-/StateHash-, stale-/illegal-action- und AI-Nachweis abschliessen.

## No-Scope

- Keine V1.9.14+-Karten.
- Keine generische `trigger_ability`-Freischaltung.
- Keine automatische KI-Freigabe ohne AI-Hints und AI-Smokes.
- Keine offiziellen Assets, externen Kartendatenbank-Abhaengigkeiten oder V2.x-Produktfeatures.
