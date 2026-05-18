# V1.9.22 Runner Program Implementation Preflight

Stand: 2026-05-13
Status: WIP-Preflight, Newsgroup-Filter install-only umgesetzt, keine Catalog-/AI-Promotion

## Befund

`data/rules/v1922-local-card-facts.json` enthaelt fuer 14 Runner-Programme lokale Kosten-/MU-/Effektkerne. Seit den Shield-, install-only-, Breaker- und Zetatech-Schnitten vom 2026-05-14 bleibt nur noch der `Zetatech Software Installer`-Overlay-Vertrag als Runner-Programm-Vollvertragsluecke neben finaler Promotion offen.

Die erneute historische Suche in `docs/releases/v1/card-releases/v1-0-5k-card-release/requirements.md`, `docs/releases/v1/card-releases/v1-0-5k-card-release/implementation-review.md`, `docs/derived/V1_9_22_RESOLVER_CONTRACT_MATRIX.md`, `data/rules/v1922-resolver-contracts.json` und `data/rules/v1922-resolver-contract-inventory.json` bestaetigt:

- `Shield` war historisch wegen Prevention-/Turn-Reset-Logik zurueckgestellt und ist inzwischen als enger WIP-Resolver über das bestehende Event-Modification-Prevention-Fenster umgesetzt.
- `Poltergeist` und `Scatter Shot` haben nur die Teilnotiz "hosted recurring credits fuer Trash-Kosten"; Pool-/Zahlungsumfang und Refresh-Timing bleiben offen.
- `Newsgroup Filter` hat keinen zusaetzlichen historischen Aktivierungsvertrag ueber den lokalen Effektkern hinaus; daher ist nur der Installationsvertrag umgesetzt, nicht die Credit-Gain-Faehigkeit.
- `False Echo` und `Netspace Inverter` haben install-only WIP-Vertraege; ihre erfolgreichen-Run-Faehigkeiten bleiben bis zu Trigger-, Sequenz- und PublicPayload-Bestaetigung ohne LegalAction.
- `Poltergeist`, `Rabbit`, `Scatter Shot`, `Speed Trap` und `Startup Immolator` haben install-only WIP-Vertraege; ihre Recurring-Credit-, Trace-Modifier-, Interrupt- oder Post-Break-Faehigkeiten bleiben bis zu spezifischen Verträgen ohne LegalAction.

## Kleinste Kandidaten

| Karte | Warum klein | Offener Vertrag |
| --- | --- | --- |
| `Newsgroup Filter` | Installkosten 5, MU 2 und `[A]: Gain 2 Credits` sind als Runtime-WIP umgesetzt. | Finale AI-/Catalog-/Release-Promotion. |
| `Poltergeist` / `Scatter Shot` | Installkosten 0, MU 1. `Poltergeist` hat 2 recurring restricted Credits fuer Node-Trash-Kosten; `Scatter Shot` hat 2 recurring restricted Credits fuer Upgrade-Trash-Kosten. | Restricted-Credit-Pool fuer Trash-Kosten und Refresh-Timing. |

## Nicht-kleine Kandidaten

- Breaker (`Flak`, `Hammer`, `Japanese Water Torture`, `Reflector`) brauchen Subroutine-Kategorien, Break-/Pump-LegalActions und teils Folgeeffekte. Alle vier haben durch Nutzerklaerung vom 2026-05-14 jetzt bestaetigte Installkosten, Staerke, Breaker-Kosten, Subroutine-Taxonomie und Standard-Breaker-Vertrag. `Hammer` verliert beim Hammer-Break insgesamt bis zu 2 von Stealth-Karten, mit Runner-Verteilung falls mehrere Quellen verfuegbar sind. `Japanese Water Torture`-Aktionsschuld bleibt ueber Zugwechsel bestehen, bis die naechsten X normalen Runner-Aktionen verloren wurden.
- Run-Reaktionskarten (`False Echo`, `Netspace Inverter`, `Speed Trap`, `Startup Immolator`) brauchen konkrete Triggerfenster und Ziel-/Reihenfolge-Vertraege.
- `Zetatech Software Installer` hat durch Nutzerklaerung vom 2026-05-14 Installkosten 0 und MU 1; restricted Recurring Credits fuer Programminstallationen und Runner-Zugstart-Refresh sind als nicht-promotender Runtime-WIP umgesetzt. Fachlich offen bleibt der Overlay-Vertrag.

## Entscheidung

Kein weiterer Runner-Programm-Code in diesem Preflight ausser dem spaeter umgesetzten `Newsgroup Filter`-Gain-2-Schnitt. `docs/derived/V1_9_22_NEWSGROUP_FILTER_SLICE_PREFLIGHT.md` dokumentiert den geschlossenen Runtime-WIP-Vertrag fuer Installation plus `[A]: Gain 2 Credits`. Die uebrigen install-only-Programme bleiben ability-gated. Nach den Nutzerklaerungen vom 2026-05-14 sind `Flak`, `Hammer`, `Japanese Water Torture` und `Reflector` fachlich bereit fuer enge nicht-promotende Runtime-Schnitte; offen ist dort die Code-/Testumsetzung mit Visibility und Replay/StateHash.
