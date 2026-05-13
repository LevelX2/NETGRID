# V1.9.22 Runner Program Implementation Preflight

Stand: 2026-05-13
Status: WIP-Preflight, keine Runtime-/Catalog-/AI-Promotion

## Befund

`data/rules/v1922-local-card-facts.json` enthaelt fuer 14 Runner-Programme lokale Kosten-/MU-/Effektkerne. Seit dem Shield-Schnitt vom 2026-05-14 bleibt die No-LegalAction-Absicherung fuer die verbleibenden 13 Programmkarten korrekt, weil die meisten Programmwirkungen zusaetzliche Timing-, Payment- oder Subroutine-Kategorien brauchen.

Die erneute historische Suche in `docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md`, `docs/derived/V1_0_5K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_9_22_RESOLVER_CONTRACT_MATRIX.md`, `data/rules/v1922-resolver-contracts.json` und `data/rules/v1922-resolver-contract-inventory.json` bestaetigt:

- `Shield` war historisch wegen Prevention-/Turn-Reset-Logik zurueckgestellt und ist inzwischen als enger WIP-Resolver über das bestehende Event-Modification-Prevention-Fenster umgesetzt.
- `Poltergeist` und `Scatter Shot` haben nur die Teilnotiz "hosted recurring credits fuer Trash-Kosten"; Pool-/Zahlungsumfang und Refresh-Timing bleiben offen.
- `Newsgroup Filter` hat keinen zusaetzlichen historischen Aktivierungsvertrag ueber den lokalen Effektkern hinaus.

## Kleinste Kandidaten

| Karte | Warum klein | Offener Vertrag |
| --- | --- | --- |
| `Newsgroup Filter` | Installkosten 5, MU 2, Effektkern "Gain 1 credit from installed program ability". | Aktivierungstiming, Klick-/Tap-/Once-per-turn-Kosten und PublicPayload der Programmaktion. |
| `Poltergeist` / `Scatter Shot` | Installkosten 0, MU 1, je 1 recurring restricted credit. | Restricted-Credit-Pool fuer Trash-Kosten und Refresh-Timing. |

## Nicht-kleine Kandidaten

- Breaker (`Flak`, `Hammer`, `Japanese Water Torture`, `Reflector`) brauchen Subroutine-Kategorien, Break-/Pump-Kosten und teils Folgeeffekte.
- Run-Reaktionskarten (`False Echo`, `Netspace Inverter`, `Speed Trap`, `Startup Immolator`) brauchen konkrete Triggerfenster und Ziel-/Reihenfolge-Vertraege.
- `Zetatech Software Installer` hat noch `installCost: null` und bleibt dadurch fachlich blockiert.

## Entscheidung

Kein weiterer Runner-Programm-Code in diesem Preflight. `docs/derived/V1_9_22_NEWSGROUP_FILTER_SLICE_PREFLIGHT.md` konkretisiert den kleinsten verbleibenden Programm-Kandidaten und haelt Code gesperrt, bis Aktivierungskosten, Timing und Limit lokal bestaetigt sind. Bis dahin bleiben die verbleibenden 13 Programmkarten aus `playable_mvp` und ohne `install_card`, `pump_breaker` oder `break_subroutine`-LegalActions.
