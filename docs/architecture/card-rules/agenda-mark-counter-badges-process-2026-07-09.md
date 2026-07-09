# Agenda Mark Counter Badges Prozess

Status: aktiv

Quelle/Vorgabe: Nach dem Project-Venice-Fix wurde geprüft, welche Agenda-bezogenen Mark-Counter noch ohne verständliche PlayerView-/UI-Erklärung bleiben. Gefunden wurden Project Zurich als Score-Area-Agenda-Mark-Counter und Ice Transmutation als Agenda-Effekt, der einen Mark-Counter auf gewähltes ICE legt.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung. Scope, Artefakte, Reihenfolge und Verifikation sind bestimmbar.

## Gesamtziel

Project Zurich und Ice Transmutation zeigen keine generischen `Mark-Counter` mehr, sondern fachlich erklärende Counter-Displays und UI-Badges mit Tooltip. Die Rules Engine bleibt Regelautorität; die UI rendert nur PlayerView-Daten.

## Annahmen

- Project Zurich speichert den Overadvance-Credit-Wert weiter intern als `mark`, weil der bestehende Start-of-turn-Resolver darauf basiert.
- Ice Transmutation legt weiterhin einen `mark` auf das gewählte ICE; die Erklärung erfolgt über eine spezifische PlayerView-ID statt über den generischen ICE-Mark-Fallback.
- Project Venice und Corporate Retreat bleiben unverändert.
- Die im Hauptworkspace vorhandenen ungetrackten Review-Dateien sind fremde Artefakte und bleiben unberührt.

## Nicht-Ziele

- Keine Neumodellierung der Counter-Typen im Shared-Schema.
- Keine Änderung an Project-Zurich-Timing oder Ice-Transmutation-Regelwirkung.
- Kein UI-Redesign der Kartenfläche.
- Kein Push, Pull Request oder Remote-Abschluss.

## Controller-Invarianten

- Engine-Korrektheit zuerst.
- PlayerView darf nur öffentliche oder für die betrachtende Seite sichtbare Informationen enthalten.
- UI darf keine Regelentscheidung aus Kartennamen neu berechnen.
- Fokussierte Tests sichern die neuen Display-IDs, Tooltips und vorhandene Wirkung.

## Automatische Fehlerbehandlung

Bei roten Tests wird eng am aktiven Paket debuggt. Wenn ein bestehender Test zeigt, dass ein Mark-Counter nicht aus einer Agenda-Wirkung stammt, wird dieser als Follow-up klassifiziert und nicht still in den Scope aufgenommen.

## Sicherheitsblocker

- Hidden-Info-Leak über PlayerView oder PublicEvent.
- Änderung an Score-/Start-of-turn-Regelwirkung außerhalb der Anzeige.
- Merge-Konflikt mit abweichendem Counter-Display-Vertrag.
- Broad Refactoring in CardView, CardBadges oder Scored-Agenda-Sequenzen.

## State Machine

1. `prepared`: Worktree und Prozessartefakt existieren.
2. `zurich-fixed`: Project Zurich hat spezifischen Score-Area-Badge und Tests.
3. `transmutation-fixed`: Ice Transmutation hat spezifischen ICE-Badge und Tests.
4. `integrated`: Arbeitsbranch ist lokal nach `main` gemerged und Worktree entfernt.

## Paketfolge

### AMB-1 Prozessartefakt

Ziel: Scope, Annahmen, Paketfolge und Checks versionieren.

Kernartefakte:
- `docs/architecture/card-rules/agenda-mark-counter-badges-process-2026-07-09.md`

Checks:
- `git diff --check`

Done-Gate:
- Prozessartefakt ist committed.

Commit-Message:
- `docs: add agenda mark counter badge process`

### AMB-2 Project Zurich Badge

Ziel: Project Zurich zeigt den gespeicherten Overadvance-Credit-Wert als erklärenden Score-Area-Badge statt als generischen Mark-Counter.

Kernartefakte:
- `packages/engine/src/game/view/card-view.ts`
- `packages/engine/src/index-tests/proteus/agenda-suite.test.ts`
- `apps/web/features/cards/CardBadges.tsx`
- `apps/web/app/action-board-ui.ts`
- `apps/web/app/action-board-ui.test.ts`
- `apps/web/app/globals.css`

Checks:
- fokussierter Project-Zurich-Vitest
- fokussierter Web-Tooltip-Vitest
- `git diff --check`

Done-Gate:
- PlayerView-ID ist Project-Zurich-spezifisch.
- Badge-Text macht Credits pro Corp-Zug verständlich.
- Bestehender Start-of-turn-Credit-Effekt bleibt unverändert.

Commit-Message:
- `fix(ui): label project zurich credit counter`

### AMB-3 Ice Transmutation Badge

Ziel: Das von Ice Transmutation markierte ICE zeigt einen erklärenden Stärke-/Subroutinen-Badge statt generischem ICE-Mark-Counter.

Kernartefakte:
- `packages/engine/src/game/view/card-view.ts`
- geeigneter Engine-Test für Ice Transmutation PlayerView
- `apps/web/features/cards/CardBadges.tsx`
- `apps/web/app/action-board-ui.ts`
- `apps/web/app/action-board-ui.test.ts`

Checks:
- fokussierter Ice-Transmutation- oder Mark-Modifier-Vitest
- fokussierter Web-Tooltip-Vitest
- Engine/Web-Typecheck
- `git diff --check`

Done-Gate:
- PlayerView-ID ist Ice-Transmutation-spezifisch.
- Tooltip erklärt +1 Stärke und Subroutine-Wiederholung.
- Stärkeberechnung bleibt unverändert.

Commit-Message:
- `fix(ui): label ice transmutation mark counter`

### AMB-4 Finale Integration

Ziel: Finale Checks, lokaler Merge nach `main`, Worktree entfernen.

Checks:
- alle fokussierten Pakettests erneut
- `@netgrid/engine typecheck`
- `@netgrid/web typecheck`
- `git diff --check`
- `git status --short`

Done-Gate:
- Arbeitsbranch sauber.
- Arbeitsbranch lokal nach `main` gemerged.
- Worktree entfernt.

Commit-Message:
- kein zusätzlicher Commit, sofern AMB-2 und AMB-3 vollständig sind.

## Verifikationsregeln

Fokussierte Tests sind Pflicht. Breitere Tests werden ergänzt, wenn Typecheck oder betroffene Dateien auf weitere Contracts hinweisen.

## Worktree-, Git- und Integrationsregeln

Arbeitsbranch: `codex/agenda-mark-counter-badges`

Worktree: `C:\Projekte\NETGRID_AGENDA_MARK_COUNTER_BADGES`

Der Hauptworkspace `C:\Projekte\NETGRID` wird erst beim finalen Merge genutzt. Je Paket werden nur paketbezogene Dateien gestaged und committed.

## Controller-Prompt-Kern

/Goal Arbeite Agenda Mark Counter Badges vollständig und sequenziell von AMB-1 bis AMB-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, relevante Bereichs-AGENTS und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AGENDA_MARK_COUNTER_BADGES` auf Branch `codex/agenda-mark-counter-badges`. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblockern mit Blocker-Report.

## Abschlusskriterien

- Project Zurich zeigt einen verständlichen Badge für wiederkehrende Credits pro Corp-Zug.
- Ice Transmutation markiertes ICE zeigt einen verständlichen Badge für die Mark-Wirkung.
- Keine generischen Agenda-bezogenen Mark-Counter aus diesen beiden Fällen bleiben übrig.
- Fokussierte Tests und Typechecks sind grün.
- Arbeitsbranch ist lokal in `main` integriert.
