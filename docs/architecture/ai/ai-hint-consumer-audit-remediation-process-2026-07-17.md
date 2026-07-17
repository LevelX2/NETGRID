# KI-Hint-Consumer-Audit: Prozess zur Nachbesserung vom 17.07.2026

## Status

In Arbeit.

## Quelle und Ziel

Die Spielanalyse von `match_520180ba217781ad` hat gezeigt, dass ein vorhandener
und geprüfter Kartenhint nicht automatisch bis zu einem korrekten produktiven
Consumer reicht. Der Deck-Audit meldete `Schematics Search Engine` fälschlich
als Breaker-Suche und erkannte `Boostergang Connections` nicht als verfügbare
allgemeine Stack-Suche.

Ziel ist ein verbindlicher, sichtbarer Deck-Hint-/Consumer-Audit für
Spielanalysen mit `deckSnapshot` sowie ein semantisch korrekter
Search-Access-Consumer. Die Analyse bleibt side-safe und verwendet nur
Deck-Snapshot, Hints und LegalActions.

## Annahmen und Nicht-Ziele

- `stack_search` bedeutet hier eine tatsächlich auswählbare Suche im eigenen
  Stack und darf daher vorhandene Programme und Breaker erreichbar machen.
- Die LegalAction des konkreten Suchwerkzeugs bleibt die Voraussetzung für
  `legalNow`; der Deck-Consumer erfindet keine Aktion.
- Kein Kartenhint wird ohne nachweisliche fachliche Abweichung umklassifiziert.
- Keine neue Suchstrategie, kein Score-Tuning und keine Änderungen am
  gespeicherten Match sind Teil dieses Prozesses.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- KI-Entscheidungen werden ausschließlich aus LegalActions abgeleitet.
- Keine verdeckten Stack- oder Handkarten werden für die Consumer-Bewertung
  verwendet.
- Ein Analyseabschluss mit `deckSnapshot` darf nur dann behaupten, dass
  Hint- und Consumer-Kette geprüft sind, wenn der Deck-Audit ausgeführt wurde
  und `result.status = ok` oder alle blockierenden Befunde ausdrücklich als
  offene Findings ausgewiesen sind.

## Paketfolge

### P1: Audit-Vertrag und Pfadstabilität

- Aktualisiere den Spielanalyse-Skill: Der Deck-Audit wird bei jedem
  `deckSnapshot` zum Abschlussgate; sein Ergebnis, seine Ausschlüsse und
  blockierende Findings müssen im Bericht stehen.
- Mache `scripts/audit-ai-deck-hint-consumers.ts` unabhängig vom aktuellen
  Arbeitsverzeichnis, damit der dokumentierte `pnpm --filter`-Aufruf den
  Repository-Root korrekt verwendet.
- Check: Audit aus `apps/server` gegen Checkpoint `cp-5201-02` starten.
- Commit: `docs(ai): require deck hint consumer audit`.

### P2: Semantischen Search-Consumer korrigieren

- Erkenne allgemeine `stack_search`-Semantik als tatsächlich nutzbare
  Programm-/Breaker-Suche.
- Unterbinde titel- und typbasierte Fehlklassifikation; Text-Fallbacks dürfen
  nur den tatsächlichen Kartentext bewerten.
- Sichere beide Seiten mit Tests: Boostergang wird erkannt, Schematics nicht.
- Check: fokussierte Capability-Tests und Deck-Audit grün.
- Commit: `fix(ai): consume stack search for breaker access`.

### P3: Abschluss und Integration

- Führe den Match-Checkpoint, Deck-Audit, relevante KI-Checks und
  `git diff --check` aus.
- Dokumentiere Ergebnis und verbleibende Warnungen im Review/Monatslog.
- `main` defensiv integrieren, final prüfen, Arbeits-Worktree und Branch
  entfernen.
- Commit: `docs(ai): close hint consumer audit remediation`.

## Abschlusskriterien

- Der Skill verlangt und protokolliert den Deck-Audit bei jedem vorhandenen
  Deck-Snapshot.
- Der dokumentierte Audit-Aufruf funktioniert aus dem gefilterten
  Server-Workspace.
- Der Audit für `cp-5201-02-preserve-wall-breaker-d98` ist grün: Boostergang
  ist ein Search-Tool, Schematics nicht.
- Fokussierte Tests, Typprüfung und relevante KI-Gates sind grün.
- Der Arbeitsbranch ist lokal nach `main` integriert, anschließend sind
  Worktree und Branch nachweislich entfernt.
