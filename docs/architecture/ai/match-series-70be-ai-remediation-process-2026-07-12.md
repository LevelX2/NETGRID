# Matchserie 70BE: KI-Remediation-Prozess

Status: abgeschlossen und lokal nach `main` integriert

## Quelle und Gesamtziel

Quelle ist die freigegebene Analyse der Side-Swap-Serie
`series_70be007e45d843a0` mit den Matches
`match_a199d04c94d5a906` und `match_3bb2232dccc0a1da`.

`/Goal` Arbeite die sechs freigegebenen KI- und Gate-Befunde dieser Serie
vollständig und sequenziell ab, verifiziere jeden Befund mit realitätsnahen
Engine-/AI-Regressionen und merge den abgeschlossenen Arbeitsbranch lokal
nach `main`.

## Zielprüfung

Der Endzustand ist ausreichend präzise:

- Korp-Scoreline-Installationen bleiben nur aktiv, wenn ihr vollständiger
  Same-Turn-Closeout über jede Engine-/AI-Transition ausführbar bleibt;
- Broker-Aufbau und -Auszahlung überstehen die side-sichere AI-Input-Grenze;
- Draw-Tax-Entscheidungen bewerten Tags und Credits als Folgekosten;
- Event-Runs verwenden die Route nach Zahlung ihrer Aktionskosten;
- akuter Runner-Handpuffer kann opportunistische Run-Pläne überstimmen;
- Real-Engine- und Sequenztests decken die tatsächlichen Live-Verträge ab.

## Nicht-Ziele

- keine Nutzung zukünftiger oder gegnerischer Hidden Information;
- keine Kartennamen-Sonderregeln, wenn Action- oder Ontologie-Semantik reicht;
- keine Änderung der Engine-Regelautorität oder Erzeugung eigener AI-Aktionen;
- keine Optimierung bloßer Probe-Runs gegen damals ungerezztes ICE;
- kein Push und kein Pull Request.

## Controller-Invarianten

- Die Rules Engine erzeugt sämtliche `LegalActions`.
- Die KI konsumiert nur side-sichere `PlayerView`, `PublicEvents`,
  `LegalActions` und erlaubte Metadaten.
- Negative oder blockierte Planpfade dürfen sichere LegalActions nicht allein
  wegen Planbindung verdrängen.
- Realitätsregressionen müssen Engine-erzeugte Inputs verwenden, wenn der
  Fehler an einer Producer-/Projection-/Consumer-Grenze liegt.
- Genau ein Paket ist aktiv; jedes Paket erhält Checks und einen eigenen
  Commit.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden innerhalb des aktiven Pakets diagnostiziert.
- Testfixtures dürfen den Live-Input-Vertrag nicht durch zusätzliche Felder
  umgehen.
- Ein Engine-, Side-Safety- oder Replay-Fehler stoppt den Prozess.
- Fremde Änderungen auf `main` werden erst am Integrationspunkt defensiv
  eingebunden.

## State Machine und Paketfolge

1. `P01 evidence`: Prozess, Match-Evidence und reproduzierbare Befunde.
2. `P02 corp-scoreline`: Same-Turn-Score-Konversion transitionsicher machen.
3. `P03 runner-action-semantics`: Broker-, Draw-Tax- und Event-Run-Semantik
   durch die Live-Grenzen führen.
4. `P04 runner-hand-buffer`: Akute Handentwicklung gegen Planbindung härten.
5. `P05 reality-gates`: Engine-erzeugte und sequenznahe Regressionen ergänzen.
6. `P06 closeout`: Breite Checks, Final Review, Wissenspflege und Integration.

## Paketdetails

### P01 Evidence

- Kernartefakte: dieser Prozess und der Evidence-Report unter
  `docs/reviews/ai/`.
- Done-Gate: alle sechs Befunde mit Decision-/StateVersion-Ankern und
  Akzeptanzkriterien dokumentiert; `git diff --check` grün.
- Commit: `docs(ai): record match series 70be remediation evidence`.

### P02 Korp-Scoreline

- Arbeit: generische Score-Konversionssemantik auch für spezialisierte
  Operation-Resolver durch die Engine-/AI-Grenze führen. Ungeschützte,
  contestbare Agenda-Installationen bleiben nur bei einem nach jeder Aktion
  weiterhin ausführbaren Same-Turn-Closeout zulässig.
- Done-Gate: beide gespeicherten Zustandsmuster führen den vollständigen Pfad
  `Install → Systematic Layoffs → Advance → Score` aus; fehlt die generische
  Semantik oder eine Ressource, bleibt der Install fail-closed.
- Commit: `fix(ai): preserve same-turn score conversion follow-through`.

### P03 Runner-Action-Semantik

- Arbeit: generische Hosted-Credit-Semantik, Draw-Tax-Folgekosten und
  post-cost Event-Run-Pfade in der Live-Runtime auswerten.
- Done-Gate: Broker wird aus Engine-Input erkannt, bezahlbarer Draw vermeidet
  den unnötigen Tag, Rush Hour startet keinen bekannten unbezahlbaren Pfad.
- Commit: `fix(ai): preserve runner action semantics across live input`.

### P04 Runner-Handpuffer

- Arbeit: Handpuffer als akute Planpriorität modellieren, nicht nur als später
  wegfilterbare Action-Score-Komponente.
- Done-Gate: Ein-Karten-Zustände entwickeln die Hand, sofern kein sichtbarer
  unmittelbarer Payoff das Risiko rechtfertigt.
- Commit: `fix(ai): let acute hand buffer preempt speculative runs`.

### P05 Realitätsgates

- Arbeit: echte Engine-Inputs und notwendige Plansequenzen für alle Befunde
  abdecken; synthetische Payload-Abkürzungen vermeiden.
- Done-Gate: fokussierte Real-Engine-/Sequenztests und angrenzende Regressionen
  grün; Hidden-Info- und LegalAction-Vertrag belegt.
- Commit: `test(ai): cover match series 70be live regressions`.

### P06 Abschluss

- Arbeit: Final Review, aktuelles Monatslog, breite AI-Checks und lokaler Merge.
- Done-Gate: Arbeitsbranch sauber, relevante Gates grün, `main` integriert und
  nach dem Merge erneut geprüft.
- Commit: `docs(ai): close match series 70be remediation`.

## Verifikationsregeln

Mindestens:

- fokussierte Vitest-Regressionen je Paket;
- angrenzende Runtime-/Plan-/Real-Engine-Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- relevante AI-Gates bei Datenänderungen;
- `git diff --check` nach jedem Paket;
- nach Integration derselbe relevante Verify-Lauf auf `main`.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI_SERIES_70BE_REMEDIATION`
- Branch: `codex/ai-series-70be-remediation`
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für den finalen lokalen Merge.
- Vor dem Merge wird aktuelles `main` defensiv in den Arbeitsbranch integriert.
- Kein Push und kein PR ohne gesonderte Nutzeranweisung.

## Abschlusskriterien

Der Prozess ist erst abgeschlossen, wenn alle sechs Pakete committed, die
relevanten Checks grün, der Branch lokal nach `main` integriert und der
Hauptworkspace nach dem Merge sauber verifiziert ist.

## Abschlussstand 2026-07-12

- P01 bis P06 sind umgesetzt und jeweils committed.
- Die gespeicherten Problemzustände wurden nach der Korrektur erneut über den
  aktuellen Engine-/AI-Pfad ausgewertet.
- Das neue Real-Engine-Gate erzeugt die LegalActions selbst und wendet die
  vollständige Korp-Score-Sequenz tatsächlich an.
- Die erste breite AI-Suite fand zwei zu weit gefasste Handpuffer-Fixtures;
  nach der Review-Nachschärfung wirkt der Override nur gegen tatsächlich
  gemappte spekulative Runs und nicht gegen positive Broker-/No-Run-Verträge.
- 297 AI-Testdateien mit 1.955 Tests, die vollständige Engine-Suite,
  Engine-/AI-Typecheck, `check:ai`, Deck-Doctrine und Diff-Hygiene sind grün.
- Führender Abschlussnachweis:
  `docs/reviews/ai/match-series-70be-ai-final-review-2026-07-12.md`.
- Der Arbeitsbranch wurde konfliktfrei per Fast-forward lokal nach `main`
  integriert.
