# Final Review: HQ-/R&D-Mole im Access-Start-Runfenster

Datum: 13. Juli 2026

Match: `match_606a546d0ba02826`

Arbeitsbranch: `codex/mole-access-start-ui`

Prozess: `docs/architecture/ui/mole-access-start-run-window-process-2026-07-13.md`

## Ergebnis

HQ Mole und R&D Mole werden nun unmittelbar vor Beginn des Accesses gemeinsam
mit `Access beginnen` im aktiven Run-Fenster angeboten. Mehrere installierte
Kopien bleiben getrennte, nacheinander auswählbare LegalActions. Die UI erzeugt
dabei keine eigene Regelaktion, sondern spiegelt ausschließlich die von der
Engine gelieferten Access-Start-Aktionen.

Die zusätzlich gemeldete Beobachtung, nach Rush Hour und zwei aktivierten R&D
Moles nur zwei Karten erhalten zu haben, ist kein Ersetzungsfehler. Im
betroffenen Live-Stand erhöhte die Engine den angeforderten Access-Count korrekt
von 4 auf 6 und anschließend auf 8. Zu Beginn des Breaches lagen aber nur noch
zwei Karten in R&D; deshalb enthielt die regelkonform begrenzte Access-Queue
genau diese zwei Karten.

## Ursachen-Evidence

Die Engine öffnete bereits vor der Korrektur ein Access-Start-Fenster und
lieferte die Mole-Fähigkeiten als LegalActions mit
`cardImplementationAbilityTiming = access_start`. Das Run-Fenster des
Webclients spiegelte bislang jedoch nur `access_card`, Timingpunkte unter
`access.*` sowie die Run-Fortsetzung. Eine Mole-Aktion am Timingpunkt
`game.checkpoint` war daher nur über den weniger offensichtlichen Kartenmarker,
nicht im zeitkritischen Run-Fenster erreichbar.

Die neue Live-Sequenz im Match belegt getrennt davon die korrekte
Engine-Akkumulation:

- Rush Hour stellte vor den Moles `accessCount = 4` her.
- Die erste R&D-Mole-Aktivierung erhöhte auf 6.
- Die zweite R&D-Mole-Aktivierung erhöhte auf 8.
- Vor Aufbau der Queue enthielt R&D nur zwei Karten.
- Die Queue enthielt daher zwei R&D-Zugriffe, und beide wurden aufgelöst.

Damit wurde der gemeldete Eindruck eines Replace-Verhaltens auf verfügbare
Live-Daten zurückgeführt, ohne die korrekte Queue-Begrenzung zu verändern.

## Umsetzung

- `apps/web/app/action-board-ui.ts` erkennt aktivierte Kartenfähigkeiten im
  Run-Fenster generisch über das vorhandene Access-Start-Payloadfeld.
- Karten-IDs, Kartentitel und Labeltexte spielen für die Erkennung keine Rolle.
- `Access beginnen` bleibt als ausdrückliche Fortsetzungsoption erhalten.
- Mehrere Mole-Karteninstanzen werden nicht dedupliziert; ihre individuellen
  Action-IDs bleiben erhalten.
- Andere aktivierte Kartenfähigkeiten am allgemeinen Timingpunkt
  `game.checkpoint` werden nicht versehentlich in das Run-Fenster aufgenommen.

## Engine- und Hidden-Info-Vertrag

Die Engine selbst brauchte keine Regeländerung. Neue Kombinationstests sichern
für R&D und HQ jeweils zwei Mole-Kopien ab:

- 4 Credits Kosten pro Aktivierung;
- Trash und Reveal ausschließlich der aktivierten Quelle;
- kumulative Zähler 4/6/8 für Rush Hour auf R&D und 1/3/5 für HQ;
- Aufbau der Access-Queue erst nach ausdrücklichem `Access beginnen`;
- Begrenzung der Queue auf die tatsächlich vorhandenen zentralen Karten;
- keine Offenlegung nicht aktivierter Hidden Resources gegenüber der Korp;
- stabiles Replay und stabiler StateHash.

## Regressionen und Verifikation

- Engine-Fokustest
  `packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts`:
  15 Tests bestanden.
- Web-Helfertest `apps/web/app/action-board-ui.test.ts`: 101 Tests bestanden.
- `corepack pnpm --filter @netgrid/engine typecheck`: erfolgreich.
- `corepack pnpm --filter @netgrid/web typecheck`: erfolgreich.
- `git diff --check`: erfolgreich.

## Grenzen und Nicht-Ziele

- Es gab keine Änderung an Rush Hour, Mole-Kartentexten, Kosten,
  Kartenregistrierung, KI-Verhalten oder allgemeiner Access-Queue-Semantik.
- Die Anzeige erklärt noch nicht gesondert, wenn der angeforderte Access-Count
  größer als die Zahl der vorhandenen Zentralserverkarten ist. Der bestehende
  Fortschritt zeigt die tatsächlich aufgebaute Queue; ein weitergehendes
  UX-Redesign war nicht Teil dieses Fehlerfixes.
- Es erfolgte kein Push und kein Pull Request.

## Integrationsfreigabe

Die vier sequenziellen Pakete besitzen jeweils einen eigenen lokalen Commit.
Nach Integration des dann aktuellen `main` müssen dieselben zwei Fokustests,
beide Typechecks und die Diff-Hygiene erneut grün sein. Erst danach darf der
Arbeitsbranch per Fast-Forward nach `main` übernommen und der Worktree samt
Branch verifiziert entfernt werden.
