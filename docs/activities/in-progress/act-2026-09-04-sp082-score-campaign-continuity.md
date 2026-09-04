---
activityId: act-2026-09-04-sp082-score-campaign-continuity
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-09-04
startedAt: 2026-09-04
completedAt:
branch: codex/sp082-score-campaign-continuity
releaseTarget: local-main
blockedBy: []
resultArtifacts: []
checks: []
---

# SP-082 Score-Kampagnenkontinuität

## Status

SP082-A bis SP082-C abgeschlossen. SP082-D ist als nächstes aktiv.

## Paketprotokoll

### SP082-A – erster Verlustpunkt

Die Seeds `meta-357-final-034` und `meta-357-final-036` wurden auf dem
festgehaltenen lokalen Basisstand deterministisch erneut ausgeführt. Beide
Replays waren state-hash-stabil und ohne Runtime-Fallback, Timeout oder
Enginefehler. Der aktuelle Stand reproduziert nicht den historischen
Nullscore-Endstand, aber denselben frühen Kontinuitätsverlust.

Der erste belegte Verlust liegt vor der Head-Erzeugung:

- In Spiel 36, StateVersion 107, existiert der konkrete residente
  `corp.score_agenda`-Parent für Marked Accounts auf `remote_1`. Er ist wegen
  `corp_score_protection_required:remote_1` blockiert. Bei null Credits ist
  keine ICE-Installation in diesen bereits geschützten Remote aktuell legal.
- Die bekannte Schutzquote des Parents weist damit einen Fundingbedarf aus;
  `corpScoreProtectionInstallRouteScan` durchsucht jedoch nur aktuell legale
  ICE-Installationen. Ohne eine solche Action veröffentlicht der Score-Parent
  kein Funding-Milestone und kein `score-support`-Need.
- Die exakt legale Kreditaktion wird deshalb von einem eigenständigen
  P6-Economy-Parent gewählt. Der Score-Parent hat `openNeedIds: []`, keinen
  Parent-gebundenen Support-Head und keinen produktiven Progress-Root.
- Spiel 34, StateVersion 121, bestätigt dieselbe Vertragslücke beim
  nahe-Matchpoint-blockierten Charity-Takeover-Parent: Die Kreditaktion gehört
  einer allgemeinen Accounts-Receivable-Economy-Linie; beide konkrete
  Score-Parents bleiben ohne veröffentlichten Supportbedarf.

Die Gegenlinie ändert nicht Engine-Legalität oder den aktuellen Action-Typ:
Dieselbe aktuelle `corp.gain_credit`-Action muss als exakt gebundener
`corp.economy`-Leaf den bekannten Fundingbedarf des bestehenden
`corp.score_agenda`-Parents erfüllen. Erst nach geschlossenem Gap wird der
nächste Defense- oder Agenda-Meilenstein erneut materialisiert.

Der engste Änderungsschnitt liegt damit in der vorhandenen Score-
Schutzassessment-/Funding-Milestone-Ableitung und ihrer bestehenden
Economy-Supportkonversion. Es ist weder ein pauschaler Scorebonus noch eine
zweite Kampagnenstruktur erforderlich.

### SP082-B – progressabler Score-Vertrag

`CorpScoreFundingMilestone` berücksichtigt nun neben dem bereits
veröffentlichten Routengap auch zwei vorhandene, voneinander getrennte
Engine-nahe Belege: den bekannten Schutzgap und den exakten
Score-Konversionsfloor. Der verwendete Beleg wird typisiert im Milestone
festgehalten. Ein Schutzgap ist nur zulässig, wenn Parent, Need und aktuelle
StateVersion zusammenpassen.

Damit erhält Spiel 36 bei null Credits einen stabilen Zielwert von vier
Credits aus der bekannten Agenda-Konversion. Die aktuelle Kreditaktion wird
als `corp.economy`-Leaf unter dem residenten Score-Parent und dessen
`score-support`-Need ausgewählt. Ein unbekannter Schutzpfad erzeugt weiterhin
keinen erfundenen Schutzgap; ein davon unabhängiger bekannter
Konversionsfloor darf jedoch progressabel bleiben.

Der Checkpoint zeigt zugleich den nächsten vertikalen Verlustpunkt für
SP082-C: Der produktive Head und seine Phase sind korrekt Parent-/Need-
gebunden, aber der Progress-Root sucht wegen der weiterhin offenen
Schutzfrage vorrangig nach `score-protection:*` und meldet fälschlich Replan,
statt den tatsächlich gewählten `score-support:*`-Witness anzuerkennen.

### SP082-C – vertikale Funding-Konversion

Der Agenda-Linienbauer konsumiert nun die vorhandenen parentgebundenen
Economy-Needs und erzeugt für jeden aktuell exakt belegten Provider eine
eigene `fund_setup`-Linie. Die Familie ist an allen betroffenen Stellen
explizit als Nicht-Rush klassifiziert. Sie erzeugt weder Agenda-Installations-
noch Defense-Payoff, sondern ausschließlich einen auf das veröffentlichte Gap
begrenzten Netto-Funding-Claim. Der produktive Head trägt den bestehenden
Economy-Provider, Score-Parent, `score-support`-Need, Assignment und die
kanonische aktuelle Invocation.

Die Progress-Root-Prüfung bevorzugt nun die tatsächlich vorhandene
Parent-/Need-Bindung eines aktuellen Support-Heads. Spiel 36 meldet damit
keinen fälschlichen Replan mehr: Der blockierte Score-Root besitzt einen
gültigen `support_head`-Witness für `corp.gain_credit`. Bei geschlossenem Gap
wird keine `fund_setup`-Linie mehr veröffentlicht; der Supportbedarf gibt an
die erneute Score-/Defense-Materialisierung zurück.

Spiel 34 bleibt bewusst unverändert: Dort ist der Konversionsfloor bereits
finanziert, aber keine sichtbare zweite ICE-Option erfüllt die aktuelle
strenge Near-Matchpoint-Schutzquote. Eine allgemeine Economy-Aktion ist daher
kein nachgewiesener kausaler Scorefortschritt und wird nicht künstlich an den
Score-Parent gehängt.

## Quelle und Zielprüfung

Quelle sind der Registry-Verdachtsfall SP-082, Pairing 357 mit den Seeds
`meta-357-final-034` und `meta-357-final-036` sowie das Architektur- und
Codereview vom 2026-09-04.

Die Vorgabe ist für eine automatische Umsetzung präzise genug. SP082-A muss
zuerst den ersten tatsächlichen Verlustpunkt im produktiven Planungspfad
beweisen. SP082-B und SP082-C ändern nur die dort nachgewiesene Ursache. Kann
kein state-exakter Verlustpunkt belegt werden, endet der Prozess mit einer
begründeten Evidence-Klassifikation statt eines spekulativen Verhaltensfixes.

## Gesamtziel

Ein erkannter `corp.score_agenda`-Parent bleibt durch aktuell exakt belegte
Vorbereitungsschritte wirksam und kann über Defense- oder Economy-Support in
die tatsächliche Score-Konversion gelangen. Der aktuelle gewählte Schritt ist
vollständig an Parent, Need, Assignment, Provider, Invocation, Targets und
Choices gebunden. Ungewisse spätere Wirkung behält ihren tatsächlichen
Garantiegrad und sperrt keine unabhängig belegte heutige Verbesserung.

## Annahmen

- Implementierungsbasis ist der lokale Commit
  `a2fc95ea3b1926081320c9529463d623a6969cd9`.
- `origin/main` stand beim Prozessstart auf
  `41319f318b5169f1aa68dee92f3577d5cf1412dd`.
- Die schmutzigen Änderungen im primären Main-Checkout betreffen fremde
  E2E-Arbeit und bleiben unangetastet.
- Vor der Auswahl dürfen mehrere nichtautoritative Planning Heads
  konkurrieren; erst die gewählte Linie bindet genau einen Leaf-Head.
- Unknown ist eine lokale Eigenschaft einer Behauptung, kein Beweis für die
  Nichtdurchführbarkeit der gesamten Kampagne.

## Nicht-Ziele

- Kein pauschaler Scorebonus, kein Scorezwang nach einer Zugzahl und keine
  abgesenkte Schutzschwelle.
- Keine zweite Kampagnenpersistenz, kein paralleler Chooser und keine neue
  Action-Autorität.
- Keine Karten-, Deck- oder Matchup-Sonderregel.
- Kein Zugriff auf verdeckte Runner-Informationen.
- Kein allgemeines Redesign des TurnPlanners und keine Reparatur anderer
  Verdachtsfälle ohne denselben belegten Ownerfehler.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Agenda-, Advance- und Scoreentscheidungen gehören `corp.score_agenda`.
- ICE-Auswahl und ICE-Installation gehören `corp.defend_servers`.
- Economy-Aktionen gehören `corp.economy`.
- Support erhält den unmittelbaren Bedarf und den ursprünglichen Score-Parent
  über die gesamte Parent-/Leaf-Kette.
- Nur aktuelle LegalActions können ausführbare Heads bilden. Spätere Schritte
  dürfen als Bedarf oder Quote beschrieben, aber nicht als zukünftige
  LegalAction erfunden werden.
- Derselbe unveränderte Planungskontext erzeugt keine zusätzlichen
  Fortschrittsclaims.

## Automatische Fehlerbehandlung

- Fehlt die exakte Bindung der aktuellen Action, wird nur dieser Head
  verworfen und die Diagnose nennt den fehlenden Vertrag.
- Ist nur die spätere Wirkung unbekannt, bleibt ein unabhängig belegter
  aktueller Fortschritt als Kandidat zulässig; eine Scoregarantie wird nicht
  behauptet.
- Widerspricht neue Evidence der Route, wird sie invalidiert und neu bewertet.
- Fehlender aktueller Support löst Reassessment oder eine typisierte
  Waiting Condition aus, nicht automatisch Abandon.
- Ein Sicherheits- oder Ownership-Konflikt stoppt das aktuelle Paket mit einer
  konkreten Removal Condition. Kein Fallback kaschiert die Ursache.

## Sicherheitsblocker

- Eine Änderung würde fremde Ownership in `corp.score_agenda` duplizieren.
- Der produktive Head ließe sich nicht an eine aktuelle LegalAction binden.
- Der Fix benötigte verdeckte Runner-Daten oder kartenspezifische Ausnahmen.
- Der Nachweis wäre nur über einen Diagnose-Slice, nicht über den produktiven
  Chooser möglich.

## State Machine

```text
discovered
  -> executable_now
  -> progressable_by_support
  -> waiting_until_condition
  -> interrupted_by_higher_priority
  -> reassess
  -> invalidated_or_abandoned
```

Der Garantiegrad aktueller und späterer Aussagen wird orthogonal als
`known`, `bounded` oder `unknown` geführt. Reassessment darf Waiting-Deadline
und Fundingziel nicht ohne neue fachliche Evidence nach hinten verschieben.

## Paketfolge

### SP082-A: Reproduktion und erster Verlustpunkt

**Ziel:** Die Seeds 34 und 36 aus Pairing 357 auf der festgehaltenen Basis
reproduzieren und den ersten Verlustpunkt zwischen Projekterkennung,
residentem Parent, Assessment, Need, Supportzuordnung, Planning Heads,
Linienbildung, Pruning, produktiver Auswahl und Fortsetzung bestimmen.

**Eingangsvoraussetzungen:** Registry-Reproduktionsdaten, Basiscommit und
vollständiger erlaubter Planungskontext sind verfügbar.

**Arbeit:**

- beide Seeds deterministisch erneut ausführen;
- den frühesten belastbaren Corp-Zustand als Decision-Checkpoint sichern;
- den produktiven Chooser einschließlich Parent-/Leaf-Bindung prüfen;
- eine vollständige Gegenlinie aus demselben Ausgangszustand nachweisen;
- Ursache und engsten vertikalen Änderungsschnitt dokumentieren.

**Kernartefakte:** Selfplay-/Checkpoint-Fixture, fokussierter Regressionstest,
diese Activity.

**Checks:** der neue Checkpoint-Test, direkt betroffene bestehende
Planungs-/Runtime-Tests und `git diff --check`.

**Done-Gate:** Der erste Verlustpunkt ist state-exakt reproduziert oder ein
spekulativer Fix wird mit begründeter Evidence ausgeschlossen.

**Commit:** `test(ai): capture sp082 score campaign loss point`

### SP082-B: Bestehenden Kampagnenvertrag präzisieren

**Ziel:** Die vorhandenen Assessments, Planning Heads, Milestone-Quotes und
Value-Claims drücken den in SP082-A fehlenden Garantie-, Waiting- oder
Fortschrittsvertrag aus, ohne eine zweite persistente Kampagnenwahrheit.

**Eingangsvoraussetzungen:** SP082-A benennt den exakten Vertragsverlust.

**Arbeit:**

- aktuelle Belegbarkeit, Lifecycle und Zukunftsgarantie trennen;
- mindestens einen exakt belegten Supportkandidaten als Progressability
  zulassen;
- Waiting Condition und stabile Deadline vollständig binden;
- kausale Vorher-/Nachher-Quotes aus demselben Ausgangszustand verwenden;
- bloßen Zeitablauf und bloße Quote-Vervollständigung nicht als Boardfortschritt
  bewerten.

**Kernartefakte:** bestehende Score-/Turn-Planning-Verträge und fokussierte
Vertragstests.

**Checks:** betroffene Unit- und Vertragstests, gegebenenfalls AI-Typecheck,
`git diff --check`.

**Done-Gate:** Der reproduzierte Verlustpunkt besitzt einen korrekten
progressablen Vertrag; Unknown bleibt lokal und idempotentes Requoting erzeugt
keinen Mehrwert.

**Commit:** `fix(ai): preserve exact score campaign progress`

### SP082-C: Vertikale Support- und Auswahlkonversion

**Ziel:** Die in SP082-A nachgewiesene Lücke reicht vollständig von
Providerkandidaten über Linienklassifikation und Claims bis zur produktiven
Auswahl und Rückgabe an den Score-Owner.

**Eingangsvoraussetzungen:** SP082-B liefert den gültigen Vertrag.

**Arbeit:**

- mehrere zulässige Supportheads bis zum Vergleich erhalten;
- nach Auswahl genau einen Leaf-Head mit Parent, Need, Assignment und
  Canonical Invocation binden;
- falls Funding betroffen ist, `fund_setup` explizit als Nicht-Rush- und
  Nicht-Installationslinie integrieren;
- stabiles Fundingziel, nutzbare Nettofinanzierung und Supportfreigabe beim
  geschlossenen Gap sichern;
- verschachtelte Score-Defense-Economy-Bindungen erhalten;
- nur tatsächlich kausale inkrementelle Value-Claims erzeugen.

**Kernartefakte:** Scoremodul, Agenda-Linienbauer, produktiver Corp-TurnPlanner
und eng angrenzende Tests.

**Checks:** produktiver Chooser-Checkpoint, Support-/Ownershiptests,
AI-Typecheck bei Vertragsänderung und `git diff --check`.

**Done-Gate:** Der aktuelle Support-Head wird im produktiven Chooser gewählt,
korrekt ausgeführt und gibt nach erfülltem Bedarf an den nächsten realen
Meilenstein zurück.

**Commit:** `fix(ai): convert bound score campaign support`

### SP082-D: Mehrschrittige Regression und Selfplay-Verifikation

**Ziel:** Parentkontinuität, Supportfreigabe, Waiting, Unknown, Hidden Info,
Sicherheit und Determinismus über mehrere Schritte und einen Gegnerzug
nachweisen und denselben Seed-Satz erneut vergleichen.

**Eingangsvoraussetzungen:** SP082-C besteht fokussiert.

**Arbeit:**

- Mehrschritt- und Gegnerzugkontinuität testen;
- Fundingabschluss, Deadline-Stabilität und idempotente Claims prüfen;
- Hidden-Info- und Expositionsgegenproben ausführen;
- die reproduzierten Seeds und anschließend Pairing 357 mit 40 Seeds erneut
  ausführen;
- SP-082 in der lokalen Evidence-Registry ausschließlich entsprechend der
  tatsächlich belegten Wirkung aktualisieren.

**Kernartefakte:** Regressionstests, deterministische Selfplay-Evidence und
Registry-Eintrag.

**Checks:** fokussierte Tests, direkt betroffene AI-Tests, bei berührten
Typverträgen AI-Typecheck, Registry-Check und `git diff --check`.

**Done-Gate:** Kein nachweislich progressabler Scorepfad bleibt im geprüften
Checkpoint wiederholt ungenutzt; Sicherheitsqualität, Ownership, Hidden Info
und Determinismus bleiben erhalten. Die 40er-Serie wird als Vergleichsevidence
und nicht allein als Spielstärkenbeweis bewertet.

**Commit:** `test(ai): verify sp082 score campaign continuity`

## Verifikationsregeln

- Während Diagnose und Umsetzung laufen ausschließlich direkt
  änderungsnahe Tests.
- Typchecks laufen, wenn Typoberflächen oder gemeinsame Verträge geändert
  werden.
- Breite AI-Shards sind ohne zusätzlichen Integrationsgrund nicht Teil dieses
  Prozesses.
- Jeder Paketabschluss erfordert grüne Paketchecks und `git diff --check`.
- Ein Test darf nicht allein durch Abschwächen der Sicherheits- oder
  Ownership-Aussage grün gemacht werden.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree:
  `C:\Projekte\NETGRID-worktrees\sp082-score-campaign-continuity`
- Arbeitsbranch: `codex/sp082-score-campaign-continuity`
- Primärer Checkout: `C:\Projekte\NETGRID`, ausschließlich für den finalen
  lokalen Merge.
- Genau ein Paket ist aktiv; jedes abgeschlossene Paket erhält einen eigenen
  Commit.
- Vor dem finalen Merge wird der aktuelle lokale `main` defensiv in den
  Arbeitsbranch integriert, wenn er weitergelaufen ist.
- Push und Pull Request sind nicht Bestandteil dieses Auftrags.

## Controller-Prompt-Kern

`/Goal Arbeite SP-082 Score-Kampagnenkontinuität vollständig und sequenziell
von SP082-A bis SP082-D ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main. Lies zuerst AGENTS.md, packages/ai/AGENTS.md, die führenden
AI-Architekturverträge und diese Activity. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID-worktrees\sp082-score-campaign-continuity auf Branch
codex/sp082-score-campaign-continuity. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative
automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket,
führe dessen direkt änderungsnahe Checks aus und committe es. Bei einem
Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition. Nach
Abschluss integriere den aktuellen lokalen main, verifiziere erneut, merge
lokal nach main, prüfe main, entferne Worktree und gemergten Branch verifiziert
und markiere das Goal erst dann als complete.`

## Abschlusskriterien

- SP082-A bis SP082-D sind gemäß ihren Done-Gates abgeschlossen und committed.
- Die dauerhafte Architektur- oder Testwahrheit enthält alle
  wiederverwendbaren Erkenntnisse; diese Activity kann nach Rückführung
  entfernt werden.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- `main` besteht die direkt änderungsnahen Checks und `git diff --check`.
- Worktree-Pfad und Branch sind anschließend nachweislich entfernt.

## Ergebnisnotiz

Noch offen.
