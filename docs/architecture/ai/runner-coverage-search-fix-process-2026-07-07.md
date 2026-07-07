# Runner Coverage Search Fix Prozess 2026-07-07

Status: umgesetzt, finale Integration läuft

## Quelle und Ziel

Quelle sind die zwei neuesten beendeten lokalen Spiele aus `data/runtime/multiplayer/netgrid.sqlite`:

- `match_e05dbb4eadd9a5f4`, beendet am 2026-07-07 um 18:55:00Z, Corp-Sieg durch Agenda-Punkte.
- `match_13f99872809e6a66`, beendet am 2026-07-07 um 18:42:37Z, Corp-Sieg durch Agenda-Punkte.

Gesamtziel: Die Runner-KI darf nach einem guten Start nicht im Coverage-/The-Short-Circuit-Suchmodus hängen bleiben, wenn sie bereits konkrete Antworten in der Hand hat, eine direkte Agenda-Chance offen ist oder ein Remote-Score droht. Die Umsetzung bleibt LegalActions-only, side-safe und ändert keine Engine-, Replay-, StateHash- oder Hidden-Info-Verträge.

## Invarianten

- Die KI erzeugt keine Aktionen, sondern wählt ausschließlich aus vorhandenen `LegalActions`.
- Sichtbarkeit bleibt auf PlayerView, redigierte PublicEvents, LegalActions und erlaubte AI-Metadaten beschränkt.
- Keine kartennamenspezifische Sonderregel für `The Short Circuit`, wenn eine generische Coverage-Search-Regel ausreicht.
- Suchaktionen müssen ein konkretes Follow-up haben: installieren, finanzieren oder bewusst abbrechen.
- Setup- und Coverage-Pläne dürfen akute Agenda-/Score-Threat-Chancen nicht verdrängen.

## Nicht-Ziele

- Kein Broker-spezifischer Plan in diesem Paket. Die zwei analysierten Spiele belegen keine freiwillige Broker-Fehlentscheidung.
- Keine Änderung an Engine-Regeln, Handlimit-Regeln, Access-Regeln oder der Kartendefinition von `The Short Circuit`.
- Keine Runtime-Datenbankänderung und kein Serverstart.

## Paketfolge

### Paket 1: Preflight, Evidence und Prozess

Ziel: Worktree, Prozessartefakt und Match-Evidence anlegen.

Checks:

- `git status --short --branch`
- `git diff --check`

Done-Gate: Prozess- und Evidence-Datei sind versioniert und beschreiben Scope, Invarianten und analysierte Fehlergruppen.

### Paket 2: Coverage-Search Stop- und Pivot-Regel

Ziel: Weitere Programmsuche unter Coverage-Plänen hart abwerten oder blockieren, wenn bereits passende Handantworten vorhanden sind, die Hand voll ist oder eine frisch gesuchte Antwort noch nicht installiert beziehungsweise finanziert wurde.

Checks:

- fokussierte Tests für Coverage-Search-Fit und TacticalPlans
- `git diff --check`

Done-Gate: Regressionsfall verhindert die wiederholte Suche trotz vorhandener Coverage-Antwort.

### Paket 3: Install-/Funding-Priorität für gefundene Antworten

Ziel: Frisch gesuchte oder sichtbare Coverage-Antworten werden vor weiterer Suche als Installations- oder Funding-Ziel behandelt.

Checks:

- fokussierte Tests für TacticalPlan-Runner-Coverage
- `git diff --check`

Done-Gate: Plan-Mapping bevorzugt Installation/Funding der vorhandenen Antwort vor weiterer Suche.

### Paket 4: Agenda- und Score-Threat-Override

Ziel: `runner.obtain_breaker_coverage` darf direkte Agenda-/Score-Threat-Runs nicht als Plan-Mismatch wegdrücken, wenn die Alternative side-safe sichtbar und deutlich besser ist.

Checks:

- fokussierte Tests für Semantic Choice Ranking und Runtime-Cutover
- `git diff --check`

Done-Gate: Bekannte HQ-Agenda, frischer R&D-Agenda-Hinweis oder sichtbarer Score-Threat übersteuern Coverage-Setup.

### Paket 5: Remote-Contest und Low-Payoff-Run-Härtung

Ziel: Fortgeschrittene Remotes erhalten einen temporären Contest-Anker; Archives/simple Runs ohne konkreten Payoff verlieren gegen dringende Setup-, Funding- oder Score-Threat-Ziele.

Checks:

- fokussierte Tests für Remote-Contest-Strategie und Run-Payoff
- `git diff --check`

Done-Gate: Remote-Score-Threat wird nicht durch generisches Setup verdrängt; Archives-Füllruns werden ohne konkreten Payoff abgewertet.

### Paket 6: Dokumentation und Wissenspflege

Ziel: Evidence, Final-Report und Projektlog aktualisieren.

Checks:

- `git diff --check`

Done-Gate: Final-Report nennt Änderungen, Grenzen und Checks.

### Paket 7: Finale Verifikation und lokale Integration

Ziel: AI-Checks ausführen, Arbeitsbranch nach `main` mergen und Hauptworkspace verifizieren.

Checks:

- fokussierte Vitest-Regressionen
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate: Arbeitsbranch ist lokal nach `main` integriert und der Worktree ist entfernt oder sauber belassen.

## Sicherheitsblocker

Stoppe ohne Workaround, wenn eine Lösung verdeckte Informationen benötigt, nicht aus LegalActions ableitbar ist oder eine Engine-/PlayerView-Erweiterung statt AI-Scoring erfordert.

## Umsetzungsergebnis

- Coverage-Programmsuche wird nicht mehr als Planfortschritt gemappt, wenn seit der letzten Programmsuche ein sichtbares Programm in der Runner-Hand auf Installation oder Funding wartet.
- Rig-basierte Programmsuche wird bei erreichtem Handlimit als unproduktiver Coverage-Search-Fit abgelehnt.
- Der Runtime-Folgefall ist regressionsgeschützt: Nach einer `The Short Circuit`-Suche und sichtbarem Programm in der Hand wählt die Runner-KI Funding statt erneuter Suche.
- Coverage-Setup schützt echte Coverage-Antworten weiter, lässt aber bekannte HQ-Agenda- und frische R&D-Payoff-Runs bei deutlichem Score-Vorsprung durch.
- Remote-Contest-Pläne akzeptieren jetzt auch neutrale oder aus RunTarget-Evaluationen erzeugte Remote-Score-Threat-Goals als Plananker.

## Paketstatus

- Paket 1: abgeschlossen, Commit `acd5dc2e1`.
- Paket 2: abgeschlossen, Commit `32bc4e77d`.
- Paket 3: abgeschlossen, Commit `661af7a46`.
- Paket 4: abgeschlossen, Commit `84dcba3a4`.
- Paket 5: abgeschlossen, Commit `ce78eb54a`.
- Paket 6: in diesem Dokumentationspaket abgeschlossen.
- Paket 7: finale Verifikation und lokale Main-Integration stehen noch aus.
