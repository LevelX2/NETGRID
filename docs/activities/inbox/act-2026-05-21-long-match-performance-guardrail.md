---
activityId: act-2026-05-21-long-match-performance-guardrail
status: inbox
kind: cleanup
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Long-Match-Performance-Guardrail ergänzen

## Ziel

Die langen-Match-Optimierungen sollen einen reproduzierbaren Guardrail bekommen, damit künftige Änderungen nicht wieder unbegrenzt wachsende State-, Snapshot- oder Payload-Kosten einführen.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-05-21: Zugverarbeitung wird bei langen Spielen spürbar langsamer.
- Bereits umgesetzt oder geplant: kompakte State-Blobs, separate Engine-Events, Bestandssnapshot-Kompaktierung, inkrementelle Eventwrites, Payload-Verschlankung.
- Aktuelle Tests sichern Funktionalität, aber nur begrenzt Größenwachstum und Lastverhalten langer Matches.

## Scope

- Einen fokussierten Test- oder Script-Guardrail für lange Matches definieren.
- Messen oder prüfen:
  - `record_json` bleibt klein,
  - `game_states.game_state_json` enthält keine eingebettete Event-Historie,
  - neue `state_snapshots.game_state_json` wachsen nicht linear mit der gesamten Event-Historie,
  - normale SidePayloads bleiben begrenzt, sobald das Payload-Paket umgesetzt ist.
- Der Guardrail soll deterministisch und CI-tauglich sein oder klar als lokaler Smoke markiert werden.
- Ergebnis im passenden Log oder Testkommentar knapp dokumentieren.

## Nicht im Scope

- Kein großer Benchmark-Framwork-Aufbau.
- Keine fragilen Wallclock-Grenzwerte als harte Tests, sofern sie lokal stark schwanken können.
- Keine Änderung an Engine-Regeln, Replay, StateHash oder Hidden-Info-Grenzen.

## Akzeptanzkriterien

- [ ] Es gibt einen wiederholbaren Guardrail für lange Match-Historien.
- [ ] Der Guardrail erkennt wieder eingebettete Event-Historie in State-/Snapshot-Blobs.
- [ ] Wo Timing gemessen wird, ist die Messung als Smoke/Diagnose eingeordnet und nicht flaky.
- [ ] Die relevanten Performance-Annahmen sind knapp im Ergebnis dokumentiert.
- [ ] Checks: abhängig vom gewählten Ort mindestens `corepack pnpm --filter @netgrid/server test` oder ein klar benannter lokaler Smoke-Befehl.

## Umsetzungshinweise

- Bevorzugt Größen- und Strukturchecks statt Millisekunden-Grenzen.
- Ein kleines Testfixture mit künstlich verlängerter Event-Historie reicht, solange Replay/StateHash nicht verfälscht wird.
- Dieses Paket kann nach den Implementierungspaketen abgeschlossen werden oder als erstes einen Baseline-Guardrail schaffen.

## Ergebnisnotiz

Noch offen.
