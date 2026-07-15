# Match ECFE3CE: Engine-, Hint- und Broker-Prozess 2026-07-16

## Status

P0 aktiv. Die Punkte F1, F2 und H1 bis H5 aus
`match_ecfe3ce373a56823` sind vom Nutzer zur Umsetzung freigegeben. Das
Broker-Verhalten wird vollständig analysiert; ein zusätzlicher Broker-Fix
bleibt bis zu einem eigenen belastbaren Befund und Freigabe-Gate getrennt.

## Gesamtziel

Die sichtbare Run-Pfadquote soll ausschließlich aktuell installierte
Breaker-Coverage verwenden, jede Engine-Quelle eines Runs soll denselben
Run-Sperren-Vertrag samt Ausführungs-Guard einhalten, und die bestätigten
Fang-, All-Nighter-, Private-LDL-, Bodyweight- und TKO-Verträge sollen bis zum
tatsächlichen Consumer korrekt transportiert werden. Parallel wird jede
Broker-Entscheidung des Quellmatches einschließlich ausgelassener legaler
Ladefenster und Cashouts wirtschaftlich bewertet.

## Arbeitsstrang

- Worktree: `C:\Projekte\NETGRID_AI_ECFE3CE_ENGINE_HINTS_BROKER_AUDIT`
- Branch: `codex/ai-ecfe3ce-engine-hints-broker-audit`
- Integrationsbranch: lokaler `main`
- kein Push und kein Pull Request

## Invarianten

- Engine-Korrektheit und `applyAction`-Revalidierung gehen vor KI-Scoring.
- Historische Evidence verwendet ausschließlich side-safe Informationen bis
  zur jeweiligen StateVersion.
- Vor jedem Fix muss der unveränderte aktuelle Code mit einer fachlich roten
  Reproduktion beziehungsweise einem roten Vertrags-/Engine-Test belegt sein.
- Keine Karten-ID-Sondergewichte; gemeinsame Mechanik-, Projektion- und
  Consumer-Verträge bevorzugen.
- Frühe Check-Runs werden nicht pauschal unterdrückt.
- Broker wird nicht aufgrund des Nutzerverdachts vorab umgewichtet. Erfasst
  werden Installation, jedes legale Ladefenster, tatsächliche Ladungen,
  Cashouts, Aktionen nach der Entscheidung, Poolwert und konkreter Funding-
  oder Notfallbedarf.

## Paketfolge

### P0 – Preflight, Prozess und Broker-Decision-Census

- Quellmatch und 208/208-Trace-Coverage bestätigen.
- Alle Broker-bezogenen LegalActions und gewählten Alternativen aus Traces,
  Snapshots und öffentlichen Folgen extrahieren.
- Für jedes Fenster den Grenzertrag eines weiteren Ladens gegenüber Cashout,
  Basic-Economy, Run, Setup und Zugende bestimmen.
- Prozessartefakt und Broker-Evidence separat committen.

### P1 – Rote Beweise für F1 und F2

- D59 als spielgleichen Decision-Checkpoint auf aktuellem Code reproduzieren.
- Run-Sperren-Gegenmatrix für Basic-, Karten-, Restricted- und Bonus-Runs
  sowohl im LegalAction-Builder als auch im Ausführungs-Guard rot sichern.
- Positive Gegenprobe unmittelbar nach legalem Entfernen der Sperre.

### P2 – Gemeinsame Pfadquote und Run-Sperren-Guard

- Vorab-RunTarget, Action-Projektion und RunnerRunPlan auf einen gemeinsamen
  aktuellen Rig-/Coverage-Vertrag führen.
- Gemeinsamen Engine-Guard für jede Run-Quelle einführen und bei Ausführung
  erneut validieren.
- Historische und synthetische Gegenproben unverändert grün machen.

### P3 – Kartenverträge und Consumer

- Fang ohne Tag-Semantik modellieren.
- All-Nighter-Folge unabhängig vom Erfolg des ersten Runs modellieren.
- Private-LDL-Access-Replacement bis Action-Projektion und Score erhalten.
- Bodyweight-Drawmenge im produktiven Wert sichtbar konsumieren.
- TKO-Action-Loss in Inspector und generischem Consumer erhalten.
- Aktive, kompilierte und Inspector-Artefakte regenerieren und prüfen.

### P4 – Verifikation, Review und Integration

- Alle neuen Ziel- und Gegenproben sowie angrenzende Regressionen ausführen.
- AI- und Engine-Typechecks, Hint-/Ontology-/Inspector-Gates und
  `git diff --check` ausführen; wenn realistisch vollständige AI-/Engine-
  Tests ergänzen.
- Evidence-, Final- und Wissenslog-Artefakte abschließen.
- Aktuelles `main` defensiv integrieren, Arbeitsbranch lokal nach `main`
  mergen und integrierten Stand erneut prüfen.
- Sauberen Worktree und gemergten Branch entfernen und doppelt verifizieren.

## Done-Gate

- F1 und F2 sind mit unveränderten roten Erwartungen belegt und danach grün.
- H1 bis H5 sind in Quelle, Generierung, Projektion und tatsächlichem Consumer
  konsistent oder mit klarer, getesteter Schichtgrenze dokumentiert.
- Broker besitzt eine vollständige Fensteranalyse samt konkreter
  Fehlentscheidungen oder einer begründeten Entlastung.
- Keine Hidden-Info-, Replay-, LegalAction- oder Ausführungsregression.
- `main` ist sauber integriert; Worktree und Branch sind entfernt.
