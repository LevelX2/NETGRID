# MVP 0.1 Requirements Review

Stand: 2026-05-03T09:25:10+02:00  
Reviewer: Codex Root Agent, ohne Subagents gemaess Nutzeranweisung

## Ergebnis

`ready_for_implementation: true`

Phase 1 ist reviewfähig abgeschlossen. Die Derived-Artefakte, Datenartefakte, Szenario-Fixtures und die Testmatrix bilden den MVP-0.1-Scope ab, ohne MVP-0.2-Funktionalität vorzuziehen.

## Prüfpunkte

| Gate | Status | Nachweis |
|---|---|---|
| Jede konkrete Requirement hat stabile ID. | pass | `docs/releases/mvp/mvp-0-1-local-core/requirements.md` enthält REQ-001 bis REQ-045. |
| Jedes Must ist auf Test oder Szenario abgebildet. | pass | `docs/releases/mvp/mvp-0-1-local-core/test-matrix.md`, `docs/releases/mvp/mvp-0-1-local-core/acceptance-criteria.md`; Coverage-Check ohne fehlende Must-IDs. |
| Jede `playable_mvp` Karte hat Unit- und Szenario-/Integrationstest-Zuordnung. | pass | `data/manifests/card-implementation-manifest.json` und Kartenabdeckung in `docs/releases/mvp/mvp-0-1-local-core/test-matrix.md`. |
| Jede Regelabweichung ist dokumentiert. | pass | `docs/releases/mvp/mvp-0-1-local-core/deviation-registry.md` als konsolidierte historische Abweichungsdokumentation. |
| Jede Unklarheit hat deterministische MVP-Annahme. | pass | `docs/releases/mvp/mvp-0-1-local-core/open-questions.md`. |
| Konflikte zwischen Quellen sind sichtbar gemacht. | pass | `docs/releases/mvp/mvp-0-1-local-core/conflict-matrix.md`. |
| Keine Implementierung vor Phase-1-Gate. | pass | Nur Docs, JSON-Artefakte und Test-TODO aktualisiert; kein Engine-/UI-/Server-/KI-Code. |
| JSON-Artefakte sind syntaktisch gültig. | pass | Lokaler Node-Parse-Check fuer 11 JSON-Dateien erfolgreich. |

## Annahmen

- Demo-Partien verwenden `agendaPointsToWin = 6`, weil das feste Corp-Demo-Deck nur 6 Agenda Points enthält.
- Mulligan, Jack-out, Multiaccess, Tags, Trace, Damage, Viren, Hosting, Prevention, Replacement und Interrupts bleiben außerhalb MVP 0.1.
- Full-State-Debug bleibt nur lokal/serverintern und ist kein normaler PlayerView-/UI-Payload.
- Konkrete StateHashes in Szenarien werden erst nach der ersten grünen Engine-Implementierung persistiert.

## Risiken

- Die 6-Punkte-Demo-Siegbedingung ist bewusst abweichend von der offiziellen 7-Punkte-Siegbedingung und muss bei Deck-Erweiterung überprüft werden.
- Die Run-State-Machine ist der höchste Implementierungsrisiko-Bereich.
- Visibility-Tests müssen früh implementiert werden, weil UI, KI und später MVP 0.2 auf diesen Filtern aufbauen.

## Nächster Schritt

Phase 2 starten: MVP-0.1-Implementierung gemäß Derived-Artefakten, beginnend mit Shared Types, Engine-Basismodell, deterministischem Setup, StateHash und Validierung.
