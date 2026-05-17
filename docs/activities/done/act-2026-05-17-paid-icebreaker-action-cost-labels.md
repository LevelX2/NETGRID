---
activityId: act-2026-05-17-paid-icebreaker-action-cost-labels
status: done
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
parallelWorker: worker-2
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts --passWithNoTests
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Icebreaker-Aktionen: Kosten im Button sichtbar machen

## Ziel

Bezahlte Icebreaker- und Fähigkeitsaktionen müssen ihre Kosten direkt im Dialog/Button anzeigen, damit Spieler vor Bestätigung wissen, was bezahlt wird.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Bei Icebreakern wie `Crash` ist nicht transparent genug sichtbar, dass das Brechen einer Subroutine 2 Credits kostet.
- Verwandt mit Cinderella-Prüfpunkt, aber als generisches UI-Label-Paket geschnitten.

## Scope

- Action-Button-/Choice-Label-Generierung für bezahlte Fähigkeiten prüfen.
- Kosten und Effektlabel zusammenführen, z. B. `2 Credits - Subroutine brechen`.
- Credits, Klicks, Trash/Sacrifice und andere vorhandene Kostenarten einheitlich darstellen.
- Fallback definieren, wenn Kosten nur aus Kartentext abgeleitet werden können.

## Nicht im Scope

- Keine Regeländerung an Icebreaker-Kosten.
- Kein kompletter Dialog-Redesign.

## Akzeptanzkriterien

- [x] Bezahlte Breaker-Aktionen zeigen Kosten direkt im Button oder der Auswahloption.
- [x] Kostenanzeige nutzt Daten aus LegalActions oder einem revalidierbaren Kostenpayload, nicht nur freien Kartentext.
- [x] Mehrere Kostenarten werden konsistent und kurz angezeigt.
- [x] UI-Tests oder fokussierter Render-Test decken mindestens Credits bei einem Icebreaker ab.

## Umsetzungshinweise

- Bei fehlenden Kostenmetadaten kann ein kleines Folgepaket für LegalAction-Cost-Metadata nötig sein.

## Ergebnisnotiz

Erledigt: Bezahlte Breaker- und Fähigkeitslabels bekommen jetzt einen kurzen Kostenpräfix aus `LegalAction.costs`, z. B. `2 Credits - Subroutine 1 brechen`. Mehrere vorhandene Kostenarten werden als `1 Aktion + 2 Credits - ...` zusammengeführt. Kostenlose Aktionen und Self-Modifying-Code bleiben unverändert; es wurden keine Icebreaker-Kosten, keine Legalität und kein Dialoglayout verändert.

Verifiziert mit fokussiertem Web-UI-Helper-Test für bezahlte Icebreaker-Credits, Mehrkosten und generische bezahlte Fähigkeiten sowie Web-Typecheck und `git diff --check`.

Offene Punkte: keine. Der aktuelle `Cost`-Vertrag enthält Credits und Klicks; Trash-/Sacrifice-Kosten werden nur dort direkt im Text geführt, wo sie bereits als revalidierbares Action-Label vorliegen.
