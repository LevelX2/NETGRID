# Testfehler-Ursachenbehebung 2026-08-25

Status: in Bearbeitung

## Quelle/Vorgabe

Der Nutzer hat auf dem lokalen `main`-Stand `706b43a06` alle Test-Suites
ausführen lassen. 33 Tests in 21 Testdateien schlugen fehl. Der Auftrag ist,
diese Fehler im isolierten Worktree sorgfältig und ursachenorientiert zu
beseitigen, ohne die ursprünglichen Änderungsintentionen abzuschwächen.

## Zielprüfung

Die Vorgabe ist für eine direkte, sequenzielle Umsetzung ausreichend präzise.
Die beobachteten Fehler sind nach Paket und Vertrag lokalisierbar. Die genaue
Ursache je Gruppe wird im jeweils aktiven Paket ermittelt; Test- oder
Snapshot-Anpassungen sind nur zulässig, wenn der aktuelle Produktvertrag die
bisherige Erwartung nachweislich ersetzt hat.

## Gesamtziel

Alle 33 auf `706b43a06` beobachteten Fehler an ihrer verursachenden Schicht
beheben, die relevanten Regressionen fokussiert grün nachweisen, jeden
abgeschlossenen Ursachenblock separat committen, den aktuellen lokalen
`main` defensiv integrieren und den fertigen Arbeitsbranch lokal nach `main`
mergen. Danach Worktree und Branch verifiziert entfernen.

## Annahmen

- Die Testbeobachtung auf `706b43a06` ist die Baseline dieses Prozesses.
- Fehler mit langen Laufzeiten sind nicht automatisch durch höhere Timeouts zu
  beheben; zuerst werden Schleife, Komplexität, deterministische Begrenzung und
  fachliche Erwartung geprüft.
- Mehrere Decision-Checkpoint-Fehler können eine gemeinsame Plan- oder
  Projektionursache haben und werden nach Evidenz geclustert.
- Ein aktueller Test darf nur angepasst werden, wenn er nachweislich einen
  ersetzten Vertrag prüft; ansonsten wird der Produktionspfad korrigiert.

## Nicht-Ziele

- Keine neuen Produktfeatures oder Kartenfreischaltungen.
- Keine pauschale Regeneration aller Checkpoints oder Goldens.
- Keine Fallback-, Kompatibilitäts- oder Catch-and-Continue-Lösung.
- Kein vollständiger Workspace-, Build- oder E2E-Lauf ohne neue konkrete
  Erkenntnisfrage; direkt betroffene Tests und Verträge sind maßgeblich.
- Kein Push oder Pull Request.

## Controller-Invarianten

- Rules Engine und strukturierte `LegalActions` bleiben Regelautorität.
- Hidden-Info-Payloads bleiben side-sicher; privilegierte lokale Diagnose ist
  keine Rechtfertigung für Reconnect- oder PlayerView-Leaks.
- KI-Choice-Resolver vervollständigen nur die Payload einer exakt gebundenen
  Action; Plan-, Server-, Ziel- und Strategieentscheidungen bleiben beim
  zuständigen Plan.
- Bestehende Planinstanz, `PlanExecutionOrigin`, Route und Executor bleiben
  erhalten, sofern der Fehler nicht gerade in dieser Ownership liegt.
- Keine technische ID wird als fachliche Semantik geparst.

## Automatische Fehlerbehandlung

- Reproduktionsfehler werden mit dem kleinsten betroffenen Test erneut geprüft.
- Gemeinsam verursachte Fehler werden in einem Paket zusammengeführt, einzeln
  abweichende Ursachen bleiben getrennt.
- Nach einem Fix laufen nur der direkte Test, angrenzende Aufrufer und berührte
  Vertragsprüfungen.
- Neue unabhängige Findings werden als Follow-up dokumentiert und erweitern den
  aktiven Paketumfang nicht still.

## Sicherheitsblocker

- Unklare Hidden-Info-Anforderung oder widersprüchliche Sichtbarkeitsverträge.
- Konfligierende Plan-Ownership zwischen aktuellem Architekturvertrag und
  Testintention.
- Mergekonflikt, bei dem beide fachlichen Intentionen nicht gleichzeitig
  erhalten werden können.
- Fremde oder unklare Änderungen im Arbeits- oder Hauptworkspace.

## State Machine

`prepared -> package_active -> package_verified -> package_committed -> next_package`

Nach dem letzten Paket:

`all_packages_committed -> main_integrated -> affected_checks_green -> merged_to_main -> worktree_removed -> branch_removed -> complete`

## Paketfolge

1. `TF-00` Prozess, Worktree und Baseline
2. `TF-01` Engine-Determinismus-Langläufer
3. `TF-02` Server-Sichtbarkeit und Multiplayer-Langläufer
4. `TF-03` Web-Tooltip-Vertrag
5. `TF-04` AI-CardSpec-Golden-Vertrag
6. `TF-05` AI-Simulations-, Continuation- und Langläuferfehler
7. `TF-06` AI-Decision-Checkpoint-Cluster
8. `TF-07` Main-Abgleich, Abschlussprüfung und Integration

## Paketdetails

### TF-00 Prozess, Worktree und Baseline

- Ziel: reproduzierte Fehlerliste und Prozessgrenzen verbindlich machen.
- Eingang: sauberer `main` auf `706b43a06`.
- Arbeit: Worktree/Branch anlegen, Prozessartefakt und `/Goal` setzen.
- Kernartefakt: diese Datei.
- Checks: `git status --short`, Worktree-/Branch-Verifikation,
  `git diff --check`.
- Done-Gate: isolierter sauberer Worktree, Prozessartefakt committed.
- Commit: `docs: define test failure remediation process`

### TF-01 Engine-Determinismus-Langläufer

- Ziel: Vacuum-Link-/Pacifica-Test innerhalb des fachlich vorgesehenen,
  deterministischen Pfads stabil grün machen.
- Eingang: TF-00 abgeschlossen.
- Arbeit: Laufzeitursache und Testintention prüfen; Ursache in Engine, Fixture
  oder Testgrenze beheben.
- Kernartefakte: Engine-Test und unmittelbar verantwortliche Engine-Schicht.
- Checks: betroffene Testdatei bzw. Einzelfall, angrenzende Determinismus- und
  Revalidierungsprüfungen, `git diff --check`.
- Done-Gate: ursprüngliche Assertions bleiben fachlich wirksam, Test grün.
- Commit: `fix(engine): restore deterministic hidden access regression`

### TF-02 Server-Sichtbarkeit und Multiplayer-Langläufer

- Ziel: zwei Reconnect-Sichtbarkeitsfehler und zwei Multiplayer-Timeouts an der
  jeweiligen Ursache beseitigen.
- Eingang: TF-01 abgeschlossen.
- Arbeit: Actor-/Opponent-Sichtbarkeit der Choice-Metadaten prüfen; lange
  AI-Multiplayer-Szenarien auf Schleife oder fehlende Begrenzung untersuchen.
- Kernartefakte: `apps/server/src/multiplayer.test.ts` und verantwortliche
  PlayerView-/Reconnect-/Simulation-Schichten.
- Checks: vier Einzelfälle, angrenzende Reconnect-, Hidden-Info-, Replay- und
  Idempotenztests, `git diff --check`.
- Done-Gate: keine verbotenen Datenleaks, regulärer deterministischer Abschluss,
  alle vier Tests grün.
- Commit: `fix(server): restore reconnect visibility and bounded ai matches`

### TF-03 Web-Tooltip-Vertrag

- Ziel: Marker-Sichtbarkeit und Keyboard-Lesbarkeit nach aktuellem
  `tooltipDetail`-Vertrag korrekt absichern.
- Eingang: TF-02 abgeschlossen.
- Arbeit: Produktionscode und sourcebasierte Testintention vergleichen; nur die
  tatsächlich veraltete Vertragsseite ändern.
- Kernartefakte: `apps/web/app/card-view-model.test.ts` und Run-Overlay.
- Checks: betroffener Test, direkt angrenzende Action-/Tooltip-Tests,
  `git diff --check`.
- Done-Gate: Markerinhalt bleibt sichtbar und zugänglich; Test grün.
- Commit: `test(web): align marker tooltip contract`

### TF-04 AI-CardSpec-Golden-Vertrag

- Ziel: den einzelnen Classic-Golden-Fehler auf echte Vertragsdrift oder
  veraltete Erwartung zurückführen.
- Eingang: TF-03 abgeschlossen; AI-Architektur-Preflight gelesen.
- Arbeit: exakte semantische Differenz der 46 Artefakte prüfen und nur die
  verursachende Quelle oder präzise Golden-Erwartung korrigieren.
- Kernartefakte: Classic-Hint-Golden-Test und betroffene CardSpec-/Hint-Quelle.
- Checks: Golden-Test, direkt betroffene CardSpec- und Hint-Validierungen,
  `git diff --check`.
- Done-Gate: keine pauschale Snapshot-Aktualisierung, semantischer Vertrag grün.
- Commit: `fix(ai): restore classic hint golden contract`

### TF-05 AI-Simulations-, Continuation- und Langläuferfehler

- Ziel: sechs nicht-checkpointbasierte AI-Fehler nach gemeinsamer Ursache
  beseitigen.
- Eingang: TF-04 abgeschlossen.
- Arbeit: Siren, R&D Express, Corporate Downsizing, All-Nighter, Proteus Hijack
  sowie Continuation-/Ownership-Pfade einzeln reproduzieren und clustern.
- Kernartefakte: betroffene sechs Testdateien und zuständige Planmodule.
- Checks: Einzelfälle, Owner-/Route-/Executor-Assertions und direkt angrenzende
  Simulationen, `git diff --check`.
- Done-Gate: alle sechs Tests grün, keine neue Entscheidungsautorität.
- Commit: `fix(ai): restore bounded simulation and plan continuations`

### TF-06 AI-Decision-Checkpoint-Cluster

- Ziel: 21 Checkpoint-Abweichungen in zwölf Suites nach belegten gemeinsamen
  Ursachen beheben.
- Eingang: TF-05 abgeschlossen.
- Arbeit: tatsächliche versus erwartete Action, Plan, Route und Evidenz je
  Cluster vergleichen; Plan-/Projektionursachen korrigieren oder nach
  nachgewiesenem Vertragswechsel einzelne Checkpoints präzise aktualisieren.
- Kernartefakte: betroffene Decision-Checkpoint-Suites, Fixtures und zuständige
  Corp-/Runner-Planmodule.
- Checks: betroffene zwölf Suites, relevante Owner-/Coverage-Tests,
  `git diff --check`.
- Done-Gate: 21 Tests grün; ursprüngliche strategische Intention je Checkpoint
  bleibt erhalten oder ein aktueller führender Vertrag ist explizit belegt.
- Commit: `fix(ai): restore decision checkpoint intentions`

### TF-07 Main-Abgleich, Abschlussprüfung und Integration

- Ziel: alle Pakete auf aktuellem `main` zusammenführen und lokal integrieren.
- Eingang: TF-01 bis TF-06 committed und Worktree sauber.
- Arbeit: aktuellen `main` in Arbeitsbranch mergen, Konflikte intentionswahrend
  lösen, nur durch neue Main-Änderungen betroffene Checks ergänzen, Prozessdatei
  entfernen, Branch nach `main` mergen und Cleanup verifizieren.
- Checks: alle direkt geänderten Testdateien/Verträge, `git diff --check`,
  `git status --short` auf Branch und `main`.
- Done-Gate: lokaler `main` enthält alle Paketcommits; Worktree-Pfad und
  Arbeitsbranch existieren nicht mehr.
- Commit: `docs: close test failure remediation process`

## Verifikationsregeln

- Pro Paket nur direkt änderungsnahe Tests plus unmittelbar berührte Verträge.
- AI-Testdateien erhalten ein äußeres Zeitfenster von mindestens 180 Sekunden.
- Ein fortsetzbarer Prozess wird weiterverfolgt und nicht wegen des ersten
  Yield-Zeitfensters neu gestartet.
- Vor jedem Paketcommit: `git diff --check` und sauber begrenztes Staging.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_TEST_FAILURE_REMEDIATION_20260825`
- Branch: `codex/test-failure-remediation-20260825`
- Integrationsbranch: lokaler `main`
- Hauptworkspace wird nur für den finalen Merge verwendet.
- Kein Push, kein Force-Push, kein `git reset --hard`.

## Controller-Prompt-Kern

`/Goal Arbeite Testfehler-Ursachenbehebung 2026-08-25 vollständig und
sequenziell von TF-00 bis TF-07 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main. Lies AGENTS.md, AGENTS.local.md, die Pflichtseiten der
Wissensbasis, dieses Prozessartefakt und vor AI-Patches den vollständigen
AI-Architektur-Preflight. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_TEST_FAILURE_REMEDIATION_20260825 auf Branch
codex/test-failure-remediation-20260825. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktiven Paket, führe fokussierte Checks
aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblockern.
Nach Abschluss integriere aktuellen main, prüfe direkt betroffene Pfade, merge
lokal nach main, entferne Worktree und Branch verifiziert und markiere das Goal
erst dann als complete.`

## Abschlusskriterien

- Alle 33 Baseline-Fehler sind ursachenorientiert adressiert und fokussiert grün.
- Ursprüngliche Test- und Änderungsintentionen sind erhalten.
- Jedes Paket besitzt einen eigenen sauberen Commit.
- Aktueller lokaler `main` enthält den abgeschlossenen Arbeitsbranch.
- Prozessartefakt, Worktree und Arbeitsbranch sind entfernt; beide
  Entfernungskontrollen sind grün.
