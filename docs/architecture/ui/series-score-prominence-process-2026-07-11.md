# Prominentes Matchserien-Endergebnis – Prozess

Status: in_progress

Stand: 2026-07-11

Primärer Agent: small-adjustments-agent

Arbeitsbranch: `codex/series-score-prominence`

Arbeits-Worktree: `C:\Projekte\NETGRID_SERIES_SCORE_PROMINENCE`

## Quelle und Vorgabe

Im Ergebnisfenster einer abgeschlossenen Matchserie ist die eigentliche
Serienentscheidung über Matchpunkte derzeit nur als Teil einer kompakten
Detailzeile sichtbar. Im vorliegenden Beispiel lautet das maßgebliche Ergebnis
`15 : 11`, ist aber gegenüber Überschrift, Einzelspielwertung und Statistiken
visuell zu schwach.

Der Nutzer möchte das eigentliche Ergebnis der Matchserie als primäre
Ergebnisinformation deutlich prominenter sehen.

## Zielprüfung

Die Vorgabe ist für eine automatische, kleine UI-Umsetzung ausreichend präzise.

- Gesamtziel: Das Matchpunkte-Ergebnis einer abgeschlossenen Matchserie ist im
  Ergebnisfenster sofort als Ergebnis erkennbar.
- Reihenfolge: Prozessartefakt, UI-/Helper-Anpassung, fokussierte Tests,
  Abschlussprüfung, lokaler Merge.
- In Scope: `GameOverModal`, zugehörige reine UI-Helfer, Ergebnisfenster-CSS und
  fokussierte Webtests.
- Nicht-Ziele: Berechnung der Matchpunkte, Serien-Lifecycle, Engine, Server,
  Replay, StateHash, PlayerViews oder ein Redesign des gesamten Ergebnisfensters.
- Abnahme: Eine beendete Serie zeigt eine klar beschriftete, große
  `Endergebnis`-Anzeige im Format `<eigene Matchpunkte> : <gegnerische
  Matchpunkte>`; ergänzende Siege-, Draw- und Agenda-Angaben bleiben sekundär
  erhalten; kleine Viewports bleiben lesbar.

## Gesamtziel

Die bisher in der Detailzeile versteckten Matchpunkte werden bei einer
abgeschlossenen Serie in einen eigenen visuellen Ergebnisblock gehoben. Im
Beispiel muss `Endergebnis 15 : 11` auf den ersten Blick erfassbar sein. Der
Block trägt eine aussagekräftige `aria-label`-Beschreibung mit beiden
Teilnehmern und Matchpunktwerten.

## Annahmen

- Die Reihenfolge bleibt viewerbezogen: zuerst die lokale Person, danach die
  Gegenseite. Das entspricht der bestehenden `ApiSeriesResultSummary`-Semantik.
- Während einer noch nicht abgeschlossenen Serie darf derselbe Platz als
  `Zwischenstand` dienen; nur der Status `finished` erhält die Beschriftung
  `Endergebnis`.
- Der vorhandene Seriengewinner in der großen Überschrift bleibt bestehen. Die
  neue Anzeige ergänzt ihn um den entscheidenden Zahlenstand.
- Bestehende Änderungen im Hauptworkspace (`apps/web/next-env.d.ts` und lokale
  Server-Laufzeitdaten) sind fremd und bleiben unangetastet.

## Nicht-Ziele

- Keine Änderung an Matchpunkt- oder Agenda-Berechnungen.
- Keine Änderung an Seriengewinner, Seitenwechsel oder nächstem Serienspiel.
- Keine Änderung an Engine, Server, KI, LegalActions, Replay oder StateHash.
- Keine neue Grafik und kein umfassendes Redesign des Result Modals.
- Keine Anpassung der Ergebnisdarstellung in der Recent-Games-Liste.

## Controller-Invarianten

- Die vorhandenen Werte aus `ApiSeriesResultSummary` werden nur dargestellt,
  nicht neu berechnet.
- Die Rules Engine und der Server bleiben alleinige Autorität für das Ergebnis.
- Die Anzeige verwendet ausschließlich bereits side-sichere Ergebnisdaten.
- Seriengewinner und Matchpunktreihenfolge dürfen nicht vertauscht werden.
- Einzelspielwertung und Serienwertung bleiben sprachlich und visuell getrennt.
- Der Hauptworkspace wird erst für den finalen lokalen Merge verwendet.

## Automatische Fehlerbehandlung

- Falls ein bestehender Komponententest fehlt, wird die Anzeige über einen
  kleinen reinen Helper-Vertrag abgesichert und zusätzlich per Typecheck
  geprüft.
- Falls der frische Worktree keine Abhängigkeiten auflösen kann, werden die
  vorhandenen Abhängigkeiten des Hauptworkspaces über die projektübliche
  Installation beziehungsweise denselben pnpm-Store verfügbar gemacht.
- Falls CSS-Selektoren mit bestehenden Regeln kollidieren, werden sie eng auf
  den Serien-Ergebnisblock begrenzt.
- Rot laufende fokussierte Tests werden im aktiven Paket behoben; das Paket wird
  vorher nicht abgeschlossen.

## Sicherheitsblocker

Stop ohne Rückfrage, wenn:

- die gewünschte Anzeige nur durch Änderung der Serienwertung oder durch Zugriff
  auf nicht side-sichere Daten möglich wäre;
- parallele Änderungen auf `main` denselben Ergebnisvertrag fachlich
  widersprüchlich verändern;
- der finale Merge einen nicht sicher auflösbaren fachlichen Konflikt erzeugt.

Removal Condition: Blockerbericht mit betroffener Datei, Ursache, sicherer
Alternative und erforderlicher Nutzerentscheidung.

## State Machine

```text
UIPROM-00_process_artifact
  -> UIPROM-01_result_prominence
  -> integrate_main
  -> complete
```

Fehlerpfade:

```text
package_active -> package_debug -> package_active
package_active -> blocker_report -> stop
integrate_main -> conflict_review -> integrate_main
integrate_main -> blocker_report -> stop
```

## Paketfolge

### UIPROM-00: Prozessartefakt

Ziel: Den verbindlichen Scope, die Darstellung und die Abnahmegates festlegen.

Eingangsvoraussetzungen:

- Worktree `C:\Projekte\NETGRID_SERIES_SCORE_PROMINENCE` existiert.
- Branch `codex/series-score-prominence` ist aktiv.

Konkrete Arbeit:

- Dieses Prozessartefakt unter `docs/architecture/ui/` anlegen.
- UI-Vertrag, Nicht-Ziele, Sicherheitsgrenzen und Checks definieren.

Kernartefakt:

- `docs/architecture/ui/series-score-prominence-process-2026-07-11.md`

Tests/Checks:

- `git diff --check`

Done-Gate:

- Das Artefakt beschreibt Endzustand, Invarianten, Paketfolge und finalen Merge.

Commit-Message:

- `docs(ui): plan prominent series score result`

### UIPROM-01: Ergebnisdarstellung und Regressionstest

Ziel: Das Matchserien-Ergebnis als eigenen, prominenten Zahlenstand darstellen.

Eingangsvoraussetzungen:

- UIPROM-00 ist verifiziert und committed.

Konkrete Arbeit:

- Einen reinen UI-Helper für Beschriftung, Zahlenformat und zugängliche
  Beschreibung des Serienstands ergänzen.
- `GameOverModal` so strukturieren, dass der Matchpunktstand einen eigenen
  Ergebnisblock erhält.
- Doppelte Matchpunkte aus der sekundären Detailzeile entfernen; Siege, Draws
  und Agenda-Punkte dort erhalten.
- CSS für klare Hierarchie und responsive Darstellung ergänzen.
- Fokussierte Helper-Tests für `Endergebnis 15 : 11` und `Zwischenstand`
  ergänzen.
- Prozessstatus nach bestandenen Checks auf `completed` setzen.

Kernartefakte:

- `apps/web/app/result-modal-ui.ts`
- `apps/web/app/result-modal-ui.test.ts`
- `apps/web/features/results/GameOverModal.tsx`
- `apps/web/app/globals.css`
- dieses Prozessartefakt

Tests/Checks:

- `corepack pnpm --filter @netgrid/web exec vitest run app/result-modal-ui.test.ts`
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`

Done-Gate:

- Abgeschlossene Serien zeigen `Endergebnis` und den Matchpunktstand groß.
- Der Testfall `15 : 11` ist als primäres Endergebnis abgesichert.
- Noch offene Serien verwenden die Beschriftung `Zwischenstand`.
- Sekundärdetails bleiben erhalten und die UI bleibt auf kleinen Viewports
  lesbar.
- Alle fokussierten Checks sind grün.

Commit-Message:

- `feat(ui): emphasize final series score`

## Verifikationsregeln

- Nach jedem Paket `git diff --check` ausführen.
- Nur paketzugehörige Dateien stagen.
- Jedes abgeschlossene Paket separat committen.
- Vor dem finalen Merge fokussierten Webtest, Web-Typecheck und
  `git diff --check` erneut ausführen.
- Nicht ausgeführte Checks müssen mit Ursache und Risiko dokumentiert werden.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_SERIES_SCORE_PROMINENCE`.
- Branch: `codex/series-score-prominence`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für den finalen lokalen Merge nach
  `main` verwenden.
- Kein Push und kein Pull Request.
- Vor dem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls es
  weitergelaufen ist.
- Bevorzugt per Fast-Forward nach `main` mergen.
- Worktree erst nach erfolgreichem Merge und Main-Prüfung entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess für ein prominentes Matchserien-Endergebnis vollständig und sequenziell von UIPROM-00 bis UIPROM-01 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis und docs/architecture/ui/series-score-prominence-process-2026-07-11.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_SERIES_SCORE_PROMINENCE auf Branch codex/series-score-prominence.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage und schreibe einen Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Das eigentliche Serienergebnis ist im Result Modal visuell dominant und klar
  als `Endergebnis` beschriftet.
- Sekundäre Serieninformationen bleiben vorhanden.
- Fokussierter Test, Web-Typecheck und `git diff --check` sind grün.
- Beide Paketcommits liegen auf dem Arbeitsbranch.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Der Worktree ist entfernt.
- Engine-, Server-, Serienwertungs-, Replay- und StateHash-Verträge sind
  unverändert.
