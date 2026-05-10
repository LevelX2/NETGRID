# V1.9.1 Release Assignment Preflight

Stand: 2026-05-10  
Status: abgeschlossen (Scope-Freeze-Eingang)

## Datenbasis

- `docs/derived/V1_9_0_FINAL_REVIEW.md`
- `docs/derived/V1_9_1_TO_V1_9_8_OPEN_POINTS_GROBPLAN.md`
- `C:/Projekte/NETGRID/data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`

## Ergebnis

- Geplanter V1.9.1-Korb laut Grobplan: 3 Karten
- V1.9.1-Kern für dieses Gate: exakt 3 Karten
- Deferred aus V1.9.0 wird in V1.9.1 vollständig übernommen (kein Rest aus diesem Überhang)

## Kernkorb V1.9.1 (freigabefähig)

1. `onr_v1_013_cockroach`
2. `onr_v1_034_incubator`
3. `onr_v1_030_grubb`

## Abhängigkeitsbefund je Kernkarte

| Nr | CardId | Name | Primäre Mechaniklücke | Preflight-Entscheidung |
| --- | --- | --- | --- | --- |
| 013 | `onr_v1_013_cockroach` | Cockroach | HQ-Discard-Randomisierung ab Counter-Schwelle | freigabefähig in V1.9.1 |
| 034 | `onr_v1_034_incubator` | Incubator | Start-of-turn-Multiroll + Counter-Transform-Choice | freigabefähig in V1.9.1 |
| 030 | `onr_v1_030_grubb` | Grubb | remainder-of-run-Breaker-Stärke-Lifecycle | freigabefähig in V1.9.1 |

## Frozen Scope

In V1.9.1 werden nur die drei oben genannten Karten implementiert und freigegeben.  
Keine weiteren Karten aus der V1.9.2+ Linie werden vorgezogen.

## No-Scope-Bestätigung

- keine V2.x-Funktionen
- keine zusätzlichen Karten außerhalb des 3er-Kernkorbs
- kein automatischer AI-Support-Upgrade
