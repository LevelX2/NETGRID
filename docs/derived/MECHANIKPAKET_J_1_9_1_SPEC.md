# Mechanikpaket J 1.9.1 Spezifikation

Stand: 2026-05-10  
Status: eingefroren

## Scope

1. Deferred-Aufloesung fuer exakt drei Karten: `Cockroach`, `Incubator`, `Grubb`.
2. Deterministische Resolverpfade fuer Random-/Counter-/Run-Persistenz im 3er-Kern.
3. Replay-/StateHash-/Visibility-stabile Integration in bestehende Turn- und Encounter-Vertraege.

## Nicht-Scope

1. Keine V1.9.2-Hidden-Zone-/Access-Breite.
2. Keine V1.9.3-Trace-/Tag-/Resource-Breite.
3. Keine V1.9.4-Damage-/Prevention-Breite.
4. Keine V2.x-Produktfeatures.

## Kartenvertrag V1.9.1

| CardId | Karte | Vertragskern |
| --- | --- | --- |
| `onr_v1_013_cockroach` | Cockroach | deterministischer HQ-Discard-/Counter-Kontext ohne Leak |
| `onr_v1_034_incubator` | Incubator | deterministischer Start-of-turn-/Counter-Transform-Choice |
| `onr_v1_030_grubb` | Grubb | remainder-of-run Breaker-Strength-Lifecycle |

## Engine-Vertrag

### 1) Deterministische Random-Pfade

- Jeder Randompfad nutzt `seed` + `randomCounter` + purpose-gebundene Records.
- Kein direkter unprotokollierter Zufallszugriff.

### 2) Counter-/Transform-Vertraege

- Counter-Aenderungen laufen ausschliesslich ueber legal validierte Actions/Resolver.
- Transform-/Consume-Pfade bleiben idempotent und replaybar.

### 3) Run-Persistenz

- Remainder-of-run-Zustaende werden explizit gesetzt und am Run-Ende sauber entfernt.
- Keine Persistenz ueber Turn-/Run-Grenzen hinaus ohne expliziten Vertrag.

## Visibility-/Replay-Vertrag

1. Keine Hidden-Info-Leaks in PlayerViews/PublicEvents/Reconnect/Undo/Errors.
2. Replay erzeugt bei gleichem Seed identische StateHashes.
3. DecisionDebug bleibt auf sichtbare Fakten begrenzt.

## Deferred-Hinweis

- Karten ausserhalb des 3er-Kerns bleiben in V1.9.1 deferred.
- `Data Naga`, `TKO 2.0`, `Data Darts`, `Data Raven`, `Dupre` werden nicht implizit vorgezogen.
