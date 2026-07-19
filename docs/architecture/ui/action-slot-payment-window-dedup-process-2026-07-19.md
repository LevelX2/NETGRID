# Aktionsslot-Deduplizierung bei Bezahlfenstern

## Status

- Prozess: in Bearbeitung
- Aktives Paket: P03
- Paketstand: P01–P02 abgeschlossen; P03 aktiv; P04 ausstehend
- Rote Evidence: fokussierter Web-Testlauf mit 653 grünen und genau einer
  roten Assertion (`expected 5 to be 4`) auf unverändertem Produktionscode.
- Branch: `codex/ui-action-slot-dedup`
- Worktree: `C:\Projekte\NETGRID_UI_ACTION_SLOT_DEDUP`

## Quelle und Vorgabe

Im aktiven Match `match_ca7b2adac169c642` zeigte die Runner-Aktionsleiste fünf
Aktionsslots, obwohl die Engine nach drei verbrauchten Aktionen korrekt noch
eine von vier Aktionen auswies. Eine durch `Swiss Bank Account` unterbrochene
und fortgesetzte `Finders Keepers`-Aktion erzeugte zwei öffentliche Events mit
demselben Aktionsordinal und jeweils `actionCostClicks: 1`.

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung präzise. Der Fehler ist auf die
Web-UI-Rekonstruktion der Aktionskapazität begrenzt. Engine-Regeln,
LegalActions, Kartenauflösung und Eventpersistenz bleiben unverändert.

## Gesamtziel

Die Aktionsleiste zählt eine bezahlte Aktion über ein eingeschobenes
Bezahl-Supportfenster hinweg genau einmal. Echte zusätzliche Aktionen bleiben
weiterhin sichtbar. Der Fehler wird durch eine fokussierte Regression
abgesichert, lokal verifiziert und nach `main` integriert.

## Annahmen

- `turnActionOrdinalStart` und `turnActionOrdinalEnd` sind innerhalb eines
  Zuges die führende öffentliche Identität verbrauchter Aktionsplätze.
- Wiederholte Events mit demselben Ordinalbereich beschreiben denselben
  Aktionsverbrauch und dürfen die Slotkapazität nicht erhöhen.
- Events ohne belastbare Ordinalfelder verwenden weiterhin die bestehende
  additive Rückfalllogik über `actionCostClicks`.

## Nicht-Ziele

- Keine Änderung an Engine-, Karten- oder Bezahlfensterlogik.
- Keine Änderung an Chronicle-Gruppierung oder Eventpersistenz.
- Kein allgemeines Refactoring des Action Boards.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die UI bleibt reine Darstellung und keine Regelautorität.
- `currentClicks` stammt weiterhin aus der PlayerView.
- Die Basiskapazität bleibt Runner 4, Corp 3.
- Echte Bonusaktionen vergrößern die Kapazität weiterhin korrekt.
- Genau ein Paket ist gleichzeitig aktiv; kein Paket wird übersprungen.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden nur im aktuellen Paket untersucht.
- Eine unerwartete Engine- oder Eventvertragsänderung wird als Gap
  klassifiziert und nicht durch UI-Heuristiken verdeckt.
- Fremde Änderungen werden nicht zurückgesetzt oder überschrieben.

## Sicherheitsblocker

Stoppen ohne Workaround bei Hidden-Info-Leak, fehlender side-sicherer
PlayerView-/Event-Evidence, fachlich widersprüchlichen Ordinalverträgen oder
nicht kollisionsfrei integrierbarem `main`.

## State Machine

`P01 aktiv -> P02 -> P03 -> P04 -> Main-Merge -> Cleanup -> complete`

Jeder Übergang setzt ein grünes Done-Gate und einen eigenen Commit voraus.

## Paketfolge

### P01 – Preflight und Prozessvertrag

- Ziel: Scope, Invarianten, Branch und Worktree verbindlich festhalten.
- Eingang: sauberer Hauptworkspace und freier Zielbranch/-pfad.
- Arbeit: Preflight prüfen, Worktree anlegen, dieses Artefakt erstellen.
- Kernartefakt: dieses Prozessdokument.
- Checks: `git status --short --branch`, `git worktree list --porcelain`,
  `git diff --check`.
- Done-Gate: Prozessvertrag ist vollständig und Worktree eindeutig aktiv.
- Commit: `docs(ui): define action slot dedup process`

### P02 – Rote Regression

- Ziel: Den beobachteten Doppelzählungsfehler minimal reproduzieren.
- Eingang: P01 abgeschlossen.
- Arbeit: Test mit zwei Events desselben Aktionsordinals um ein
  Bezahl-Supportfenster ergänzen.
- Kernartefakt: `apps/web/app/action-board-ui.test.ts`.
- Checks: fokussierter Vitest-Lauf, erwarteter einzelner roter Test,
  `git diff --check`.
- Done-Gate: Der Test scheitert am unveränderten Code mit Kapazität 5 statt 4;
  bestehende angrenzende Tests bleiben grün.
- Commit: `test(web): reproduce payment window action double count`

### P03 – Deduplizierende Berechnung

- Ziel: Wiederholte Ordinalbereiche nur einmal als verbrauchte Aktionen zählen.
- Eingang: roter P02-Commit.
- Arbeit: eng begrenzte Korrektur in `action-board-ui.ts`; Rückfalllogik für
  Events ohne Ordinale erhalten.
- Kernartefakte: `action-board-ui.ts` und fokussierte Tests.
- Checks: fokussierter Vitest-Lauf, Web-Typecheck soweit verfügbar,
  `git diff --check`.
- Done-Gate: neue Regression und bestehende Bonusaktionsfälle sind grün.
- Commit: `fix(web): deduplicate action slots across payment windows`

### P04 – Abschluss und Integrationsbereitschaft

- Ziel: Ergebnis dokumentieren und breit genug verifizieren.
- Eingang: P03 abgeschlossen.
- Arbeit: Prozessstatus abschließen, Checks und Grenzen dokumentieren.
- Kernartefakt: dieses Prozessdokument.
- Checks: fokussierte Tests, relevanter Web-Testlauf oder begründete engere
  Auswahl, Typecheck, `git diff --check`, sauberer Worktree.
- Done-Gate: alle Änderungen committed und der Branch ist mergefähig.
- Commit: `docs(ui): close action slot dedup process`

## Verifikationsregeln

- Die Live-Evidence lautet: Engine `runnerActionsTakenThisTurn = 3`,
  `runner.clicks = 1`; die UI darf daraus Kapazität 4, nicht 5, ableiten.
- Der bestehende Test für echte Corp-Bonusaktionen muss unverändert grün bleiben.
- Der neue Test muss dieselbe Aktion vor und nach dem Supportfenster über den
  identischen Ordinalbereich modellieren.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in `C:\Projekte\NETGRID_UI_ACTION_SLOT_DEDUP`.
- Hauptworkspace nur für den finalen lokalen Merge nach `main` verwenden.
- Jedes Paket separat prüfen und committen.
- Vor Merge gegebenenfalls aktuelles `main` in den Arbeitsbranch integrieren.
- Nach erfolgreichem Merge Worktree ohne `--force` entfernen, Entfernung in
  Git und Dateisystem prüfen und den gemergten Branch mit `git branch -d`
  löschen.

## Controller-Prompt-Kern

`/Goal` Arbeite die Aktionsslot-Deduplizierung vollständig und sequenziell von
P01 bis P04 ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.
Lies AGENTS.md, AGENTS.local.md, `apps/web/AGENTS.md` und dieses Artefakt.
Arbeite ausschließlich im festgelegten Worktree und Branch, stelle ohne
Sicherheitsblocker keine Zwischenfragen, führe Paketchecks aus und committe
jedes Paket. Markiere das Goal erst nach grünem Main-Check, verifiziertem
Worktree-Cleanup und Branch-Löschung als complete.

## Abschlusskriterien

- Reproduktionsregression zuerst rot und nach dem Fix grün.
- Keine Doppelzählung identischer Aktionsordinalbereiche.
- Echte Bonusaktionen bleiben sichtbar.
- Alle Paketcommits lokal nach `main` integriert.
- Arbeits-Worktree und gemergter Branch nachweislich entfernt.
