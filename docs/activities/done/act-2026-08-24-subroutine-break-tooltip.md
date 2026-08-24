# ACT-2026-08-24: Subroutinentext am Break-Button anzeigen

Status: done

## Quelle/Vorgabe

Nutzerwunsch vom 24.08.2026: Während eines Runs soll beim Überfahren einer
Aktion wie `Breaker: Subroutine 1 brechen` der Text genau dieser Subroutine im
Tooltip erscheinen, damit ähnlich benannte Break-Aktionen nicht verwechselt
werden.

## Zielprüfung

Der Endzustand ist präzise bestimmbar. Die Änderung betrifft ausschließlich
die Darstellung bereits legaler `break_subroutine`-Aktionen im Run-Fenster.
Engine-Regeln, LegalActions, Kosten, Ziele und Action-Ausführung bleiben
unverändert.

## Gesamtziel

Bei jeder einzelnen oder gebündelten `break_subroutine`-Aktion im Run-Fenster
zeigt der vorhandene Hover-/Fokus-Tooltip die sichtbaren Texte der durch die
Action adressierten Subroutinen. Bei fehlender oder nicht eindeutig bindbarer
sichtbarer Textquelle wird kein fachlich erfundener Ersatztext angezeigt.

## Annahmen

- Das im Run-Fenster bereits angereicherte, bekannte Encounter-ICE ist die
  maßgebliche sichtbare Textquelle.
- `subroutineIndex` beziehungsweise `subroutineIndexes` aus dem strukturierten
  Action-Payload binden die angezeigte Break-Aktion an die Textzeile.
- Eine einzelne Subroutine wird ohne den technischen Marker `[Subroutine]`
  angezeigt; mehrere gebündelte Subroutinen werden eindeutig nummeriert.
- Das bestehende `data-tooltip`-Verhalten deckt Hover und Tastaturfokus ab.

## Nicht-Ziele

- Keine Änderung an Engine, LegalAction-Erzeugung oder Break-Kosten.
- Keine neue Ableitung aus `actionId` oder freiem Action-Label.
- Keine allgemeine Neugestaltung von Tooltips oder des Run-Fensters.
- Keine Rekonstruktion verdeckter oder nicht im PlayerView vorhandener Texte.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Die UI verwendet ausschließlich strukturierte Payload-Indizes und den
  bekannten, side-sicheren `VisibleCard`-Text.
- Der Klickpfad reicht dieselbe unveränderte `LegalAction` ein.
- Ohne exakt bindbare sichtbare Textzeile bleibt der Tooltip aus; der
  Action-Button selbst bleibt unverändert bedienbar.

## Automatische Fehlerbehandlung

- Ungültige, doppelte oder außerhalb des sichtbaren Textes liegende Indizes
  werden nicht geraten oder aus dem Label rekonstruiert.
- Ein fehlender Tooltip blockiert keine legale Break-Aktion.
- Neue Unsicherheiten werden als Follow-up dokumentiert und erweitern dieses
  kleine UI-Paket nicht still.

## Sicherheitsblocker

Die Umsetzung stoppt, falls der gewünschte Text nur aus einer privilegierten
oder verdeckten Datenquelle bezogen werden könnte. Removal Condition: eine
side-sichere, strukturierte PlayerView-Projektion stellt die benötigte
Subroutinenbindung bereit.

## State Machine

`prepared -> implementing -> verified -> integrated -> cleaned`

- Genau ein Paket ist aktiv.
- Ein Paket wechselt erst nach Checks, `git diff --check` und Commit weiter.
- Ein rotes Done-Gate verhindert den Wechsel zum nächsten Paket.

## Paketfolge

### P01 – Prozess und Datenweg festlegen

- Ziel: Scope, Invarianten, Datenquelle und Done-Gates verbindlich festhalten.
- Eingangsvoraussetzung: sauberer Worktree auf aktuellem lokalem `main`.
- Kernartefakt: dieses Activity-Paket.
- Check: Dokumentprüfung und `git diff --check`.
- Done-Gate: Prozessartefakt committed.
- Commit: `docs(activity): define subroutine break tooltip package`

### P02 – Tooltip implementieren und testen

- Ziel: Den Text der adressierten sichtbaren Subroutine am Break-Button im
  Run-Fenster anzeigen.
- Eingangsvoraussetzung: P01 abgeschlossen.
- Kernartefakte: `apps/web/app/action-board-ui.ts`,
  `apps/web/features/game-board/RunTimelineOverlay.tsx`, direkt angrenzender
  Web-Test.
- Checks: fokussierter Vitest für die Ableitung und `git diff --check`.
- Done-Gate: Einzel- und Mehrfachbindung sowie fail-closed-Verhalten sind grün.
- Commit: `feat(web): show subroutine text on break actions`

### P03 – Paket abschließen und integrieren

- Ziel: Evidence ergänzen, direkt änderungsnahe Checks final wiederholen,
  lokal nach `main` integrieren und Arbeitsartefakte sauber entfernen.
- Eingangsvoraussetzung: P02 abgeschlossen und Worktree sauber.
- Kernartefakt: dieses Activity-Paket im `done`-Status.
- Checks: fokussierter Vitest, `git diff --check`, Git-/Cleanup-Prüfungen.
- Done-Gate: Commit auf Arbeitsbranch, lokaler Main-Merge, Main sauber,
  Worktree entfernt und Branch gelöscht.
- Commit: `docs(activity): complete subroutine break tooltip package`

## Verifikationsregeln

- Standard ist der kleinste direkt änderungsnahe Vitest.
- Ein Paket-Typecheck wird nur ergänzt, falls sich eine Typoberfläche ändert.
- Kein vorsorglicher Workspace-, Build-, E2E- oder AI-Gesamtlauf.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_SUBROUTINE_BREAK_TOOLTIP`
- Branch: `codex/subroutine-break-tooltip`
- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für den finalen Merge.
- Jedes Paket erhält einen eigenen Commit.
- Vor dem Merge wird ein weitergelaufenes `main` defensiv eingebunden.
- Nach erfolgreichem Merge werden Worktree und gemergter Branch entfernt und
  ihre Entfernung in Git und Dateisystem verifiziert.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite ACT-2026-08-24 vollständig und sequenziell von P01 bis P03 ab,
zeige für sichtbare break_subroutine-Aktionen den exakt gebundenen sichtbaren
Subroutinentext im bestehenden Tooltip, verifiziere ausschließlich direkt
änderungsnah, committe jedes Paket, merge den Arbeitsbranch lokal nach main und
markiere das Goal erst nach verifiziertem Worktree- und Branch-Cleanup als
complete.`

## Abschlusskriterien

- Einzelne Break-Aktionen zeigen den Text der adressierten Subroutine.
- Gebündelte Break-Aktionen zeigen alle adressierten Texte eindeutig.
- Nicht-Break-Aktionen und nicht bindbare Daten erhalten keinen neuen
  fachlichen Tooltip.
- Die eingereichte Action bleibt unverändert.
- Fokussierte Tests, Diff-Prüfung, Main-Integration und Cleanup sind grün.

## Fortschritt und Evidence

- P01 abgeschlossen: Prozess, Scope und fail-closed Datenbindung festgelegt;
  `git diff --check` grün; Commit `4c2f79a9b`.
- P02 abgeschlossen: Der Run-Button bindet den Tooltip über ICE-ID,
  strukturierte Subroutinenindizes, optional die Subroutinen-ID und die
  effektive sichtbare Subroutinenliste. `[Subroutine]`- und Legacy-`*`-Marker,
  Einzel-/Mehrfachaktionen, falsche Bindungen und unvollständige Textlisten
  sind im fokussierten Test abgedeckt.
- P02-Checks: `action-board-ui.test.ts` grün (133 Tests), Prettier grün und
  `git diff --check` grün.
- Der ergänzend ausgeführte Web-Typecheck stoppt an einem unabhängigen
  Baseline-Fehler in `app/ai-turn-plan-comparison-ui.test.ts`: Das bestehende
  Fixture enthält die inzwischen erforderlichen Felder `executionOrigin` und
  `selectedStep` nicht. Der geänderte Tooltip-Pfad meldet keinen Typfehler.
- P03 fachlich abgeschlossen: Die direkt änderungsnahen Checks wurden nach
  Formatierung erneut grün ausgeführt. Der lokale Main-Abgleich, Merge und
  verifizierte Cleanup folgen als Integrationsschritte desselben Pakets.
