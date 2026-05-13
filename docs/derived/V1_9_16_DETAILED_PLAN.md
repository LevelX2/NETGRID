# V1.9.16 Detailed Plan - Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy

Stand: 2026-05-13
Status: implementing
Primaerer Agent: release-implementation-agent

## Zielbild

V1.9.16 aktiviert genau den Program-Subtype-/Hosting-/Stealth-/Link-/Installed-card-Destroy-Slice aus der V1.9.10-bis-V1.9.xx-Completion-Matrix. Der Release baut auf den vorhandenen Install-, Trace/Link-, Hosting-, Recurring-, Damage- und Trash-Vertraegen auf und erweitert sie nur fuer die Zielkarten.

## Kartenliste

| Karte | ID | Seite | Typ | Primaerer Pfad |
| --- | --- | --- | --- | --- |
| Baedeker's Net Map | `onr_v1_003_baedekers-net-map` | Runner | Program | Base Link, Trace |
| Bakdoor | `onr_v1_004_bakdoor` | Runner | Program | Base Link, Trace |
| Imp | `onr_v1_033_imp` | Runner | Program | Daemon, Hosting |
| Invisibility | `onr_v1_035_invisibility` | Runner | Program | Stealth, Recurring |
| Pile Driver | `onr_v1_047_pile-driver` | Runner | Program | Icebreaker, Stealth |
| R&D-Protocol Files | `onr_v1_050_r-and-d-protocol-files` | Runner | Program | Stealth, Recurring |
| Vewy Vewy Quiet | `onr_v1_071_vewy-vewy-quiet` | Runner | Program | Stealth, Recurring |
| Raven Microcyb Eagle | `onr_v1_140_raven-microcyb-eagle` | Runner | Hardware | Stealth, Recurring |
| Raven Microcyb Owl | `onr_v1_141_raven-microcyb-owl` | Runner | Hardware | Stealth, Recurring |
| Access through Alpha | `onr_v1_148_access-through-alpha` | Runner | Resource | Base Link, Trace |
| Access to Arasaka | `onr_v1_149_access-to-arasaka` | Runner | Resource | Base Link, Trace |
| Access to Kiribati | `onr_v1_150_access-to-kiribati` | Runner | Resource | Base Link, Trace |
| Back Door to Hilliard | `onr_v1_152_back-door-to-hilliard` | Runner | Resource | Base Link, Trace |
| Back Door to Orbital Air | `onr_v1_153_back-door-to-orbital-air` | Runner | Resource | Base Link, Trace |
| Submarine Uplink | `onr_v1_182_submarine-uplink` | Runner | Resource | Base Link, Counter, Trace |
| Fragmentation Storm | `onr_v1_246_fragmentation-storm` | Corp | ICE | Trace, installed program trash, damage |

## Umsetzungsschnitte

1. Scope-Freeze und Gate-Artefakte vorbereiten.
2. Runtime-Definitionen fuer die 16 Zielkarten ohne Promotion anlegen.
3. Engine-Smokes fuer Installation, MU, Link-Beitrag, Stealth/Recurring-Pools, Hosting-Eligibility und Fragmentation-Storm-Encounter ergaenzen.
4. Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes, Webversion und Final Review erst nach gruenem Gate finalisieren.

## No-Scope

- Keine V1.9.17+-Karten.
- Keine generische `trigger_ability`-Freischaltung.
- Keine freie Karten-/Regeltextparser-Autoritaet.
- Keine offiziellen Assets, externen Kartendatenbank-Abhaengigkeiten oder V2.x-Produktfeatures.
