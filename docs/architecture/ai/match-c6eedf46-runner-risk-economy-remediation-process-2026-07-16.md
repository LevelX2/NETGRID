# Match C6EEDF46: Runner-Risiko- und Ökonomie-Remediation 2026-07-16

Status: P0 und P1 abgeschlossen, P2 aktiv

## Quelle und Zielprüfung

Quelle ist das abgeschlossene Match `match_c6eedf46e777c169` aus der lokalen,
read-only ausgewerteten SQLite-Runtime. Alle 11 Runner-KI-Entscheidungen sind
vollständig durch AI-Traces gedeckt. Freigegeben sind die Korrekturen für die
verzögert auszahlende Ökonomie, die aktionsbezogene Reserveprüfung, den
Chicago-Branch-Hint und das typfalsche BBS-Rez-Ereignis.

Der Nutzer hat den fachlichen Vertrag ergänzt:

- Sichtbare Damage-, Tag-, Trace- oder Punish-Karten müssen die Vermutung
  eines Damage-/Punish-Decks erhöhen und die Runner-KI vorsichtiger machen.
- Vor einem solchen sichtbaren Signal darf Risiko weiterhin eine legitime
  Spielentscheidung sein.
- Echte Grenzentscheidungen sollen nicht vollständig ausrechenbar sein.
  Kontrollierte Varianz ist erlaubt, klare Fehler und erzwungene Aktionen
  bleiben dagegen deterministisch.

Die Vorgabe ist präzise genug für direkte sequenzielle Umsetzung. Im
historischen Entscheidungszeitpunkt D9/SV15 waren Chance Observation und
Urban Renewal noch nicht sichtbar. Sie dürfen deshalb weder in den
Checkpoint noch in die Begründung der Reservekorrektur einfließen.

## Gesamtziel und `/Goal`

`/Goal`: Die freigegebenen Findings aus Match C6EEDF46 im bestehenden
Analyse-Worktree zuerst mit spielgleicher roter Decision-Evidence sichern,
verzögerte Ökonomie und aktionsbezogene Liquiditätsreserven generisch
verbinden, ausschließlich sichtbare Damage-/Punish-Signale in eine
replay-stabile Risikohaltung überführen, kontrollierte Varianz nur zwischen
fachlich zulässigen nahen Alternativen erlauben, Chicago Branch und das
BBS-Rez-Ereignis fachlich korrigieren, unveränderte Erwartungen und enge
Gegenproben grün verifizieren und den fertigen Arbeitsbranch lokal nach
`main` integrieren.

- Arbeitsbranch: `codex/ai-match-c6eedf46-analysis`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_C6EEDF46_ANALYSIS`
- synchronisierter Ausgangs-`main`: `70b3f985c2f85321af633824c65c6abfb1bb4db4`
- Runtime-Evidence: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Push oder Pull Request: nicht Teil des Prozesses

## Annahmen und Nicht-Ziele

- Die Korrektur erzwingt bei D9 keine bestimmte einzelne Aktion. Sie verbietet
  die zwei Installationen, die ohne unmittelbare Liquidität auf 0 Credits
  führen, und lässt eine fachlich sinnvolle Positivmenge zu.
- Back Door ist eine gute historische Gegenoption, aber die KI darf Chance
  Observation nicht vor ihrer öffentlichen Enthüllung erraten.
- Frühe Facecheck-Runs, bezahlte akute Contests, unmittelbare Score-/Steal-
  Fenster und echte Sofortauszahlungen dürfen weiterhin bewusst Reserve
  verbrauchen.
- Kontrollierte Varianz ist kein globales Zufallsrauschen auf Scores. Sie gilt
  nur innerhalb einer engen, vorab fachlich zulässigen Kandidatenmenge.
- Kein Match-, Seed-, Karteninstanz- oder Kartennamen-Sondergewicht entsteht.
- Broker und Fall Guy werden nicht verändert; beide hatten im Quellmatch kein
  legales Entscheidungsfenster.
- Die parallelen fremden Worktrees und ihre Änderungen bleiben unangetastet.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Historische Checkpoints verwenden nur damalige PlayerViews, LegalActions,
  öffentliche Eventpräfixe und side-safe Runtime-Metadaten.
- Produktionscode wird erst nach einem roten `behavior_regression`-Nachweis
  für D9 verändert.
- Aktionskosten, Credits nach der Aktion, unmittelbarer Credit-Ertrag,
  Mindestreserve und Handpuffer werden gemeinsam am konkreten Kandidaten
  bewertet.
- `economy.installment_credit` und `economy.turn_start_credit` dürfen nicht als
  sofortige Liquidität konsumiert werden.
- Damage-/Punish-Vermutungen entstehen nur aus sichtbaren oder zuvor
  regelkonform enthüllten Karten und öffentlichen Ereignissen. Deckname,
  unbekannte HQ-Karten und zukünftige Events sind verboten.
- Varianz muss replay-stabil und reproduzierbar sein. Gleicher Seed,
  identischer öffentlicher Zustand und identischer Decision-Kontext ergeben
  dieselbe Auswahl.
- Klare Dominanz, Regelzwang, Überlebenszwang, unmittelbarer Sieg oder eine
  Reserveverletzung ohne zulässigen Override nehmen nicht an Varianz teil.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket erhält einen Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`, Fixture-Migration,
  Warmup-Drift oder Redaction-Fehler gelten nicht als bestätigte
  Verhaltensregression.
- Ist D9 auf synchronisiertem aktuellem Code bereits fachlich grün, wird kein
  Verhaltensfix aus dem historischen Fund abgeleitet.
- Erfordert Damage-Erkennung zukünftige oder verdeckte Karten, stoppt der
  Prozess ohne Workaround.
- Erfordert Varianz einen nicht replaybaren Zufallszug außerhalb des
  bestehenden Seed-/Random-Vertrags, stoppt der Prozess und beschränkt sich
  auf vorhandene replay-stabile Mechanismen.
- Neue Engine-, Replay-, StateHash-, Side-Safety- oder AI-Gate-Fehler
  blockieren Abschluss und Merge.

## State Machine

`preflight -> process_committed -> evidence_committed -> red_checkpoint_committed -> behavior_fixed -> hints_engine_fixed -> verified -> documented -> merged -> cleaned`

## Paketfolge

### P0 – Preflight und Prozessbasis

- Ziel: Scope, `/Goal`, Invarianten, Branch, Worktree und Nutzerleitplanken
  versionieren.
- Check: `git diff --check`.
- Done-Gate: Prozessartefakt ist separat committed.
- Commit: `docs(ai): plan match c6eedf46 runner remediation`

### P1 – Spiel-Evidence und Fehlergruppen

- Ziel: 11/11-Decision-Coverage, D7-D9-Sequenz, Hint-/Consumer-Kette,
  Nicht-Leak-Vertrag und die Nichtbeteiligung von Broker/Fall Guy dauerhaft
  dokumentieren.
- Done-Gate: Evidence nennt sichtbare Alternativen, Folgeauswahl und klare
  Grenzen für Damage-Vermutung und Varianz.
- Commit: `docs(ai): record match c6eedf46 evidence`

### P2 – Spielgleicher roter D9-Checkpoint

- Ziel: D9/SV15 mit dem damaligen GameState, öffentlichen Eventpräfix,
  TacticalPlan, PlanPortfolio, StrategicIntent und produktivem Chooser
  capturen.
- Zielvertrag: Installationen ohne unmittelbare Liquidität, die 4 Credits auf
  0 reduzieren, sind nicht akzeptabel; eine positive Menge aus kostenlosen
  Setup-, Draw-, Credit- oder erreichbaren Druckaktionen bleibt zulässig.
- Gegenproben:
  - dieselbe verzögerte Investition ist mit ausreichender Restreserve erlaubt;
  - eine echte unmittelbare Auszahlung oder ein akutes Contest-/Scorefenster
    darf die Reserve kontrolliert verwenden;
  - ohne sichtbares Damage-/Punish-Signal entsteht keine pauschale
    Übervorsicht.
- Done-Gate: Historischer Zieltest ist ausschließlich
  `behavior_regression` rot; Gegenproben sind grün; separater Commit.
- Commit: `test(ai): capture match c6eedf46 runner regression`

### P3 – Ökonomietiming, Reserve und Planfortschreibung

- Ziel: Sofortökonomie, auszahlbare Banken und verzögerte Ratenökonomie bis
  Action-Projektion, Handentwicklung, Funding-Plan und Arbitration
  unterscheiden.
- Arbeit:
  - strukturiertes Effect-Target in der Action-Semantik erhalten;
  - `creditsAfterAction`, unmittelbaren Ertrag, Mindestreserve und Handpuffer
    kandidatenbezogen berechnen;
  - Funding-Ziel und funded continuation mit der tatsächlichen Restreserve
    revalidieren;
  - absolute Planbindung lösen, wenn der konkrete Installationsschritt den
    eigenen Risikovertrag verletzt;
  - Debug-Evidence einschließlich `spendingWouldDropBelowReserve` aus dem
    konkreten Kandidaten statt aus einer festen Falschaussage erzeugen.
- Done-Gate: D9 und positive Gegenproben grün; angrenzende Economy-, Install-
  und Plan-Arbitration-Tests grün.
- Commit: `fix(ai): revalidate delayed economy against reserve`

### P4 – Sichtbare Damage-/Punish-Vermutung und kontrollierte Varianz

- Ziel: Bereits enthüllte Damage-, Tag-, Trace- und Punish-Signale erhöhen
  generisch Handpuffer, Trace-/Tag-Abwehrwert und Liquiditätsreserve.
- Arbeit:
  - öffentliche Kartenmemory und strukturierte Hints als einzige Evidence
    verwenden;
  - Intensität nach Anzahl, Aktualität und Kombination sichtbarer Signale
    staffeln;
  - Risikohaltung in Economy-/Handbuffer-/Install-Consumer einspeisen;
  - vorhandene replay-stabile Varianzmechanik identifizieren und nur auf eine
    enge Menge nicht dominierter, reservekonformer Grenzentscheidungen
    anwenden;
  - Entscheidungskette mit Risikosignal, Varianz-Eignung und stabilem
    Auswahlgrund beobachtbar machen.
- Gegenproben:
  - keine Vorsicht aus unbekannten HQ-/R&D-Karten;
  - ein einzelnes schwaches Signal verbietet keine sinnvollen Runs;
  - eindeutige Überlebens-, Score- und Dominanzentscheidungen variieren nicht;
  - identischer Replay-Kontext bleibt deterministisch, unterschiedliche
    erlaubte Seeds oder Decision-Kontexte können verschiedene sichere
    Grenzentscheidungen wählen.
- Done-Gate: fokussierte Risk-/Memory-/Varianztests und Redaction-Gates grün.
- Commit: `feat(ai): vary safe risk choices from visible punish signals`

### P5 – Chicago-Hint und BBS-Rez-Typ

- Ziel: Chicago Branch nicht mehr als Economy-Asset klassifizieren und
  Nicht-ICE-Rez-Ereignisse typkorrekt ausgeben.
- Arbeit:
  - dedizierte Scorebeschleunigungs-Semantik beziehungsweise eine fachlich
    äquivalente Remote-Rolle einführen und im Trash-Consumer nutzen;
  - Inspector-Invariante ergänzen, die `asset_economy` ohne unabhängigen
    Credit-/Economy-Nachweis ablehnt;
  - aktive und kompilierte Hints sowie Inspector-/Derived-Artefakte
    regenerieren;
  - BBS-Rez als generisches `rez_card` statt `rez_ice` ausgeben, ohne
    Sichtbarkeits-, StateHash- oder Replayvertrag zu lockern.
- Done-Gate: Hint-/Ontology-/Inspector-Gates sowie fokussierte Engine-/Replay-
  Tests grün.
- Commit: `fix(ai): correct score acceleration and non-ice rez semantics`

### P6 – Verifikation, Review und Wissenspflege

- Ziel: historische Expectations unverändert grün, angrenzende Regressionen
  und breite Gates abschließen.
- Pflichtchecks: Checkpoint und Gegenproben, fokussierte Vitest-Dateien,
  Hint-/Ontology-/Inspector-Gates, AI- und betroffene Engine-/Shared-
  Typechecks, realistisch vollständige AI-Suite und `git diff --check`.
- Artefakte: Final Review unter `docs/reviews/ai/`, AI-README und Monatslog.
- Done-Gate: Checks, Grenzen, bewusst nicht ausgeführte Läufe und Merge-
  Bereitschaft dokumentiert; Arbeitsbranch sauber.
- Commit: `docs(ai): close match c6eedf46 runner remediation`

### P7 – Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv einbinden, relevante Checks wiederholen,
  bevorzugt Fast-Forward nach lokalem `main` mergen und Worktree sowie Branch
  verifiziert entfernen.
- Done-Gate: `main` enthält alle Paketcommits und ist sauber; Worktree-Pfad
  und Arbeitsbranch existieren weder in Git noch im Dateisystem.

## Verifikationsregeln

- Checkpoint-Erwartungen werden nach dem roten Nachweis nicht abgeschwächt.
- Jede positive Regel erhält mindestens eine eng variierte negative
  Gegenprobe.
- Fokussierte Vitest-Dateien werden direkt ausgeführt, wenn Filterargumente
  nicht zuverlässig durchgereicht werden.
- Fehlt `tsx` oder `vitest` im Worktree, wird der dokumentierte Binary-Fallback
  aus dem Hauptworkspace verwendet; Dependencies werden nicht unnötig neu
  installiert.
- Bei Runtime-/Arbitration-Änderungen werden die AI-Testshards oder die
  vollständige AI-Suite ausgeführt.
- Vor dem finalen Merge werden zwischenzeitliche `main`-Änderungen inhaltlich
  geprüft; fremde Intentionen werden erhalten.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_C6EEDF46_ANALYSIS` auf Branch
`codex/ai-match-c6eedf46-analysis`. Arbeite immer nur am aktuellen Paket,
stelle den historischen Verhaltensvertrag vor Produktionsänderungen fachlich
rot, ändere seine Expectation danach nicht und committe jedes abgeschlossene
Paket separat. Nutze den Hauptworkspace nur für Runtime-Evidence und den
finalen Merge. Verwende keine zukünftige Hidden Info und keine
nicht-replaybare Zufallsquelle.

## Abschlusskriterien

- D9 besitzt einen dauerhaften spielgleichen Checkpoint und enge
  Gegenproben.
- Der Zieltest war vor dem Fix `behavior_regression` rot und ist danach
  unverändert grün.
- Verzögerte Ökonomie kann akute Liquidität nicht mehr vortäuschen.
- Reserve-, Handbuffer- und Planfortschrittsentscheidungen verwenden den
  konkreten Post-Action-Zustand.
- Sichtbare Damage-/Punish-Signale erhöhen abgestuft die Vorsicht, ohne
  unbekannte Karten zu erraten oder die KI generell passiv zu machen.
- Kontrollierte Varianz betrifft nur sichere Grenzentscheidungen und bleibt
  replay-stabil.
- Chicago Branch und Nicht-ICE-Rez-Ereignisse sind fachlich korrekt.
- Pflichtchecks und Grenzen sind dokumentiert.
- `main` enthält alle Paketcommits; Worktree und Branch sind verifiziert
  entfernt.
