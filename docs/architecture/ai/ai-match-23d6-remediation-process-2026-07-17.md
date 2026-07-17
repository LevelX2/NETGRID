# Match 23D6: Runner-Run-, Breaker-, Broker- und Hint-Remediation

Status: abgeschlossen; lokale Main-Integration ausstehend

## Quelle und Zielprüfung

Quelle ist das abgeschlossene Match `match_23d6dc3849db2566` aus der lokalen,
read-only ausgewerteten SQLite-Runtime. Alle 199 Runner-KI-Entscheidungen sind
durch detaillierte AI-Traces gedeckt. Der Nutzer hat nach der vollständigen
Analyse die direkte Umsetzung von sechs Punkten freigegeben und ausdrücklich
die Prüfung der Hints sowie ihrer Capability-, Strategy- und Runtime-Consumer
verlangt.

Die Vorgabe ist präzise genug für einen sequenziellen Paketprozess. Ein
KI-Verhaltensfix wird nur umgesetzt, wenn der spielgleiche Checkpoint auf dem
aktuellen Code als `behavior_regression` rot ist. Engine-LegalAction- und
Hint-Compiler-Findings erhalten stattdessen eigene Engine- beziehungsweise
Consumer-Vertragstests.

## Gesamtziel und `/Goal`

`/Goal`: Die sechs freigegebenen Findings aus Match 23D6 im eigenen Worktree
zuerst als spielgleiche Decision-Checkpoints oder schichtspezifische rote
Verträge sichern, ausschließlich bestätigte aktuelle Fehler generisch in
AI-Input, RunPlan, Handkarten-/Bank-Arbitration, Breaker-Suche, Viacox-Engine
und Hint-Consumern korrigieren, den Skullcap-Compiler-Overlap schließen,
unveränderte Erwartungen und enge Gegenproben grün verifizieren, alle Pakete
einzeln committen und den fertigen Arbeitsbranch lokal nach `main` integrieren.

- Arbeitsbranch: `codex/ai-match-23d6-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_23D6_REMEDIATION`
- Ausgangs-`main`: `24bee63ce1ef6fd451fec83a035da1ad89daa4c8`
- Runtime-Evidence:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Push oder Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Das Runner-Deck bleibt unverändert. Seine Einzelkopien von Krash,
  Codecracker, Dwarf, Loony Goon, Aujourd'Oui und Broker sind Kontext, aber
  kein Anlass für Deckbauarbeit.
- Die Viacox-Würfe 3 auf R&D sind regelkonforme Pflichtaktionen und werden
  nicht durch KI-Scoring unterdrückt. Korrigiert werden Installationsrisiko,
  Hint-Vertrag und die Zielwahl bei Wurf 5.
- Frühe Runs gegen unbekanntes ICE bleiben zulässig. Der Prozess korrigiert
  ausschließlich den belegten Subroutine-Zielverlust und erzwungene
  LegalAction-Lücken.
- Broker bleibt ein verzögerter Bankwert und keine sofortige Liquidität. Ein
  Fundingplan darf ihn dennoch nicht absolut verdrängen, wenn die Zielkarte
  im verbleibenden Zug nicht mehr installiert werden kann.
- Aujourd'Oui darf nur bei konkretem, side-safe erkennbarem Coverage-Bedarf
  einen Economy-Plan unterbrechen.
- Der Skullcap-Fund ist unabhängig vom Matchverlauf, aber durch den
  verpflichtenden 27-Karten-Deck-Audit blockierend.
- Fremde Worktrees und zwischenzeitliche `main`-Änderungen bleiben
  unangetastet.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben einzige Aktionsautorität.
- AI-Input-Erweiterungen verwenden positive Allowlisting und nur
  actor-sichere Zieldaten aus bereits legalen Aktionen.
- Checkpoints enthalten nur das öffentliche Eventpräfix bis zur Zieldecision,
  den historischen Actor-/Deck-Kontext und side-safe Runtime-Memory.
- Vor dem Red-Evidence-Commit wird kein Produktionscode geändert.
- Nur `behavior_regression` autorisiert einen KI-Verhaltensfix; bereits grüne
  oder driftende Fälle werden dokumentiert, nicht passend gestimmt.
- Hint-Korrekturen werden bis aktiver Hint, Compiler, Inspector,
  DeckCapability, DeckStrategy, Action-Projektion und produktiver Arbitration
  verfolgt.
- Viacox-Wurf 5 bietet die regelkonforme Auswahl legaler Remotes; `applyAction`
  validiert weiterhin das gewählte Ziel.
- Genau ein Paket ist aktiv. Jedes abgeschlossene Paket erhält einen Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`,
  `fixture_migration_required`, Warmup-Drift und Redaction-Fehler sind keine
  rote KI-Verhaltensevidence.
- Ist ein späterer Strict-Capture durch frühere aktuelle Verhaltensdrift
  blockiert, wird nicht still auf `rebase` gewechselt. Der Fall wird als
  nicht spielgleich reproduzierbar dokumentiert oder erhält einen engeren,
  schichtspezifischen Vertrag.
- Erfordert eine Lösung Hidden Info, nicht deterministische Auswahl oder eine
  KI-seitige Umgehung fehlender LegalActions, stoppt der Prozess.
- Neue Engine-, Replay-, StateHash-, Side-Safety-, Hint- oder AI-Gate-Fehler
  blockieren Abschluss und Merge.

## State Machine

`preflight -> process_committed -> evidence_committed -> red_evidence_committed -> input_fixed -> arbitration_fixed -> viacox_fixed -> hint_audit_green -> broad_green -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Preflight, Worktree und Prozessbasis

- Ziel: Scope, `/Goal`, Invarianten, Paketfolge und Integrationsregeln
  versionieren.
- Check: `git diff --check`.
- Done-Gate: Prozessartefakt ist separat committed.
- Commit: `docs(ai): plan match 23d6 remediation`

### P1 – Spiel-Evidence und Consumer-Ketten

- Ziel: 199/199-Decision-Coverage, zwölf Finding-Anker, erzwungene
  Viacox-Runs, bessere Alternativen, Decksnapshot und vollständige Hint-/
  Consumer-Ketten dauerhaft dokumentieren.
- Kernartefakt:
  `docs/reviews/ai/match-23d6-runner-remediation-evidence-2026-07-17.md`.
- Done-Gate: historische Findings, aktuelle Einzelreproduktion und Nicht-Ziele
  sind getrennt; Deck-Audit 27/27 inklusive Skullcap-Blocker ist enthalten.
- Commit: `docs(ai): record match 23d6 evidence`

### P2 – Spielgleiche Checkpoints und rote Schichtverträge

- Zieldecisions: D37 Viral 15, D130 Broker, D164 Aujourd'Oui und D148 Viacox.
- Engine-Vertrag: D70/Viacox-Wurf 5 muss bei mehreren Remotes Auswahl bieten.
- Hint-Verträge: Viacox darf Zufallsdraw nicht als Search-Werkzeug und
  Pflichtaktionen nicht risikolos ausgeben; Skullcap darf keinen
  überlappenden Damage-Prevention-Effekt kompilieren.
- Gegenproben:
  - Viral 15 mit Jack-out-Absicht beziehungsweise ausreichenden Credits;
  - sofort konvertierbarer Handkarten-Fundingplan und akute Liquidität;
  - Aujourd'Oui ohne konkrete Coverage-Lücke;
  - Viacox auf sicherem Board sowie Wurf 5 mit einem oder keinem Remote;
  - unterschiedliche, nicht überlappende Prevention-Effekte.
- Done-Gate: valide AI-Zieltests scheitern nur als `behavior_regression`;
  Engine-/Hint-Verträge sind in ihrer eigenen Schicht rot; Gegenproben bleiben
  grün; alles ist vor Produktionscode committed.
- Commit: `test(ai): capture match 23d6 regressions`

### P3 – Side-sichere Encounter-Zieldaten

- Ziel: Subroutine-Zielindex und erforderlicher Break-Kontext bleiben durch
  `buildAiDecisionInput` erhalten und werden von Score sowie RunPlan genutzt.
- Checks: DTO-, Break-Score-, RunPlan- und D37-Checkpointtests.
- Done-Gate: D37 bricht den Programmtrash; Gegenproben bleiben grün.
- Commit: `fix(ai): preserve encounter break targets`

### P4 – Broker-, Funding- und Coverage-Arbitration

- Ziel: Fundingpläne revalidieren verbleibende Klicks und Yield zu einer
  sinnvollen Bank-Cadence oder konkreten Coverage-Suche.
- Checks: D130-/D164-Checkpoints, Bank-, Handdevelopment-, PlanRanking- und
  Coverage-Search-Gegenproben.
- Done-Gate: Broker wird nicht durch einen in diesem Zug unkonvertierbaren
  Fundingplan verdrängt; Aujourd'Oui unterbricht nur bei konkreter Lücke.
- Commit: `fix(ai): revalidate funding against bank and coverage`

### P5 – Viacox Engine, Hints und Risiko-Consumer

- Ziel: Wurf 5 erzeugt korrekte Remote-Auswahl; Hint und Installationsconsumer
  unterscheiden zufälligen Draw, Pflichtaktion und boardabhängiges Runrisiko.
- Checks: Engine-LegalActions/applyAction, Hint-Compiler/Inspector,
  DeckCapability/DeckStrategy, Handdevelopment/Score und D148-Checkpoint.
- Done-Gate: gefährliche Installation verliert gegen produktive Alternativen,
  sichere Nutzung bleibt möglich, Wurf 3/4 bleibt verpflichtend.
- Commit: `fix(engine-ai): model Viacox choices and risk`

### P6 – Skullcap und deckweiter Hint-/Consumer-Audit

- Ziel: Damage-Prevention-Overlap fachlich deduplizieren und alle 27
  eindeutigen Karten erneut bis zu Capability-/Strategy-Consumern auditieren.
- Checks: Hint-Compiler-Vertrag, Inspector/Derived Facts, fester
  `audit-ai-deck-hint-consumers.ts`-Lauf ohne Blocker.
- Done-Gate: Auditstatus `ok`, 27/27 Karten, null neue Warnungen oder Blocker.
- Commit: `fix(ai): normalize deck hint consumer contracts`

### P7 – Breite Gates, Review, Wissenspflege, Main-Integration und Cleanup

- Ziel: AI-Testshards beziehungsweise vollständige AI-Suite, Engine-Tests,
  Hint-/Ontology-Gates, Typechecks, Final Review und Wissenspflege abschließen;
  aktuelles `main` defensiv einbinden, final prüfen, lokal mergen und Worktree
  sowie Branch verifiziert entfernen.
- Done-Gate: alle neuen und angrenzenden Checks grün oder Baseline-Abweichungen
  nachvollziehbar klassifiziert; `main` enthält alle Commits und ist sauber;
  Worktree-Pfad und Arbeitsbranch existieren weder in Git noch im Dateisystem.
- Commit: `docs(ai): close match 23d6 remediation`

## Verifikationsregeln

- Checkpoint-Erwartungen werden nach rotem Nachweis nicht abgeschwächt.
- Jede neue Priorität erhält mindestens eine enge Gegenprobe.
- Bei Runtime-/Arbitration-Änderungen laufen die AI-Testshards oder die
  vollständige AI-Suite.
- Bei Hint-Änderungen laufen Generator-/Konsistenzgates, Inspector-Checks und
  der deckweite Consumer-Audit; JSON-Artefakte werden nur über bestehende
  Generatoren aktualisiert.
- Engine-Änderungen werden deterministisch auf LegalActions, `applyAction`,
  Replay und StateHash geprüft.
- Vor jedem Commit: relevante Checks und `git diff --check`.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree
  `C:\Projekte\NETGRID_AI_MATCH_23D6_REMEDIATION`.
- Hauptworkspace nur für Runtime-Evidence und finalen lokalen Merge nutzen.
- Jedes Paket endet mit selektivem Staging und eigenem Commit.
- Kein Push und kein Pull Request.
- Vor Cleanup werden absoluter Worktree-Pfad, sauberer Status und erfolgreiche
  Main-Integration erneut geprüft.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_23D6_REMEDIATION` auf Branch
`codex/ai-match-23d6-remediation`. Arbeite immer nur am aktuellen Paket,
sichere historische Verhaltens- und Schichtverträge vor Produktionsänderungen,
akzeptiere nur `behavior_regression` als roten KI-Nachweis, ändere danach keine
Erwartungen, prüfe Hints bis zu ihren produktiven Consumern, committe jedes
abgeschlossene Paket und nutze den Hauptworkspace nur für Runtime-Evidence und
den finalen Merge.

## Abschlusskriterien

- Alle sechs freigegebenen Punkte besitzen valide Checkpoints oder rote
  schichtspezifische Verträge und grüne Gegenproben.
- Jeder KI-Verhaltensfix war vorab als `behavior_regression` rot.
- AI-Input, RunPlan, Funding, Bank, Coverage-Suche, Viacox und Skullcap sind
  generisch, side-safe und replay-stabil korrigiert.
- Der 27-Karten-Deck-Audit ist ohne Consumer-Drift grün.
- Pflichtchecks und verbleibende Grenzen sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.

## Ausführungsstand

- P0 abgeschlossen: Prozessbasis in Commit `7c0079d11`.
- P1 abgeschlossen: 199/199-Entscheidungsevidenz in Commit `106f5b1bf`.
- P2 abgeschlossen: D37 strict und driftfrei capturt; D58 besitzt ebenfalls
  null Warmup-Drifts. Die späteren D130-/D148-/D164-/D176-Fixtures sind als
  explizite Migration mit vier dokumentierten frühen Drifts und langem
  kompatiblem Suffix capturt. Fünf KI-Erwartungen sind als
  `behavior_regression` rot, der sichere Viacox-Kontrollfall ist grün.
- P2-Schichtverträge sind rot: Encounter-Ziele fehlen im DTO, Viacox-Wurf 5
  bietet bei zwei Remotes nur Remote 1, Viacox enthält falsche Search-Semantik
  und keine Risiko-Tags, Skullcap besitzt zwei überlappende generische
  Damage-Prevention-Effekte. Der 27/27-Deck-Audit bestätigt genau den einen
  Skullcap-Blocker bei null Warnungen.
- P3 abgeschlossen: Die positive LegalAction-Allowlist erhält ausschließlich
  die actor-sicheren Encounter-Felder `breakerId`, `iceId`,
  `subroutineIndex` und `subroutineIndexes`. DTO- und Side-Safety-Vertrag,
  Break-Score, RunPlan-Zitat und D37-Checkpoint sind grün; D37 bricht nun die
  programmtrashende Subroutine 2 und behält Krash.
- P4 abgeschlossen: Fundingpläne publizieren ihren vollständigen
  Click-to-fund-plus-convert-Horizont. Nur bei
  `funding_same_turn_convertible:false` darf ein höher bewerteter erster
  Bank-Load den Basiscredit unterbrechen. Eine Programmsuch-Installation
  erhält nur bei side-safe sichtbarer, aktuell unpassierbarer ICE-Coverage-
  Lücke einen Interrupt. D130, D164 und D176 sowie Liquid-Funding- und
  No-Coverage-Gegenproben sind grün; Bank-, Search-, PlanRanking- und
  Typecheck-Verträge bestehen.
- P5 abgeschlossen: Die Engine führt Wurf 5 als eingeschränkte
  `start_run_remote`-Aktionsfamilie und bietet damit alle vorhandenen Remotes
  an; ohne Remote entsteht keine Pflichtaktion, Wurf 3/4 bleibt fest auf
  R&D/HQ. Chronicle, `applyAction`, Replay und StateHash sind mitgeprüft.
  Viacox besitzt keine falsche Search-Semantik mehr, publiziert
  `mandatory_action` und `random_outcome` bis in Inspector und
  Action-Semantik und erhält eine negative Installationskomponente. Ein
  deutlich stärkerer Broker-Bankzug darf diesen risikobehafteten
  Handkartenplan überstimmen. D148 ist grün, D58 bleibt als sichere
  Installationsgegenprobe grün; 76 angrenzende AI-Verträge und 21
  Engine-Verträge bestehen.
- P6 abgeschlossen: Skullcap ist in der bestehenden, geprüften
  Effect-Normalisierung registriert. Der kompilierte generische
  Damage-Prevention-Effekt liegt genau einmal vor und trägt die Typen Brain
  und Net. Der feste Deck-Audit erfasst erneut 27/27 eindeutige und 45/45
  Karten; Capability-/Search- und Doctrine-/Strategy-Consumer liefern Status
  `ok` mit null Blockern und null Warnungen. Viacox erscheint dabei nur noch
  mit Pflicht-/Zufallsaktions- und Run-Signalen, nicht mehr als Search-Tool.
- P7 abgeschlossen: Alle drei AI-Testshards sind auf dem abschließend
  formatierten Stand mit 374 Dateien und 2.580 Tests grün. Die fokussierten
  Runtime-/23D6-, Hint-/9FEF- und Source-Role-Verträge sind darin enthalten.
  Engine ist mit 1.717 Tests, Web mit 626 Tests und der
  Workspace-Typecheck für alle sieben Projekte grün. `check:ai`, Hint-
  Inspector-Index, Source-Struktur, Formatprüfung, `git diff --check` und der
  27/27-Deck-Audit bestehen. Ein im breiten Lauf erkannter 9FEF-Kontrollfehler
  wurde durch die enge Autorität strukturierter `delayed_penalty`-Risiken
  behoben, ohne gewöhnliche Draw-Rohmechaniken zu unterdrücken. Ausstehend ist
  nur die im Anschluss an diesen Paketcommit ausgeführte lokale
  Main-Integration samt Worktree-/Branch-Cleanup.
