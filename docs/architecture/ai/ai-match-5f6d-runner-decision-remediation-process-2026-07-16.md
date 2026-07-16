# KI-Runner-Decision-Remediation für Match 5F6D (2026-07-16)

Status: P0 bis P2 abgeschlossen, P3 aktiv

## Quelle und Zielprüfung

Quelle ist das abgeschlossene Match `match_5f6d027aecbe34e2` aus der lokalen
SQLite-Runtime. Die vollständige Analyse klassifizierte 101 von 101
Runner-KI-Entscheidungen und belegte drei unabhängige Fehlergruppen:

1. Decision 58 / StateVersion 105: Ein Trace-Bid von 5 Credits verhindert
   zwar den Tag, macht aber den bekannten verbleibenden Run-Pfad unbezahlbar.
   Decision 60 ist die daraus folgende, lokal korrekte Run-Aufgabe.
2. Decisions 62, 74, 75, 83 und 84: Die Basic-Credit-Aktion mit einem Credit
   verdrängt die gleichzeitig legale Newsgroup-Ability mit zwei Credits ohne
   zusätzliche Kosten oder Einschränkung.
3. Decision 72 / StateVersion 127: Eine mehrstufige Top-5-Suche bewertet die
   erste Karte für den Grip und die Reihenfolge des restlichen Stapels als
   eine uniforme Auswahl.

Die Vorgabe ist nach der ausdrücklichen Nutzerfreigabe präzise genug für die
direkte sequenzielle Umsetzung.

## Gesamtziel und `/Goal`

`/Goal`: Die drei freigegebenen Findings aus Match 5F6D im eigenen Worktree
zuerst als spielgleiche rote Decision-Checkpoints mit engen Gegenproben
sichern, nur weiterhin rote Verhaltensfehler generisch in Trace-Budgetierung,
Credit-Aktionsvergleich und mehrstufiger Stack-Suche beheben, unveränderte
Erwartungen grün verifizieren, fokussiert und breit prüfen, dokumentieren,
lokal nach `main` integrieren und Worktree sowie Arbeitsbranch verifiziert
entfernen.

- Arbeitsbranch: `codex/ai-match-5f6d027a-fixes`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_5F6D027A`
- Ausgangs-`main`: `02f71c6fdc530c05d6e0f0d599e198e1aae82710`
- Hauptworkspace: nur für Runtime-Evidence und finalen lokalen Merge
- Push oder Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Erwartungen verwenden nur damalige Runner-PlayerViews, LegalActions,
  öffentliche Eventpräfixe und erlaubte Runtime-Metadaten.
- Der Trace-Fix vergleicht Tag-Vermeidung und Restpfad allgemein; er enthält
  keine Hunter-, Data-Wall-, Match- oder Karteninstanz-Sonderregel.
- Die Credit-Dominanz gilt nur bei gleichem Aktionsaufwand und höherem
  projiziertem Nettoertrag ohne zusätzliche Kosten oder Einschränkung.
- Die Suche bleibt kartengenerisch und trennt semantisch Entnahme und
  Reststapel-Reihenfolge.
- Engine-Kartentexte, LegalAction-Erzeugung, Replay und Hidden-Info-Grenzen
  werden nicht verändert, sofern kein reproduzierbarer Engine-Blocker
  entsteht.
- Historische Entscheidungen, die auf aktuellem Code bereits korrekt sind,
  werden dokumentiert und nicht künstlich repariert.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Die KI verwendet nur side-sichere PlayerViews und öffentliche Events.
- Produktionscode wird erst nach einem roten `behavior_regression`-Nachweis
  geändert.
- Checkpoint-Erwartungen werden nach dem Red-Nachweis nicht abgeschwächt.
- Jede positive Regel erhält eine eng variierte Gegenprobe.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket erhält einen Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`, Fixture-Migration,
  Warmup-Drift oder Redaction-Fehler sind Infrastrukturarbeit und kein
  bestätigter Verhaltensfehler.
- Erfordert eine Lösung Hidden Info oder eine KI-Aktion außerhalb der
  LegalActions, stoppt der Prozess.
- Neue Engine-, Replay-, StateHash-, Side-Safety- oder AI-Gate-Fehler
  blockieren den Abschluss.
- Neue parallele Änderungen an denselben Verträgen werden vor Integration
  fachlich abgeglichen; keine Seite wird blind überschrieben.

## State Machine

`preflight -> process_committed -> red_evidence_committed -> trace_fixed -> economy_fixed -> search_fixed -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Prozessbasis, Evidence und isolierter Worktree

- Ziel: Scope, vollständige Decision-Coverage, `/Goal`, Invarianten, Branch
  und Worktree versionieren.
- Kernartefakte: dieses Prozessdokument und der Evidence-Report.
- Check: `git diff --check`.
- Done-Gate: Beide Artefakte sind auf dem Arbeitsbranch committed.
- Commit: `docs(ai): plan match 5f6d runner remediation`

### P1 – Spielgleiche rote Decision-Checkpoints

- Ziel: Decisions 58, 62, 72, 74, 75, 83 und 84 vor
  Produktionsänderungen strikt capturen.
- Zielverträge:
  - D58 wählt einen Bid, der bei akzeptabler Tag-Folge den bekannten
    verbleibenden Zugriffspfad nicht selbst unfinanzierbar macht.
  - D62 wählt die strikt höhere creditproduzierende Newsgroup-Aktion.
  - D72 nimmt Executive Wiretaps als erste Grip-Karte und behandelt die
    restliche Reihenfolge als nachgelagerte Auswahl.
- Gegenproben:
  - D87 bleibt bei einem nicht gewinnbaren Trace auf dem minimalen Bid 0.
  - Eine Credit-Ability mit gleichem oder geringerem Nettoertrag verdrängt
    die Basic-Credit-Aktion nicht.
  - Cloak darf bei freier MU, ausreichenden Credits und passendem Rig die
    richtige erste Suchkarte sein.
- Done-Gate: Historische Zieltests sind ausschließlich als
  `behavior_regression` rot; Gegenproben sind grün; separater Commit.
- Commit: `test(ai): capture match 5f6d runner regressions`

### P2 – Trace- und Restpfad-Budgetierung härten

- Ziel: Trace-Bids berücksichtigen Credits nach dem Bid, bekannten
  verbleibenden Run-Pfad, Zugriffswert, Tag-Entfernung und sichtbare
  Tag-Bestrafung.
- Done-Gate: Unveränderte D58-Erwartung und D87-Gegenprobe sind grün;
  angrenzende Trace- und RunPlan-Tests bleiben grün.
- Commit: `fix(ai): preserve viable run paths across trace bids`

### P3 – Credit-Aktionsdominanz vereinheitlichen

- Ziel: Finanzierungs- und Low-Credit-Wert auf alle legalen
  creditproduzierenden Aktionen anhand ihres projizierten Nettoertrags
  anwenden.
- Done-Gate: Unveränderte D62-Erwartung und negative Gegenproben sind grün;
  bestehende Economy-Checkpoints bleiben grün.
- Commit: `fix(ai): compare credit actions by projected yield`

### P4 – Zweistufige Stack-Suche modellieren

- Ziel: Genau eine Karte für den Grip auswählen und erst danach die
  verbliebenen Karten mit aktualisiertem Hand-, Duplikat-, MU- und
  Plankontext sortieren.
- Done-Gate: Unveränderte D72-Erwartung und Cloak-Gegenprobe sind grün;
  angrenzende Choice- und Search-Tests bleiben grün.
- Commit: `fix(ai): separate stack search pick from ordering`

### P5 – Gesamtverifikation, Final-Report und Wissenspflege

- Pflichtchecks: alle neuen Checkpoints und Gegenproben, angrenzende
  Runtime-/Trace-/Economy-/Choice-Tests, AI-Typecheck und `git diff --check`.
- Breite Checks: vollständige AI-Suite beziehungsweise alle AI-Testshards und
  relevante AI-Gates, sofern realistisch.
- Artefakte: Red-Evidence, Final-Report, AI-README beziehungsweise aktueller
  Monatslog, falls ein dauerhafter Vertrag entstanden ist.
- Done-Gate: Checks, Grenzen und bewusst nicht gelaufene Gates dokumentiert;
  Arbeitsbranch sauber.
- Commit: `docs(ai): close match 5f6d runner remediation`

### P6 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, erneut verifizieren, bevorzugt
  Fast-Forward mergen und Worktree sowie Branch entfernen.
- Done-Gate: Lokales `main` enthält alle Paketcommits; Status und Diff-Hygiene
  sind grün; Worktree-Pfad und Arbeitsbranch existieren nicht mehr.

## Verifikationsregeln

- Historische Expectations bleiben nach ihrem Red-Nachweis unverändert.
- Fokussierte Vitest-Dateien werden direkt aufgerufen.
- Bei fehlendem `node_modules` im Worktree wird der dokumentierte Binary-
  Fallback des Hauptworkspace verwendet oder ein eingefrorener Install-Lauf
  ausgeführt.
- Ein breiter Testfund wird eingegrenzt und auf demselben finalen Code erneut
  geprüft; kein grüner Einzeltest kaschiert einen roten Gesamtvertrag.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_5F6D027A` auf Branch
`codex/ai-match-5f6d027a-fixes`. Arbeite immer nur am aktuellen Paket,
stelle historische Verhaltensverträge vor dem jeweiligen Fix fachlich rot,
ändere ihre Expectations danach nicht und committe jedes abgeschlossene Paket
separat. Nutze den Hauptworkspace erst für den finalen Merge.

## Abschlusskriterien

- Alle weiterhin reproduzierbaren Fehler besitzen dauerhafte spielgleiche
  Checkpoints und enge Gegenproben.
- Zieltests waren vor dem Fix rot und sind danach unverändert grün.
- Produktionsänderungen sind generisch, side-safe und kartennamenfrei.
- Pflichtchecks und bewusst nicht ausgeführte Checks sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
