# AI Replay Evidence: Match 731b

Status: Paket-Evidence für freigegebene Umsetzung

Analysiertes Match: `match_731b436e85fb2484`

SQLite-Quelle: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

## Match-Metadaten

- Status: `finished`
- Modus: `human_runner_vs_corp_ai`
- Seed: `match-mr7nb3bj-1hfbr0e`
- Corp-AI: `corp-ai-v0.9-hard`, Difficulty `hard`
- Runner-Deck: `Stealth Interface Starter`
- Corp-Deck: `Tycho Ice Stack`
- Abschlusszeit: `2026-07-05T16:46:21.992Z`
- End-StateVersion: `328`
- Events: `329`
- State-Snapshots: `329`
- AI-Decision-Traces: `0`
- Gewinner: Runner
- Endgrund: Runner erreicht Agenda-Punkte-Ziel durch zweiten Steal von `Tycho Extension`

## Evidence-Grenze

Dieses Match enthält keine gespeicherten `ai_decision_traces`. Die historische Evidence kommt daher aus öffentlichen Events, gespeicherten State-Snapshots, LegalActions und gewählten AI-Aktionen. Zusätzlich wurde für kritische StateVersions die aktuelle Corp-AI post hoc mit side-safe Input rekonstruiert. Diese Post-hoc-Diagnostik zeigt aktuelle Scoring-/Debug-Gründe, ist aber kein historischer Trace-Beweis.

Für die Umsetzung gelten nur generische, side-safe Muster:

- sichtbare Runner-Rig-/Score-/Credit-Lage;
- Corp PlayerView, HQ-Handgröße, Credits, Clicks, installierte öffentliche Serverstruktur;
- LegalActions der jeweiligen StateVersion;
- öffentliche Access-/Steal-Folgen erst nach Eintritt als Folgebeobachtung.

## Relevante Replay-Folge

- StateVersion 32/33: Runner installiert `R&D Interface`; R&D-Multiaccess-Druck ist ab diesem Zeitpunkt sichtbar.
- StateVersion 178 bis 202: R&D-Run mit Access auf öffentlich gewordene Karten; die Corp verhindert keinen erneuten zentralen Druck.
- StateVersion 233 bis 256: Runner greift R&D an, trasht `Department of Truth Enhancement` und stiehlt `Tycho Extension`; Runner steht danach bei 4 Agenda-Punkten.
- StateVersion 258 bis 260: Corp bleibt in Scoreline-Drucklage, entscheidet aber weiter für Funding/ICE statt Agenda-Commit in ein vorbereitetes Remote.
- StateVersion 300: Corp installiert teures R&D-ICE und fällt von 6 auf 0 Credits; dadurch entsteht kein belastbarer Rez-/Defense-Plan.
- StateVersion 305 bis 328: Finaler R&D-Run; Corp rezt beziehungsweise verteidigt nicht wirksam genug, Runner stiehlt die zweite `Tycho Extension` und gewinnt.

## Corp-Aktionsprofil

Für AI-Aktionen mit `idempotencyKey` `ai-corp` ergab sich im Match:

- `gain_credit`: 37
- `mandatory_draw`: 19
- `end_turn`: 19
- `install_card`: 15
- `rez_ice`: 8
- `decline_rez`: 5
- `resolve_choice`: 3
- `draw_card`: 3
- `play_operation`: 2

Es gab keine historischen `score_agenda`- oder `advance_card`-Aktionen und keine erkennbare Score-Conversion.

## Fehlergruppe 1: Score-Druck bricht nicht durch

Beispiele:

- StateVersion 204: `Tycho Extension` war legal installierbar, die Corp wählte Funding.
- StateVersion 226/227: vorhandener Remote-Aufbau und kritischer Agenda-Druck, aber die Corp bevorzugte ICE/Funding.
- StateVersion 258/259/260: nach Runner bei 4 Agenda-Punkten wurde die Scoreline-Lage kritisch, trotzdem kein Agenda-Commit.

Sichtbar bessere Alternative: Agenda in ein bereits vorbereitetes oder unmittelbar vorbereitbares Remote committen, wenn HQ/R&D-Agenda-Exposition und Runner-Scoreline-Druck zusammenfallen.

Umsetzungserwartung: `fund_score_remote` und `force_scoreline_clock` dürfen einen legalen Agenda-Install in ein Score-Remote nicht pauschal als Board-Triage-Mismatch abwerten.

Betroffene Schicht: Corp Board Triage, Corp Score Runtime, Regressionstests.

## Fehlergruppe 2: Score-Remote-Pipeline ohne nächsten Score-Schritt

Beispiele:

- StateVersion 225/226: Score-Remote-Aufbau wurde verstärkt, obwohl `score_horizon: slow` und Runner-Contest-Fähigkeit gegen eine langsame Pipeline sprachen.
- StateVersion 259/260: weitere Setup-/Funding-Schritte, aber keine erzwungene Conversion in Agenda-Install, Advance oder Score.

Sichtbar bessere Alternative: Score-Remote-Pipeline muss an eine konkrete nächste Aktion gebunden sein: Agenda installieren, scorable Agenda advancen/scoren, Funding mit unmittelbarem Score-Ziel nehmen oder Pipeline abbrechen.

Umsetzungserwartung: Extra-ICE/Funding erhält nur dann Vorrang, wenn dadurch eine konkrete Scoreline-Conversion messbar näher rückt.

Betroffene Schicht: Corp Score Runtime, Score-Window-Evidence, ICE-Placement-Verbraucher.

## Fehlergruppe 3: R&D-Interface-Matchpoint wird zu schwach bewertet

Beispiele:

- `R&D Interface` war ab StateVersion 33 sichtbar.
- Nach dem ersten `Tycho Extension`-Steal ist der Runner auf Matchpoint-relevanter Schwelle.
- StateVersion 300: teure R&D-ICE-Installation senkt Credits auf 0 und erzeugt keinen klaren Rez-/Defense-Vorteil.

Sichtbar bessere Alternative: Bei sichtbarem R&D-Multiaccess plus Runner-Scoreline-Druck keine zentrale ICE-Installation wählen, die den Rez-Floor unter den sichtbaren Verteidigungsbedarf drückt. Stattdessen Scoreline-Conversion, bezahlbare zentrale Verteidigung oder Funding mit konkretem Schutz-/Score-Ziel bevorzugen.

Umsetzungserwartung: R&D-Matchpoint-Druck wirkt als side-safe Risiko in ICE-Placement und Score-Komponenten.

Betroffene Schicht: Corp Score Runtime, ICE-Placement, Tests.

## Fehlergruppe 4: ICE-Install und Rez-Bewertung laufen auseinander

Beispiele:

- StateVersion 300: teures ICE wird installiert, obwohl die Folge-Credits für Rez/Defense unzureichend sind.
- StateVersion 305: historische Entscheidung war `decline_rez`; aktuelle Post-hoc-Diagnostik klassifiziert den Rez teils als Zero-Effect gegen sichtbare Breaker-Abdeckung.

Sichtbar bessere Alternative: ICE-Placement muss bereits vor Installation die post-install Rez-Reserve und sichtbare Zero-Effect-Risiken berücksichtigen; Rez-Bewertung und Install-Bewertung dürfen nicht gegeneinander arbeiten.

Umsetzungserwartung: Effektive Verteidigung, sichtbare Breaker-Abdeckung und Rez-Reserve werden in ICE-Placement-Scoring sichtbarer und stärker.

Betroffene Schicht: ICE-Placement Evaluator, Corp Score Runtime, Tests.

## Fehlergruppe 5: Analyse ohne Decision-Traces ist zu schwach abgesichert

Beispiel:

- Das Match hatte `0` gespeicherte `ai_decision_traces`, obwohl es als AI-Spiel wertvolle Replay-Evidence liefern sollte.

Sichtbar bessere Alternative: Analyse-/Replay-Tooling muss fehlende Traces klar melden oder optional detailed AI tracing für private Analyse-Matches nahelegen.

Umsetzungserwartung: Kein stiller Analysepfad, der Trace-Lücken wie vollständige DecisionDebug-Evidence behandelt.

Betroffene Schicht: Analyse-/Report-Guard oder Dokumentationsvertrag.

## Nicht freigabereif aus diesem Spiel

- Einzelne HQ-root-/Asset-Placements wirkten schwach, sind aus diesem Match aber nicht als generisches Fehlmuster hinreichend belegt.
- Es gibt keinen Beleg für eine Engine- oder LegalAction-Lücke.
- Es gibt keinen Scope für kartennamenspezifische Sonderregeln für `Tycho Extension`.

## Akzeptanzkriterien

- Mindestens ein fokussierter Test belegt, dass kritischer Scoreline-Druck Agenda-Commit in ein vorbereitetes Remote gegenüber reiner Funding-/ICE-Fortsetzung aufwertet.
- Mindestens ein fokussierter Test belegt, dass weitere Score-Remote-Pipeline-Schritte ohne konkrete Conversion nicht endlos Setup bevorzugen.
- Mindestens ein fokussierter Test belegt, dass R&D-Multiaccess-Matchpoint plus niedrige post-install Rez-Reserve teure ICE-Installationen abwertet.
- Debug-Evidence nennt die neuen side-safe Gründe nachvollziehbar.
- `corepack pnpm --filter @netgrid/ai typecheck` bleibt grün.
