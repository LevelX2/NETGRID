# V1.7.1 Release Assignment Preflight

Stand: 2026-05-09  
Status: abgeschlossen (Requirements-Freeze Eingang)

## Datenbasis

- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- `docs/releases/v1/v1-7-1-mechanikpaket-e/plan-to-v1-8-1.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`

## Ergebnis

- Geplanter V1.7.1-Korb laut Matrix: 48 Karten
- Als V1.7.1-Kern implementiert: 5 Karten
- Deferred in V1.7.1: 43 Karten

## Kernkorb (freigabefähig)

1. `onr_v1_114_temple-microcode-outlet`
2. `onr_v1_106_private-ldl-access`
3. `onr_v1_118_weather-to-finance-pipe`
4. `onr_v1_084_edited-shipping-manifests`
5. `onr_v1_129_hq-interface`

## Freigabe-Matrix je Karte

| Nr | CardId | Name | Entscheidung | Begründung |
| --- | --- | --- | --- | --- |
| 020 | onr_v1_020_dupre | Dupré | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 024 | onr_v1_024_expert-schedule-analyzer | Expert Schedule Analyzer | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 032 | onr_v1_032_i-spy | I Spy | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 041 | onr_v1_041_microtech-ai-interface | Microtech AI Interface | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 042 | onr_v1_042_mouse | Mouse | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 043 | onr_v1_043_mystery-box | Mystery Box | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 052 | onr_v1_052_raffles | Raffles | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 058 | onr_v1_058_seeya | SeeYa | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 059 | onr_v1_059_self-modifying-code | Self-Modifying Code | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 062 | onr_v1_062_shredder-uplink-protocol | Shredder Uplink Protocol | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 063 | onr_v1_063_signpost | Signpost | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 065 | onr_v1_065_smarteye | Smarteye | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 076 | onr_v1_076_all-nighter | All-Nighter | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 081 | onr_v1_081_custodial-position | Custodial Position | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 082 | onr_v1_082_deal-with-militech | Deal with Militech | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 084 | onr_v1_084_edited-shipping-manifests | Edited Shipping Manifests | freigabefähig | Kernkorb V1.7.1; deckt Hidden-Zone-Search und/oder Run/Access-Erweiterung ohne Folgegate-Abhängigkeit. |
| 085 | onr_v1_085_executive-wiretaps | Executive Wiretaps | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 087 | onr_v1_087_forgotten-backup-chip | Forgotten Backup Chip | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 088 | onr_v1_088_fortress-respecification | Fortress Respecification | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 089 | onr_v1_089_gideons-pawnshop | Gideon's Pawnshop | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 091 | onr_v1_091_hunt-club-bbs | Hunt Club BBS | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 092 | onr_v1_092_ice-and-datas-guide-to-the-net | Ice and Data's Guide to the Net | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 096 | onr_v1_096_kilroy-was-here | Kilroy Was Here | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 099 | onr_v1_099_mantis-fixer-at-large | Mantis, Fixer-at-Large | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 101 | onr_v1_101_mit-west-tier | MIT West Tier | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 105 | onr_v1_105_priority-wreck | Priority Wreck | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 106 | onr_v1_106_private-ldl-access | Private LDL Access | freigabefähig | Kernkorb V1.7.1; deckt Hidden-Zone-Search und/oder Run/Access-Erweiterung ohne Folgegate-Abhängigkeit. |
| 107 | onr_v1_107_romp-through-hq | Romp through HQ | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 110 | onr_v1_110_sneak-preview | Sneak Preview | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 111 | onr_v1_111_social-engineering | Social Engineering | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 112 | onr_v1_112_stumble-through-wilderspace | Stumble through Wilderspace | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 114 | onr_v1_114_temple-microcode-outlet | Temple Microcode Outlet | freigabefähig | Kernkorb V1.7.1; deckt Hidden-Zone-Search und/oder Run/Access-Erweiterung ohne Folgegate-Abhängigkeit. |
| 118 | onr_v1_118_weather-to-finance-pipe | Weather-to-Finance Pipe | freigabefähig | Kernkorb V1.7.1; deckt Hidden-Zone-Search und/oder Run/Access-Erweiterung ohne Folgegate-Abhängigkeit. |
| 129 | onr_v1_129_hq-interface | HQ Interface | freigabefähig | Kernkorb V1.7.1; deckt Hidden-Zone-Search und/oder Run/Access-Erweiterung ohne Folgegate-Abhängigkeit. |
| 142 | onr_v1_142_record-reconstructor | Record Reconstructor | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 151 | onr_v1_151_aujourdoui | Aujourd'Oui | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 169 | onr_v1_169_n-e-t-o | N.E.T.O. | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 175 | onr_v1_175_ronin-around | Ronin Around | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 177 | onr_v1_177_the-short-circuit | The Short Circuit | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 181 | onr_v1_181_the-springboard | The Springboard | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 188 | onr_v1_188_ai-chief-financial-officer | AI Chief Financial Officer | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 189 | onr_v1_189_artificial-security-directors | Artificial Security Directors | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 194 | onr_v1_194_corporate-downsizing | Corporate Downsizing | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 202 | onr_v1_202_genetics-visionary-acquisition | Genetics-Visionary Acquisition | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 235 | onr_v1_235_data-naga | Data Naga | deferred | Offener Mechanikhinweis (`geprüft`), vor Freeze nicht freigabefähig. |
| 249 | onr_v1_249_hunter | Hunter | deferred | Folgeabhängigkeit außerhalb V1.7.1 laut Effektzuordnung. |
| 250 | onr_v1_250_ice-pick-willie | Ice Pick Willie | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |
| 272 | onr_v1_272_too-many-doors | Too Many Doors | deferred | Nicht im freigabefähigen Kernkorridor; Resolver-/Testfokus auf deterministischem E-Kern. |

## Deferred-Regel

Karten außerhalb des Kernkorbs bleiben in V1.7.1 deferred, wenn mindestens eine Bedingung gilt:

- zusätzliche Abhängigkeit zu V1.7.2 (Trace/Tag/ActionEconomy/BaseLink)
- zusätzliche Abhängigkeit zu V1.8.0 (Agenda-Static/Overadvance)
- zusätzliche Abhängigkeit zu V1.8.1 (Counter/Virus/Purge)
- zusätzliche Abhängigkeit zu V1.9.0 (deterministischer Würfelzufall)
- offener Mechanikhinweis (`geprüft`) oder fehlende kernrelease-taugliche Resolver-/Testschnittstelle

## Offene-Mechanik-Entscheidung in V1.7.1

- `onr_v1_020_dupre`: deferred (zusätzliche V1.8.1-Counterabhängigkeit und `geprüft`-Hinweis).
- `onr_v1_235_data-naga`: deferred (`geprüft`-Hinweis; resolvernahe Präzisierung bleibt Folgegate).
