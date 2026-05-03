# MVP 0.5 Requirements Review

Status: pass  
Stand: 2026-05-03

## Review-Ergebnis

`ready_for_implementation: true`

V0.5 ist ausreichend klar für die Implementierung. Der Scope bleibt auf lokale Import-/Katalogdaten, Statusmodell, read-only API und funktionale Katalogansicht beschränkt.

## Geprüfte Gates

| Gate | Ergebnis | Notiz |
|---|---|---|
| Quellenentscheidung | pass | Nur lokale, versionierte Demo- und Katalog-Fixture-Daten. |
| Keine externen APIs | pass | Source Registry verbietet Runtime-Fetches. |
| Keine offiziellen Assets | pass | Asset-Felder werden nicht importiert oder verwendet. |
| Kartentext kein Parser | pass | `displayOnlyText: true` und Spezifikationsregel. |
| Import nicht spielbar | pass | Statusmodell trennt Import, Implementierung, Spielbarkeit und Decklegalität. |
| Testabdeckung | pass | Jede Must-Anforderung ist einer Testmatrix-ID zugeordnet. |
| V0.7 außerhalb Scope | pass | UI ist nur funktionaler Katalog, keine Neugestaltung. |

## Behobene Review-Punkte

- Das ursprüngliche Risiko, dass alle Snapshotkarten bereits spielbar sind, wurde durch zwei lokale Katalog-Fixtures entschärft.
- `blocked` ist ausführbar abbildbar über `catalog_preview_resource_001`.
- Nicht implementiert, aber katalogbereit ist ausführbar abbildbar über `catalog_preview_operation_001`.

## Annahmen

- Die lokalen fiktiven Katalog-Fixtures sind projektinterne Demo-Daten und keine externen Karten.
- V0.5 darf bestehende spielbare Demo-Karten im Katalog als `deck_legal` für den lokalen Demo-Kontext markieren. V0.6 führt daraus konkrete Formatprofile ab.
- Ältere Manifestabdeckung ohne explizite V0.4-Visibility-/Replay-Felder bleibt für die bestehenden V0.1-Karten gültig, solange die aktuelle Regression grün bleibt.

## Risiken

- Spätere externe Quellenentscheidung kann neue Lizenz- oder Datenfeldregeln erfordern.
- Statusbegriffe dürfen in V0.6 nicht mit vollständiger Formatlegalität verwechselt werden.
- Katalog-UI muss einfache funktionale Ergänzung bleiben und darf V0.7 nicht vorwegnehmen.

## Nächster Schritt

Phase 2: V0.5-Implementierung mit `packages/catalog`, read-only Katalog-API, funktionaler Katalogansicht und Tests.
