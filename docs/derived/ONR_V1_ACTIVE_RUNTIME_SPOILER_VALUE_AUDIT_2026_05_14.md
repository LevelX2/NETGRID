# O:NR v1 Active Runtime Spoiler Value Audit 2026-05-14

Status: aktive Runtime-Karten gegen lokale Spoilertexte abgeglichen, eindeutige Werte korrigiert

## Quellen

- `docs/source/Runnerspoiler 1.0.txt`
- `docs/source/Corpspoiler 1.0.txt`

## Ergebnis

Der Audit deckt die 327 Karten aus dem exportierten `ONR_V1_RUNTIME_RELEASE_CARD_IDS` ab. Nach Parser-Normalisierung fuer Sonderzeichen, TM/R-Marker und fehlerhafte `Card Title:Operation`-Zeilen wurden 327/327 aktiven Karten den Spoilerquellen zugeordnet. Der erweiterte Abgleich prueft 581 einzelne Wertfelder.

Gepruefte Felder:

- Runner: Play-Kosten, Installkosten, MU, Staerke.
- Corp: Operation-Kosten, Agenda-Difficulty/Agenda-Punkte, ICE-Rez-Kosten/Staerke, Asset-/Node-/Upgrade-Rez- und Trash-Kosten.
- Zusaetzlich nachgezogen: eindeutige ICE-Subtypes und Trace-Staerken, wo der Runtime-Testpfad sie direkt nutzt.

Nach Korrektur: 0 offene maschinenlesbare Wertabweichungen fuer die aktiven Runtime-Karten.

## Korrigierte Schwerpunktwerte

Die breite Korrektur betrifft unter anderem:

- `The Shell Traders`: Installkosten 0.
- Runner-Events wie `Custodial Position`, `Executive Wiretaps`, `Gideon's Pawnshop`, `MIT West Tier`, `Hunt Club BBS`, `Hot Tip for WNS`, `Jack 'n' Joe`, `Livewire's Contacts`.
- Runner-Programme und Breaker wie `Afreet`, `Dogcatcher`, `Dropp`, `Force Shield`, `Joan of Arc`, `Self-Modifying Code`, `Ramming Piston`, `Replicator`, `Dupré`, `Microtech AI Interface`, `Shredder Uplink Protocol`.
- Runner-Hardware/Resources wie `Armored Fridge`, `Full Body Conversion`, `Nasuko Cycle`, `The Shell Traders`, `Umbrella Policy`, `Wilson, Weeflerunner Apprentice`, `Broker`, `Short-Term Contract`, `The Springboard`, `Record Reconstructor`.
- Corp-Agendas/Operations wie `Corporate Downsizing`, `Detroit Police Contract`, `Employee Empowerment`, `Superior Net Barriers`, `Overtime Incentives`, `New Blood`.
- Corp-Assets/Nodes/Upgrades wie `ACME Savings and Loan`, `Blood Cat`, `Braindance Campaign`, diverse City Grids, `Turbeau Delacroix` und weitere aktive Rez-/Trash-Werte.
- ICE-Werte/Subtypes/Trace-Staerken wie `Asp`, `Banpei`, `Bolter Cluster`, `Cerberus`, `Cinderella`, `Data Darts`, `Data Raven`, `Fang`, `Fang 2.0`, `Homewrecker`, `Ice Pick Willie`, `Mastiff`, `Neural Blade`, `Pocket Virtual Reality`, `Rex`, `Too Many Doors`.
- Spaetere aktive Runtime-Karten aus V1.9.16 bis V1.9.21 wie `Baedeker's Net Map`, `Bakdoor`, `Imp`, `Pile Driver`, `Fragmentation Storm`, `Fait Accompli`, `Management Shake-Up`, `Project Consultants`, `Militech MRAM Chip`, `Corporate Boon`, `AI Boon`, `Boardwalk` und `Quest for Cattekin`.

## Nachgezogene Schichten

- Engine-Definitionen: `packages/shared/src/index.ts`
- Catalog-Zahlenbasis und Tests: `packages/catalog/src/index.ts`, `packages/catalog/src/index.test.ts`
- Engine-Tests/Runtime-Erwartungen: `packages/engine/src/index.test.ts`
- Side-sicherer Hammer-PublicPayload-Nachweis: `packages/engine/src/index.ts`

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: 301 Tests gruen.
- `v1-9-install-and-check.ps1 -Task catalog`: 44 Tests gruen.
- `v1-9-install-and-check.ps1 -Task typecheck`: gruen.

## Grenzen

Dieser Audit bestaetigt und korrigiert numerische/typisierte Kartenattribute. Er ist keine Release-Promotion und ersetzt nicht die V1.9.22-Resolververtraege fuer noch offene Spezialeffekte.
