# Match 74e2369: Corp-KI-Regressionsbehebung

Status: P5 aktiv

## Quelle und Gesamtziel

Quelle ist das zuletzt abgeschlossene lokale Spiel
`match_74e236955b3208a1` mit 136/136 detailliert gespeicherten
KI-Entscheidungen. Der Nutzer hat die Umsetzung der bestätigten Punkte nach
vollständiger Analyse freigegeben und ausdrücklich eine mögliche Regression
gegen bereits funktionierendes Verhalten hinterfragt.

`/Goal`: Die im Spiel bestätigten Corp-KI-Fehler zuerst aus dem exakten
historischen Zustand auf aktuellem Code reproduzieren, ihre Einführung über
bestehende Verträge und Git-Historie bestimmen, ausschließlich weiterhin
rote Verhaltens- oder Schichtfehler generisch beheben, alle unveränderten
Gegenproben und breiten Gates grün verifizieren, jedes Paket einzeln
committen und den fertigen Arbeitsbranch lokal nach `main` integrieren.

- Arbeitsbranch: `codex/ai-replay-match-74e2369`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_74E2369`
- Ausgangs-`main`: `fe86a82e2751201a711cb05d451f48acf2ef6bb4`
- Runtime-Evidence:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Push oder Pull Request: nicht Teil des Prozesses

## Freigegebener Scope

- wiederholtes Sparen trotz legaler und deutlich besser bewerteter
  R&D-Verteidigung;
- falsches Agenda-Ziel im `Project Consultants`-Scorefenster;
- wiederholte Plan-Überstimmung von `Night Shift` zugunsten eines
  Basic-Credit-Klicks;
- Abwurf von `Night Shift` bei zwei gehaltenen `Tycho Extension`;
- blockierende Compiled-Hint-Überlappungen bei `Corporate War`,
  `Ball and Chain` und `Wall of Ice`;
- fehlende Runtime-Nutzung des sichtbaren `Corporate War`-Schwellen- und
  Economy-Crash-Vertrags bei Erhalt dringender Low-Credit-Score-Gegenproben.

Nicht freigabereif bleiben die eigenständige Umstimmung der konkreten
`Corporate War`-Scoreentscheidung und der BBS-Installation beziehungsweise
-Rezentscheidung ohne zusätzliche Gegenprobe.

## Invarianten und Sicherheitsblocker

- Rules Engine und `LegalActions` bleiben einzige Aktionsautorität.
- Checkpoints erzeugen `PlayerView` und `LegalActions` erneut aus dem exakten
  historischen `GameState` und ausschließlich dem öffentlichen Eventpräfix.
- Vor dem Red-Evidence-Commit wird kein Produktionscode und kein produktiver
  Hint geändert.
- Nur `behavior_regression` autorisiert einen Verhaltensfix. Engine-, Runtime-,
  Fixture-, Warmup- oder Redaction-Drift wird separat dokumentiert.
- Historische Erwartungen werden nach rotem Nachweis nicht abgeschwächt.
- Jede neue Priorität erhält mindestens eine Gegenprobe, die das bisher
  legitime Verhalten erhält.
- Hint-Effekte werden nur dedupliziert, wenn ihre fachlichen Kerne tatsächlich
  überlappen; getrennte Mehrfachwirkungen bleiben erhalten.
- Genau ein Paket ist aktiv. Jedes abgeschlossene Paket erhält einen Commit.

## State Machine und Paketfolge

`P0_PROCESS -> P1_EVIDENCE_BASELINE -> P2_RED_CHECKPOINTS -> P3_ARBITRATION -> P4_HINT_CONSUMERS -> P5_BROAD_VERIFY -> P6_INTEGRATE -> COMPLETE`

### P0 – Prozessvertrag

Status: abgeschlossen

- Scope, `/Goal`, Invarianten, Paketfolge und Integrationsregeln sichern.
- Check: `git diff --check`.
- Commit: `docs(ai): plan match 74e2369 remediation`.

### P1 – Evidence, Baseline und Regressionsursprung

Status: abgeschlossen

- 136/136 Entscheidungen, bessere Alternativen und Nicht-Findings dauerhaft
  dokumentieren.
- bestehende fokussierte und breite Tests unverändert auf dem Ausgangsstand
  ausführen;
- für Arbitration, Agenda-Zielwahl, Discard und Hint-Kompilierung den letzten
  nachweislich guten beziehungsweise den einführenden Commit bestimmen;
- vollständigen 22-Karten-Deck-Audit mit Quell-, Active-, Compiled- und
  Consumer-Differenz erklären.
- Commit: `docs(ai): record match 74e2369 regression evidence`.

### P2 – Spielgleiche rote Evidence

Status: abgeschlossen

- historische Decision-Checkpoints für R&D-Verteidigung, Agenda-Zielwahl,
  `Night Shift` und Abwurfentscheidung capturen;
- nur valide `behavior_regression` als rot akzeptieren;
- Hint-Überlappungen und fehlenden Schwellen-Consumer als enge rote
  Schichtverträge sichern;
- Gegenproben für sichere Scorefortsetzung, echten Credit-Bedarf, legitime
  Agenda-Aufbewahrung, getrennte Mehrfacheffekte und dringenden
  Low-Credit-Score grün halten.
- Commit: `test(ai): capture match 74e2369 regressions`.

### P3 – Plan-, Scorefenster- und Discard-Arbitration

Status: abgeschlossen

- positive Zentralverteidigung und überlegene Economy-Aktionen dürfen nicht
  von einem schlechteren Scorefenster-Schritt absolut verdrängt werden;
- Scorefenster-Ziele nach tatsächlich erzielbaren Agendapunkten und
  Siegfortschritt unterscheiden;
- überzählige Agenden in der Discard-Logik situationsabhängig statt pauschal
  duplikatfrei behandeln.
- Checkpoints und Gegenproben unverändert grün machen.
- Commit: `fix(ai): restore corp action arbitration`.

### P4 – Hint-Kompilierung und Corporate-War-Consumer

Status: abgeschlossen

- die drei blockierenden Effektkern-Überlappungen an ihrer gemeinsamen
  Ursache deduplizieren;
- `Corporate War`-Schwellen- und Crash-Semantik in die produktive
  Scoreentscheidung führen, ohne dringende Low-Credit-Abschlüsse zu sperren;
- vollständigen 22-Karten-Audit auf `status=ok` bringen.
- Commit: `fix(ai): normalize match deck hint consumers`.

### P5 – Breite Verifikation und Wissenspflege

Status: aktiv

- fokussierte Checkpoints, Gegenproben, angrenzende Regressionen,
  AI-Testshards beziehungsweise vollständige AI-Suite und Typecheck;
- relevante Hint-, Ontologie-, Inspector- und Deck-Consumer-Gates;
- `git diff --check`, Abschlussreview und wiederverwendbare Wissenspflege.
- Commit: `docs(ai): close match 74e2369 remediation`.

### P6 – Main-Abgleich und lokale Integration

Status: ausstehend

- aktuelles lokales `main` defensiv einbinden und relevante Gates wiederholen;
- Arbeitsbranch sauber lokal nach `main` mergen;
- finalen Main-Stand verifizieren und sauberen Worktree entfernen.

## Abschlusskriterien

- Jeder Verhaltensfix besitzt vorher eine valide rote spielgleiche Evidence.
- Alle Checkpoints und Gegenproben sind danach mit unveränderten Erwartungen
  grün.
- Der 22-Karten-Audit meldet `status=ok`, null Blocker und keine neu
  eingeführten Warnungen.
- Die Ursache des Rückschritts ist anhand produktiver Consumer und Git-Historie
  belegt, nicht nur vermutet.
- Pflichtchecks sind grün oder ein verbleibender Baselinefehler ist identisch
  auf unverändertem aktuellem `main` reproduziert.
- `main` enthält alle Paketcommits; es erfolgt kein Push und kein PR.

## Ausführungsstand

- P0 im Commit `52dc5e30b` abgeschlossen.
- P1 abgeschlossen: 136/136 Decisions sind klassifiziert; alle 2817
  bestehenden AI-Tests und der AI-Typecheck sind grün. Der einzige rote
  globale AI-Gate-Teil ist die unveränderte Source-Structure-Baseline mit vier
  Dateigrößenüberschreitungen. Git-Historie und Consumer-Kette belegen eine
  Plan-Kompositionslücke bei Night Shift/R&D sowie seit Mai bestehende
  Compiled-Hint-Überlappungen hinter korrekt überarbeiteten Active Hints.
- P2 abgeschlossen: fünf strikte Checkpoints wurden mit null Warmup-Drifts capturt und
  scheitern ausschließlich als `behavior_regression`; drei Hint-Verträge sind
  rot, während 43 angrenzende Gegenverträge und drei Hint-Erhaltungsproben grün
  bleiben.
- P2 im Commit `2048aa9c9` rot gesichert.
- P3 abgeschlossen: Eine stärkere R&D-Triage- oder Burst-Economy-Alternative
  bleibt vor einer schwächeren strategischen Corp-Ersetzung erhalten, ohne
  starke Tag-Punish-Unterbrechungen zu blockieren. Same-Turn-Konvertierungen
  unterscheiden Agenda-Punkte, und nur die zum Sieg redundante Agenda-Kopie
  erhält einen Discard-Abschlag. Vier historische Auswahlcheckpoints, der
  frühere Night-Shift-Fall, 61 weitere fokussierte Plan-/Arbitration-/Discard-
  Tests und der AI-Typecheck sind grün.
- P4 abgeschlossen: Die Compiled-Hint-Zusammenführung erhält bei drei
  überprüften Karten den fachlich führenden Active-Effektkern und ergänzt nur
  weiterhin eigenständige abgeleitete Effekte. Der vollständige Deck-Audit
  prüft 22/22 unterschiedliche Karten beziehungsweise 47 Karten insgesamt
  mit `status=ok`, null Blockern und null Warnungen. Der neue generische
  Score-Ökonomie-Consumer bewertet `Corporate War` bei erfüllter Schwelle als
  +12-Credit-Burst und darunter mit dem tatsächlich verlorenen Creditbestand;
  der historische dringende Zwei-Credit-Score bleibt grün.
