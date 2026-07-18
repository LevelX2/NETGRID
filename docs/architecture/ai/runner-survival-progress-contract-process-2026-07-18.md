# Runner-Survival-Progress-Contract-Prozess

Status: P2 abgeschlossen; P3 aktiv

## Quelle/Vorgabe

Quelle sind der commit-reine AI-Behavior-Baselinelauf auf `ce65b4aae707`,
der reproduzierte Net-Damage-Seed `ai-behavior-baseline-v1-09` und die
Nutzerfreigabe vom 2026-07-18 zur direkten Umsetzung. Führende Evidence ist
`docs/reviews/ai/ai-behavior-baseline-v1-current-ce65b4aae-2026-07-18.md`.

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung präzise genug. C-09 belegt
eine nicht erzwungene Folge von 30 Basic Credits unter
`runner.survival_defense`: Die Hand bleibt bei einer Karte, eine konkrete
Reserve-Lücke fehlt, der Planstatus bleibt dennoch `progressing` und der
Plancontroller blockiert positiv bewertete Alternativen. Dieselbe Fehlerklasse
tritt außerdem in Net-Damage-08 sowie Hybrid-04 und Hybrid-07 auf.

## Gesamtziel

Die Runner-KI darf eine Credit-Aktion nur dann als Survival-Fortschritt und
plan-dominante Aktion behandeln, wenn sie eine sichtbare konkrete
Survival-Finanzierungslücke verkleinert. Handgewinn, reduzierte akute
Flatline-Gefahr und echte Damage Prevention bleiben gültige Fortschritte.
Nichtprogressive Survival-Schritte verlieren deterministisch ihre TTL, geben
die normale semantische Auswahl frei und werden als eigene No-Progress-
Fehlerklasse diagnostiziert. Der vollständige AI-Behavior-Benchmark muss
zeigen, dass C-09 nicht mehr wegen der bestätigten Survival-Credit-Schleife ins
Action-Limit läuft.

## Annahmen

- Der aktuelle `flatlineRisk`-, Handziel- und Reservevertrag ist side-safe und
  bleibt die fachliche Grundlage; es wird kein zweites Damage-Modell gebaut.
- Eine Credit-Aktion darf Survival-Fortschritt sein, wenn eine bereits
  sichtbare, konkrete Prevention- oder Reaktionsreserve noch nicht finanzierbar
  ist und der Credit die Lücke tatsächlich verkleinert.
- Falls C-09 nach Beseitigung der Survival-Schleife aus einer unabhängigen
  Ursache das Action-Limit erreicht, wird diese Ursache als getrenntes Finding
  dokumentiert und nicht durch Scope-Erweiterung kaschiert.
- Lokale kompakte und rohe Benchmarkdaten bleiben unter `data/local/`
  unversioniert; der kleine Reviewbericht wird versioniert.

## Nicht-Ziele

- Keine Engine-, LegalAction-, Kartenregel-, Decklisten- oder Corp-KI-Änderung.
- Keine pauschale Abschwächung echter Draw- oder Damage-Prevention-Pläne.
- Kein allgemeines Rebalancing aller Runner-Scores oder Run-Ziele.
- Keine Behebung der getrennten Action-Limit-Ursachen in Net-Damage-07 oder
  Hybrid-05 ohne neuen Beleg, dass sie zum selben Vertrag gehören.
- Kein Push, Pull Request oder Remote-Merge.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität; die KI wählt ausschließlich
  aus `LegalActions`.
- Es werden nur Runner-PlayerView, side-gefilterte öffentliche Events,
  LegalActions und vorhandene side-sichere Semantikdaten ausgewertet.
- Plannerzeugung, Kandidaten-Mapping, Fortschrittsbewertung und Arbitration
  verwenden denselben fachlichen Survival-Fortschrittsvertrag.
- Ein nichtprogressiver Plan darf keine positive legale Alternative mit einer
  absoluten Plancontroller-Schwelle blockieren.
- Echter Draw und echte Damage Prevention dürfen weiterhin einen generischen
  riskanten Run überstimmen.
- Replay, StateHash und Hidden-Info-Verträge bleiben unverändert grün.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.

## Automatische Fehlerbehandlung

- Fehlende Worktree-Abhängigkeiten werden mit
  `corepack pnpm install --frozen-lockfile --offline` hergestellt; falls der
  lokale Store nicht genügt, wird ohne Lockfile-Änderung normal installiert.
- Rote fokussierte Tests werden auf den kleinsten verletzten Vertrag
  zurückgeführt. Ein Paket wird erst nach grünem Done-Gate abgeschlossen.
- Breite Altfehler dürfen nur dann als Baseline klassifiziert werden, wenn sie
  auf demselben aktuellen `main` reproduzierbar sind.
- Bei weitergelaufenem `main` werden beide fachlichen Intentionen im
  Arbeitsbranch integriert und relevante Checks wiederholt.

## Sicherheitsblocker

Der Prozess stoppt, wenn die Korrektur verdeckte Corp-Hand-, R&D- oder
Remote-Informationen, vollständigen `GameState` im AI-Pfad, neue nicht von der
Engine gelieferte Aktionen oder eine Abschwächung der Replay-/Redaction-Gates
benötigen würde. Ein Blocker erhält einen Report mit eindeutiger Removal
Condition.

## State Machine

`P0_PROCESS -> P1_ACTION_CONTRACT -> P2_PROGRESS_MEMORY -> P3_ARBITRATION -> P4_DIAGNOSTICS -> P5_VERIFY_INTEGRATE -> COMPLETE`

## Paketfolge

### P0: Prozessvertrag

Status: abgeschlossen

Ziel: Scope, Worktree, Branch, Invarianten, Paketfolge und Abschlussgates
verbindlich sichern.

Kernartefakte:

- dieses Prozessdokument
- Worktree `C:\Projekte\NETGRID_runner_survival_progress`
- Branch `codex/runner-survival-progress`

Checks: `git diff --check`, sauberer Worktree nach Paketcommit.

Done-Gate: Prozessartefakt ist vollständig, formatiert und separat committed.

Commit: `docs(ai): plan runner survival progress contract`

### P1: Survival-Aktionsvertrag und Kandidaten-Mapping

Status: abgeschlossen

Ziel: `gain_credit` mappt nur bei einer sichtbaren konkreten Survival-
Finanzierungslücke auf `find_survival_answer`; oberhalb des Ziels und ohne
finanzierbare Folgeaktion bleibt die Aktion außerhalb des Survival-Plans.

Konkrete Arbeit:

- eine gemeinsame side-sichere Prüfung für progressfähige Survival-Aktionen
  einführen;
- pauschales `economy.gain_credit` aus dem Survival-Wunschvertrag entfernen;
- Planerzeugung und Kandidaten-Mapping an dieselbe Prüfung anbinden;
- negative und positive Funding-Gegenprobe ergänzen.

Kernartefakte:

- `packages/ai/src/plans/tactical-plan-runner-hand-buffer.ts`
- `packages/ai/src/plans/tactical-plan-step-candidate-matching.ts`
- fokussierte Tests unter `packages/ai/src/plans/`

Checks: fokussierte Plan-/Mapping-Vitests, AI-Typecheck, `git diff --check`.

Done-Gate: Credit ohne konkrete Lücke mappt nicht; Credit unter einer
konkreten finanzierbaren Prevention-Lücke mappt; echte Draw-/Prevention-Fälle
bleiben grün.

Ergebnis: Planner und Kandidaten-Mapping verwenden denselben side-sicheren
Fortschrittsvertrag. Der Survival-Plan trägt eine explizite Mindestreserve;
Basic Credits oberhalb dieser Reserve mappen nicht mehr, während ein Credit
unterhalb der akuten Reaktionsreserve und echte Draw-/Prevention-Aktionen
gültig bleiben. 78 fokussierte Plan-/Mapping-Tests und der AI-Typecheck sind
grün.

Commit: `fix(ai): require concrete survival credit progress`

### P2: Beobachtbarer Planfortschritt und TTL-Abbruch

Status: abgeschlossen

Ziel: `runner.survival_defense` bleibt nur `progressing`, wenn sich Hand,
akute Gefahr, Prevention-Zustand oder konkrete Reserve-Lücke verbessert.

Konkrete Arbeit:

- Survival-spezifischen Progress-Contract in Plan-Memory/Progression ergänzen;
- bei unverändertem Zustand TTL dekrementieren;
- wiederholten No-Progress deterministisch als `blocked` oder `abandoned`
  beenden;
- Memory-Regressionen für Fortschritt und Stillstand ergänzen.

Kernartefakte:

- `packages/ai/src/plans/plan-memory.ts`
- `packages/ai/src/plans/tactical-plan-progression.ts`
- zugehörige Plan-Memory-/Progression-Tests

Checks: fokussierte Memory-/Progression-Vitests, AI-Typecheck,
`git diff --check`.

Done-Gate: unveränderter Survival-Zustand erneuert die TTL nicht; echter
Fortschritt bleibt stabil; andere Plantypen ändern ihr Verhalten nicht.

Ergebnis: Die Plan-Memory speichert für `runner.survival_defense` den
Handstand, das akute Flatline-Risiko, die Mindestreserve und die verbleibende
Reservelücke sowie den gewählten ActionType. Nur Handgewinn, Risikoreduktion,
verringerte Reservelücke oder eine bereits durch P1 als Prevention gemappte
Aktion erhalten die Kontinuität. Andernfalls wird
`no_observable_progress` gesetzt, die TTL dekrementiert und der Plan nach der
zweiten Wiederholung mit `repeated_survival_without_visible_progress`
abgebrochen. 88 fokussierte Plan-, Memory- und Mapping-Tests sowie der
AI-Typecheck sind grün.

Commit: `fix(ai): expire stalled runner survival plans`

### P3: Plan-Arbitration absichern

Status: aktiv

Ziel: Nur progressfähige Survival-Aktionen erhalten Plan-Dominanz. Ein
nichtprogressiver Basic Credit darf keine besser bewertete legale Alternative
absolut blockieren.

Konkrete Arbeit:

- die Survival-Ausnahme beim Rich-Basic-Credit-Yield entfernen oder an den
  gemeinsamen Fortschrittsvertrag binden;
- `Infinity`-Dominanz nur für tatsächlich progressfähige Mappings zulassen;
- C-09-nahen Ranking-Checkpoint und echte Draw-/Prevention-Gegenprobe sichern.

Kernartefakte:

- `packages/ai/src/runtime/choice-ranking/runner-plan-overrides.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- fokussierte Runtime-/Ranking-Tests

Checks: fokussierte Ranking-/Checkpoint-Vitests, AI-Typecheck,
`git diff --check`.

Done-Gate: negative nichtprogressive Credit-Aktion verliert gegen eine
positive Alternative; echter Survival-Fortschritt bleibt plan-dominant.

Commit: `fix(ai): yield stalled survival plan arbitration`

### P4: Diagnostik und Loop-Gate

Status: ausstehend

Ziel: Diagnostics melden nur nachweisbare Coverage-Reparatur und erkennen
wiederholte Survival-Aktionen ohne Fortschritt als High-Severity-Fund.

Konkrete Arbeit:

- `runnerCoverageRepairIntentSatisfied` an echte Capability- oder
  Affordability-Verbesserung binden;
- `runner_survival_no_progress_loop` ergänzen;
- Basic Credits in der neuen Fehlerklasse erfassen, ohne allgemeine
  Economy-Sequenzen falsch positiv zu markieren;
- Trace-Mining-Regressionen ergänzen.

Kernartefakte:

- `packages/ai/src/simulation/runner-known-no-access.ts`
- `packages/ai/src/simulation/selfplay-trace-mining.ts`
- zugehörige Simulation-/Trace-Mining-Tests

Checks: fokussierte Diagnostics-Vitests, AI-Typecheck, `git diff --check`.

Done-Gate: C-09-artige Schleife wird erkannt; normale Economy-Folgen und echte
Coverage-/Funding-Verbesserungen bleiben ohne Falschpositiv.

Commit: `fix(ai): detect stalled runner survival loops`

### P5: Benchmark, Review, Integration und Cleanup

Status: ausstehend

Ziel: Zielregressionen und breite Gates verifizieren, den aktuellen
AI-Behavior-Benchmark commit-rein ausführen, Ergebnis dokumentieren, aktuelles
`main` integrieren und den Prozess vollständig abschließen.

Konkrete Arbeit:

- C-09 sowie Net-Damage-08 und Hybrid-07 gezielt prüfen;
- AI-Testshards, AI-Typecheck, `check:ai`, Replay-/Redaction-Verträge und den
  festen 60-Spiele-Standardbenchmark ausführen;
- Final Review, Prozessstatus und Monatslog aktualisieren;
- aktuelles `main` defensiv in den Arbeitsbranch integrieren;
- finale relevante Checks wiederholen;
- lokal bevorzugt per Fast-Forward nach `main` mergen;
- sauberen Worktree entfernen, Entfernung in Git und Dateisystem verifizieren
  und den vollständig gemergten Branch mit `git branch -d` löschen.

Checks: fokussierte Zieltests, drei AI-Shards, AI-Typecheck, `check:ai`,
Benchmark-Hard-Gates, `git diff --check`, Status- und Cleanup-Prüfungen.

Done-Gate: Die bestätigte Survival-Credit-Schleife ist beseitigt, echte
Survival-Gegenfälle bleiben grün, Main enthält alle Paketcommits, Hauptworkspace
ist sauber und Worktree sowie Arbeitsbranch sind nachweislich entfernt.

Commit: `docs(ai): close runner survival progress remediation`

## Verifikationsregeln

- Direkte Vitest-Dateiaufrufe werden für fokussierte Regressionen bevorzugt.
- Tests prüfen fachliche Zustandsänderungen, nicht nur ausgewählte actionIds.
- Ein reguläres Spielende allein widerlegt keine Survival-Schleife; Trace und
  Planstatus müssen ebenfalls geprüft werden.
- Ein verbleibendes Action-Limit wird nach Ursache klassifiziert. Nur die
  bestätigte Survival-Fehlerklasse ist Abschlussblocker dieses Prozesses.
- Kompakte Benchmarkresultate und vollständige redigierte Traces bleiben
  gemeinsam auswertbar; Hidden-Info- und Replay-Gates sind hart.

## Worktree-, Git- und Integrationsregeln

- P0 bis P5 werden ausschließlich im Arbeits-Worktree bearbeitet.
- Jedes abgeschlossene Paket erhält nach bestandenem Done-Gate einen eigenen
  Commit; nur paketzugehörige Dateien werden gestagt.
- Der Hauptworkspace wird erst für den finalen lokalen Merge wieder verwendet.
- Kein `git reset --hard`, kein pauschales Revert und kein Force-Cleanup.
- Bei Main-Konflikten werden beide fachlichen Intentionen rekonstruiert.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

```text
/Goal Arbeite Runner Survival Progress Contract vollständig und sequenziell
von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, packages/ai/AGENTS.md,
docs/reviews/ai/ai-behavior-baseline-v1-current-ce65b4aae-2026-07-18.md und
docs/architecture/ai/runner-survival-progress-contract-process-2026-07-18.md.
Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_runner_survival_progress auf Branch
codex/runner-survival-progress. Nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktuellen Paket, führe seine Checks aus,
dokumentiere Abweichungen und committe jedes abgeschlossene Paket. Stoppe nur
bei einem Sicherheitsblocker. Integriere am Ende aktuelles main defensiv,
wiederhole die finalen Checks, merge lokal nach main, entferne Worktree und
gemergten Branch und markiere das Goal erst nach doppelter Cleanup-Verifikation
als complete.
```

## Abschlusskriterien

- Basic Credits ohne konkrete Survival-Finanzierungslücke mappen nicht auf
  `runner.survival_defense`.
- Kein Survival-Plan bleibt ohne Verbesserung von Hand, Flatline-Risiko,
  Prevention-Zustand oder Reserve-Lücke dauerhaft `progressing`.
- Nichtprogressive Survival-Aktionen sperren keine positiven legalen
  Alternativen absolut.
- C-09 endet ohne die belegte Survival-Credit-Schleife; die weiteren bekannten
  Folgen sind beseitigt oder durch konkreten Funding-Bedarf begründet.
- Echte Draw-/Prevention-Survival-Fälle bleiben grün.
- Replay, StateHash, Redaction und Hidden-Info bleiben grün.
- Alle Paketcommits sind lokal in `main` integriert; Worktree und Arbeitsbranch
  sind verifiziert entfernt.
