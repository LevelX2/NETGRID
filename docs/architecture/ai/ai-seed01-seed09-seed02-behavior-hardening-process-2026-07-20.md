# KI-Verhalten für Seed 01, Seed 09 und Seed 02 härten

Status: in Umsetzung

## Quelle und Zielprüfung

Quelle ist die freigegebene Detailanalyse der drei Partien aus dem Slot
`strategy_panel_net_damage_black_ice` der AI Behavior Baseline v1 am Stand
`de15e599f`. Die Vorgabe ist für eine direkte Umsetzung ausreichend präzise.

Seed 01 und Seed 09 zeigen denselben Projektionsfehler: Die aktivierte
Fähigkeit von R&D-Protocol Files startet regeltechnisch einen Run, wird in der
KI aber nicht als konkreter Run-Produzent mit Ziel, Route und Payoff gebunden.
Seed 02 zeigt zwei unabhängige Corp-Fehler: Ein erst nach dem Scoren aktiver
Agendaeffekt wird als sofortige Remote-Verteidigung konsumiert, und eine
taktische Scoreline bleibt aktiv, obwohl die strategische Feasibility sie
bereits als unerreichbar klassifiziert.

## Gesamtziel

Alle Run-produzierenden Aktionen verwenden vor der Auswahl dieselbe
side-sichere Erreichbarkeits-, Kosten-, Payoff- und Commitment-Prüfung. Der
Top-5-Blick von R&D-Protocol Files wird als geordnete R&D-Kenntnis gespeichert
und bei Draw, Access, Shuffle und Reorder korrekt fortgeschrieben oder
invalidiert. Karteneffekte zählen nur in ihrem tatsächlichen Aktivzustand.
Strategie, Board-Triage, Tactical Plans und Plan Memory verwenden dieselbe
Punkt- und Deadline-Feasibility und wechseln bei unerreichbarer Scoreline auf
eine noch produktive Siegroute.

## Annahmen

- Die Engine bleibt einzige Regelautorität; die KI wählt ausschließlich
  LegalActions.
- Run-Metadaten und private R&D-Kenntnis werden nur in der jeweils zulässigen
  Runner-PlayerView beziehungsweise im side-sicheren PublicEvent geführt.
- Bekannte geordnete R&D-Karten dürfen nach einem öffentlichen Corp-Draw
  positionsgenau weitergeführt werden. Shuffle, Reorder oder nicht
  positionssicher auflösbare Zonenänderungen invalidieren die Reihenfolge.
- Ein Access-Replacement-Run besitzt einen eigenen Payoff. Fehlender normaler
  Access ist deshalb kein pauschaler Blocker; der erfolgreiche Ersatz-Payoff
  muss jedoch erreichbar sein.
- Bypass, ICE-Überspringen, Umleitung, Trace, Break/Pump und andere zulässige
  Routenalternativen werden von der vorhandenen gemeinsamen Routenquote
  bewertet und nicht kartenspezifisch nachgebaut.
- Eine mathematisch unerreichbare Agenda-Siegroute schließt nützliche
  Agendaeffekte oder Agenda-Köder in einer expliziten Damage-/Ambush-Linie
  nicht automatisch aus.

## Nicht-Ziele

- kein Sonderfall nach Kartenname oder Action-Label;
- kein pauschales Verbot von Scout-, Access-Replacement- oder Unknown-ICE-Runs;
- kein global aggressiveres Agenda-Spiel ohne Punkt- oder Deadline-Nachweis;
- keine FullState- oder Hidden-Info-Abkürzung;
- keine Änderung an Kartentexten oder Engine-Legalität;
- kein Push und keine Remote-Integration.

## Controller-Invarianten

1. Eine Aktion, die unmittelbar einen Run startet, besitzt ein konkretes
   Run-Ziel oder einen expliziten noch offenen Ziel-Choice-Vertrag.
2. Vor Arbitration existieren für den Run eine `RunnerRunTargetEvaluation`,
   eine `RunnerRunReleaseDecision` und ein erzeugbarer Run-Commitment.
3. `no_access` beziehungsweise ein nicht erreichbarer erfolgreicher
   Access-Replacement-Payoff kann durch Plan- oder Card-Ability-Boni nicht
   wieder freigegeben werden.
4. Der Run-Pfad berücksichtigt alle projektierten Bypass-, Skip-, Trace-,
   Break-, Pump-, Redirect- und Accept-Alternativen.
5. Geordnete R&D-Kenntnis bleibt positionsgebunden. Ein bekannter Draw schiebt
   die verbleibende Sequenz um genau eine Position und überführt die gezogene
   Karte in die sichere HQ-Kenntnis.
6. Ein Effekt darf einen Plan nur unterstützen, wenn seine Aktivbedingung nach
   der projektierten Aktion erfüllt ist.
7. `scoreline_unreachable` ist über alle Strategie- und Planungsschichten
   verbindlich und invalidiert widersprechende Scoreline-Pläne.
8. Deadline-Economy oder zusätzlicher Schutz ist nur zulässig, wenn er vor dem
   Verlustfenster in eine konkrete Siegroute konvertiert werden kann.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Der Prozess stoppt bei benötigten verdeckten Gegnerinformationen, einer
Auswahl außerhalb der LegalActions, einem nicht side-sicheren Event oder
einer erforderlichen Änderung der Spielregel. Paketnahe rote Tests werden im
aktiven Paket an der gemeinsamen fachlichen Quelle behoben. Eine bloße
Baseline-Kennzahlverbesserung ohne semantische Gegenprobe ist kein Fix.

## State Machine

`preflight -> paket_0_evidence -> paket_1_run_and_rnd_knowledge -> paket_2_effect_activation -> paket_3_scoreline_feasibility -> paket_4_final_verify -> main_merge -> cleanup -> complete`

Genau ein Zustand ist aktiv. Jeder Paketabschluss benötigt fokussierte Tests,
`git diff --check`, einen eigenen Commit und einen sauberen Worktree.

## Paketfolge

### Paket 0: Reproduzierbare Evidence und Prozessvertrag

Ziel: Entscheidungs-Checkpoints für Seed 01/196, Seed 01/278, Seed 01/347,
Seed 09/290 sowie Seed 02/181, Seed 02/354 und Seed 02/413 sichern. Die
Checkpoints bleiben side-sicher und fixieren keine bloßen Scorewerte.

Done-Gate: Checkpoint-Validierung, reproduzierbare Ist-Entscheidungen,
`git diff --check`.

Commit: `test(ai): capture seed01 seed09 seed02 behavior evidence`

### Paket 1: Run-Produzenten und geordnete R&D-Kenntnis

Problem: Aktivierte `make_run`-Fähigkeiten können ohne konkrete Run-Projektion
an der bestehenden Routenfreigabe vorbeilaufen. Die vorhandene Topdeck-
Sequenz wird nach Corp-Draws vollständig invalidiert statt fortgeschrieben.

Maßnahme: Die Engine-LegalAction projiziert side-sicher Run-Ziel,
Run-Produzent und Access-Replacement. Alle Run-Aktionstypen werden auf die
gemeinsame Route, Release und Commitment abgebildet. Unmittelbare Run-Starts
ohne konkrete Projektion werden vor Arbitration ausgeschlossen. Die
vorhandene `knownSequenceDefinitionIds`-Ablage verschiebt nach bekanntem
Corp-Draw und nach entferntem R&D-Access die Positionen, überführt die gezogene
Karte nach HQ und invalidiert bei Shuffle/Reorder vollständig.

Nebenwirkungsgrenze: Erreichbare R&D-Protocol-, Bypass- und Unknown-ICE-Runs
bleiben zulässig. Ein noch offener Ziel-Choice kann einen Pending-Commitment
verwenden. Keine zweite Wissensablage wird eingeführt.

Done-Gate: rote Seed-01-/Seed-09-Checkpoints grün; positive erreichbare,
Unknown-ICE-, Bypass-/Skip- und Access-Replacement-Gegenproben; Belief-State-
Tests für Draw, Access, Shuffle und Reorder; AI-/Engine-Typecheck.

Commit: `fix(ai): bind card runs and advance rnd knowledge`

### Paket 2: Zustandsabhängige Effektaktivierung

Problem: `remote_protection` aus dem Hint von Black Ice Quality Assurance wird
im ungescorten Remote als aktiv behandelt, obwohl der Effekt erst in der
Score Area gilt.

Maßnahme: Der Card-Semantic-Vertrag erhält beziehungsweise konsumiert einen
expliziten Aktivierungskontext. `protect_remote` akzeptiert nur Aktionen,
deren Schutzwirkung nach der Aktion aktiv ist. Scored-Agenda-Modifier bleiben
nach dem Scoren vollständig erhalten; installierte Access-Fallen und echte
Remote-Upgrades werden entsprechend ihrem eigenen Aktivzustand weiter
berücksichtigt.

Nebenwirkungsgrenze: kein pauschales Ausblenden unrezzter Root-Karten und kein
Sonderfall für eine einzelne Agenda.

Done-Gate: Seed-02/181 grün; ungescorte/gescorte Agenda-Gegenprobe; positive
Upgrade- und Access-Fallen-Gegenprobe; Card-Hint-Consumer-Audit; AI-Typecheck.

Commit: `fix(ai): require active remote protection effects`

### Paket 3: Gemeinsame Scoreline-Feasibility und Deadline-Routing

Problem: Die strategische Ebene meldet `scoreline_unreachable`, während
Board-Triage und Plan Memory weiter `corp.create_score_window` finanzieren.
Zusätzlicher Schutz kann den Reservebedarf kurz vor Deckout sogar erhöhen.

Maßnahme: Eine gemeinsame Feasibility führt maximal erreichbare Agenda-Punkte,
Punkte bis zum Sieg, verbleibende Draws/Aktionen, konkrete Score-Schritte und
erreichbare Finanzierung. Punkt-unerreichbare Scoreline-Pläne werden nicht
neu erzeugt und aus Memory invalidiert. Bei enger, aber erreichbarer Deadline
wird ein Agenda-/Remote-Pfad gebunden und zusätzlicher Schutz nur zugelassen,
wenn er fristgerecht konvertiert. Bei unerreichbarer Scoreline gewinnt die
noch produktive Damage-/Tag-/Ambush-Linie; Agendaaktionen bleiben nur als
explizite Unterstützung dieser Linie bewertbar.

Nebenwirkungsgrenze: Normale sichere Scorelines und sofortige Scores bleiben
unverändert. Die kontrollierte Risikoannahme greift nur bei nachgewiesener
Punkt- oder Zeitknappheit.

Done-Gate: Seed-02/354 und Seed-02/413 grün; Planinvalidierung,
Deadline-Scoreline, normale sichere Scoreline und Damage-/Ambush-Umschaltung
als Gegenproben; AI-Typecheck.

Commit: `fix(ai): align scoreline feasibility and deadlines`

### Paket 4: Gesamtverifikation und Wissenspflege

Ziel: Alle Checkpoints und positiven Kontrollen, AI-Shards, Typechecks,
Source-Structure-, Hidden-Info- und Card-Hint-Gates ausführen. Danach einen
vollständigen AI-Behavior-Baseline-Vergleich mit identischer Konfiguration
erstellen und semantisch prüfen. Ergebnis und belastbare Architekturregeln in
Review, Wissensbasis und Projektlog zurückführen.

Done-Gate: alle Pflichtchecks grün oder eng dokumentierter fachlicher Blocker;
vollständiger akzeptierter Vergleichslauf; sauberer Arbeitsbranch.

Commit: `docs(ai): close seed01 seed09 seed02 hardening`

## Worktree-, Git- und Integrationsregeln

- Worktree:
  `C:\Projekte\NETGRID_AI_SEED_01_09_02_BEHAVIOR_HARDENING`
- Branch: `codex/ai-seed-01-09-02-behavior-hardening`
- Hauptworkspace wird nur für den finalen lokalen Merge verwendet.
- Jedes Paket wird separat verifiziert, gezielt gestaged und committed.
- Vor dem Merge wird aktuelles `main` defensiv integriert und erneut geprüft.
- Nach erfolgreichem lokalen Merge werden Worktree und Branch ohne Force
  entfernt und in Git sowie im Dateisystem verifiziert.

## /Goal

`/Goal Arbeite den freigegebenen NETGRID-KI-Härtungsprozess für Seed 01, Seed 09 und Seed 02 vollständig und sequenziell von Paket 0 bis Paket 4 ab. Sichere reproduzierbare Checkpoints, führe alle Run-Produzenten durch dieselbe Route-/Release-/Commitment-Prüfung, schreibe das Top-5-R&D-Wissen positionsgenau über Draw und Access fort und invalidiere es bei Shuffle/Reorder, konsumiere Karteneffekte nur in ihrem aktiven Zustand und vereinheitliche Scoreline-Feasibility, Deadline und Planinvalidierung. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_SEED_01_09_02_BEHAVIOR_HARDENING auf Branch codex/ai-seed-01-09-02-behavior-hardening, halte genau ein Paket aktiv, verifiziere und committe jedes Paket einzeln, führe Card-Hint-Audit und vollständigen AI-Behavior-Baseline-Vergleich aus, integriere danach aktuelles main, merge lokal nach main und entferne sowie verifiziere Worktree und Branch. Keine Hidden-Info-Leaks, keine Kartenname-Sonderfälle und keine Remote-Integration.`

## Abschlusskriterien

- Alle sieben Checkpoints und ihre positiven Kontrollen sind grün.
- R&D-Protocol Files erzeugt bei Auswahl einen konkreten Run-Commitment.
- Top-5-Wissen bleibt geordnet und wird bei Draw/Access korrekt verschoben.
- Inaktive Agendaeffekte schützen kein Remote.
- Punkt- oder zeit-unerreichbare Scorelines blockieren keine produktive
  Siegroute mehr.
- Vollständiger Baseline-Vergleich und relevante Projektgates sind bestanden.
- Alle Pakete sind separat committed, lokal nach `main` integriert und der
  Prozess-Worktree sowie der gemergte Branch verifiziert entfernt.

## Fortschritt

- Preflight: abgeschlossen
- Paket 0: abgeschlossen
  - sieben side-sichere Decision-Checkpoints aus dem unveränderten
    Baseline-Lauf erfasst und gegen StateHash sowie Runtime-Snapshot validiert;
  - Seed 01/196, 278, 347 und Seed 09/290 reproduzieren die ungeprüfte
    R&D-Protocol-Fähigkeit;
  - Seed 02/181 reproduziert die ungescorte Agenda als Remote-Schutz,
    Seed 02/354 die fortbestehende Scoreline-Economy und Seed 02/413 den
    zusätzlichen Mastiff unmittelbar vor dem Deckout;
  - alle sieben Equivalence-Evidence-Verträge reproduzierbar grün,
    `git diff --check` grün.
- Paket 1: abgeschlossen
  - deklarative `make_run`-Effekte veröffentlichen im actor-sicheren
    LegalAction-Payload Run-Ziel, Access-Replacement und vorhandene
    Routenmodifikatoren; der positive AI-DTO-Allowlist-Vertrag lässt nur diese
    strukturierten Primitive passieren;
  - strukturierte Sofort-Runs ohne `RunnerRunTargetEvaluation` werden
    fail-closed ausgeschlossen; erreichbare, bedingt erreichbare Unknown-ICE-
    und Bypass-Routen bleiben über Route, Release und Commitment möglich;
  - `private_look_top_rd` wird als Informations-Payoff und nicht als normaler
    Agenda-Access bewertet; ein bereits vollständig bekannter Blick ist kein
    neuer Payoff;
  - die bestehende R&D-Sequenz schiebt bei Corp-Draw und entfernendem Access,
    überführt bekannte Draws nach HQ und invalidiert zonengenau bei
    Shuffle/Reorder; Runner- und Corp-Views bleiben getrennt;
  - Seed 01/196, 278, 347 und Seed 09/290 grün; 188 fokussierte Tests,
    zusätzliche erreichbare/Unknown-ICE/Bypass/Replacement/Commitment-
    Gegenproben, Engine- und AI-Typecheck sowie `format:changed` grün.
- Paket 2: abgeschlossen
  - der Remote-Schutz-Consumer bewertet Hint-Effekte jetzt mit explizitem
    Zonen- und Zustandskontext (`root`/`score_area`, aktuell/nach Install/nach
    Rez) statt zonenblind;
  - Agenda-Effekte können aus einem installierten Root keine aktive
    Schutzwirkung liefern; der persistente Modifier von Black Ice Quality
    Assurance bleibt im Score-Bereich erhalten und sein Hint trägt die
    bestehende Ontologiebedingung `requires_scored_agenda`;
  - persistente Asset-/Upgrade-Wirkung zählt erst im aktiven Rez-Zustand,
    während echte On-Access-Fallen weiterhin unrezzed als defensive Wirkung
    gelten; advancement- und tagabhängige Voraussetzungen werden dabei
    geprüft;
  - Seed 02/181 sowie ungescorte/gescorte Agenda-, Upgrade-, On-Access- und
    Advancement-Gegenproben grün; 146 fokussierte Tests,
    Hint-Metadatenvertrag und AI-Typecheck grün.
- Paket 3: abgeschlossen
  - ein gemeinsamer Scoreline-Feasibility-Vertrag liefert Deck-Gesamtpunkte,
    eigene und gegnerische Punkte, maximal erreichbare Punkte, Punkte bis zum
    Sieg, verbleibende Mandatory Draws, aktuelle Aktionen, legale und
    finanzierbare Score-Schritte sowie Same-Turn-Closeouts;
  - Strategic Runtime, Board-Triage, TacticalPlans, TacticalPlan-Memory und
    Plan-Portfolio konsumieren denselben Vertrag; mathematisch unerreichbare
    oder nach R&D-Leerstand nicht mehr mehrzügig ausführbare Scoreline-Projekte
    werden nicht erzeugt beziehungsweise aus Memory entfernt;
  - bei leerem R&D erhalten nicht mehr fristgerecht konvertierbare Agenda-/ICE-
    Installationen einen eng begrenzten Deadline-Malus; aktivierbare
    Non-Scoreline-Punish-Pfade bleiben unberührt;
  - Seed 02/354 verwirft den alten Credit-/Score-Window-Plan und installiert
    Private Cybernet Police ausdrücklich über `corp.apply_punish_pressure` als
    Tag-Linien-Unterstützung; Seed 02/413 verwirft den vierten Mastiff und
    beginnt stattdessen die noch im laufenden Zug aktivierbare Blood-Cat-Linie;
  - 146 fokussierte Tests einschließlich normaler sicherer Scoreline,
    Last-Draw-Fenster, Same-Turn-Closeout, Planinvalidierung und bestehender
    Board-Triage-Gegenproben sowie AI-Typecheck grün.
- Paket 4: in Arbeit
- Main-Merge und Cleanup: offen
