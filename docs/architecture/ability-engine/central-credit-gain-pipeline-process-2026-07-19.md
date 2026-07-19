# Zentrale Credit-Gain-Pipeline: Umsetzungsprozess

Status: in-progress

Stand: 2026-07-19

Primärer Agent: `release-implementation-agent`

Arbeitsbranch: `codex/central-credit-gain-pipeline`

Arbeits-Worktree: `C:\Projekte\NETGRID_CENTRAL_CREDIT_GAIN_PIPELINE`

## Quelle und Vorgabe

Ausgangspunkt ist der bestätigte Playtest-Fund im lokalen Match
`match_e653f50ac25eed22`: Der Runner hatte vor dem Ausspielen von `Finders
Keepers` 7 Credits, zahlte 7, würfelte `6,2,2` und erhielt trotz installierter
`Elena Laskova` nur 10 statt 11 Credits. Der Kartenvertrag verlangt den
zusätzlichen Credit beim ersten Creditgewinn aus dem Effekt einer gespielten
Prep.

Die Nutzerfreigabe erweitert die enge Kartenreparatur ausdrücklich um die
strukturelle Anforderung, alle vorhandenen produktiven Wege für Creditgewinn
oder Crediterhalt zu prüfen und sauber in einen gemeinsamen Regelpfad
einzubinden.

## Zielprüfung

Die Vorgabe ist für eine automatische sequenzielle Umsetzung ausreichend
präzise:

- Endzustand: ein autoritativer, typisierter Credit-Gain-Pfad für alle
  produktiven Pool-Creditgewinne;
- fachlicher Beweisfall: `Elena Laskova` + `Finders Keepers` ergibt bei einer
  Würfelsumme von 10 einen Gesamtgewinn von 11;
- Sicherheitsgrenzen: deterministisches Replay, StateHash, LegalAction-
  Revalidierung und Hidden-Info-Schutz bleiben erhalten;
- Integration: Paketcommits im eigenen Worktree, finale lokale Integration
  nach `main`, danach verifizierter Worktree- und Branch-Cleanup;
- Remote-Push oder Pull Request sind nicht freigegeben.

## Gesamtziel

Alle produktiven Regelauflösungen, die Credits in den normalen Creditpool von
Runner oder Korp einbringen, verwenden eine gemeinsame semantische
Credit-Gain-Pipeline. Die Pipeline unterscheidet den angeforderten Grundbetrag,
regelbedingte zusätzliche Credits, tatsächlich gutgeschriebene Credits und
gegebenenfalls abgefangene Credits. Sie trägt Quelle und Auflösungskontext,
erzeugt konsistente öffentliche Ergebnisdaten und erlaubt generische
Credit-Gain-Modifier, ohne dass Resolver konkrete Karten wie `Elena Laskova`
kennen.

## Annahmen

- `Prep` entspricht im aktuellen Datenmodell einem Runner-`event`; die
  deklarative Classic-Kartenquelle führt `Finders Keepers` als Prep.
- Elenas „additional [1]“ modifiziert den ersten Creditgewinn derselben
  Prep-Auflösung. Es ist kein zweiter unabhängiger Creditgewinn, der erneut
  Credit-Gain-Reaktionen auslöst.
- Setupwerte, Test-Fixture-Zuweisungen, Restore/Hydration und ausdrücklich
  regelnde `set credits`-Effekte sind keine Creditgewinne.
- Das Nehmen bereits gehosteter Credits in den normalen Pool ist ein
  Creditgewinn, sofern der bestehende öffentliche Vertrag `gainedCredits`
  ausweist. Das bloße Platzieren oder Auffrischen gehosteter, recurring,
  restricted oder temporärer Credits ist kein Pool-Creditgewinn.
- Creditverlust und Bezahlung bleiben getrennte semantische Pfade und werden
  nicht künstlich durch die Gain-Pipeline geführt.

## Nicht-Ziele

- keine vollständige Neuentwicklung der Kosten-/Payment-Pipeline;
- keine Änderung von Kartenbeträgen oder Releasefreigaben außerhalb des
  bestätigten Elena-Vertrags;
- keine UI-Neugestaltung;
- keine Legacy-Migration für gespeicherte Version-0-Spiele;
- keine Remote-Integration.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. Normale Resolver dürfen Pool-Credits nach Abschluss des Prozesses nicht
   direkt mit `state.runner.credits +=` oder `state.corp.credits +=` erhöhen.
3. Der autoritative Pfad erhält einen typisierten Kontext mit mindestens
   Empfänger, Grundbetrag, Quelle, Grund und optionalem Auflösungs-Scope.
4. Der finale Betrag wird vor der Kontomutation bestimmt; Modifier dürfen
   keine rekursive zweite Gain-Auflösung erzeugen.
5. PublicPayload und `ResolvedGameEffect` berichten den tatsächlich
   aufgelösten Gewinn und dürfen keine CardInstanceIds oder andere verdeckte
   Informationen leaken.
6. Dieselben Eingaben, derselbe Seed und dieselbe Eventfolge erzeugen
   denselben Zustand, StateHash und Replay.
7. Direkte Zuweisungen bleiben nur an explizit klassifizierten Setup-,
   Restore-, Test- oder `set credits`-Grenzen zulässig.
8. Jede Migration bewahrt bestehende Spezialverträge wie
   `corpCreditForfeitDebt`, PublicPayload-Felder und Kartenattribution.

## Automatische Fehlerbehandlung

- Ein roter Paketcheck blockiert den Übergang zum nächsten Paket.
- Fehler werden auf die kleinste betroffene Pipeline oder Resolverfamilie
  eingegrenzt; Follow-ups erweitern das aktive Paket nicht stillschweigend.
- Bei neu gefundenen direkten Creditpfaden wird die Auditmatrix ergänzt und
  der Pfad im passenden Migrationspaket bearbeitet.
- Bei kompatiblen Änderungen auf `main` werden beide Intentionen erhalten und
  die relevanten Checks wiederholt.

## Sicherheitsblocker

Der Prozess stoppt mit dokumentierter Removal Condition, wenn eine Migration:

- Hidden-Info in PublicPayload oder `ResolvedGameEffect` sichtbar machen
  würde;
- Replay oder StateHash nondeterministisch macht;
- eine Creditquelle ohne LegalAction-/`applyAction`-Revalidierung öffnet;
- einen unauflösbaren fachlichen Konflikt zwischen aktuellem Kartentext und
  führender Regelquelle zeigt;
- für den finalen Cleanup einen fremden oder unsauberen Worktree berühren
  müsste.

## State Machine

```text
PREPARED
  -> CGP-01_AUDIT
  -> CGP-02_CORE
  -> CGP-03_DECLARATIVE_MIGRATION
  -> CGP-04_RESOLVER_MIGRATION
  -> CGP-05_REGRESSION_AND_GUARD
  -> CGP-06_FINAL_REVIEW
  -> MAIN_SYNC
  -> FINAL_VERIFY
  -> MAIN_MERGE
  -> WORKTREE_CLEANUP
  -> COMPLETE
```

## Paketfolge

| Paket  | Titel                                           | Done-Gate                                                                                                                                     | Commit-Vorschlag                                                    |
| ------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| CGP-01 | Vollständiges Credit-Gain-Audit und Zielvertrag | Jede produktive direkte Mutation und jeder gemeinsame Gain-Helfer ist klassifiziert; Prozessartefakt und Auditmatrix sind versioniert.        | `docs(engine): define central credit gain process`                  |
| CGP-02 | Autoritativer Credit-Gain-Kern                  | Typisierter Gain-Kontext, Ergebnisvertrag und Elena-Modifier sind zentral implementiert und fokussiert getestet.                              | `refactor(engine): add authoritative credit gain pipeline`          |
| CGP-03 | Deklarative und Command-Pfade migrieren         | Ability-Effect-Interpreter, `EffectCommand.gain_credits` und Adapter verwenden denselben Kern; Payload-/ResolvedEffect-Verträge bleiben grün. | `refactor(engine): route declarative gains through credit pipeline` |
| CGP-04 | Resolver- und Lifecycle-Pfade migrieren         | Alle als echter Pool-Gain klassifizierten produktiven Direktpfade und Helfer sind migriert; Ausnahmen sind begründet dokumentiert.            | `refactor(engine): migrate resolver credit gains`                   |
| CGP-05 | Karten-, Replay- und Architekturregressionen    | Elena + Finders, Mehrfach-/Nicht-Prep-Grenzen, Replay/StateHash und ein Guard gegen neue Direktgewinne sind grün.                             | `test(engine): guard central credit gain contract`                  |
| CGP-06 | Final Review und Wissensrückführung             | Final Review, Wissensstatus und ausgeführte Checks dokumentieren den erreichten Endzustand ohne offene Must-Punkte.                           | `docs(engine): close central credit gain rollout`                   |

## Paketdetails

### CGP-01 – Vollständiges Credit-Gain-Audit und Zielvertrag

Ziel: Sämtliche produktiven Creditmutationen und Hilfspfade erfassen und als
`gain`, `spend`, `lose`, `set`, `hosted-only`, `temporary-only` oder
`setup/restore` klassifizieren.

Kernartefakte:

- dieses Prozessartefakt;
- `central-credit-gain-audit-2026-07-19.md`;
- Suchinventar für direkte Poolmutationen, `credits(...)`, `gainCredits(...)`,
  `EffectCommand.gain_credits`, `ResolvedGameEffect.gain_credits` und
  `gainedCredits`-Producer.

Checks: Auditabgleich mit `rg`, `git diff --check`.

### CGP-02 – Autoritativer Credit-Gain-Kern

Ziel: Einen Engine-internen Vertrag einführen, der Betrag und Kontext
normalisiert, aktive Gain-Modifier ermittelt, genau einmal mutiert und ein
typisiertes Ergebnis liefert.

Kernanforderungen:

- `baseAmount`, `bonusAmount`, `requestedAmount`, `creditedAmount`,
  `interceptedAmount` und Creditstand danach sind unterscheidbar;
- Quellenkontext ist öffentlich nur als CardDefinition/Title sichtbar;
- Elena wird generisch aus installierten CardImplementation-Daten gesammelt;
- „erster Gain derselben Prep-Auflösung“ besitzt einen stabilen Scope;
- Corp-Forfeit-Debt bleibt semantisch erhalten.

Checks: neue Unit-Tests für den Kern, Engine-Typecheck, `git diff --check`.

### CGP-03 – Deklarative und Command-Pfade migrieren

Ziel: Bestehende gemeinsame Ausführungspfade auf den neuen Kern setzen, ohne
eine zweite Gain-Engine zu behalten.

Kernartefakte:

- Ability-Effect-Interpreter und Credit-Effect-Familie;
- EffectCommand-Executor;
- CardImplementation-Adapter für gehostete Creditentnahme;
- typisierte `ResolvedGameEffect`-/PublicPayload-Attribution.

Checks: fokussierte Ability-Engine-, Effect- und Contracttests, Typecheck,
`git diff --check`.

### CGP-04 – Resolver- und Lifecycle-Pfade migrieren

Ziel: Alle im Audit als echte Creditgewinne klassifizierten direkten
Mutationen und lokalen Gain-Helfer auf den neuen Kern umstellen.

Vorgehen:

- dateiweise Migration anhand der Auditmatrix;
- Spezialkontext und vorhandene Payloadfelder erhalten;
- `set`, `spend`, `lose`, Setup und nicht in den Pool fließende Counter bleiben
  getrennt und werden als bewusste Ausnahmen markiert;
- nach jeder Resolverfamilie fokussierte Tests.

Checks: betroffene Mechanik- und Release-Smokes, Engine-Typecheck,
Audit-Rerun, `git diff --check`.

### CGP-05 – Karten-, Replay- und Architekturregressionen

Ziel: Den Nutzerfund und die strukturelle Vollständigkeit dauerhaft schützen.

Muss-Fälle:

- Finders Keepers mit installiertem Elena: Würfelsumme +1, korrekter
  Creditstand, öffentliche Modifierattribution;
- derselbe Resolver ohne Elena: unveränderter Grundgewinn;
- Nicht-Prep-Gain: kein Elena-Bonus;
- mehrere Gain-Effekte derselben Prep-Auflösung: Bonus nur beim ersten Gain;
- Replay und StateHash bleiben identisch;
- statischer Guard findet keine unklassifizierten direkten produktiven
  Pool-Creditgewinne.

Checks: fokussierte Tests, Engine-Gesamttests, Contracttests, Typecheck,
`git diff --check`.

### CGP-06 – Final Review und Wissensrückführung

Ziel: Ist-Stand, Entscheidungen, Checks und Restpunkte so dokumentieren, dass
die Pipeline für spätere Kartenarbeit führend auffindbar ist.

Kernartefakte:

- `docs/reviews/engine/central-credit-gain-pipeline-final-review-2026-07-19.md`;
- Ability-Engine-Übersicht und projektbezogene Wissensbasis;
- relevante Lognotiz nach Projektregel.

Checks: Dokumentlinks, Format, `git diff --check`.

## Verifikationsregeln

- Paketnah zuerst, breiter erst nach grünem engem Test.
- Mindestens:
  - fokussierte neue Credit-Gain-Tests;
  - `corepack pnpm --filter @netgrid/engine typecheck`;
  - `corepack pnpm --filter @netgrid/engine test`;
  - `corepack pnpm test:contracts`;
  - `corepack pnpm format:changed`;
  - `git diff --check`.
- Tests mit Timeout, Abbruch oder übersprungenem relevanten Teil gelten nicht
  als bestanden.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich im Worktree
  `C:\Projekte\NETGRID_CENTRAL_CREDIT_GAIN_PIPELINE` auf
  `codex/central-credit-gain-pipeline` arbeiten.
- Hauptworkspace `C:\Projekte\NETGRID` nur für Preflight, finalen lokalen
  Merge und Abschlussprüfung verwenden.
- Jedes Paket erhält nach grünem Done-Gate genau einen eigenen, klar
  benannten Commit.
- Vor der Integration aktuelles `main` in den Arbeitsbranch integrieren, wenn
  `main` weitergelaufen ist; Konflikte werden inhaltlich gelöst.
- Bevorzugt per Fast-Forward nach lokalem `main` mergen.
- Kein Push und kein Pull Request.
- Nach erfolgreichem Merge Worktree-Pfad erneut gegen Haupt- und Fremd-
  Worktrees prüfen, sauberen Status bestätigen, Worktree ohne `--force`
  entfernen, Git-Liste und Dateisystem prüfen und Branch mit `git branch -d`
  löschen.

## Controller-Prompt-Kern

```text
/Goal Arbeite „Zentrale Credit-Gain-Pipeline“ vollständig und sequenziell von
CGP-01 bis CGP-06 ab und merge den abgeschlossenen Arbeitsbranch lokal nach
main.

Lies AGENTS.md, AGENTS.local.md, packages/engine/AGENTS.md und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_CENTRAL_CREDIT_GAIN_PIPELINE auf Branch
codex/central-credit-gain-pipeline. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, aktualisiere
Audit- und Prozessartefakte, führe Paketchecks aus und committe jedes
abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe, dokumentiere
Removal Condition und verwerfe keine fremden Änderungen. Nach Abschluss:
final verifizieren, aktuelles main integrieren, lokal nach main mergen, main
prüfen, den sauberen Arbeits-Worktree entfernen, Entfernung in Git und
Dateisystem verifizieren, den gemergten Arbeitsbranch löschen und das Goal
erst danach als complete markieren.
```

## Abschlusskriterien

- Auditmatrix ohne unklassifizierte produktive Creditmutation;
- alle echten Pool-Creditgewinne verwenden die autoritative Pipeline;
- Elena + Finders Keepers sowie Grenzfälle sind reproduzierbar grün;
- PublicPayload, ResolvedEffects, Replay, StateHash und Hidden-Info-Vertrag
  sind belegt;
- alle sechs Paketcommits liegen auf dem Arbeitsbranch;
- finaler lokaler Merge nach `main` ist geprüft;
- Arbeits-Worktree ist in Git und Dateisystem entfernt;
- gemergter Arbeitsbranch ist gelöscht;
- keine Remote-Integration wurde ausgeführt.
