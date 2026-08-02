# B0B0 Runner Remediation

- Status: **in Arbeit**
- Quelle: vollständiger Entscheidungs-Audit von `match_b0b0bffec6715028`
- Primärer Agent: `card-enablement-ai-knowledge-agent`
- Arbeitsbranch: `codex/b0b0-runner-remediation`
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_B0B0_RUNNER_REMEDIATION`

## Zielprüfung

Die Nutzerfreigabe umfasst die bestätigten Findings F1 bis F3. Der bereits auf
`main` integrierte D57-Fix ist die Ausgangsbasis. Seine exakte Match-Regression
ist grün, die erneute Prüfung zeigt aber eine zu breite Producer-Grenze: Der
aktuelle Helper behandelt jedes sichtbare gerezzte Ontologie-`tag_source` wie
eine Draw-Tax-Quelle. Die D57-Härtung gehört deshalb in den freigegebenen Scope.

## Gesamtziel

Die drei reproduzierbaren Runner-Fehler aus dem Match werden generisch und
plan-first behoben:

1. Run-only-Credit-Pools werden nur durch eine konkrete, zielgebundene
   Run-Route materialisiert.
2. Draw-Tax-Projektion erkennt ausschließlich strukturiert als Ziehsteuer
   ausgewiesene Quellen und bewahrt bezahlbare Multi-Draw-Linien.
3. Bei bestätigtem Flatline-Risiko bindet `runner.defense_and_recovery` die
   Keep-Priorität sichtbarer Notfallprävention an den erzwungenen Abwurf.

Alle historischen Checkpoints müssen vor der jeweiligen Korrektur rot oder als
konkrete Lücke nachweisbar und danach grün sein. Positive Gegenproben bleiben
grün. Der vollständig verifizierte Arbeitsbranch wird lokal nach `main`
integriert; Worktree und Branch werden danach verifiziert entfernt.

## Annahmen

- Die Runtime-SQLite wurde bereits read-only ausgewertet; die versionierten
  Checkpoints sind die Implementierungsevidence.
- Der bestehende City-Surveillance-Fix auf `main` bleibt fachliche Basis und
  wird nicht zurückgebaut.
- Karten-Hints dürfen ergänzt werden, wenn die Analyse eine fehlende
  strukturierte Semantik belegt.
- Die Engine bleibt alleinige Regelautorität; KI-Projektionen sind side-safe
  Entscheidungshilfen vor der Action-Grenze.

## Nicht-Ziele

- keine Änderung der Kartenregeln oder LegalActions;
- keine Karten-ID- oder Kartenname-Sonderlogik in produktiven Entscheidern;
- kein neuer globaler Chooser, Override, Resolverplan oder Fallback;
- keine Remediation der nicht reproduzierbaren historischen D32-Linie;
- keine Optimierung der neutralen Shell-Traders-Sequenz D15 bis D18;
- keine Migration lokaler Runtime-Daten;
- kein Push und kein Pull Request.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. Jeder Paketabschluss besitzt fokussierte Checks, `git diff --check` und
   einen eigenen Commit.
3. D9 gehört einer konkreten Run-Route; `runner.develop_board_and_hand` darf
   keine Run-only-Economy als allgemeines Banktool materialisieren.
4. D57 behält Owner `runner.rig_and_coverage`, Phase `draw_for_answer` und Step
   `draw_for_answer_breaker_sentry`. D58 bis D63 bleiben Engine-Fortsetzungen.
5. D65 behält Action-ID `runner.resolve_choice` und Executor
   `rules.window_resolution`. Der Resolver vervollständigt nur eine vom
   Defense-/Cleanup-Owner gebundene Choice-Payload.
6. Choice-Änderungen dürfen keine andere Action-ID, keinen anderen Executor
   und keine zweite Strategielogik einführen.
7. Hidden-Info-, Replay-, StateHash-, Determinismus- oder IllegalAction-
   Abweichungen sind Sicherheitsblocker.

## Automatische Fehlerbehandlung

- Rote Tests werden nur im aktiven Paket und am belegten Owner debuggt.
- Unklare Effekte bleiben unproduktiv oder `assessment_unknown`; sie werden
  nicht als sicher geschätzt.
- Fehlt eine Engine- oder strukturierte Hint-Semantik, wird sie am bestehenden
  Vertrag ergänzt und nicht aus Kartennamen oder Freitext erraten.
- Unabhängige neue Findings werden als Follow-up dokumentiert und erweitern
  den Scope nicht still.

## Sicherheitsblocker

Der Prozess stoppt bei Hidden-Info-Leak, IllegalAction, Replay-/StateHash-
Abweichung, geändertem Owner/Executor ohne Architekturvertrag, nicht
deterministischem Checkpoint oder einem roten Gate ohne eng benannte Removal
Condition.

## State Machine

```text
planned
→ package_active
→ package_verifying
→ package_committed
→ next_package
→ final_verifying
→ main_integrating
→ worktree_cleaning
→ complete
```

## Paketfolge

| Paket | Titel | Ergebnis |
| --- | --- | --- |
| B000 | Prozess und Ausgangsevidence | verbindlicher Scope, Invarianten und Paketvertrag |
| B001 | Draw-Tax-Quellenvertrag | D57-Fix erkennt nur echte Ziehsteuern und erhält sichere Multi-Draws |
| B002 | Run-only-Economy-Routing | D9 verwirft die wertlose Lucidrine-Archives-Linie |
| B003 | Plan-owned Emergency-Keep | D65 behält Flatline-Prävention bei bestätigter Gefahr |
| B004 | Gesamtverifikation und Integration | Final Review, breite Gates, Main-Merge und Cleanup |

## B000 – Prozess und Ausgangsevidence

### Ziel

Audit, vorhandenen Main-Fix, verbleibende Lücken, Owner und Sicherheitsgrenzen
vor dem ersten Codepatch verbindlich sichern.

### Kernartefakte

- dieses Prozessdokument;
- `docs/reviews/ai/match-b0b0bffec6715028-full-runner-ai-decision-audit-2026-08-02.md`;
- vorhandener D57-Checkpoint und City-Surveillance-Final-Review.

### Checks und Done-Gate

- Main und Worktree sind sauber und isoliert;
- der D57-Checkpoint ist auf Main grün;
- die False-Positive-Lücke und fehlende Multi-Draw-Gegenprobe sind belegt;
- noch kein produktiver Code wurde in diesem Prozess geändert;
- `git diff --check` ist grün.

### Commit

`docs(ai): plan B0B0 runner remediation`

## B001 – Draw-Tax-Quellenvertrag

### Ziel

Die bestehende D57-Lösung bleibt ownerstabil, zählt aber nur strukturierte
Draw-Tax-Quellen und verwirft keinen vollständig bezahlbaren Multi-Draw.

### Konkrete Arbeit

- rote/negative Gegenprobe: eine andere sichtbare gerezzte Tagquelle ist keine
  Draw-Tax-Quelle;
- positive Gegenprobe: Fünf-Karten-Draw mit vollständig bezahlbaren fünf
  Ziehsteuern bleibt zulässig;
- draw-spezifische strukturierte Hint-/Ontology-Semantik ergänzen;
- den vorhandenen Server-Feature-Consumer auf diese Semantik verengen;
- D57-Checkpoint und Owner-/Step-Assertions unverändert grün halten.

### Checks

- fokussierte Feature-, Liability-, Tactical- und D57-Checkpoint-Tests;
- relevante Hint-/Ontology-Gates;
- AI-Typecheck, Source-Structure, Generic-Card-ID-Guard;
- `git diff --check`.

### Done-Gate und Commit

Kein Nicht-Draw-Tag-Source wird als Ziehsteuer gezählt, bezahlbare Multi-Draws
bleiben verfügbar und D57 bleibt grün.

Commit: `fix(ai): narrow visible draw-tax source projection`

## B002 – Run-only-Economy-Routing

### Ziel

D9 wird spielgleich gesichert. `Lucidrine Booster Drug` darf nicht als
allgemeines Bank-/Handentwicklungswerkzeug auf eine Route ohne realisierbaren
Run-Payoff gespielt werden.

### Konkrete Arbeit

- D9 als strikten roten Decision-Checkpoint versionieren;
- Consumer-Grenze identifizieren, an der `during_run`-Credits als generische
  Bank klassifiziert werden;
- Run-only-Pool aus allgemeinen Bank-/Entwicklungsrouten entfernen;
- Lucidrine nur über konkrete Run-Zielbewertung mit nutzbarem Credit-Pool,
  Zugriffs-Payoff und anschließendem Core-Damage-Nachteil zulassen;
- Gegenprobe mit konkret profitabler Lucidrine-Runlinie ergänzen;
- Deck-Hint-Consumer-Audit auf die neue Invariante erweitern.

### Checks

- D9 vor Fix rot und nach Fix grün;
- fokussierte Deck-Capability-, Handentwicklungs-, Run- und Checkpoint-Tests;
- Deck-Hint-Consumer-Audit;
- AI-Typecheck, Source-Structure, Generic-Card-ID-Guard;
- `git diff --check`.

### Done-Gate und Commit

D9 wählt eine produktive LegalAction, der falsche Owner verschwindet und eine
gute Run-only-Economy-Linie bleibt möglich.

Commit: `fix(ai): route run-only economy through concrete runs`

## B003 – Plan-owned Emergency-Keep

### Ziel

D65 behält `Arasaka Owns You` bei vier Tags und bestätigtem Flatline-Risiko,
ohne dem Choice-Resolver neue Strategieautorität zu geben.

### Konkrete Arbeit

- D65 als strikten Choice-Checkpoint versionieren;
- Defense-/Cleanup-Owner und vorhandene PlanExecutionOrigin bestimmen;
- planseitige Keep-Prioritäten für sichtbare Survival-/Prevention-Hints an die
  bestehende Choice binden;
- Resolver nur die exakt gebundene Payload vervollständigen lassen;
- Owner, Step, Action-ID, Executor und ausgewählte Optionen festschreiben;
- Gegenprobe ohne konkrete Gefahr ergänzen, in der die situative
  Präventionskarte abwerfbar bleibt.

### Checks

- D65 vor Fix rot und nach Fix grün;
- fokussierte Defense-, Discard-, Choice- und Checkpoint-Tests;
- AI-Typecheck, Source-Structure, Generic-Card-ID-Guard;
- `git diff --check`.

### Done-Gate und Commit

Die gefährliche Choice behält Notfallprävention, die harmlose Gegenprobe bleibt
flexibel und es entsteht keine zweite Entscheidungsautorität.

Commit: `fix(ai): bind emergency discard keep priorities`

## B004 – Gesamtverifikation und Integration

### Ziel

Alle drei Findings gemeinsam verifizieren, dauerhaft dokumentieren und lokal
nach `main` integrieren.

### Konkrete Arbeit

- Final Review mit Match, Fehlergruppen, Fixes, Grenzen und Checks;
- AI-Architekturindex und Monatslog nur bei dauerhaft neuem Vertrag ergänzen;
- fokussierte Checkpoints und Gegenproben erneut ausführen;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `corepack pnpm test:ai:shards`;
- relevante Hint-, Ontology-, Source-Structure-, Generic-ID- und Deck-Gates;
- aktuelles `main` in den Arbeitsbranch integrieren, finale Checks wiederholen;
- bevorzugt Fast-Forward nach `main` mergen;
- Main prüfen, Worktree verifiziert entfernen und gemergten Branch löschen.

### Done-Gate und Commit

Alle Gates sind grün, Final Review ist committed, Main enthält alle Pakete und
Worktree sowie Branch sind nachweislich entfernt.

Commit: `docs(ai): close B0B0 runner remediation`

## Verifikationsregeln

- Fokussierte AI-Tests erhalten mindestens 180 Sekunden äußeres Zeitfenster.
- Vollständige AI-Shards erhalten mindestens 600 Sekunden.
- Fortsetzbare Testprozesse werden weiterverfolgt und nicht wegen eines frühen
  Yields neu gestartet.
- Paketchecks laufen vor jedem Commit; `git diff --check` ist Pflicht.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im angegebenen Worktree und Arbeitsbranch.
- Hauptworkspace ausschließlich für finalen lokalen Merge und Main-Prüfung.
- Nur paketzugehörige Dateien stagen; jedes Paket erhält einen Commit.
- Kein Reset, kein pauschales Revert, kein Push und kein PR.
- Vor Cleanup absoluten Worktree-Pfad, sauberen Status und erfolgreichen Merge
  erneut prüfen; Entfernung in Git und Dateisystem doppelt verifizieren.

## Controller-Prompt-Kern

```text
/Goal Arbeite B0B0 Runner Remediation vollständig und sequenziell von B000 bis
B004 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies AGENTS.md, packages/ai/AGENTS.md, den KI-Änderungskompass und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_B0B0_RUNNER_REMEDIATION auf Branch
codex/b0b0-runner-remediation. Nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktuellen Paket, führe seine Checks aus und
committe jedes bestandene Paket. Erhalte Planowner, Action-ID und Executor und
führe keine Karten-ID-, Resolver-, Override- oder Fallback-Autorität ein.

Nach B004: aktuelles main integrieren, finale Checks wiederholen, lokal nach
main mergen, main prüfen, den sauberen Worktree entfernen, Entfernung in Git
und Dateisystem verifizieren und den gemergten Branch löschen. Goal erst danach
als complete markieren.
```

## Abschlusskriterien

- B000 bis B004 sind jeweils mit bestandenem Done-Gate committed;
- alle drei Match-Checkpoints und positiven Gegenproben sind grün;
- keine zweite Entscheidungsautorität und kein Hidden-Info-Leak;
- vollständige AI-Shards und relevante Gates sind grün;
- Arbeitsbranch ist lokal nach `main` integriert;
- Worktree und Arbeitsbranch sind nachweislich entfernt.
