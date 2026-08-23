---
activityId: act-2026-08-22-scored-fort-diagnostic-terminology
status: inbox
kind: cleanup
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-08-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Scored-Fort-Diagnosen auf allgemeine Fort-Semantik präzisieren

## Ziel

Interne Diagnosen in der Scored-Fort-ICE-Stärkesequenz dort von „Remote“ auf
die tatsächlich allgemeine Fort-Semantik umstellen, wo der Vertrag auch
zentrale Forts zulässt.

## Kontext und Quellen

- Regel-Engine-Review Batch 4 vom 2026-08-22.
- `packages/engine/src/game/corp/scored-agenda/scored-fort-ice-strength-bonus-sequence.ts`
- Es wurde kein Regelfehler festgestellt; betroffen ist ausschließlich die
  Präzision technischer Diagnoseprosa.
- Aktivierungsauslöser: nächste fachliche Änderung dieser Sequenz oder ein
  gezielter kleiner Diagnose-Cleanup.

## Scope

- Betroffene Diagnosepfade gegen den tatsächlichen Server-/Fort-Vertrag
  prüfen.
- Nur sachlich falsche „Remote“-Bezeichnungen auf präzise englische
  Fort-/Server-Terminologie ändern.
- Direkte Diagnosetests aktualisieren, sofern sie den Text als Vertrag prüfen.

## Nicht im Scope

- Änderung von Zielauswahl, ICE-Stärkebonus oder Scored-Agenda-Ablauf.
- Allgemeine Übersetzungs- oder Error-Code-Migration.
- Änderung user-facing lokalisierter Texte außerhalb des betroffenen Pfads.

## Akzeptanzkriterien

- [ ] Diagnosebezeichnung entspricht dem tatsächlich zugelassenen Fort-Scope.
- [ ] Keine Regel-, Auswahl- oder Payload-Semantik wurde verändert.
- [ ] Angefasste interne Kommentare und Machine-Texte bleiben Englisch.
- [ ] Direkte Tests und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor Änderung prüfen, ob die Diagnose inzwischen bereits präzisiert wurde.
- Wenn der Text nutzerseitig sichtbar ist, nicht hardcodiert übersetzen,
  sondern an den bestehenden Präsentationsvertrag anbinden.

## Ergebnisnotiz

Noch offen.
