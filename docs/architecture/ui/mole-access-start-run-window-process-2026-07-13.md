# HQ-/R&D-Mole im Access-Start-Runfenster anbieten

## Status

Umsetzung und Paketverifikation am 13. Juli 2026 abgeschlossen; für die
abschließende lokale Integration nach `main` freigegeben.

## Quelle und Vorgabe

Ausgangspunkt ist der Nutzerbefund, dass `R&D Mole` bei einem erfolgreichen
`Rush Hour`-Run auf R&D trotz ausreichender Credits nicht zur Aktivierung
angeboten wurde. `HQ Mole` stand unter demselben Verdacht.

Das lokale Match `match_606a546d0ba02826` bestätigt beide Varianten:

- State 198: erfolgreicher Rush-Hour-Run auf R&D, `accessCount = 4`, zwei
  installierte R&D Moles und 17 Runner-Credits. Das Engine-Fenster
  `hiddenRunnerResourceAccessStartServerId = rd` war offen; als nächste
  eingereichte Aktion folgte dennoch `Access beginnen`.
- State 213: erfolgreicher Bonus-Run auf HQ, zwei installierte HQ Moles und 11
  Runner-Credits. Das entsprechende Access-Start-Fenster für HQ war offen;
  erneut folgte direkt `Access beginnen`.
- Beide Aktionen wurden akzeptiert. Es gab keinen Kosten-, Kartenstatus- oder
  stale-action-Fehler.

Die Engine öffnet das Access-Start-Fenster nur, wenn neben der Fortsetzung
mindestens eine passende Karten-LegalAction existiert. Der Befund liegt daher
in der Webpräsentation, nicht in Kartenregel, Kostenprüfung oder
LegalAction-Erzeugung.

Der Nutzer hat nach der Analyse die direkte Umsetzung mit
`$paketprozess-worktree-goal` beauftragt.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung. Erwarteter
Endzustand, betroffene Karten und Schichten, Ursache, Tests, Worktree- und
Merge-Erwartung sowie Hidden-Info-Grenzen sind bestimmbar.

## Gesamtziel

Alle legalen Runner-Kartenfähigkeiten mit
`cardImplementationAbilityTiming = access_start` werden im aktiven
Run-Fenster unmittelbar vor Aufbau der Access-Queue angeboten. `Access
beginnen` bleibt als ausdrückliche Verzichts-/Fortsetzungsoption erhalten.

Für HQ Mole und R&D Mole gilt:

- Aktivierung kostet 4 Credits und trasht die aktivierte Quelle.
- Jede Aktivierung erhöht den passenden zentralen Access um zwei Karten.
- Mehrere Kopien bleiben kumulativ und einzeln aktivierbar.
- Ein Rush-Hour-R&D-Run entwickelt sich damit von 4 auf 6 und bei zwei
  aktivierten Kopien auf 8 angeforderte Zugriffe.
- Ein normaler HQ-Run entwickelt sich von 1 auf 3 und bei zwei aktivierten
  Kopien auf 5 angeforderte Zugriffe.
- Die tatsächlich aufgebaute Access-Queue bleibt durch die Zahl der zu diesem
  Zeitpunkt vorhandenen Karten im angegriffenen Zentralserver begrenzt.

## Annahmen

- Das bestehende Engine-Access-Start-Fenster ist fachlich korrekt und bleibt
  die alleinige Regelautorität.
- Der Webclient erkennt Access-Start-Fähigkeiten generisch am bereits
  vorhandenen LegalAction-Payloadfeld, nicht an Karten-IDs oder Labels.
- Kartenbezogene Aktionsmarker im Rig bleiben erhalten; das Run-Fenster
  spiegelt die zeitkritischen LegalActions zusätzlich.
- Zwei gleichnamige Buttons dürfen gleichzeitig erscheinen, weil sie zwei
  verschiedene Karteninstanzen und kumulative Aktivierungen repräsentieren.

## Nicht-Ziele

- Keine Änderung an Kartentexten, Kosten, Kartenregistrierung oder
  Supportmanifesten.
- Keine Änderung der Rush-Hour-Regel oder allgemeinen Access-Queue-Semantik.
- Kein Redesign des Run-Fensters oder der Kartenaktionsmarker.
- Keine Karten-ID-Sonderlogik.
- Keine Änderung der Runner-KI-Entscheidungslogik.
- Kein Push und kein Pull Request.

## Controller-Invarianten

1. Die Rules Engine bleibt einzige Regelautorität.
2. Der Webclient zeigt ausschließlich vorhandene LegalActions.
3. `applyAction` revalidiert Timing, Seite, State-Version, Kosten und Quelle.
4. Nicht aktivierte Hidden Resources bleiben für die Korp vollständig
   verborgen.
5. Eine aktivierte Mole-Quelle wird erst durch die bestehende
   Hidden-Resource-Auflösung öffentlich und landet offen im Heap.
6. Die Access-Queue entsteht erst nach Abschluss des Access-Start-Fensters.
7. Mehrere Mole-Kopien werden nicht dedupliziert oder zusammengefasst.
8. Replay, StateHash und deterministische Access-Reihenfolge bleiben stabil.

## Automatische Fehlerbehandlung

- Fehlt das Access-Start-Payloadfeld, wird keine Aktion aufgrund eines Labels
  oder Kartennamens als Mole-Aktion interpretiert.
- Nicht bezahlbare oder unpassende Mole-Fähigkeiten werden weiterhin gar nicht
  als LegalActions erzeugt.
- Rote fokussierte Tests, Typechecks oder Diff-Hygiene stoppen das aktuelle
  Paket und werden eng am betroffenen Vertrag diagnostiziert.
- Fremde Änderungen auf `main` werden vor dem finalen Merge semantisch in den
  Arbeitsbranch integriert und anschließend erneut geprüft.

## Sicherheitsblocker

- Jede Lösung, die Korp-seitig verdeckte Runner-Ressourcen offenlegt, ist
  verboten.
- Jede Lösung, die eine nicht vorhandene Aktion clientseitig erfindet oder
  Kostenprüfung in die UI verschiebt, ist verboten.
- Ein Konflikt mit einem neueren `main`, der denselben Access- oder
  LegalAction-Vertrag widersprüchlich ändert, blockiert den Merge bis zur
  fachlichen Auflösung.

## State Machine

```text
successful_run_before_breach
  -> access_start_window_open
  -> mole_actions_and_access_continue_visible
  -> activate_zero_one_or_more_moles
  -> access_continue_selected
  -> breach_queue_built_with_final_access_count
  -> sequential_access_resolution
```

## Paketfolge

### Paket 1: Prozessvertrag und Worktree-Preflight

- Ziel: Evidence, Scope, Invarianten, Pakete und Abschlussweg festschreiben.
- Eingang: sauberer Hauptworkspace auf `main`; Zielbranch und Zielworktree
  existieren noch nicht.
- Arbeit: Worktree anlegen und dieses Prozessartefakt erstellen.
- Kernartefakt: diese Datei.
- Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: korrekter Worktree/Branch, vollständiger Vertrag, grüner Diff.
- Commit: `docs(ui): define Mole access-start run-window process`

### Paket 2: Engine-Kombinationsregressionen

- Ziel: den bereits korrekten Engine-Vertrag für beide Karten und mehrere
  Kopien gegen reale Kombinationsfälle festschreiben.
- Eingang: Paket 1 abgeschlossen.
- Arbeit:
  - Rush Hour plus eine und zwei R&D-Mole-Aktivierungen prüfen;
  - normalen HQ-Run plus eine und zwei HQ-Mole-Aktivierungen prüfen;
  - Credits, Source-Trash/Reveal, finalen Access-Count, Queue-Aufbau,
    Hidden-Info, Replay und StateHash belegen.
- Kernartefakt:
  `packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts`.
- Checks: fokussierter Engine-Vitest, Engine-Typecheck, `git diff --check`.
- Done-Gate: beide Zentralen und Mehrfachkopien grün, keine Engineänderung
  nötig oder jede unerwartete Abweichung eng erklärt und behoben.
- Commit: `test(engine): cover cumulative Mole access-start runs`

### Paket 3: Generischer Web-Fix

- Ziel: Access-Start-Kartenfähigkeiten im Run-Fenster sichtbar und direkt
  ausführbar machen.
- Eingang: Paket 2 abgeschlossen.
- Arbeit:
  - `runWindowActions` um den generischen Access-Start-Timingvertrag ergänzen;
  - positive und negative Helper-Regressionen ergänzen;
  - mehrere Mole-Instanzen als getrennte Aktionen erhalten;
  - vorhandene Run-, Access- und Kartenkontextdarstellung bewahren.
- Kernartefakte:
  - `apps/web/app/action-board-ui.ts`;
  - `apps/web/app/action-board-ui.test.ts`.
- Checks: fokussierter Web-Vitest, Web-Typecheck, `git diff --check`.
- Done-Gate: Access-Start-Aktionen und `Access beginnen` erscheinen gemeinsam;
  andere `game.checkpoint`-Kartenaktionen werden nicht versehentlich gespiegelt.
- Commit: `fix(web): show Mole actions at access start`

### Paket 4: Abschlussnachweis und Wissenspflege

- Ziel: Ursache, Umsetzung, Grenzen und Verifikation dauerhaft festhalten.
- Eingang: Paket 3 abgeschlossen.
- Arbeit:
  - Final Review erstellen;
  - aktuellen Befund im Juli-Projektlog verdichtet dokumentieren;
  - fokussierte Tests und Typechecks erneut ausführen.
- Kernartefakte:
  - `docs/reviews/ui/mole-access-start-run-window-final-review-2026-07-13.md`;
  - historische Projektlog-Chronik (aus dem Arbeitsbaum entfernt; Git bleibt Nachweis);
  - dieses Prozessartefakt.
- Checks: Engine-/Web-Fokustests, Engine-/Web-Typechecks,
  `git diff --check`.
- Done-Gate: Abschlussartefakte aktuell und alle relevanten Checks grün.
- Commit: `docs(ui): close Mole access-start run-window fix`

## Verifikationsregeln

- Paketnahe Vitest-Dateien werden direkt ausgeführt.
- Engine- und Web-Typecheck werden mindestens nach ihrem jeweiligen
  Implementierungspaket ausgeführt.
- `git diff --check` läuft vor jedem Paketcommit.
- Nach Integration des aktuellen `main` werden alle fokussierten Tests und
  beide Typechecks erneut ausgeführt.
- Tests mit Timeout oder abgebrochene Prozesse gelten nicht als bestanden.

## Worktree-, Git- und Integrationsregeln

- Hauptworkspace: `C:\Projekte\NETGRID`, ausschließlich für den finalen lokalen
  Merge.
- Arbeits-Worktree: `C:\Projekte\NETGRID_MOLE_ACCESS_START_UI`.
- Arbeitsbranch: `codex/mole-access-start-ui`.
- Genau ein Paket ist aktiv; jedes Paket erhält einen eigenen Commit.
- Vor dem finalen Merge wird aktuelles `main` in den Arbeitsbranch integriert.
- Der Arbeitsbranch wird bevorzugt per Fast-Forward lokal nach `main` gemergt.
- Erst danach werden Worktree und gemergter Branch entfernt und sowohl Git-
  Registrierung als auch Dateisystemzustand verifiziert.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess HQ-/R&D-Mole im Access-Start-Runfenster vollständig und sequenziell von Paket 1 bis Paket 4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_MOLE_ACCESS_START_UI auf Branch codex/mole-access-start-ui. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket. Bewahre Engine-Autorität, LegalAction-Disziplin, Hidden-Info, Replay und StateHash. Führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition. Integriere vor Abschluss aktuelles main, verifiziere erneut, merge lokal nach main, entferne Worktree und Branch verifiziert und markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- HQ Mole und R&D Mole erscheinen im passenden Access-Start-Runfenster.
- `Access beginnen` bleibt als Fortsetzungsoption sichtbar.
- Rush Hour plus ein beziehungsweise zwei R&D Moles ergibt 6 beziehungsweise
  8 angeforderte R&D-Zugriffe; die Queue wird auf die vorhandenen R&D-Karten
  begrenzt.
- Ein normaler HQ-Run plus ein beziehungsweise zwei HQ Moles ergibt 3
  beziehungsweise 5 HQ-Zugriffe, soweit ausreichend Karten vorhanden sind.
- Kosten, Trash/Reveal, Hidden-Info, Replay und StateHash sind abgesichert.
- Andere `game.checkpoint`-Aktionen werden nicht pauschal in das Run-Fenster
  aufgenommen.
- Alle Paketcommits sind lokal nach `main` integriert.
- Arbeits-Worktree und Arbeitsbranch sind verifiziert entfernt.
