# CardSpec-Zufallsreview Batch 14 – Umsetzungsprozess

Status: in Arbeit  
Quelle: Nutzerbericht „NETGRID – CardSpec-Zufallsreview Batch 14: Findings“, Stand 2026-08-16  
Ausgangsbranch: `main` auf `00a3a635a`

## Zielprüfung

Der Bericht ist für eine direkte, konservative Umsetzung ausreichend präzise. Jede Empfehlung wird gegen den aktuellen CardSpec, die geschlossenen Planning-Verträge, den Hint-Compiler und die Originalquelle geprüft. Plausible, aber derzeit nicht konsumierte Wunschheuristiken werden nicht als neue Taxonomie erfunden.

## Gesamtziel

`/Goal` Batch 14 vollständig und sequenziell prüfen, alle auf dem aktuellen Stand bestätigten Text-, Semantik-, Risiko-, Strategie- und TargetProfile-Fehler ursachenorientiert korrigieren, fokussiert verifizieren und den sauberen Arbeitsbranch lokal nach `main` integrieren.

## Annahmen und Nicht-Ziele

- Der Bericht bestätigt keine neue Runtime- oder Regelmechanikabweichung; Engine-Änderungen sind daher nicht vorgesehen.
- CardSpec-Annotationen bleiben deklarativ und read-only. Sie erzeugen keine Legalität und keine zweite Entscheidungsautorität.
- Actor-private Information darf in der zuständigen planlokalen Auswahl genutzt werden, wird aber nicht öffentlich projiziert.
- Neue Signal-, Risiko- oder Preference-Begriffe entstehen nur, wenn der geschlossene Katalog und ein produktiver Consumer sie bereits tragen oder eine wiederverwendbare, getestete Katalogerweiterung fachlich notwendig ist.
- Vollständige neue Such-, Hosting-, Installationssequenz- oder Positionsalgorithmen in Planmodulen sind kein stiller Bestandteil dieses CardSpec-Semantikpakets.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerauftrag.

## Controller-Invarianten

- Rules Engine und aktuelle `LegalActions` bleiben alleinige Regelautorität.
- Choice-Profile beschreiben nur echte Ziel-, Modus- oder Optionswahlen.
- Fest gebundene Ziele erhalten kein künstliches TargetProfile.
- Strategieanker bleiben echten Engines, Enablern, Payoffs, Schlüsselkarten oder Win Conditions vorbehalten.
- Eigene private Information darf ausgewertet, aber nicht an die Gegenseite geleakt werden.
- Der Planowner entscheidet Ziel, Quelle, Menge, Reihenfolge und Ressourceneinsatz; ein Choice-Resolver vervollständigt nur die gebundene Payload.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Abweichende aktuelle Repo-Wahrheit schlägt den älteren Prüfstand und wird dokumentiert.
- Ein roter fokussierter Check wird ursachenbezogen behoben, bevor das nächste Paket beginnt.
- Ein fachlicher Vertragskonflikt, nicht ausdrückbare erforderliche Semantik oder fremde kollidierende Änderung stoppt das betroffene Paket mit Removal Condition.
- Unabhängige Baseline-Fehler werden getrennt ausgewiesen und nicht durch Fallbacks kaschiert.

## State Machine

`disposition -> canonical_text -> target_and_choice_semantics -> roles_risks_and_strategy -> verification -> main_integration -> cleanup -> complete`

Genau ein Paket ist aktiv. Jedes Paket endet mit fokussierter Prüfung, `git diff --check` und eigenem Commit.

## Paketfolge

### B14-01 – Disposition und Prozess

- Bericht gegen aktuellen Stand, Quellen, Katalog und Compiler prüfen.
- Bestätigte, bereits generisch abgedeckte, nicht ausdrückbare und abzulehnende Punkte trennen.
- Done-Gate: Prozessartefakt committed.
- Commit: `docs(cards): plan batch 14 review fixes`

### B14-02 – Kanonischer Kartentext

- Quelltreue Creditnotation für Dwarf, Databroker, Codeslinger, Raptor, Wilson und Day Shift korrigieren.
- Done-Gate: fokussierte Textprojektion und CardSpec-Tests grün.
- Commit: `fix(cards): normalize batch 14 canonical credit text`

### B14-03 – Ziel-, Choice- und actor-private Semantik

- Unberechtigte Profile bei fest gebundenen Zielen entfernen.
- Vorhandene Profile echter Hosting-, Such-, Positions-, Mengen- und eigener Hidden-Zone-Choices mit den geschlossenen Katalogbegriffen präzisieren.
- Keine Planentscheidung in Resolver oder allgemeinen Scheduler verlagern.
- Done-Gate: CardSpec-/Hint-Invarianten und fokussierte Compiler-Assertions grün.
- Commit: `fix(cards): align batch 14 target semantics`

### B14-04 – Rollen, Risiken und Strategieanker

- Falsche Run-/Economy-/Tagrollen korrigieren.
- Übergewichtete ICE- und Support-Anker entfernen.
- Bereits katalogisierte Risiken und präzise Schutz-/Damage-Semantik ergänzen, soweit sie nicht mechanisch abgeleitet wird.
- Done-Gate: fokussierte Semantiktests, Hint-Compiler und Strategiechecks grün.
- Commit: `fix(cards): refine batch 14 planning semantics`

### B14-05 – Abschluss und Integration

- Relevante Karten- und AI-Hint-Tests, Paket-Typecheck sowie generierte-Hints-Gate ausführen.
- Prozessartefakt mit tatsächlicher Disposition und Evidence abschließen.
- Arbeitsbranch mit aktuellem `main` abgleichen, lokal integrieren und Hauptworkspace prüfen.
- Worktree entfernen, Entfernung in Git und Dateisystem prüfen, gemergten Branch löschen.
- Commit: `docs(cards): record batch 14 verification`

## Verifikationsregeln

- Iterativ nur fokussierte CardSpec-/Hint-Tests.
- Bei geänderten CardSpec-Typoberflächen oder gemeinsamen Katalogen: Cards- und AI-Typecheck sowie betroffene Struktur-/Hint-Gates.
- Kein vollständiger Workspace-/E2E-Lauf ohne breitere Wirkung.
- Abschluss mindestens: fokussierte Tests, `corepack pnpm --filter @netgrid/cards typecheck`, relevante AI-Hint-Tests/Gates und `git diff --check`.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_CARD_RANDOM_BATCH_14`
- Branch: `codex/card-random-batch-14`
- Hauptworkspace wird bis zur finalen lokalen Integration nicht verändert.
- Jeder abgeschlossene Schritt erhält einen eigenen Commit.
- Vor Merge wird aktuelles `main` defensiv integriert, falls es weitergelaufen ist.
- Nach erfolgreichem Merge werden Worktree und Branch ohne Force entfernt und doppelt verifiziert.

## Abschlusskriterien

- Alle 30 Findings besitzen eine belegte Disposition.
- Bestätigte Korrekturen sind im CardSpec bzw. bestehenden Semantikvertrag umgesetzt.
- Abgelehnte oder zurückgestellte Wunschheuristiken sind begründet.
- Relevante Checks sind grün oder ein unabhängiger Baseline-Blocker ist exakt dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Worktree und Arbeitsbranch sind verifiziert entfernt.
