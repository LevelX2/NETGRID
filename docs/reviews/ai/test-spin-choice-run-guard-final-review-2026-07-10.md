# Test-Spin Choice-/Run-Guard: Final Review

## Ergebnis

Der Test-Spin-Folgefund ist behoben. Der Fehler war keine illegale
KI-Entscheidung und kein Run-Lock: Ein Run auf leere, ungeschützte Archives
kann korrekt vollständig innerhalb von `startRun` enden. Der Resolver setzte
seine Run-End-Metadaten bislang erst danach und deutete den bereits beendeten
Run fälschlich als fehlgeschlagen.

Der Resolver übergibt `testSpinTemporaryInstall` jetzt atomar über den
vorhandenen generischen `StartRunOptions`-Vertrag. Dadurch besitzt auch ein
synchron endender Run beim Cleanup alle benötigten Daten. Die nachträgliche
`state.run`-Existenzprüfung und Mutation entfallen.

## Engine-Regression

Der neue Grenztest spielt Test Spin auf leere, ungeschützte Archives und
bestätigt:

- Event und runnerprivate Programmchoice werden legal aufgelöst;
- der Run darf bereits beim Rücksprung aus `startRun` beendet sein;
- das temporär installierte Programm liegt nicht mehr im Rig und ist wieder
  verdeckt im Stack;
- das PublicPayload meldet Runstart und Rückgabe ohne Hidden-Info-Leak;
- Replay und StateHash bleiben stabil.

Die bestehenden positiven Rückgabe- und Penalty-Tests bleiben unverändert
grün.

## Seed- und Matchup-Nachtest

Der ursprüngliche Fehlerseed
`proteus_hq_virus_derez` / `universal-fast-advance-11` lief mit identischen
Decks und `current_candidate`-Controllern erneut:

- vor dem Fix: Abbruch bei StateVersion 152, eine IllegalAction;
- nach dem Fix: Corp-Sieg 7:2 nach 162 Aktionen;
- 0 IllegalActions, 0 Replayfehler, redaction-safe.

Der erweiterte Nachtest über Seeds 01 bis 25 des gleichen Matchups ergab:

- 25 Spiele und 5.264 Entscheidungen;
- 11 Corp-Siege, 14 Runner-Siege, 0 Action-Limits;
- 0 IllegalActions und 0 Replayfehler;
- vollständig redaction-safe.

Die 23 übrigen mittleren Qualitätsfindings betreffen bestehende strategische
Detektoren (21 wiederholte No-Progress-Runs, zwei Bank-over-Target-Fälle).
Sie sind weder Engine-/Choice- noch Replay-/Hidden-Info-Fehler und wurden
nicht in diesen Fix hineingezogen.

## Gates

- fokussierte/angrenzende Engine-Tests: 3 Dateien, 27 Tests;
- Engine-Typecheck: grün;
- AI-Typecheck: grün;
- vollständige Engine-Suite: 180 Dateien, 1.623 Tests;
- `git diff --check`: grün.

## Grenzen und Nicht-Ziele

- keine KI-Gewichts-, Plan- oder Hintänderung;
- keine Karten-ID-Sonderlogik in der KI;
- keine Regeländerung an Test Spin;
- keine Bearbeitung der unabhängigen strategischen Matchup-Findings.

## Rohdaten

Die umfangreichen Selfplay-Reports bleiben unversioniert unter
`data/local/`:

- `test-spin-seed-11-before.json`
- `test-spin-seed-11-after.json`
- `test-spin-hq-matchup-25-after.json`
