---
activityId: act-2026-05-17-cinderella-trace-break-cost-reconstruction
status: done
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Cinderella|Replicator break only trace\""
  - "corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts app/chronicle.test.ts -t \"Cinderella|breaker pump|overlay\" --passWithNoTests"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "git diff --check"
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

- [x] Reproduktion dokumentiert, ob ein Logikfehler oder ein UI-Missverständnis vorliegt.
- [x] Bei Logikfehler ist Credit-/Kostenabzug side- und state-korrekt behoben.
- [x] Bei UI-Fehler benennt der Dialog aktuelles ICE, Subroutine und Kosten klar.
- [x] Chronik trennt Trace-Ergebnis, Karteneffekt, Break-Kosten und gebrochene Subroutine.
- [x] Regression deckt mindestens erfolgreichen und nicht erfolgreichen Trace ab.

## Umsetzungshinweise

- Nach `trace_open_bidding_alignment` keine Rückkehr zu altem verdecktem Trace-Modell einführen.

## Ergebnisnotiz

Reproduktion ergab keinen generellen Trace-Regel-Rollback-Bedarf: Ein abgewehrter Cinderella-Trace triggert keinen Hardware-Trash, keinen Meat Damage und kein Run-Ende; Runner-Creditverlust stammt aus dem freiwilligen Runner-Trace-Bid. Vor Trace-Auflösung sichtbare Break-Aktionen werden nach der aufgelösten Trace-Subroutine nicht mehr als LegalAction angeboten und ein alter ActionId wird durch `applyAction` abgelehnt.

Umgesetzt wurde die fehlende Darstellungsschärfe: Break-LegalActions und PublicPayloads enthalten jetzt side-sicher aktuelles ICE, Subroutine und Kosten; Run-Fenster-Labels nennen das konkrete ICE; die Chronik beschreibt Trace-Ergebnis/Karteneffekt und Break-Kosten/Subroutine getrennt.
