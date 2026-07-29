# KI-Zug- und Kampagnenplaner – Worktree-Paketprozess

Status: **ZK00 bis ZK05 abgeschlossen; ZK06 aktiv**

Stand: 2026-07-29

Quelle:

- `docs/architecture/ai/ai-turn-and-campaign-planner-concept-2026-07-29.md`;
- Nutzerfreigaben der dort in Version 0.4 festgeschriebenen
  Architekturentscheidungen;
- die Spielanalysen, die inkonsistente Einzelaktionen, fehlende
  Zentralverteidigung, verfrühten Abwurf und fehlende Plankontinuität belegt
  haben;
- `docs/architecture/ai/ai-plan-layer-target-state-wip.md`;
- der produktive Plan-first-Stand auf `main`.

## Zielprüfung

Der Endzustand ist hinreichend bestimmt und wird ohne weitere fachliche
Grundsatzfrage umgesetzt:

1. Vor der Aktionsauswahl bewertet ein Zugplaner vollständige, in sich
   stimmige Restzugvarianten bis Zugende oder bis zur ersten echten
   Informationsgrenze.
2. Fachmodule melden nicht autoritative Planning Heads. Der zentrale Planer
   vergleicht, kombiniert, verwirft und materialisiert sie unter aktuellen
   LegalActions.
3. Ein angenommener TurnPlan bleibt über erwartete Zustands- und Phasenwechsel
   erhalten. Abweichungen, Neustarts und echte Unsicherheit führen zu einer
   expliziten Neuplanung.
4. Mehrzügige Ziele bleiben als Kampagnen mit Meilensteinen, harten
   Verpflichtungen und neu quotierten Restwerten erhalten.
5. Agenda-, Defense- und Economy-Pläne können einen gemeinsamen Zug bilden.
   ICE-Installation und Rezzen bleiben Bestandteil des Defense-Plans und
   werden kontextuell bewertet; unrezzbares ICE ist weder pauschal verboten
   noch pauschal gut.
6. Opening Rush kann als reine Rushline, kombinierte
   Agenda-/Remote-ICE-/Central-ICE-Line oder sicherer Aufbau antreten. HQ und
   R&D dürfen nur ohne verletzte harte P1-/P2-Pflicht zeitweilig ungeschützt
   bleiben.
7. Jede Corp- und Runner-Aktion wird vor dem jeweiligen Cutover von einem
   fachlich zuständigen Modul und einem klassifizierten Planungshorizont
   abgedeckt.
8. Determinismus, Replay, StateHash, Hidden-Info-Schutz und
   LegalAction-Autorität bleiben vollständig erhalten.

Arbeitsbranch:
`codex/ai-turn-campaign-planner-rollout`

Arbeits-Worktree:
`C:\Projekte\NETGRID_AI_TURN_CAMPAIGN_PLANNER_ROLLOUT`

Ausgangs-`main`:
`9a30f2d84711cc8d113a8309d9bcdb9c23fb86c4`

## Gesamtziel

NETGRID erhält über der bestehenden Plan-first-Aktionsauswahl eine
deterministische Dirigentenschicht, die fachliche Planangebote zu einem
kohärenten Restzug ordnet, den gewählten Plan kontrolliert ausführt und
mehrzügige Kampagnen korrekt über Zuggrenzen hinweg fortschreibt. Der
produktive Cutover erfolgt erst nach vollständiger Seitenabdeckung,
Shadow-Vergleich und breiter Verifikation.

## Annahmen

- Die Rules Engine liefert weiterhin alle LegalActions, Kosten, Ziele,
  Choices, Zufallsrecords und Zustandsversionen.
- Die bestehende Plan-first-Runtime bleibt bis zum jeweiligen Cutover der
  produktive Fallback und Vergleichspunkt.
- Vorhandene Verträge wie `ActionDemand`, `ActionCapacityRoute`,
  Ressourcenledger und `CorpHandInventoryFacts` werden erweitert und nicht
  dupliziert.
- Konkrete bekannte Karteninstanzen dürfen in Plänen über
  `cardInstanceId` und ergänzend über Kartennamen beschrieben werden.
  Zukünftige `actionId`-Werte werden nie gespeichert.
- Unbekannte Information wird nicht simuliert. Draw, Zufall und materiell
  freie Gegnerentscheidungen bilden echte Boundaries.
- Gewichte, Frontgrößen, Suchbudgets und Zufallswahrscheinlichkeiten sind
  kalibrierbare Policywerte, keine offenen Architekturentscheidungen.

## Nicht-Ziele

- Keine zweite Rules Engine in der KI.
- Keine freie Aktionsheuristik außerhalb von Planmodulen.
- Keine verdeckten Runner- oder Corp-Daten in Plannerinput, Trace oder Replay.
- Keine Kartennamen-Sonderfälle als Ersatz für fachliche Modulverträge.
- Kein allgemeiner Beam Search, solange die vertikalen Schnitte und eine
  begrenzte deterministische Zwei-Schritt-Suche ausreichen.
- Keine Netzwerk-, Account-, Datenbank- oder Kartenregeländerung ohne
  nachgewiesene Notwendigkeit. Die vorhandene privilegierte private
  KI-Debuganzeige wird ausdrücklich um Zugplanung erweitert.
- Keine Rückwärtskompatibilität für veraltete interne Plannerartefakte.
- Kein Push, Pull Request oder Remote-Merge.

## Controller-Invarianten

- Engine-Autorität steht vor jeder KI-Entscheidung.
- Die Prioritätsordnung lautet:
  `Engine > gültiges hartes PlanCommitment > TurnPlanCommitment >
Persistence/Hysterese`.
- Genau eine Phase besitzt genau einen Root-Owner; Supportleaves bleiben
  innerhalb dieser Phase gebunden.
- Ein vollständiger TurnPlan darf mehrere geordnete Rootphasen enthalten.
- Jede konkrete Aktion wird unmittelbar vor Ausführung aus den aktuellen
  LegalActions rematerialisiert und erneut validiert.
- Erwartete Phasenübergänge bewahren die TurnPlan-Identität. Echte
  Informationsgrenzen, unerwartete Deltas, ungültige Verpflichtungen und
  Runtime-Neustarts lösen eine Neuplanung aus.
- Nach Runtime-Neustart wird kein altes TurnPlanCommitment fortgeführt.
  Harte PlanCommitments werden neu validiert, Kampagnen neu quotiert.
- Zentral vergleichbare Werte stammen ausschließlich aus einem versionierten
  Evaluation Registry. Modulinterne Fachwerte verlassen ihren Geltungsbereich
  nicht als scheinbar globale Utility.
- Campaign Value Claims besitzen Owner, Zeitfenster und Verbrauchsstatus.
  Zentralvalidierung verhindert Doppelzählung.
- Suche und Tie-Breaking verwenden deterministische Knoten-, Tiefen- und
  Branchbudgets, niemals Laufzeit oder `Math.random`.
- Zugelassene Line-Randomisierung verwendet ausschließlich den vorhandenen
  replay-stabilen KI-Zufallspfad und wird zustandsgebunden persistiert.
- `EndTurn` ist nur bei autoritativem Abschluss im realen aktuellen Zustand
  zulässig, niemals allein aufgrund einer hypothetischen Projektion.
- Ranking, Caches und Planner-IDs verwenden ausschließlich einen
  side-sicheren Planning-Fingerprint. Ein optionaler Engine-Freshness-Token
  darf keine Auswahl beeinflussen.
- Die privilegierte private Betreiber-Debuganzeige darf und soll beide
  vollständigen Kartenlagen zeigen. Diese Ausnahme erweitert keine normalen
  Spieler-, Replay-, WebSocket-, Reconnect-, Log- oder Fehlerflächen.

## Automatische Fehlerbehandlung

- Schlägt ein Paketcheck fehl, bleibt genau dieses Paket aktiv. Die Ursache
  wird eng behoben oder als echter Sicherheitsblocker dokumentiert.
- Historische Checkpoints unterscheiden Verhaltensfehler von Fixture-,
  Redaction-, Replay- und Runtime-Drift.
- Rote Zieltests dürfen nur zusammen mit ihrer kontrollierten Baseline
  committed werden und müssen im unmittelbar zuständigen Umsetzungspaket
  geschlossen werden.
- Eine nicht projektierbare Aktion endet fail-closed an der aktuellen
  Planungsgrenze; sie erhält keine erfundene Folgewirkung.
- Wird eine gespeicherte konkrete Referenz ungültig, wird der Plan verworfen
  und unter aktuellen IDs neu aufgebaut.
- Neue `main`-Änderungen werden vor Abschluss in den Arbeitsbranch integriert.
  Semantische Konflikte werden fachlich gelöst und vollständig nachgetestet.

## Sicherheitsblocker

Der Prozess stoppt ohne heuristischen Workaround, wenn:

- eine Entscheidung nur aus FullState oder verdeckten Gegnerdaten ableitbar
  wäre;
- eine Aktion nicht aus aktuellen LegalActions rematerialisiert werden kann;
- ein zukünftiger Action-Identifier oder eine hypothetische Engine-Wirkung
  gespeichert werden müsste;
- zwei Rootmodule dieselbe konkrete Phase autoritativ besitzen;
- ein harter PlanCommitment-Vertrag ohne erneute Legalitäts- und
  Zustandsprüfung ausgeführt werden müsste;
- Zufall nicht seed-, replay- und restartstabil erfasst werden kann;
- eine produktive Seite ohne vollständige Modul- und Horizontabdeckung
  umgeschaltet werden müsste.

## State Machine

`ZK00 Prozessvertrag → ZK01 Red-Evidence → ZK02 D5/Handinventar →`
`ZK03 Kernverträge → ZK04 Projektionskern → ZK05 Agenda-Vertikalschnitt →`
`ZK06 Defense/Economy → ZK07 Restzugsuche → ZK08 Commitment-Ausführung →`
`ZK09 Corp-Abdeckung → ZK10 Corp-Shadow → ZK10a Gegnerzugminimum →`
`ZK11 Corp-Cutover →`
`ZK12 Gegnerzug/Kampagnen → ZK13 Runner-Cutover →`
`ZK14 Gesamtverifikation/Integration`

Genau ein Paket ist aktiv. Kein Paket wird übersprungen. Jedes abgeschlossene
Paket besitzt einen eigenen Commit.

## Paketfolge

### ZK00 – Reviewabschluss und Zielvertrag

Ziel:
Freigegebenes Konzept, Invarianten, Paketfolge, Goal und Integrationsregeln
als ausführbaren Controllervertrag fixieren.

Kernartefakt:

- dieses Prozessdokument.

Checks:

- sauberer und isolierter Arbeits-Worktree;
- `git diff --check`;
- Vollständigkeit gegen Konzeptabschnitte 22 bis 29.

Done-Gate:
Prozessartefakt ist committed und ZK01 als einziges Paket aktiv.

Commit:
`docs(ai): plan turn and campaign planner rollout`

### ZK01 – Historische Red-Evidence und Ausgangsbaseline

Ziel:
Die beobachteten inkohärenten Corp-Züge und die aktuelle Testsituation
reproduzierbar sichern, bevor Produktionsverhalten geändert wird.

Konkrete Arbeit:

- Checkpoints für frühe Zentralverteidigung, externes Installieren plus
  Abwurf, D3/D4 sowie D5/Handkapazität sichern;
- jeden KI-Schritt aus LegalActions, PlayerView, Planangeboten und
  Auswahltrace prüfbar machen;
- aktuelle AI-Gates als Ausgangsbaseline klassifizieren;
- grüne Gegenproben für zulässigen Rush und kontextuell sinnvolle
  unrezzbare ICE-Installation erhalten.

Checks:

- fokussierte Checkpoint- und Scheduler-Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Done-Gate:
Zielabweichungen und erlaubte Gegenfälle sind getrennt und reproduzierbar.

Commit:
`test(ai): capture turn coherence planning gaps`

### ZK02 – Lokaler D5-Fix und Handinventar-Härtung

Ziel:
Den bereits lokal eingrenzbaren Handkapazitätsfehler beseitigen und das
vorhandene Handinventar als planwirksame, zugabschlussfähige Quelle härten.

Konkrete Arbeit:

- `CorpHandInventoryFacts` um planrelevante Belegungs-, Verbrauchs- und
  Cleanup-Projektionen ergänzen;
- Abwurf nur nach Vergleich mit nutzbaren Restzuglinien zulassen;
- vorhandene Handrouten und Dispositionen wiederverwenden;
- keinen parallelen Handscanner einführen.

Checks:

- D5-Checkpoint;
- Draw-/Discard-/Overflow-Tests;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Ein vermeidbarer Abwurf verliert gegen eine legale bessere Restzuglinie.

Commit:
`fix(ai): harden plan effective corp hand capacity`

### ZK03 – Kernverträge und Planning Heads

Ziel:
Die typisierten, side-sicheren Plannerverträge ohne produktiven Cutover
bereitstellen.

Konkrete Arbeit:

- `PlanningRulesContext` mit Rules-/Format-/Policy-Fingerprint;
- `PlanningStateIdentity` ausschließlich aus side-sicherem AI-Input;
- `PlanTargetRef`, kanonische Invocations und `ChoicePlanningRole`;
- getrennte aktuelle `CurrentLegalActionBinding`; keine zukünftige
  `actionId`;
- `TurnPlanningHead`, ausführbarer Witness, Horizonklassifikation und
  Multi-Phase-TurnPlan;
- Phase Entry, Completion, Transition, Cursor und exakte
  Need-/Assignment-Bindung;
- nur residente oder admission-geprüfte spätere Rootphasen;
- line-prefix-gebundene Campaign Value Claims samt Ownership und
  Aggregationsmodus;
- getrennte P1–P3-Obligations und versioniertes P4–P6-Evaluation Registry;
- zentrale Validatoren für Ziele, Choices, Owner, Werte und Pflichten.

Checks:

- Contract-/Serialization-/Redaction-Tests;
- Hidden-Äquivalenz-, Prefix-Quote-, Phase- und Need-Binding-Tests;
- Source-Structure-Gate;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Alle neuen Verträge sind deterministisch, side-sicher und zentral validiert.

Commit:
`feat(ai): add turn planning contracts`

### ZK04 – Projektionskern, Boundaries und Minimaltrace

Ziel:
Bekannte Aktionsfolgen bis Zugende oder zur ersten echten Unsicherheit
deterministisch projizieren.

Konkrete Arbeit:

- immutable Projektionszustände für Klicks, Credits, Hand, Zonen,
  installierte Karten, Advancement und Planstatus;
- bekannte Phasenübergänge ohne Vollreplan;
- Draw, Zufall und materielle Gegnerwahl als Boundary;
- eng begrenzter abstrakter Restwert hinter einer Boundary, ohne konkrete
  Recourse-Phase;
- planwirksame Cleanup-Projektion;
- vollständige Klassifikation jeder Handkarteninstanz vor Cleanup;
- kompakter Trace für Angebot, Prunegrund, Bewertung und Boundary;
- erstes In-Game-Debug-DTO und Darstellung von Linie, Phasen, Roots,
  Supportbindung und Boundary in der privilegierten KI-Debuganzeige.

Checks:

- Projection- und Boundary-Tests;
- Determinismus-/Replay-Gegenproben;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Nur engine-zertifizierte bekannte Wirkungen werden fortgeschrieben.

Commit:
`feat(ai): add deterministic turn projection core`

### ZK05 – Agenda-Vertikalschnitt

Ziel:
Agenda- und Opening-Rush-Linien vor einer allgemeinen Suche vollständig als
Turn- und Kampagnenvarianten abbilden.

Konkrete Arbeit:

- reine Rushline;
- kombinierte Agenda-, Remote-ICE- und Central-ICE-Line;
- sichere Aufbauline;
- mehrzügige Agenda-Meilensteine und harte Fortsetzungsverpflichtungen;
- einmalige replay-stabile Rush-vs.-Non-Rush-Wahl bei Zulässigkeit und
  fehlender klarer Dominanz;
- Opportunity-, Regret-, Worst-Case- und Persistenzvertrag;
- getrennte Engine-RNG-Domäne für Planwahl und Game Effects.

Checks:

- Agenda-/Opening-Rush-Modultests;
- kombinierte Sequenz- und Gegenfalltests;
- Restart-/RNG-Replaytests;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Agendaangebote können vollständige, korrekt begrenzte Linien liefern.

Commit:
`feat(ai): plan agenda and opening rush lines`

### ZK06 – Defense-/Economy-Vertikalschnitt D3–D4

Ziel:
Zentralverteidigung und Finanzierung als gebundene Phasen einer kohärenten
Restzuglinie anbieten.

Konkrete Arbeit:

- Defense Heads für HQ, R&D, Remote und Rezzen;
- kontextuelle Bewertung unrezzbarer ICE-Installation als Vorbereitung,
  Tempoeinsatz oder Bluff;
- keine Sonderroute außerhalb des Defense-Plans;
- Economy Heads für exakte Finanzierung und Restzugfähigkeit;
- D3/D4-Checkpoints und zulässige Rush-Ausnahmen.

Checks:

- Defense-/Economy-Modultests;
- historische D3/D4-Checkpoints;
- ICE-Install-/Rez-/Bluff-Gegenproben;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Fehlende Zentralverteidigung verliert, sofern keine höherwertige zulässige
Gesamtlinie sie bewusst aufschiebt.

Commit:
`feat(ai): plan coherent corp defense and economy phases`

### ZK07 – Deterministische allgemeine Restzugsuche

Ziel:
Planning Heads zu vollständigen Restzugkandidaten kombinieren und zentral
vergleichen.

Konkrete Arbeit:

- begrenzte deterministische Zwei-Schritt-Suche als Ausgangspunkt;
- typisiertes Action-Capacity-Ledger einschließlich Aktionsgewinn und
  beschränkter Aktionen;
- kanonische Zusammenfassung beweisbar kommutativer Reihenfolgen;
- geschützte nicht dominierte Vertreter je `Root × next milestone`;
- faire Mindestexpansion je
  `Obligation-Signatur × Root × next milestone`;
- konservativ abgeschlossene Ausgangslinie je geschützter Partition;
- kleine Paretofronten, Upper Bounds und nachvollziehbare Prunegründe;
- Beam Search nur bei messbar nachgewiesener Notwendigkeit.

Checks:

- Search-/Capacity-/Canonicalization-/Pareto-Tests;
- symmetrische und abhängige Reihenfolgen;
- Root-Enumerationsreihenfolge, Partition-Starvation und
  Budget-Completeness;
- deterministische Budgetgrenzen;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Der beste zulässige Restzug wird reproduzierbar ausgewählt, ohne einen
viablen Root vorschnell wegzuprunen.

Commit:
`feat(ai): search deterministic remainder turn plans`

### ZK08 – Commitment-Ausführung, Phasenwechsel und Replan

Ziel:
Gewählte Pläne über erwartete Aktionen und Phasen stabil, aber nicht blind
ausführen.

Konkrete Arbeit:

- `TurnPlanCommitment` mit Plan-, Phasen-, Knoten- und Erwartungsidentität;
- Rematerialisierung jeder Aktion aus aktuellen LegalActions;
- erwartete Fortschreibung ohne Vollreplan;
- Replan bei Boundary, Abweichung, Ungültigkeit und Neustart;
- Neuvalidierung harter PlanCommitments und Kampagnen-Neuquote;
- autoritatives EndTurn-Zertifikat im realen Zustand.
- Commitment-Cursor, Phase-Entry-Validierung und Replangründe in der
  privilegierten KI-Debuganzeige.

Checks:

- Commitment-/Restart-/Invalidation-/EndTurn-Tests;
- unerwartete Kosten-, Choice- und Zieländerung;
- Replay-/StateHash- und Planning-Fingerprint-Gegenproben;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Planpersistenz und Neuplanung folgen exakt den freigegebenen Grenzen.

Commit:
`feat(ai): execute committed turn plans safely`

### ZK09 – Vollständige Corp-Planabdeckung

Ziel:
Alle produktiv erreichbaren Corp-Aktionsfamilien besitzen Domainowner und
Horizonklassifikation.

Konkrete Arbeit:

- Coverage-Report über LegalActions und Planmodule;
- `current_turn_only`, `campaign_capable` oder `context_dependent` je Modul;
- konkrete mehrzügige Instanzen liefern Campaign Quotes;
- verbleibende Support-, Ability-, Trace-, Trash- und Sonderaktionen
  einordnen;
- keine generischen Produktivfallbacks.

Checks:

- Corp-Coverage-Gate;
- Modul-/Ability-/Choice-Gegenproben;
- Source-Structure und Typecheck;
- `git diff --check`.

Done-Gate:
Corp erreicht 100 Prozent klassifizierte produktive Planabdeckung.

Commit:
`feat(ai): complete corp turn planning coverage`

### ZK10 – Corp-Shadow und Kalibriervergleich

Ziel:
Neuen Dirigenten gegen die produktive Plan-first-Auswahl messen, ohne
Spielverhalten umzuschalten.

Konkrete Arbeit:

- Shadow-Ausführung mit identischem side-sicheren Input;
- Vergleich von Aktionswahl, Planlänge, Boundaries, Defense-, Hand- und
  Campaign-Kohärenz;
- Policykalibrierung für Frontgrößen, Budgets, Gewichte und
  Zufallswahrscheinlichkeiten;
- In-Game-Vergleich von produktiver Auswahl und Shadow-TurnPlan;
- keine Architekturänderung durch bloße Messabweichung.

Checks:

- historische Checkpoints;
- Behavior Baseline;
- Determinismus über Wiederholung und Neustart;
- AI-Gates;
- `git diff --check`.

Done-Gate:
Alle Differenzen sind erklärt, akzeptiert oder durch eng belegte Korrekturen
geschlossen.

Commit:
`test(ai): calibrate corp turn planner shadow`

### ZK10a – Minimale Gegnerzug- und Kampagnenpersistenz

Ziel:
Agenda-, Defense- und Opening-Rush-Kampagnen bereits vor dem Corp-Cutover
über den Gegnerzug korrekt warten, fortsetzen, blockieren oder beenden.

Konkrete Arbeit:

- `awaiting_opponent_outcome`;
- öffentliche Event-Rückführung für Run, Rez, Trace, Access, Trash und
  Remote-Kompromittierung;
- nächste-eigene-Zug-Requote;
- Kampagnenstatus in der privilegierten KI-Debuganzeige.

Checks:

- Opponent-turn-/Campaign-/Opening-Rush-Tests;
- Restart-, Replay- und öffentliche Outcome-Gegenproben;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Der Corp-Cutover hängt nicht von einer noch fehlenden minimalen
Gegnerzugfortsetzung ab.

Commit:
`feat(ai): persist corp campaigns through opponent turns`

### ZK11 – Kontrollierter Corp-Cutover

Ziel:
Den neuen TurnPlanner als alleinige produktive Corp-Auswahl aktivieren.

Konkrete Arbeit:

- Umschaltung erst nach ZK09, ZK10 und ZK10a;
- alte Einzelaktionsauswahl nur als testbarer Vergleichscode, nicht als
  stiller Runtime-Fallback;
- Telemetrie/Trace für Planannahme, Fortschritt, Replan und Abschluss;
- Fehlerpfade fail-closed.

Checks:

- gesamte Corp-Modul- und Runtime-Suite;
- Behavior Baseline;
- Readiness- und Source-Structure-Gates;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Jede produktive Corp-Aktion läuft über einen validierten TurnPlan.

Commit:
`feat(ai): cut over corp to committed turn planning`

### ZK12 – Weitergehende Gegnerzug- und Interruptlogik

Ziel:
Komplexere Gegnerreaktionen und weitere Kampagnenphasen auf dem bereits vor
Cutover gesicherten Minimum ergänzen.

Konkrete Arbeit:

- mehrere überlappende Outcome- und Interruptfolgen;
- komplexe Rez-/Trace-/Prevention-/Ambush-Reaktionen;
- erweiterte Pause-/Resume-, Deadline- und Value-Claim-Übergänge;
- Agenda-, Defense- und Economy-Folgemeilensteine jenseits des Minimums.

Checks:

- Opponent-turn-/Campaign-/Restart-Tests;
- Claim-Doppelzählungs- und Hidden-Info-Gegenproben;
- Replay-/StateHash-Checks;
- AI-Typecheck;
- `git diff --check`.

Done-Gate:
Mehrzügige Pläne bleiben erklärbar, aktuell bewertet und side-sicher.

Commit:
`feat(ai): persist campaign planning across turns`

### ZK13 – Runner-Vertikalschnitte und eigener Cutover

Ziel:
Runner mit denselben Architekturverträgen, aber eigenen Domainmodulen
vollständig auf den TurnPlanner umstellen.

Konkrete Arbeit:

- Economy-, Draw/Install-, Run-, Breaker- und Multiaccess-Vertikalschnitte;
- Runner-spezifische Boundaries, Choices und Kampagnen;
- vollständige Modul- und Horizonabdeckung;
- Shadow, Kalibrierung und kontrollierter Cutover analog Corp.

Checks:

- Runner-Modul-/Runtime-/Coverage-Suite;
- Behavior Baseline;
- Readiness-, Source-Structure- und Typecheck-Gates;
- `git diff --check`.

Done-Gate:
Jede produktive Runner-Aktion läuft über einen validierten TurnPlan.

Commit:
`feat(ai): cut over runner to committed turn planning`

### ZK14 – Breite Verifikation, Wissenspflege und Integration

Ziel:
Gesamtsystem verifizieren, führende Dokumentation aktualisieren und den
Arbeitsbranch sauber lokal integrieren.

Konkrete Arbeit:

- vollständige Testmatrix aus Konzeptabschnitt 23;
- alle verbindlichen AI-Gates;
- Architektur-, Status-, Runbook- und Wissenspflege;
- Review auf Engine-Autorität, Hidden Info, Determinismus, Ownership und
  Cutovervollständigkeit;
- aktuelles `main` integrieren, Abschlusschecks wiederholen und fast-forward
  nach lokalem `main`;
- Worktree entfernen und gemergten Arbeitsbranch löschen.

Checks:

- `corepack pnpm check:ai`;
- `corepack pnpm check:ai-source-structure`;
- `corepack pnpm check:proteus-ai-readiness`;
- `corepack pnpm check:ai-deck-doctrine-strategy`;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `corepack pnpm test:ai:shards`;
- `git diff --check`;
- sauberer Git-Status.

Done-Gate:
Alle neuen und bestehenden relevanten Gates sind grün oder eine bereits auf
dem Ausgangs-`main` reproduzierte Fremdbaseline ist präzise ausgewiesen.
`main` enthält den geprüften Stand; Worktree und Branch existieren nicht mehr.

Commit:
`docs(ai): finalize turn and campaign planner rollout`

## Verifikationsregeln

- Jedes Paket führt mindestens fokussierte Tests, Typecheck soweit
  Codeverträge betroffen sind, `git diff --check` und Statusprüfung aus.
- Ein Paketcommit enthält nur die Arbeit seines Pakets plus den aktualisierten
  Paketstatus dieses Dokuments.
- Bekannte Ausgangsfehler werden vor der ersten Änderung mit genauer
  Testdatei und Ergebnis erfasst. Neue Fehler dürfen nicht als Baseline
  deklariert werden.
- Determinismustests wiederholen identische Seeds und Inputs und vergleichen
  Plan, Trace, Zufallsrecord und ausgeführte Actionfolge.
- Hidden-Info-Tests prüfen Plannerinput, Plannerpersistenz, redigierte
  Traces, Fehlerpfade und öffentliche Replaypayloads. Die ausdrücklich
  privilegierte private Betreiber-Debuganzeige bleibt davon ausgenommen und
  wird separat darauf geprüft, beide vollständigen Kartenlagen plus
  Zugplanung korrekt anzuzeigen.
- Cutovertests beweisen ausdrücklich, dass kein stiller alter Aktionsselektor
  mehr produktiv einspringt.

## Git-Regeln

- Alle Änderungen erfolgen ausschließlich im angegebenen Worktree.
- Genau ein Commit pro abgeschlossenem Paket; kein Squash während der
  Paketfolge.
- Keine fremden Änderungen aus anderen Worktrees übernehmen.
- Vor Integration wird aktuelles lokales `main` in den Arbeitsbranch
  integriert und vollständig geprüft.
- Integration nach `main` erfolgt bevorzugt per Fast-forward.
- Nach erfolgreicher Main-Verifikation wird exakt
  `C:\Projekte\NETGRID_AI_TURN_CAMPAIGN_PLANNER_ROLLOUT` entfernt.
- Die Entfernung gilt erst als verifiziert, wenn `git worktree list` den Pfad
  nicht mehr enthält und `Test-Path -LiteralPath` `False` liefert.
- Der vollständig gemergte Branch wird anschließend mit `git branch -d`
  gelöscht.
- Kein Remotezugriff, Push oder Pull Request ohne neue Nutzeranweisung.

## Controller-Prompt

Arbeite genau das aktuell als **aktiv** markierte Paket ab. Lies vor jeder
Änderung Ziel, Invarianten, konkrete Arbeit, Checks und Done-Gate dieses
Pakets. Erweitere den Scope nicht still. Führe die Paketchecks aus, prüfe den
Diff, aktualisiere dieses Dokument auf **abgeschlossen** und markiere genau
das nächste Paket als **aktiv**. Committe erst dann mit der festgelegten
Commitbotschaft. Bei Fehlern bleibt das Paket aktiv. Nach ZK14 integriere und
bereinige exakt nach den Git-Regeln.

## Abschlussbedingungen

Der Gesamtprozess ist nur abgeschlossen, wenn:

1. ZK00 bis ZK14 einschließlich ZK10a jeweils mit eigenem Commit
   abgeschlossen sind;
2. Corp und Runner vollständig über den TurnPlanner laufen;
3. Kampagnen, Restzugphasen, Boundaries, Neustart und EndTurn geprüft sind;
4. Engine-Autorität, Hidden-Info-Schutz, deterministisches Replay und
   StateHash unverändert gelten;
5. die führende Wissensbasis und Architekturübersicht den neuen Stand nennen;
6. der geprüfte Branch lokal in `main` integriert ist;
7. Main-Verifikation erfolgreich ist;
8. Worktree und gemergter Arbeitsbranch verifiziert entfernt sind;
9. das explizite Goal erst danach als `complete` markiert wird.

## Ausführungsjournal

### ZK00 – abgeschlossen

- Commit: `0696d7b01`
- Der isolierte Worktree und der vollständige Controllervertrag wurden auf
  Basis von `main` bei `9a30f2d84` angelegt.

### ZK01 – abgeschlossen

- Match `match_9b60842fe75c0b39`: 7/7 KI-Decisions klassifiziert,
  0 fehlende oder verwaiste Traces.
- D4 und D5 sind auf aktuellem Code bereits fachlich grün und werden als
  historische Checkpoints konserviert.
- Der weiterhin problematische generische Last-Click-Overflow-Vertrag ist als
  erwarteter roter Unit-Vertrag isoliert.
- Fokussierter Lauf: 20 grün, 1 erwarteter roter Vertrag.
- AI-Typecheck: grün.
- `check:ai`: grün.
- Ausgangsbaseline `test:ai:shards`: 520 Testdateien grün,
  4250 Tests grün und genau 1 erwarteter roter ZK01-Vertrag.

### ZK02 – abgeschlossen

- Nicht dringende Scorematerial-Draws werden blockiert, wenn sie ohne exakte
  Same-Turn-Verbrauchsroute zusätzlichen Cleanup-Discard erzeugen.
- Begrenzte Central-Defense-Suche und explizit zertifizierte
  Score-Defense-Ersatzsuche bleiben zugelassen.
- `CorpHandInventoryFacts` v2 ist jetzt ein planwirksamer Input mit
  expliziter Cleanup-Projektion statt rein diagnostischer Ausgabe.
- Historische D4-/D5-Checkpoints, F809-ICE-Staging und Accounts-Konversion
  bleiben grün.
- Fokussierter Lauf: 25/25 grün; AI-Typecheck grün.

### ZK02 – enger Regressionsnachtrag

- Commit: `93b272cce`
- Die breite Baseline zeigte zwei zu stark blockierte, exakt gebundene
  Scorematerial-Support-Draws bei vollem HQ und noch einer möglichen
  Folgeaktion.
- Ein einzelner Draw bleibt hierfür zulässig, wenn genau eine Folgeaktion
  verbleibt; der unerwünschte letzte Klick mit sicherem Cleanup-Overflow
  bleibt blockiert.
- Gezielter Lauf: 12 grün, 159 nicht betroffene Tests gefiltert;
  AI-Typecheck grün.

### ZK03 – abgeschlossen

- `PlanningRulesContext` bindet Rules-, Format-, Action-Semantik-,
  Modulset-, Evaluation- und Kampagnenwert-Policyversionen.
- `PlanningStateIdentity` entsteht ausschließlich aus dem side-sicheren
  AI-Input; vollständige Engine-StateHashes beeinflussen weder Planner-IDs
  noch Ranking oder Cache.
- Kanonische zukünftige Invocations enthalten konkrete Targets und Choices,
  aber keine `actionId`; nur der aktuelle Head trägt eine getrennte
  `CurrentLegalActionBinding` und einen ausführbaren Witness.
- Mehrphasige TurnPlans besitzen Root-Provenienz, Entry-, Completion-,
  Transition-, Need-/Assignment- und Cursorverträge.
- Kampagnenclaims sind line-prefix-gebunden und tragen eine zentrale
  Aggregationsart; P1–P3 sind von P4–P6-Linienwerten getrennt.
- Das zweite externe Review wurde kritisch in Konzept, Zielvertrag und
  Paketprozess integriert. Hypothetische Planinstanzen und ein vorgezogener
  Universal-Beam-Kernel bleiben ausdrücklich außerhalb von V1.
- Die verbindliche Projektausnahme ist in `apps/web/AGENTS.md` und im
  Wissenslog festgehalten: Die privilegierte private KI-Debuganzeige zeigt
  vollständige Karten beider Seiten und die gesamte Zugplanung.
- Fokussierte Vertrags-/Inputtests: 15/15 grün.
- Vollständige AI-Baseline: 521 Testdateien und 4265 Tests grün.
- AI-Typecheck, `check:ai` und `git diff --check`: grün.

### ZK04 – abgeschlossen

- `ProjectedDecisionFrame` bildet den bekannten Zustand unveränderlich und
  fingerprint-stabil für Klicks, Credits, Hand, bekannte Zonen, Board,
  Serverposturen, Reservierungen, Planfortschritt und Cleanup ab.
- Nur aktuell gebundene, engine-legale und semantisch zertifizierte Deltas
  dürfen einen Projektionsframe fortschreiben; ein falscher Basisframe wird
  fail-closed abgewiesen.
- Private Beobachtung, öffentlicher Zufall, Gegnerreaktion und noch nicht
  unterstützte Projektion sind explizite Boundaries. Hinter einer Boundary
  wird nur begrenzte Optionalität bewertet, keine konkrete Zukunftsaktion
  erfunden.
- `CorpHandInventoryFacts` v3 klassifiziert jede eigene HQ-Instanz; unbekannte
  oder nicht auflösbare Karten bleiben ausdrücklich `assessment_unknown`.
- Der Plan-first-Debugvertrag transportiert den aktuellen Head, eine
  Projektionslinie, Phase, Root, Supportbindung, Cursor, Stopgrund und
  Boundary-Restwert.
- Die privilegierte private In-Game-Buganzeige zeigt nun ausdrücklich die
  vollständigen Karten von Korp und Runner sowie die aktuelle Zugplanung.
  Normale AI-Preview-, Event-, Replay-, Log- und Fehlerpfade erhalten dieses
  Feld nicht.
- Projektionstests einschließlich deterministischer Wiederholung: 7/7 grün;
  Handklassifikation: 4/4 grün.
- Vollständige AI-Suite: 522 Testdateien und 4272 Tests grün.
- Shared Contract/Sanitizer: 16/16 grün; Multiplayer: 148/148 grün;
  Web-Debugexport: 1/1 grün.
- AI-, Shared-, Server- und Web-Typecheck sowie `git diff --check`: grün.

### ZK05 – abgeschlossen

- `corp.score_agenda` erzeugt für eine konkrete frühe Agenda-Opportunity
  deterministisch drei getrennte Linienfamilien: reiner Rush, kombinierter
  Agenda-/Remote-ICE-/Central-ICE-Rush und sicherer Central-/Economy-Aufbau.
- Aktuelle Heads bleiben an konkrete LegalActions gebunden; spätere
  Agendaschritte verwenden kanonische Invocations ohne zukünftige
  `actionId`.
- Agenda-Root, Defense-Leaf und Economy-Support besitzen getrennte
  line-prefix-gebundene Claims. Agendaertrag wird nicht durch Schutz- oder
  Liquiditätsbeiträge doppelt gezählt.
- Agendaexposition, Schutz, Liquidität, Kontinuität, Expected Value und
  Worst-Case-Floor werden gemeinsam verglichen; Dominanz und das begrenzte
  Regret-Band entscheiden vor jeder Zufallsauswahl.
- Kampagnen unterscheiden Fortsetzung, Warten über den Gegnerzug,
  blockierte Neuplanung und tatsächliche Objective-Invalidierung. Ein
  normaler Zugwechsel verwirft die Agenda-Kampagne nicht.
- Eine zulässige Rush-/Nicht-Rush-Mischung läuft atomar über den neuen
  Engine-Command `engine_randomized_turn_plan_selection`. Der eigene
  `aiTurnPlanRandomCounter` samt Record-Stream ist von Game-Effect-RNG
  getrennt; Quote, LegalActions, Gewichte und Opportunity werden vor
  Ausführung neu validiert.
- Der Engine-Command und sein privates Receipt sind replaybar und erreichen
  denselben StateHash. Der normale `randomCounter` und dessen Records bleiben
  unverändert.
- Die private Buganzeige zeigt Familien, Opportunity, Auswahlgrund,
  Zulässigkeit der Mischentscheidung, Agenda-/Defense-/Economy-Werte,
  Risiko und Worst Case; beide vollständigen Kartenlagen bleiben sichtbar.
- Fokussiert: Agenda/Opening Rush 7/7, Engine-RNG 5/5, Shared 16/16,
  Multiplayer 148/148 und Web-Debugexport 1/1 grün.
- Vollständige AI-Suite: 523 Testdateien und 4277 Tests grün; vollständige
  Engine-Suite: 210 Testdateien und 1821 Tests grün.
- AI-, Engine-, Shared-, Server- und Web-Typecheck sowie `git diff --check`:
  grün.
