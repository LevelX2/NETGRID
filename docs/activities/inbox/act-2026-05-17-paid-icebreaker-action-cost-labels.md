---
activityId: act-2026-05-17-paid-icebreaker-action-cost-labels
status: inbox
kind: fix
area: ui
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Bezahlte Breaker-Aktionen zeigen Kosten direkt im Button oder der Auswahloption.
- [ ] Kostenanzeige nutzt Daten aus LegalActions oder einem revalidierbaren Kostenpayload, nicht nur freien Kartentext.
- [ ] Mehrere Kostenarten werden konsistent und kurz angezeigt.
- [ ] UI-Tests oder fokussierter Render-Test decken mindestens Credits bei einem Icebreaker ab.

## Umsetzungshinweise

- Bei fehlenden Kostenmetadaten kann ein kleines Folgepaket für LegalAction-Cost-Metadata nötig sein.

## Ergebnisnotiz

Noch offen.
