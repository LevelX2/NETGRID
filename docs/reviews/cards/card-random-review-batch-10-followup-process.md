# CardSpec-Zufallsreview Batch 10 – Nacharbeitsprozess

Status: in Umsetzung

Quelle: gezielte Nachprüfung der im ersten Batch-10-Durchgang ausgelassenen
Findings zu Falsified-Transactions Expert, Smith's Pawnshop und Mastiff.

## Gesamtziel

`/Goal` Die bestätigten Batch-10-Nacharbeiten vollständig und sequenziell im
Worktree `C:\Projekte\NETGRID_CARD_RANDOM_BATCH_10` auf Branch
`codex/card-random-batch-10` umsetzen, fokussiert verifizieren, paketweise
committen, anschließend lokal nach `main` integrieren und den gemergten
Worktree samt Branch verifiziert entfernen.

## Zielprüfung und Annahmen

- Die Engine bleibt Regelautorität; Legalität und Choice-Angebote werden nicht
  erweitert.
- `corp.score_agenda` bleibt alleiniger Owner der Falsified-Transferroute.
- `runner.economy` bleibt alleiniger Owner der optionalen Pawnshop-Liquidation.
- Choice-Resolver materialisieren nur die zuvor planseitig exakt gebundene
  Option; sie erhalten keine eigene Bewertungsautorität.
- Mastiffs `Trace 5` ist durch den bereits dokumentierten Originalkartenscan
  geklärt. Runtime und Tracewert bleiben unverändert.
- Eigene installierte Karten und ihre öffentlichen Zustände sind side-sichere
  KI-Information.

## Nicht-Ziele

- keine neue Planinstanz oder zweite Choice-Autorität;
- keine Kartenname-Heuristik in allgemeinen KI-Resolvern;
- keine Änderung der Falsified-, Pawnshop- oder Mastiff-Legalität;
- keine breite Neubewertung aller Advancement-, Economy- oder ICE-Pläne;
- kein Push oder Pull Request.

## Controller-Invarianten

- Plan, Step, Route, Executor, Action-ID, Choice-ID und StateVersion bleiben
  bis zur Payload-Materialisierung exakt gebunden.
- Technische IDs sind höchstens letzter Tiebreak, niemals Ersatz für eine
  fehlende Quellen-, Ziel- oder Mengenbewertung.
- Fehlende oder stale Bindungen scheitern fail-closed.
- PlayerView, LegalActions und öffentliche CardSpec-Metadaten bleiben die
  einzigen KI-Eingaben.

## Paketfolge

### Paket 1 – Falsified-Transactions Expert

Ziel: Der Corp-Score-Plan bewertet und bindet die vollständige
Advancement-Transferroute aus Quelle, Ziel und Menge. Der Choice-Resolver
materialisiert ausschließlich dieses Tupel.

Done-Gate:

- Operation-Transfers werden vom bestehenden Advancement-Assessment erfasst;
- eine wertvolle Quellagenda wird nicht durch technischen Tiebreak geleert;
- Ziel, Quelle und Menge sind in derselben Score-Continuation gebunden;
- bestehende Place-/Move-Advancement-Ownership bleibt grün;
- fokussierte AI-Tests, AI-Typecheck und `git diff --check` bestehen.

Commit: `fix(ai): bind exact advancement transfer routes`

### Paket 2 – Smith's Pawnshop

Ziel: Der vorhandene Runner-Economy-Plan vergleicht den sicheren Wert von
`[2]` mit dem planrelevanten Verlust jeder legalen installierten Karte und
bindet entweder ein positives Cash-out-Ziel oder bewusst Pass.

Done-Gate:

- redundante beziehungsweise verbrauchte Karte kann verkauft werden;
- kritische Breaker-Coverage, Survival- und aktive Enginekarten werden
  geschützt;
- bei negativem Netto-Trade bleibt Pass erhalten;
- Resolver ändert weder Action-ID noch Executor;
- fokussierte AI-Tests, AI-Typecheck und `git diff --check` bestehen.

Commit: `fix(ai): price installed card liquidation choices`

### Paket 3 – Mastiff und Runner-Counter-Hints

Ziel: Mastiffs kanonischer Text enthält das belegte `Trace 5`. Der
Hint-Compiler leitet persistente Runner-Counter-Effekte aus dem jeweiligen
typisierten Countervertrag ab und erzeugt keine hardcodierte
Baskerville-Semantik für andere Karten.

Done-Gate:

- Mastiff-Text und strukturierter Tracevertrag stimmen überein;
- Mastiff projiziert Brain-, Cerberus Net- und Data Raven Tag-Counter korrekt;
- Baskerville behält seine korrekte eigene Semantik;
- Hint-Artefakte sind regeneriert und synchron;
- fokussierte Cards-/AI-Compiler-Tests, relevante Typechecks und
  `git diff --check` bestehen.

Commit: `fix(cards): correct mastiff and runner counter semantics`

## Automatische Fehlerbehandlung

- Fokussierte rote Tests werden ursachenbezogen im aktiven Paket behoben.
- Unabhängige Baselinefehler werden dokumentiert und nicht in den Scope
  gezogen.
- Ein fachlicher Konflikt mit neuem `main` stoppt den Integrationsschritt;
  kompatible Änderungen werden unter Erhalt beider Intentionen zusammengeführt.

## Abschlusskriterien

- alle drei Paketcommits vorhanden;
- gemeinsame fokussierte Gates und betroffene Typechecks grün;
- Arbeitsbranch sauber und mit aktuellem `main` abgeglichen;
- lokaler Merge nach `main` erfolgreich;
- `main` nach Merge geprüft;
- Worktree aus Git und Dateisystem entfernt und Branch regulär gelöscht.
