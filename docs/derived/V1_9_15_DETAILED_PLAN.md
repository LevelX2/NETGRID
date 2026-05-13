# V1.9.15 Detailed Plan - Run Flow, Access, Multiaccess und Ambush on Access

Stand: 2026-05-13
Status: implementing
Primaerer Agent: release-implementation-agent

## Zielbild

V1.9.15 aktiviert genau den Run-/Access-/Multiaccess-/Ambush-Slice aus der V1.9.10-bis-V1.9.xx-Completion-Matrix. Der Release baut auf den vorhandenen Run-, Breach-, Trace-, Hidden-Zone-, Counter-, Recurring- und Damage-Vertraegen auf und erweitert sie nur fuer die Zielkarten.

## Kartenliste

| Karte | ID | Seite | Typ | Primaerer Pfad |
| --- | --- | --- | --- | --- |
| Dupré | `onr_v1_020_dupre` | Runner | Program | Run-Locks, Counter |
| Expert Schedule Analyzer | `onr_v1_024_expert-schedule-analyzer` | Runner | Program | Access/Breach |
| Microtech AI Interface | `onr_v1_041_microtech-ai-interface` | Runner | Program | Access/Breach |
| Mystery Box | `onr_v1_043_mystery-box` | Runner | Program | Run, Hidden-Zone-Reveal |
| Shredder Uplink Protocol | `onr_v1_062_shredder-uplink-protocol` | Runner | Program | Run, Access/Breach |
| Smarteye | `onr_v1_065_smarteye` | Runner | Program | Run, Reveal |
| Lucidrine Booster Drug | `onr_v1_098_lucidrine-booster-drug` | Runner | Event | Run, Replacement/Avoid |
| Priority Wreck | `onr_v1_105_priority-wreck` | Runner | Event | Access/Breach |
| Social Engineering | `onr_v1_111_social-engineering` | Runner | Event | Run, Access/Breach |
| Stumble through Wilderspace | `onr_v1_112_stumble-through-wilderspace` | Runner | Event | Trace, Run, Access/Breach |
| Record Reconstructor | `onr_v1_142_record-reconstructor` | Runner | Hardware | Access/Breach, Hidden-Zone |
| Cerberus | `onr_v1_227_cerberus` | Corp | ICE | Trace, Run, Hidden-Zone, Damage, Recurring |
| Mastiff | `onr_v1_255_mastiff` | Corp | ICE | Trace, Run, Hidden-Zone, Damage, Core |
| New Blood | `onr_v1_294_new-blood` | Corp | Operation | Run/Recurring pressure |

## Umsetzungsschnitte

1. Scope-Freeze und Gate-Artefakte vorbereiten.
2. Runtime-Definitionen fuer die 14 Zielkarten ohne Promotion anlegen.
3. Run-/Access-Smokes fuer LegalAction-only Run-Start, Access-Queue, Multiaccess und Ambush/ICE-Folgen ergaenzen.
4. Ueberlappungen nur ueber bestehende Resolverfamilien nutzen: Trace V1.9.14, Hidden-Zone V1.9.11, Counter/Recurring V1.9.12 und Damage V1.9.13.
5. Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes, Webversion und Final Review erst nach gruenem Gate finalisieren.

## No-Scope

- Keine V1.9.16+-Karten.
- Keine generische `trigger_ability`-Freischaltung.
- Keine freie Karten-/Regeltextparser-Autoritaet.
- Keine offiziellen Assets, externen Kartendatenbank-Abhaengigkeiten oder V2.x-Produktfeatures.
