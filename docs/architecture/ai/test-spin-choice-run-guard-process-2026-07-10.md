# Test-Spin Choice-/Run-Guard

## Status

- Status: abgeschlossen
- Datum: 2026-07-10
- Agent: `card-enablement-ai-knowledge-agent`
- Branch: `codex/test-spin-choice-run-guard`
- Worktree: `C:\Projekte\NETGRID_AI_TEST_SPIN_RUN_GUARD`
- Integration: lokales `main`

## Quelle und Freigabe

Der 100-Versuche-Nachtest aus dem abgeschlossenen Vapor-Transfer-Prozess
enthielt einen unabhängigen Engine-/LegalAction-Fund: Im Matchup
`proteus_hq_virus_derez`, Seed `universal-fast-advance-11`, scheiterte bei
StateVersion 152 die legale Test-Spin-Choice nach der Programminstallation mit
`Test Spin konnte keinen Run starten.` Der Nutzer hat die separate Umsetzung
mit „Gerne noch fixen“ freigegeben.

## Gesamtziel

Der mehrstufige Vertrag aus Event, privater Installationschoice und
verzögertem Run darf keine Choice anbieten oder akzeptieren, deren
Zwischenauflösung den verpflichtenden Run unstartbar macht. LegalAction- und
`applyAction`-Revalidierung müssen denselben generischen Run-Lock-Vertrag
verwenden; der konkrete Fehlerseed soll anschließend ohne IllegalAction
durchlaufen.

## Annahmen

- Die führende Evidence ist der deterministische Selfplay-Seed; die konkrete
  Sperrursache wird in P0 aus dem Zustand vor und nach der Choice belegt.
- Die Korrektur gehört in Engine-/LegalAction- oder Choice-Revalidierung,
  nicht in eine Test-Spin-Sonderbewertung der KI.
- Eine kartenspezifische Effektauflösung darf den generischen Run-Startvertrag
  aufrufen, aber keinen ungültigen Zustand durch nachträgliches Werfen eines
  Fehlers erzeugen.

## Nicht-Ziele

- keine allgemeine Runner-Strategie- oder Kartengewichtsänderung;
- keine Änderung der gedruckten Test-Spin-Regelwirkung;
- keine Legacy-Migration lokaler Replays oder Runtime-Daten;
- kein Push und kein Pull Request.

## Controller-Invarianten und Sicherheitsblocker

- Die Rules Engine bleibt alleinige Regelautorität.
- Die KI wählt ausschließlich aus aktuellen `LegalActions`.
- `applyAction` revalidiert Seite, Zustand, Timing, Kosten, Ziel und Choice
  fail-closed.
- Keine Hidden-Info-Leaks aus Stack-Choice oder nachträglicher Seed-Analyse.
- Replay, Determinismus und StateHash dürfen nicht regressieren.
- Bei einer roten Engine-, Side-Safety- oder Replay-Regression stoppt der
  Prozess ohne Umgehung.
- Fremde uncommittete Änderungen im Hauptworkspace bleiben unangetastet.

## State Machine

`P0 in_progress -> P0 done -> P1 in_progress -> P1 done -> P2 in_progress ->
P2 done -> main integriert -> Goal complete`

## Paketfolge

### P0 – Preflight, Prozess und Ursachen-Evidence

- Seed 11 im Proteus-HQ-Matchup deterministisch reproduzieren.
- Event-LegalAction, private Choice, gewähltes Programm sowie Run-Lock vor und
  nach der Installation side-safe untersuchen.
- Generische Fehlergruppe, Zielvertrag und Regression festhalten.
- Checks: `git diff --check`.
- Done-Gate: konkrete Sperrursache und engster korrekter Fixpunkt sind belegt.
- Commit: `docs(ai): record test spin delayed-run evidence`.

### P1 – Generischer Choice-/Run-Vertrag

- LegalAction-/Choice-Erzeugung und Auflösung auf denselben Run-Lock-Vertrag
  bringen.
- Direkten positiven Test sowie eine negative Gegenprobe ergänzen, in der eine
  Zwischeninstallation den verpflichtenden Run verhindert.
- Checks: fokussierte Engine-Tests, Engine-Typecheck, `git diff --check`.
- Done-Gate: keine angebotene oder akzeptierte Choice endet erst nach ihrer
  Mutation in einem illegalen verzögerten Run.
- Commit: `fix(engine): guard delayed runs across install choices`.

### P2 – Seed-Retest, breite Gates, Wissenspflege und Integration

- Betroffenen Seed und mindestens das betroffene Runner-Matchup nachtesten.
- Angrenzende Engine-Suite sowie realistische breite Gates ausführen.
- Evidence-/Final-Report und Monatslog ergänzen.
- Arbeitsbranch mit aktuellem `main` abgleichen, lokal integrieren und den
  sauberen Worktree entfernen.
- Done-Gate: fokussierte und breite Checks sind grün, der Seed produziert
  keine IllegalAction, `main` enthält den Fix und fremde Änderungen sind
  erhalten.
- Commit: `docs(ai): verify test spin choice run guard`.

## Verbindliches `/Goal`

```text
/Goal Arbeite Test-Spin Choice-/Run-Guard vollständig und sequenziell von P0
bis P2 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Arbeite
ausschließlich im Worktree C:\Projekte\NETGRID_AI_TEST_SPIN_RUN_GUARD auf
Branch codex/test-spin-choice-run-guard. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und
committe jedes abgeschlossene Paket. Stoppe bei Engine-, Hidden-Info-, Replay-
oder Side-Safety-Regression. Integriere nach Abschluss aktuelles main,
verifiziere final, merge lokal nach main, entferne den Worktree und schließe
das Goal erst danach ab.
```

## Abschlusskriterien

- Der konkrete Seedfehler ist mit Zustand und Ursache belegt.
- Der Fix ist generisch am Run-/Choice-Vertrag und nicht in KI-Kartenlogik.
- Positive und negative Engine-Regressionen schützen den Vertrag.
- Der Fehlerseed läuft ohne IllegalAction; relevante Gates sind grün.
- Branch ist lokal nach `main` integriert und der Worktree entfernt.

## Abschlussstand

- P0 belegte den synchronen erfolgreichen Leere-Archives-Run als Ursache.
- P1 übergibt die bereits vorhandenen `testSpinTemporaryInstall`-Metadaten
  atomar über `StartRunOptions`; der neue Grenztest schützt sofortiges
  Run-Ende, Rückmischung, PublicPayload und Replay.
- Seed 11 sowie alle 25 Seeds des Proteus-HQ-Matchups liefen ohne
  IllegalAction oder Replayfehler und vollständig redaction-safe.
- Engine-Typecheck, AI-Typecheck, 27 fokussierte/angrenzende Tests und die
  vollständige Engine-Suite mit 180 Dateien und 1.619 Tests sind grün.
