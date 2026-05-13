# V1.9.12 Detailed Plan - Counter, Virus, Purge und Recurring Pools

Stand: 2026-05-12
Status: implementing
Primaerer Agent: release-implementation-agent

## Zielbild

V1.9.12 aktiviert die Counter-, Virus-/Purge- und Recurring-Pool-Familien fuer genau elf lokale O:NR-v1-Originalset-Karten. Der Release baut auf den bereits vorhandenen V0.99-, V1.7.0-, V1.8.1- und V1.9.1-Pfaden auf und erweitert sie nur so weit, wie es fuer die Zielkarten noetig ist.

## Kartenliste

| Karte | ID | Seite | Typ | Primaerer Pfad |
| --- | --- | --- | --- | --- |
| Butcher Boy | `onr_v1_009_butcher-boy` | Runner | Program | Virus-Counter, Purge, Recurring |
| Cascade | `onr_v1_010_cascade` | Runner | Program | Virus-Counter, Purge, Recurring |
| Deep Thought | `onr_v1_017_deep-thought` | Runner | Program | Virus-Counter, Purge, Recurring |
| I Spy | `onr_v1_032_i-spy` | Runner | Program | Counter + Hidden-Zone-Reveal |
| Skivviss | `onr_v1_064_skivviss` | Runner | Program | Virus-Counter, Purge, Recurring |
| Deal with Militech | `onr_v1_082_deal-with-militech` | Runner | Event | Counter + Hidden-Zone-Reveal |
| Hunt Club BBS | `onr_v1_091_hunt-club-bbs` | Runner | Event | Counter + Hidden-Zone-Reveal |
| Rigged Investments | `onr_v1_174_rigged-investments` | Runner | Resource | Recurring-Pool |
| The Shell Traders | `onr_v1_176_the-shell-traders` | Runner | Resource | Recurring-Pool + Counter |
| Detroit Police Contract | `onr_v1_198_detroit-police-contract` | Corp | Agenda | Scored Counter-/Credit-Pool |
| Employee Empowerment | `onr_v1_199_employee-empowerment` | Corp | Agenda | Start-of-turn/Recurring Economy |

## Umsetzungsschnitte

1. WIP-Planung und Engine-Baseline:
   - Requirements, Spezifikation, Testmatrix und Requirements Review versionieren.
   - Runtime-Definitionen fuer alle elf Karten anlegen.
   - Bestehende `purge_virus_counters`-, `recurring_credit`- und Counter-Helfer wiederverwenden.
   - Keine finale Katalog-/AI-Promotion vor Completion-Gate.

2. Typed Counter/Recurring Resolver:
   - Runner-Install setzt definierte Virus-/Recurring-Counter deterministisch.
   - Runner-Start-of-turn refresht Recurring-Pools ohne Akkumulation.
   - Corp-Purge entfernt nur Virus-Counter und bleibt LegalAction-only.
   - Scored Corp-Agendas nutzen eng typisierte Counter-/Credit-Pfade statt generischer Abilities.

3. Hidden-Zone-Sonderfaelle:
   - I Spy, Deal with Militech und Hunt Club BBS duerfen nur vorhandene V1.9.11-Hidden-Zone-Helfer nutzen.
   - Oeffentliche Payloads enthalten keine verdeckten Kartenidentitaeten, sofern die Karte nicht regelkonform revealed wird.

4. Releaseabschluss:
   - Manifest, Mechanics-Coverage, Release-Smoke, AI-Hints und AI-Smokes erstellen.
   - Catalog/Webclient-Version erst nach gruenem Gate auf V1.9.12 anheben.
   - Final Review mit Tests, Visibility, Replay/StateHash, Server/Web und No-Promotion-Nachweis abschliessen.

## No-Scope

- Keine V1.9.13+-Karten.
- Keine generische `trigger_ability`-Freischaltung.
- Keine automatische KI-Freigabe ohne AI-Hints und AI-Smokes.
- Keine V2.x-Produktfeatures, offiziellen Assets oder externen Kartendatenbank-Abhaengigkeiten.

