# MVP 0.92 Final Review

Status: bestanden
Stand: 2026-05-03

## Gate-Ergebnis

`MVP_0.92_done: true`

`ready_for_MVP_0.93_implementation: true`

V0.92 ist abgeschlossen. Das Mechanik-Inventar liegt als Markdown- und JSON-Artefakt vor, M1 ist als implementierbares Effect-/Ability-/Timing-/Choice-/Eventklassifikationsfundament eingefroren, und V0.93 hat eine konkrete Testmatrix.

## Dateien

Erstellt:

- `docs/derived/MVP_0.92_REQUIREMENTS.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.92.json`
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`
- `docs/derived/MECHANIC_M1_TEST_MATRIX.md`
- `docs/derived/MVP_0.92_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.92_FINAL_REVIEW.md`

Aktualisiert:

- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`
- `tests/specs/phase1-artifacts.test.ts`

## Wichtige Entscheidungen

- V0.91 ist als private lokale Scan-/Asset-Entscheidung eingeordnet.
- V0.91 blockiert V0.92/V0.93-Mechanikarbeit nicht.
- Private lokale Bilder bleiben reine Anzeige-Artefakte und duerfen nicht in Engine, KI, GameState, LegalActions, PlayerActions, PublicEvents, Replays, Logs oder StateHash gelangen.
- V0.93 darf `pendingChoice` additiv vorbereiten.
- V0.93 darf Breaker Pump/Break intern als Ability-Pilot migrieren, muss aber die sichtbaren Action Types kompatibel halten.
- M2 wird in V0.93 nur spezifiziert, nicht implementiert.

## Nicht begonnen

- Keine Engine-Implementierung in V0.92.
- Keine Kartenbildimplementierung.
- Keine neuen spielbaren Karten.
- Keine V0.94+-Mechanik.

## Naechster Schritt

V0.93: M1-Shared-/Engine-Grundlage implementieren, bestehende Regressionen erhalten und M2-Requirements fuer Setup/Game-End erstellen.
