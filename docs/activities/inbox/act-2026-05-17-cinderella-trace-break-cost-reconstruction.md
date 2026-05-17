---
activityId: act-2026-05-17-cinderella-trace-break-cost-reconstruction
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
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

# Cinderella: Trace, Creditverlust und Break-Kosten klären

## Ziel

Der Encounter mit `Cinderella` muss eindeutig zwischen Trace-Ergebnis, ICE-Effekt, freiwilligen Break-Kosten, aktuellem ICE und betroffener Subroutine unterscheiden.

## Kontext und Quellen

- Nutzerprüfpunkt vom 2026-05-17: Trace war offenbar nicht erfolgreich; danach wirkten 2 Credits abgezogen, zugleich erschien noch eine 2-Credit-Break-Option.
- Befund ist noch kein gesicherter Regelbug, sondern braucht Nachstellung.
- Lokaler Kartenanker: `onr_v1_228_cinderella`.

## Scope

- Erfolgreichen und nicht erfolgreichen Cinderella-Trace nachstellen.
- Chronik und UI auf getrennte Darstellung von Trace, Credit-/Damage-/Trash-Effekt und Break-Kosten prüfen.
- Break-Dialog um aktuelles ICE und konkrete Subroutine ergänzen, falls diese Information fehlt.
- Prüfen, ob veraltete Break-Optionen nach Trace-/Subroutine-Auflösung sichtbar bleiben.

## Nicht im Scope

- Keine generelle Trace-Regeländerung ohne Quellenkonflikt.
- Keine Icebreaker-Kostenanzeige für alle Karten; dafür gibt es ein separates Paket.

## Akzeptanzkriterien

- [ ] Reproduktion dokumentiert, ob ein Logikfehler oder ein UI-Missverständnis vorliegt.
- [ ] Bei Logikfehler ist Credit-/Kostenabzug side- und state-korrekt behoben.
- [ ] Bei UI-Fehler benennt der Dialog aktuelles ICE, Subroutine und Kosten klar.
- [ ] Chronik trennt Trace-Ergebnis, Karteneffekt, Break-Kosten und gebrochene Subroutine.
- [ ] Regression deckt mindestens erfolgreichen und nicht erfolgreichen Trace ab.

## Umsetzungshinweise

- Nach `trace_open_bidding_alignment` keine Rückkehr zu altem verdecktem Trace-Modell einführen.

## Ergebnisnotiz

Noch offen.
