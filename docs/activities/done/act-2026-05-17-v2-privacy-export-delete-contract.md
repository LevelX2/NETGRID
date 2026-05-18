---
activityId: act-2026-05-17-v2-privacy-export-delete-contract
status: done
kind: architecture
area: docs
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.0
blockedBy: []
resultArtifacts:
  - docs/releases/v2/v2-0-auth-privacy-cloud-decks/privacy-export-delete-contract.md
checks:
  - git diff --check
---

# V2.0 Datenschutz-Export-/Löschvertrag spezifizieren

## Ziel

Für V2.0 soll ein konkreter Export-, Lösch- und Retention-Vertrag entstehen, bevor Accountdaten, Cloud-Decks oder accountgebundene Replays implementiert werden.

## Kontext und Quellen

- `docs/releases/v2/v2-0-auth-privacy-cloud-decks/auth-privacy-decision-spike.md`
- Bestehende private Replay-Exports in `apps/server/src/multiplayer.ts`
- Bestehende Storage-/Maintenance-Redaction in `apps/server/src/storage-sqlite.ts`

## Scope

- Definieren, welche eigenen Accountdaten exportiert werden dürfen.
- Definieren, welche Daten nie exportiert werden: Tokens, Token-Hashes, FullState, Hidden Cards, gegnerische private Deckdaten, `AIInput`, `DecisionDebug`, lokale Pfade.
- Löschsemantik für Accountprofil, Cloud-Decks, Display-Namen, Replay-Index, Sessiondaten und aktive Matches festlegen.
- Retention-Aussage für Backups, Logs und Match-Historie formulieren.
- Tests oder Review-Checks für Export-/Löschpayloads skizzieren.

## Nicht im Scope

- Keine Export-/Lösch-Implementierung.
- Keine Rechtsberatung und keine fertige Datenschutzerklärung.
- Keine Public-Replay-, Spectator- oder Moderationsfunktion.
- Keine Änderung an Engine, StateHash, Replay-Determinismus oder KI.

## Akzeptanzkriterien

- [x] Exportinhalt und Exportverbote sind tabellarisch dokumentiert.
- [x] Löschung und Anonymisierung sind für Accountprofil, Cloud-Decks, Sessions und Match-Metadaten getrennt.
- [x] Backup-/Log-Retention ist ehrlich als Retention statt Sofortlöschung beschrieben.
- [x] Side-sichere Replay-Exports bleiben von `local_analysis`, FullState und Hidden-Info getrennt.
- [x] KI-Debug und AIInput bleiben ausdrücklich nicht exportierbar.

## Umsetzungshinweise

- Primärer Folgeagent: `architecture-review-agent`.
- Kann nach Abschluss in kleine Implementierungspakete für Export, Löschung und Testharness zerlegt werden.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/v2/v2-0-auth-privacy-cloud-decks/privacy-export-delete-contract.md` definiert Exportmatrix, Exportverbote, Lösch-/Anonymisierungssemantik, Retention-Vorschläge und Review-/Testchecks. Der Vertrag bestätigt, dass Account-Löschung Account- und Metadaten behandelt, aber historische Engine-Events, Replay-StateHash, `AIInput` und `DecisionDebug` nicht verändert oder exportiert.
