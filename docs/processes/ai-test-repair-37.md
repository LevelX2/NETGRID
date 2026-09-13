# AI-Testreparatur: 37 bekannte Fehler

## Status

Aktiver sequenzieller Paketprozess. Ausgangsbestand sind 37 fehlgeschlagene
AI-Assertions in 25 Testdateien. Die Liste wird nach jedem Paket mit dem
fokussierten Einzeltest aktualisiert.

## Gesamtziel

Alle 37 Fehler werden an ihrer erzeugenden Schicht behoben oder, wenn der
aktuelle Vertrag bereits korrekt ist, auf die fachliche Intention resilient
gebunden. Keine pauschalen Fallbacks, keine globale Abschwächung von
Assertions und keine neue Entscheidungsautorität.

## Arbeitsgrenzen

- Arbeits-Worktree: `C:\Projekte\NETGRID-ai-test-repair-37`
- Arbeitsbranch: `codex/ai-test-repair-37`
- Integration ausschließlich lokal nach `main`; kein Push ohne separaten
  Auftrag.
- Während der Diagnose ausschließlich der kleinste betroffene AI-Test.
- Änderungen an produktivem AI-Verhalten folgen dem Change-Compass, den
  Plan-/Owner-Verträgen und `packages/ai/AGENTS.md`.

## Bekannter Fehlerbestand

Die 37 Assertions verteilen sich auf folgende Ursachenfamilien:

1. Plan-first-Cutover-/Evidence-Erwartungen (7 in
   `semantic-ai-runtime-cutover-runner-plans.test.ts`, 1 in
   `selfplay-cycle-128-decision-checkpoints.test.ts`).
2. Runner-Reserve, Funding und Routenwahl (u. a.
   `runner-run-target-evaluation.test.ts`, `meta-433-path-costs.test.ts`,
   `meta-405-prepared-path-hazard.test.ts`,
   `plan-first-live-runtime-remote-contest-continuation.test.ts`).
3. Encounter-/Choice-/Action-Semantik und Ownerbindung (u. a.
   `match-e8047b3e-runner-remediation-decision-checkpoints.test.ts`,
   `meta-403-round5-ownership.test.ts`,
   `pairing-422-information-damage.test.ts`,
   `selfplay-177-security-purge-install-targets-decision-checkpoint.test.ts`).
4. Corp-/Runner-Checkpoint-Erwartungen für Economy, Defense, Draw und Score
   (die übrigen Match-/Selfplay-Dateien).
5. Ein langer deterministischer Replay-Gegenfall in
   `last-call-at-rd-choice-window-regressions.test.ts`.

Die konkrete Assertion, ihre aktuelle Ausgabe, der Owner und die Entscheidung
(Vertrag korrekt → Test resilient machen; Vertrag falsch → Code reparieren)
werden im Paketfortschritt ergänzt.

### Paketfortschritt

- Paket 1 (Plan-first-Metadaten/Cutover-Evidence): 7 Assertions geschlossen.
  Ursache war eine veraltete Testbindung an `P5` und
  `target:remote_1`; der aktuelle `runner.rig_and_coverage`-Vertrag liefert
  für das bekannte Remote-Projekt `P4` und
  `runner_known_remote_coverage_project:remote_1`. Aktionen, Fähigkeiten und
  Owner blieben unverändert. Der fokussierte Test ist mit 41/41 Tests grün.
- Verbleibend: 30 bekannte fehlgeschlagene Assertions.
- Paket 2 (Runner-Reserve, Choice-Bindungen und deterministische Simulation):
  13 Assertions geschlossen. Die Ursachen waren fehlende bekannte
  `installCost`-Fakten in einer Reserve-Fixture, eine korrekt geänderte
  Reserve-/Routenentscheidung, unvollständige Encounter-Subroutine- und
  Schadenssemantik, veraltete konkrete Card-/Action-Bindungen in zwei
  Checkpoints, eine inzwischen strengere Credit-Reserve im Hazard-Test, drei
  stale Plan-first-Erwartungen sowie ein zu breiter Replay-Filter. Beim
  Replay-Fall bleibt die fachliche Regression erhalten, indem nur das
  historische Mischfenster aus `Rigged Investments` und `Top Runners
  Conference` verboten wird; eine gleichartige `Rigged Investments`-Ordnung
  ist eine gültige Engine-Wahl. Alle fokussierten Einzeltests sind grün.
- Verbleibend: 17 bekannte fehlgeschlagene Assertions.
- Paket 3 (Corp-Economy-Evidence): 1 Assertion geschlossen. Die
  BBS-Fixture band den Economy-Owner zusätzlich an einen einzelnen
  Remote-/Schutzstatus, obwohl zwei aktuelle BBS-Rez-Kandidaten denselben
  gültigen Economy-Vertrag erfüllen. Der Checkpoint unterstützt dafür jetzt
  eine explizite OR-Menge zulässiger Assessment-Evidence; Aktion, Owner und
  Capability bleiben weiterhin fest gebunden. Der fokussierte e6aca-Test ist
  grün.
- Verbleibend: 16 bekannte fehlgeschlagene Assertions.
- Paket 4 (Defense-/Score-Checkpoint-Bindungen): 3 Assertions geschlossen.
  D153 erlaubte neben dem historischen Breaker-AP-Draw eine aktuell legale
  konkrete Central-Defense-Route. E676 verlangte veraltete
  Engine-Zertifizierungs-Evidence, obwohl der aktuelle Score-Owner korrekt
  eine offene Schutzanforderung meldet. Im Renticon-Matchpoint war R&D durch
  die bereits rezzte ICE-Schicht engine-zertifiziert bei 0 % Zugriff; eine
  weitere ICE wäre redundant und wurde deshalb als Economy-Fortschritt mit
  explizitem Overlayering-Verbot geprüft. Alle drei betroffenen Testdateien
  sind im fokussierten Lauf grün.
- Verbleibend: 13 bekannte fehlgeschlagene Assertions.
- Paket 5 (Restliche Replay-, Plan- und Choice-Bindungen): 12 Assertions
  geschlossen. Die Ursachen waren inkonsistente synthetische Encounter-Quotes,
  veraltete Plan-/Capability-/Evidence-Bindungen, eine fehlende ausführbare
  `gain-credits`-LegalAction in einer Corp-Fixture sowie Erwartungen, die eine
  bereits korrekt vom aktuellen Sicherheits- und Defense-Vertrag verdrängte
  Aktion weiter als zwingend behandelten. Die fachliche Absicht blieb jeweils
  erhalten: ETR-/Defense-Schutz, Score-Finanzierung, Central-Defense-Owner,
  nötige Breaker-Coverage und zulässige LegalActions bleiben explizit geprüft.
  Der zunächst auffällige D89-Fall in `match-41df` war kein Vertragsfehler:
  Der Einzeltest und die vollständige Testdatei sind grün; der Timeout trat nur
  im ressourcengeteilten breiten Verzeichnislauf unter paralleler Importlast
  auf. Es wurde deshalb weder ein globales Timeout erhöht noch eine Assertion
  abgeschwächt.
- Verbleibend: 0 bekannte fehlgeschlagene Assertions.
- Nachgelagerte Main-Prüfung (unabhängige Baseline): 2 stale Assertions
  ebenfalls geschlossen. `meta-434-r19` erwartete noch den alten Status
  `blocked_unbreakable`, obwohl der aktuelle, absichtlich eingeführte
  Funding-Vertrag `blocked_unpayable` bewahrt. Der D88-Checkpoint band eine
  einzelne Remote-ID zu eng, obwohl `Cinderella -> remote_2` dieselbe explizite
  Score-Schutzroute für die CFO-Kampagne erfüllt. Beide Einzeldateien sind
  grün; diese zwei Fälle wurden getrennt vom abgeschlossenen 37er-Paket
  behandelt.

## Paketfolge und Done-Gates

Jedes Paket bearbeitet eine klar abgegrenzte Ursachenfamilie. Innerhalb des
Pakets wird jede betroffene Assertion einzeln ausgeführt.

1. Plan-first-Metadaten und Cutover-Evidence: alle 8 Assertions fokussieren,
   Vertrag klären, minimal resilient aktualisieren oder Erzeuger reparieren.
2. Runner-Reserve/Funding/Remote-Routen: jede betroffene Assertion und ihre
   Kosten-/Reservequote einzeln verifizieren.
3. Encounter-/Choice-/Owner-Bindungen: Action, Plan, Step, Route,
   StateVersion und Choice-Payload einzeln nachweisen.
4. Corp- und Runner-Behavior-Checkpoints: nur die fachlich beabsichtigte
   Handlung/Disposition prüfen; historische absolute Aktionen entfernen,
   wenn sie nicht Vertrag sind.
5. Deterministischer Replay: den langen Einzeltest separat ausführen und die
   Abweichung an RNG-, StateHash- oder Erwartungsschicht beheben.
6. Restfehler: verbleibende Assertions einzeln schließen und einen gezielten
   AI-Teillauf der berührten Dateien ausführen.

Ein Paket ist erst abgeschlossen, wenn seine fokussierten Tests grün sind,
`git diff --check` grün ist und ein eigener Paketcommit vorliegt. Nach jedem
Paket wird die verbleibende Fehlerzahl im Prozessstatus und im Chat gemeldet.

## Verifikationsregeln

- Tests dürfen nur stabile Owner-, Capability-, LegalAction-, Choice- und
  Replay-Verträge festschreiben.
- Additive Diagnostik, Modulinstanz-IDs, Prioritätsbegründungen und stabile
  Planmetadaten werden nicht als unveränderliche Voll- oder Reihenfolgeliste
  getestet, sofern sie nicht ausdrücklich Vertragsbestandteil sind.
- Eine `missing_action_semantics`-Diagnose bleibt ein echter Fehler, bis die
  fehlende Semantik am Rules-/Plan-Vertrag behoben oder der Test auf die
  tatsächlich angebotene LegalAction-Bindung korrigiert ist.
- Kein Fallback, kein stilles Überspringen und kein Test-Timeout-Trick.

## Abschluss

Nach allen Paketen: direkt betroffene AI-Checks erneut, Arbeitsbranch sauber,
lokaler Fast-Forward-Merge nach `main`, Main-Prüfung, Worktree-Entfernung,
Branch-Löschung und erst danach Goal-Abschluss. Remote-Push bleibt außerhalb
dieses Prozesses.
