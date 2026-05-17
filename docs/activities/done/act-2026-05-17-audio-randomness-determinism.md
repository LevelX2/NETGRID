---
activityId: act-2026-05-17-audio-randomness-determinism
status: done
kind: cleanup
area: web
priority: low
primaryAgent: small-adjustments-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/activities/done/act-2026-05-17-audio-randomness-determinism.md
checks:
  - rg -n "Math\\.random|createBuffer\\(|playCardDrawSnap|AudioContext" apps/web/app/page.tsx apps/web/app/action-cues.test.ts apps/web/app/action-cues.ts
---

# Client-Audio-Rauschen bei Bedarf deterministisch machen

## Ziel

Die nicht-deterministische Nutzung von `Math.random` im reinen Client-Audio-Pfad soll als niedrige Nacharbeit dokumentiert bleiben. Umsetzung ist nur nötig, wenn Audio-Regressionstests, deterministische UI-Demos oder reproduzierbare Audio-Smokes eingeführt werden.

## Kontext und Quellen

- Architektur-Check-Finding vom 2026-05-17: Client-Audio erzeugt nicht-deterministische Rauschanteile.
- Betroffener Anker: `apps/web/app/page.tsx` ca. Zeile 11628.
- Risiko: Kein Engine-Replay-Risiko, weil der Pfad nur UI-Audio betrifft. Es kann aber Audio-/UI-Testreproduzierbarkeit stören.

## Scope

- Prüfen, ob der Audio-Rauschpfad aktuell in Tests oder Demos relevant ist.
- Falls nötig, deterministische lokale UI-Randomness für Audio einführen oder Audio-Smokes entsprechend stabilisieren.
- Klar dokumentieren, dass Engine-Replay, StateHash und Rules Engine nicht betroffen sind.

## Nicht im Scope

- Keine Änderung an Engine-Randomness, RandomCounter oder RandomDrawRecords.
- Keine Änderung an Replay, StateHash oder PublicEvents.
- Keine Audio-Neugestaltung.
- Keine Priorisierung vor echten Gameplay-/Hidden-Info-/KI-Findings.

## Akzeptanzkriterien

- [ ] Entweder ist dokumentiert, warum keine Umsetzung nötig ist, oder der Audio-Rauschpfad ist für Tests/Demos deterministisch stabilisiert.
- [ ] Engine-Replay und StateHash bleiben unberührt.
- [ ] Falls Code geändert wird, ist ein kleiner Audio-/Web-Smoke ausgeführt oder die Testauslassung begründet.

## Umsetzungshinweise

- Niedrige Priorität. Nur greifen, wenn Audio-Testbarkeit konkret relevant wird.
- Eine lokale seedbare UI-Hilfsfunktion wäre ausreichend; keine Verbindung zur Engine-Randomness herstellen.

## Ergebnisnotiz

Erledigt ohne Codeaenderung. Der relevante nicht-deterministische Pfad ist weiterhin nur `playCardDrawSnap` im lokalen Client-Audio: Dort fuellt `Math.random` einen kurzlebigen NoiseBuffer fuer den Kartenzieh-Snap. Das beruehrt weder Engine-Randomness noch Replay, StateHash, RandomCounter, RandomDrawRecords oder PublicEvents. Aktuell gibt es keine Audio-Smokes, deterministischen UI-Demos oder Snapshot-Tests, die diesen Rauschpfad auswerten; deshalb waere eine seedbare UI-Randomness jetzt zusaetzliche Komplexitaet ohne konkreten Nutzen. Falls spaeter Audio-Regressionstests entstehen, reicht eine lokale seedbare Hilfsfunktion nur fuer den Web-Audio-Pfad.
