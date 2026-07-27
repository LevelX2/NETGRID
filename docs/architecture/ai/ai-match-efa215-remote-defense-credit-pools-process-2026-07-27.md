# EFA215: Remote-Defense bei sichtbaren Breaker-Credit-Pools

## Status

Abgeschlossen – lokal auf `main` integriert.

## Quelle und Gesamtziel

Ausgangsmatch `match_efa2150596c7b527`, Corp-KI gegen menschlichen Runner.
Bei StateVersion 135 war ein zusätzliches ICE für `remote_1` legal, wurde aber
als `subset_assessment_unknown` verworfen. Der sichtbare Runner besaß
`Invisibility` mit einem wiederkehrenden, für Icebreaker nutzbaren Credit.

Ziel ist, den bestehenden Plan `corp.defend_servers` so zu vervollständigen,
dass er bei vollständig sichtbaren, begrenzten Breaker-Credit-Pools weiterhin
eine Engine-nahe Zugangsbewertung erhält und ein geeignetes ICE für einen
konkret schützenswerten Remote wählen kann. Es wird keine zweite ICE- oder
Defense-Autorität eingeführt.

## Zielprüfung, Annahmen und Nicht-Ziele

- Die sichtbaren PlayerView-Fakten, LegalActions und Engine-Quotes bleiben die
  einzige Entscheidungsbasis.
- Die frühere Installation von `Filter` und `Sleeper` vor Archives war kein
  Zufall: Ein damals laufender HQ-Überlaufplan missbrauchte ICE als
  Handkarten-Entsorgung. Der aktuelle Quellstand enthält bereits den
  Regressionstest und die Korrektur, dass ICE ausschließlich über
  `corp.defend_servers` platziert werden dürfen. Dieser historische,
  aktuell grüne Befund wird nicht erneut implementiert.
- Die parallele Activity `act-2026-07-26-corp-ice-rez-resource-exchange-value`
  behandelt ausschließlich den aktuellen Rez-Ressourcenabtausch. Dieses Paket
  ändert keine Rez-Attrition-Regeln und integriert bei einem späteren Merge
  beide Verträge defensiv.
- Nicht im Scope: unsichtbare Karten, allgemeine Zukunftssimulationen,
  kartennamenspezifische Regeln und Punkt 2 (`Overtime Incentives`).

## Controller-Invarianten

- Rules Engine und LegalActions bleiben Regelautorität.
- Nur aktuelle, für die Corp sichtbare Rig-, Counter- und Quote-Fakten werden
  bewertet.
- Unvollständige oder nicht sicher zuordenbare Credit-Pools bleiben fail-closed.
- Die Auswahl vergleicht nur konkrete aktuelle ICE-Installationsrouten nach
  Zugangswahrscheinlichkeit, Ressourcenkosten und gültigen Engine-Quotes.
- Debug-Evidence benennt Credit-Pool-Unterstützung oder ihren Unknown-Grund,
  ohne verdeckte Runner-Information preiszugeben.

## State Machine

`preflight → checkpoint-red-or-already-green → consumer-audit → minimal fix →
checkpoint-green → focused-and-broad-verify → documentation → local merge →
cleanup`

Ein historischer Checkpoint, der auf aktuellem Code schon grün ist, wird als
behobene historische Regression dokumentiert und nicht durch einen weiteren
Fix ersetzt. Der aktuelle rote Fall muss eine echte `behavior_regression`
haben; Infrastrukturdrift ist kein Verhaltenstest.

## Paketfolge

### Paket 1 – Preflight und Prozessvertrag

- Ziel: Arbeitsbranch, Scope, parallele Activity und Prüfkriterien festlegen.
- Kernartefakt: diese Prozessdatei.
- Done-Gate: sauberer Worktree auf `codex/ai-remote-defense-credit-pools`,
  keine fremden Änderungen übernommen, Prozessvertrag committed.
- Commit: `docs(ai): add remote defense credit-pool process`.
- Ergebnis: erfüllt mit `da5089d35`.

### Paket 2 – Spielgleiche Checkpoints und rote Evidence

- Ziel: den historischen Remote-Fall aus StateVersion 135 side-safe capturen
  und seine aktuelle Reproduzierbarkeit prüfen.
- Positive Erwartung: Bei einem sichtbaren, finanzierten und konkret
  schützenswerten Remote ist mindestens eine geeignete ICE-Installationsaction
  akzeptabel.
- Gegenproben: kein schützenswertes Remote, unvollständiger Credit-Pool sowie
  ICE ohne bessere Zugangsroute bleiben nicht positiv.
- Done-Gate: Captures validiert; rot nur bei `behavior_regression`, bereits
  grüne historische Archive-Regression ausdrücklich dokumentiert.
- Commit: `test(ai): capture remote defense credit-pool regressions`.
- Ergebnis: erfüllt mit `2669c393e`.

### Paket 3 – Bestehende Defense-Bewertung vervollständigen

- Ziel: die vorhandene Pfad- und Portfolio-Bewertung um exakt begrenzte,
  sichtbare Icebreaker-Credit-Pools erweitern.
- Kernartefakte: bestehende Score-Protection-/Run-Credit-Projektion und ihre
  fokussierten Tests.
- Done-Gate: keine neue Planautorität, vollständige Quote-/Pool-Bindung,
  Auswahl bleibt brecher-, Kosten- und Synergieabhängig.
- Commit: `fix(ai): evaluate visible breaker credit pools for remote defense`.
- Ergebnis: erfüllt mit `b40162d51`; die bestehende
  `corp.defend_servers`-/Score-Protection-Projektion verwendet nun das
  kanonische sichtbare Run-Credit-Budget für passende Breaker-Credits und
  deren Verbrauch über mehrere ICE.

### Paket 4 – Unveränderte Checkpoints und breite Verifikation

- Ziel: Zielcheckpoint grün, Gegenproben grün, bestehende ICE- und
  Rez-Regressionen unverändert.
- Checks: fokussierte Vitest-Suiten, AI-Typecheck, `git diff --check` und
  soweit vertretbar die vollständige AI-Test-Suite.
- Commit: `test(ai): verify remote defense credit-pool coverage`.
- Ergebnis: erfüllt mit `e417a4d88`; der historische EFA215-Checkpoint, die
  Breaker-/Pool-Gegenproben, der leere wiederverwendbare Remote und die
  bestehenden Rent-I-Con-Regressionen sind abgedeckt.

### Paket 5 – Evidence, Wissenspflege und Integration

- Ziel: Review- und Final-Report schreiben, aktuellen Betriebslog ergänzen,
  Branch lokal nach `main` integrieren und Worktree bereinigen.
- Done-Gate: Worktree sauber, Main verifiziert, Worktree und gemergter Branch
  entfernt.
- Commit: `docs(ai): record remote defense credit-pool remediation`.
- Ergebnis: erfüllt mit diesem Abschlusscommit; der Final Review liegt unter
  `docs/reviews/ai/ai-match-efa215-remote-defense-credit-pools-final-review-2026-07-27.md`.

## Verifikationsregeln

- Jeder Checkpoint nutzt GameState, Event-Präfix, Deck-Snapshot und Runtime-
  Zustand der historischen Entscheidung; keine nachträgliche Hidden-Info.
- Die positive Auswahl muss mindestens eine sinnvolle, konkrete ICE-Route
  zeigen, nicht nur Credits oder eine zufällige Installation.
- ICE-Auswahltests variieren mindestens Breaker-Klasse, verfügbare Credits,
  begrenzte wiederkehrende Credits und bereits vorhandenes ICE.
- Bestehende Tests für Archive-Entpriorisierung, HQ-Überlauf-Ownership,
  Score-Protection, gefundene Breakkosten und Rez-Routen bleiben grün.

## Worktree- und Integrationsregeln

- Arbeitsverzeichnis: `C:\Projekte\NETGRID_AI_REMOTE_DEFENSE_CREDIT_POOLS`.
- Branch: `codex/ai-remote-defense-credit-pools`.
- Kein Push oder Pull Request.
- Der Hauptworkspace wird nur für den abschließenden Main-Merge genutzt.
- Vor der Integration wird aktuelles `main` eingezogen und ein möglicher
  Konflikt mit der parallelen Rez-Activity fachlich, nicht mechanisch gelöst.

## Verbindlicher Controller-Kern

`/Goal Arbeite diesen Prozess sequenziell von Paket 1 bis Paket 5 im genannten
Worktree ab. Ändere nur Punkt 1. Arbeite immer nur am aktiven Paket, sichere
rote Evidence vor einem Fix, führe die Paketchecks aus, committe jedes fertige
Paket und integriere nach erfolgreicher finaler Verifikation lokal nach main.
Bei einem Side-Safety-, Engine- oder Merge-Blocker dokumentiere die Removal
Condition und stoppe ohne unsicheren Workaround.`
