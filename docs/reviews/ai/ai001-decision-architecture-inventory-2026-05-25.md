# AI001 Decision Architecture Bestandsaufnahme

Aufgabe-ID: AI001

Datum im Aufgabenauftrag: 2026-05-25

Arbeitsart: reine Ist-Bestandsaufnahme der bestehenden AI-Entscheidungsarchitektur

## Scope

Diese Bestandsaufnahme beschreibt den aktuellen Entscheidungsfluss der NETGRID-AI aus den bestehenden Code- und Testartefakten. Sie dokumentiert, wo Entscheidungen entstehen, welche Datenquellen in die Bewertung eingehen, welche Stellen Kontext rekonstruieren und welche lokalen Fixes bereits sichtbar sind.

Nicht Bestandteil dieser Aufgabe:

- keine Zielarchitektur,
- keine Roadmap,
- keine Folgepakete,
- keine Strategieempfehlung,
- keine Änderung an Engine, Rules, LegalActions, Scoring, Profilen, Decks, Hints, Compiled Index, Catalog oder Produktlogik.

## Kurzfazit

Die AI ist aktuell kein eigenständiger regelentscheidender Akteur und keine persistente Plan-State-Maschine. Sie erhält side-safe `AiDecisionInput`-Daten, bewertet ausschließlich vom Engine-Pfad erzeugte `LegalActions` und gibt eine Auswahl mit Diagnosefeldern zurück. Die Engine bleibt über `applyAction` die Regelautorität.

Die Entscheidung entsteht in zwei Schichten:

1. Baseline-Scoring in `packages/ai/src/index.ts`, das alle legalen Aktionen bewertet und viele reaktive Timingfenster direkt behandelt.
2. Plan-Scoring in `runner-plans.ts` und `corp-plans.ts`, das aus aktuellen LegalActions, PlayerView, PublicEvents, BeliefState, DeckDoctrine und Ontology-Hints kurzlebige Plan-Kandidaten erzeugt und diese gewichtet.

Persistente echte Intents gibt es im Ist-Stand nicht als gespeicherten AI-State. Runner- und Corp-Intents werden bei jeder Entscheidung aus sichtbarem Zustand und öffentlicher Ereignishistorie rekonstruiert. Dadurch existieren viele lokale Kontextbrücken, aber keine dauerhafte Verpflichtung auf einen Plan über mehrere Turns.

## Grober Entscheidungsfluss

1. Der Server bestimmt die entscheidende Seite über `selectAiDecisionSideForState(state)`.
2. Die Engine liefert für diese Seite die aktuellen `LegalActions`.
3. `buildAiDecisionInput(state, side, options)` baut aus `PlayerView`, `LegalActions`, PublicEvents, Difficulty, Seed, ProfileId und optionaler eigener DeckDoctrine den side-safe AI-Input.
4. `chooseAiAction(input)` dispatcht nach Seite:
   - Runner: `chooseRunnerAction(input)`.
   - Corp: `chooseCorpAction(input)`.
5. Beide Seiten berechnen zunächst eine Baseline-Entscheidung.
6. Wenn eine planfähige Aktion im LegalAction-Set liegt und die Baseline nicht als reaktiv geschützt ist, wird der jeweilige Planer aufgerufen.
7. Der Planer erzeugt Plan-Kandidaten aus LegalActions und sichtbarem Kontext, bewertet sie, sortiert deterministisch und wählt eine LegalAction.
8. Der Server sucht die gewählte LegalAction im aktuellen Set und reicht sie an `applyAction`.
9. `applyAction` validiert die Entscheidung erneut gegen Seite, ActionId, StateVersion, Timingpunkt, Kosten, Ziele und Choices.
10. Debug-/Trace-Daten werden nur in sanitisierten AI-Diagnosefeldern gespeichert oder ausgespielt.

## Regel- und Datengrenzen

Die AI erzeugt keine LegalActions und entscheidet nicht über Legalität. Legalität entsteht im Engine-/Rules-Pfad. Die AI wählt nur aus dem aktuellen LegalAction-Set.

Wesentliche Grenze:

- `LegalActions`: erlaubte Aktionen aus der Rules Engine.
- `AiDecisionInput`: side-safe Sicht mit erlaubten Feldern.
- `chooseAiAction`: Auswahl und Diagnose.
- `applyAction`: erneute Regelvalidierung.

Damit ist die AI im aktuellen Stand ein Bewertungs- und Auswahlmodul, nicht die Regelautorität.

## Echte Intents oder Action-Scoring?

Der Ist-Stand enthält intent-ähnliche Strukturen, aber keine langlebigen First-Class-Intents.

Vorhanden sind:

- Plan-Kandidaten mit `planKind`, `planId`, `visibleBenefits`, `visibleRisks`, `uncertainty`, `requiredRoles` und Debugfeldern.
- strategische Linien mit kurzlebigem Bias, etwa Runner-Pressure, Rig-Aufbau, Remote-Contest, Corp-Central-Stabilisierung, Remote-Scoring, Rez-Reserve oder Tag/Punish.
- Plan-Continuation- und Outcome-Follow-up-Heuristiken, die aus öffentlichen Events rekonstruieren, ob die AI gerade einen Plan fortsetzt, abbricht, wiederholt oder nach einem Ergebnis pivotiert.
- BeliefState-Hypothesen zu unbekannten Karten, bekannten HQ-/R&D-Informationen, Remote-Risiko und Gegnerverhalten.

Nicht vorhanden sind:

- persistierte AI-Planobjekte im GameState,
- verbindliche mehrzügige Commitments,
- ein expliziter Intent-Lifecycle mit Start, Update, Abort und Completion im Engine-State,
- eine klare Trennung zwischen langfristigem Zielzustand und aktueller Action-Wertung.

Die operative Entscheidung bleibt Action-Scoring über LegalActions. Die Planer liefern gewichtete Kandidaten und Diagnose, keine dauerhafte Absicht.

## Runner-Ist-Struktur

### Runner Baseline

`chooseRunnerAction` berechnet zuerst eine Baseline über `scoreActions`. Diese Schicht behandelt reaktive Timingfenster und viele taktische Einzelentscheidungen:

- Setup- und Choice-Fenster,
- Trace- und Zahlungssituationen,
- Agenda-Steal- und Access-Entscheidungen,
- Trash-/Decline-Entscheidungen bei Access,
- Icebreaker-Pump und Subroutine-Break,
- `continue_run` und `jack_out`,
- Tag-Removal,
- Install, Event, Trigger/Ability,
- Run-Starts,
- Credits, Draw und End Turn.

Einige Baseline-Entscheidungen blockieren absichtlich die Plan-Schicht. Dazu gehören insbesondere Choice-/Trace-/Access-/Break-/Pump-/Tag-/Setup-Fenster sowie spezielle Zahlungs- und Shell-Traders-Fälle.

### Runner Planer

Der Runner-Planer erzeugt Kandidaten unter anderem für:

- `pressure_rnd`,
- `pressure_hq`,
- `contest_remote`,
- `build_rig`,
- `recover_economy`,
- `draw_for_answers`,
- `trash_asset`,
- `safe_probe_run`.

Die Kandidaten entstehen aus aktuellen LegalActions und sichtbarem Zustand. Bewertet werden unter anderem:

- frühe Turn-Phase,
- Rig- und Breaker-Abdeckung,
- bekannte Run-Kosten,
- Server-Access-Wert,
- Remote-Threat,
- Corp-Scoring-Threat,
- sichtbarer Breaker-Plan,
- kurzlebiger Two-Turn-Intent,
- City-Surveillance-Risiken,
- installierte Economy,
- Shell-Traders-Kontext,
- Handnutzung und Duplicate-Install-Risiko,
- Remote-Contest- und Trash-Disziplin,
- Central-Pressure-Disziplin,
- Phase-Exit-Druck,
- Plan-Continuation,
- Outcome-Follow-up,
- Economy-Reserve,
- DeckDoctrine-Gewichte,
- Risiko- und Easy-Run-Strafen.

### Runner-Kontextverlust und lokale Brücken

Die wichtigsten Runner-Kontextverluste liegen dort, wo die AI in einem späteren Timingfenster nicht mehr als First-Class-State sieht, warum ein Run ursprünglich gestartet wurde.

Beobachtete Kontextbrücken im Ist-Stand:

- `reconstructRunnerPlanContinuationIntent` rekonstruiert Planfortsetzung aus PublicEvents und EventTail.
- `reconstructRunnerOutcomeFollowup` rekonstruiert Ergebnisfolgen aus jüngeren Runs, Accesses, Jack-outs und Economy-/Rig-Schritten.
- `assessKnownRezzedIcePath` bewertet sichtbare, rezzed ICE-Pfade sequentiell und erkennt known no-access, unpayable und unbreakable Zustände.
- `encounterRunRemainderEffectAssessment` bewertet sichtbare Restwirkungen im Encounter und verbleibende Pfadkosten.
- `runnerReachedAccessMovement` erkennt das Movement-/Jack-out-Fenster vor Access und schützt den Übergang zum Access gegen voreiliges Jack-out.
- Conditional-Payment-Fenster bleiben bewusst in der Baseline, damit Zahlungschoices nicht durch einen Plan überschrieben werden.
- Remote-Trash-Kontext wird über aktuelle Access-Daten, Rollen-/Trashkosten, Dedicated Credits, Finite-Pool-Wert, Budget-Reserve und letzte Decline-Events rekonstruiert.
- Central-Pressure-Wert wird an erreichbaren bekannten Access gebunden, damit bekannte unpayable/unbreakable Pfade nicht weiter wie echter Druck zählen.

Diese Brücken reduzieren konkrete Fehlentscheidungen, ersetzen aber keinen persistierten Runner-Intent.

## Corp-Ist-Struktur

### Corp Baseline

`chooseCorpAction` berechnet ebenfalls zuerst eine Baseline. Reaktive Baseline-Fenster umfassen unter anderem:

- Choice- und Trace-Entscheidungen,
- Mandatory Draw,
- Rez-/Decline-Fenster,
- Tag-Punish-/Source-Fenster,
- Purge-Entscheidungen.

Wenn die Baseline als reaktiv geschützt ist, wird kein Corp-Planer darübergelegt.

### Corp Planer

Der Corp-Planer erzeugt Kandidaten unter anderem für:

- `score_now`,
- `score_next_turn`,
- `build_scoring_remote`,
- `protect_hq`,
- `protect_rnd`,
- `recover_economy`,
- `bait_runner`.

Bewertet werden unter anderem:

- Agenda-Risiko,
- Server-Threat,
- Economy-Reserve,
- ICE-Rez-Fähigkeit,
- Scoring-Window,
- Scoring-Progress,
- Runner-Contest-Kapazität,
- Scoring-Horizon,
- Remote-Rez-Reserve,
- jüngster Remote-Agenda-Verlust,
- Advance-Protection,
- installierte Economy,
- Scored-Agenda-Actions,
- Extra-Actions,
- Plan-Continuation,
- strategische Linie,
- effektive Remote-Safety,
- Score-Conversion,
- Protection-to-Score,
- Score-Window-Compression,
- Remote-Portfolio,
- Central-ICE-Portfolio,
- HQ-Density,
- Outcome-Follow-up,
- Remote-Intent-Memory,
- DeckDoctrine-Gewichte,
- Root-Exposure- und sichtbare Risiko-Strafen.

### Corp-Kontextverlust und lokale Brücken

Die Corp hat stärker ausgebaute Board- und Scoring-Familien als persistierte Ziele, aber auch hier ist der Plan kein dauerhafter State.

Beobachtete Kontextbrücken im Ist-Stand:

- `reconstructCorpPlanContinuationIntent` rekonstruiert die jüngste Planlinie aus PublicEvents seit der letzten Conversion.
- `reconstructCorpOutcomeFollowup` erkennt Folgen von Runner-Steals, Remote-Failures, Access ohne Wert, Corp-Advance und Remote-Build-Pending.
- `evaluateCorpScoringWindow`, `evaluateCorpScoringProgress`, `evaluateCorpScoreWindowCompression` und verwandte Scoring-Evaluatoren bewerten, ob Score-/Advance-/Install-/Economy-Aktionen zum aktuellen Scoring-Fenster passen.
- `evaluateCorpEffectiveRemoteSafety` schützt Remote-Agenda-Install/Advance gegen sichtbar billigen Contest und bewertet Remote-Rollen.
- `evaluateRemoteIntentMemory` zieht Remote-Install-/Advance-/Score-Signale und Runner-HQ-/R&D-Druck aus EventTail.
- `evaluateCorpCentralIcePortfolio` und `assessCorpIcePortfolioAction` modellieren Central-Over-Ice, Rez-Reserve, Runner-Pressure, Agenda-Flood und Remote-Scoring-Bedarf.
- Future-Run-ICE-Placement bewertet ICE mit Zukunftswirkung abhängig von leerem oder bereits geschütztem Server.

Auch diese Brücken sind gewichtete, rekonstruierte Heuristiken. Sie sind kein gespeicherter Corp-Plan im GameState.

## Runner-vs-Corp-Unterschiede

| Aspekt             | Runner-Ist-Stand                                                                                              | Corp-Ist-Stand                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Planfamilien       | Druck auf R&D/HQ, Remote-Contest, Rig-Aufbau, Economy, Draw, Trash, Probe Run                                 | Score now/next turn, Scoring Remote, HQ/R&D-Schutz, Economy, Bait                                                   |
| Hauptkontext       | Run-Ziel, Access-Wert, Breaker-Abdeckung, bekannte Pfadkosten, Remote-Trash, Folge nach Access/Jack-out       | Scoring-Fenster, Remote-Safety, Rez-Reserve, Central-Portfolio, Runner-Contest, Agenda-Flood                        |
| Kontextverlust     | besonders sichtbar nach Run-Start, Encounter, Conditional Payment, Movement/Jack-out und Access               | besonders sichtbar zwischen Remote-Build, Advance, Score, Economy-Delay und Central-Protection                      |
| Lokale Fixes       | known path, no-access, unbreakable/unpayable, remote trash repeat, access movement, conditional payment guard | score conversion, economy-before-score, effective remote safety, central over-ice, rez reserve, future ICE ordering |
| Intent-Charakter   | kurzlebige Rekonstruktion aus Events und aktuellem Run-/Boardzustand                                          | kurzlebige Rekonstruktion aus Events, Boardstruktur und Scoring-/Portfolio-Evaluatoren                              |
| Persistenter State | nein                                                                                                          | nein                                                                                                                |

## Datenquellen und Verantwortlichkeiten

| Quelle / Ebene             | Verantwortlichkeit im Ist-Stand                                                                                         | Eingabe in AI-Entscheidung                                | Legalität?                | Hidden-Info-Grenze                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| Rules Engine / FullState   | erzeugt LegalActions, validiert `applyAction`, hält tatsächlichen Spielzustand                                          | indirekt über PlayerView, LegalActions und Server-Wrapper | ja, alleinige Autorität   | darf intern Hidden Info enthalten; nicht direkt als AIInput                                     |
| PlayerView                 | side-safe Sicht für die entscheidende Seite                                                                             | zentrale sichtbare Board-/Hand-/Run-/Event-Quelle         | nein                      | eigene Seitendaten ja; gegnerische Hidden Info nur als erlaubte Counts, Reveals oder Hypothesen |
| LegalActions               | aktuell erlaubte Aktionen mit IDs, Timing, Kosten, Targets, Choices und sanitisierten Payloads                          | alleinige Aktionsmenge für Scoring und Auswahl            | stammt aus Engine         | Payloads werden über Allowlist sanitisiert                                                      |
| `input-dto.ts`             | positive Allowlist für AIInput, PlayerView, PublicEvent-Payloads, LegalAction-Payloads und DeckDoctrine                 | baut den freigegebenen `AiDecisionInput`                  | nein                      | sperrt nicht erlaubte Felder und nested forbidden Payloads                                      |
| PublicEvents / EventTail   | sichtbare Historie für Rekonstruktion von Planfortsetzung, Outcome-Follow-up, Remote-Memory und Diagnose                | Kontextrekonstruktion und Evidence                        | nein                      | nur öffentliche oder side-safe Ereignisdaten                                                    |
| BeliefState                | rekonstruiert Fakten, Hypothesen, Unsicherheit, bekannte HQ-/R&D-Memory und Gegnermodell aus side-safe Daten            | Plan- und Debug-Kontext                                   | nein                      | Hypothesen statt gegnerischer Hidden Info                                                       |
| Visible Run Analysis       | bewertet bekannte rezzed ICE-Pfade, Breakbarkeit, Zahlbarkeit, Zugang zu Access und Restkosten                          | Run-/Remote-/Central-Bewertung                            | nein                      | nutzt sichtbare ICE-, Rig- und Creditdaten                                                      |
| AI Hints / Ontology        | liefert Rollen, Planrollen, strukturierte Ontology-Felder und strategische Kartensignale aus compiled Runtime-Hints     | Bewertungsgewichte, Klassifikation, Evidence              | nein                      | keine offizielle Kartendatenbank zur Laufzeit; keine Gegner-Hidden-Info                         |
| Ontology Consumer          | übersetzt strukturierte Hints in Breaker-, RemoteRole- und Tag/Punish-Klassifikation                                    | Run-Kosten, Remote-Safety, Tag-/Payoff-Diagnose           | nein                      | nur sichtbare Preconditions und LegalAction-Kontext                                             |
| DeckDoctrine               | bildet aus eigener DeckSnapshot-Seite Rollenprofile, Archetype-Tags, PlanWeights, MulliganWeights, Risiken und Evidence | Plan-/Opening-/Debug-Gewichte                             | nein                      | eigene Deck-/Hand-/Decklisteninformationen für die AI-Seite; keine gegnerische Hidden Info      |
| Baseline Scoring           | bewertet einzelne LegalActions, schützt reaktive Fenster und liefert Fallback                                           | erster Entscheidungsentwurf                               | nein                      | nur AIInput                                                                                     |
| Runner-/Corp-Planer        | erzeugt Plan-Kandidaten, bewertet sichtbaren Kontext und wählt planfähige Aktion                                        | Planentscheidung und Debug                                | nein                      | nur AIInput, BeliefState, Doctrine und erlaubte Hints                                           |
| Server-Multiplayer-Wrapper | ruft AI, wählt stabile Fallback-LegalAction, speichert optionale Trace-/Debugdaten und reicht Action an `applyAction`   | Betriebsintegration                                       | nein, delegiert an Engine | Trace-Ausgabe wird über sanitisierten AI-Debug-/Replay-Pfad begrenzt                            |
| Tests und Metrics          | prüfen Side-Safety, Stabilität gegen verbotene Payloadfelder, Runpath, Score-/Economy-/Remote-/Portfolio-Fälle          | Regressionsevidence                                       | nein                      | Tests sichern explizit gegen Hidden-Field-Einfluss und unsichere AIInputs                       |

## Bekannte lokale Fixes im Ist-Stand

Die Bestandsaufnahme findet bereits mehrere konkrete Fix-Schichten, die nicht als Zielbild, sondern als vorhandener Zustand zu verstehen sind:

- side-safe AIInput-Sanitizing über positive Allowlist,
- Stabilität gegen eingeschleuste forbidden Payloadfelder,
- Auswahl der tatsächlich entscheidenden Seite auch in Timingfenstern, in denen `activeSide` nicht die entscheidende AI-Seite ist,
- bekannte rezzed ICE-Pfadprojektion mit sequentiellen Kosten,
- Unterscheidung von unpayable und unbreakable no-access,
- Schutz des Movement-/Jack-out-Fensters direkt vor Access,
- Conditional-Payment-Behandlung über Baseline,
- Remote-Trash-Bewertung mit Rollen-, Trashkosten-, Dedicated-Credit-, Budget- und Repeat-Kontext,
- Central-Pressure-Gating an erreichbaren bekannten Access,
- Corp Score-/Advance-to-score-Konversion,
- Corp Economy-before-score-Attribution,
- Corp Effective-Remote-Safety,
- Corp Central-ICE-Portfolio und Rez-Reserve,
- Corp Future-Run-ICE-Ordering,
- Runtime-compiled AI-Hints als Bewertungsquelle ohne Legalitätswirkung.

## Offene Ist-Risiken

Diese Punkte sind als beobachtete Risiken des aktuellen Stands formuliert, nicht als Umsetzungsvorschläge:

- Es gibt keinen persistierten AI-Intent. Planfortsetzung und Outcome-Follow-up hängen von rekonstruierbaren PublicEvents, EventTail, Profil-Gates und aktuellen LegalActions ab.
- Plan-Continuation und Outcome-Follow-up sind profilabhängig. Wenn ein Profil die entsprechenden Gates nicht aktiviert oder keine DeckDoctrine verfügbar ist, fallen Teile der Kontextbrücke weg.
- Runner-Run-Zweck wird nicht als First-Class-Commitment im GameState gespeichert. Spätere Encounter-, Payment-, Jack-out- oder Access-Fenster müssen den Zweck aus aktuellem Runzustand und Historie rekonstruieren.
- Conditional-Payment-Entscheidungen bleiben absichtlich Baseline-getrieben. Der ursprüngliche Run-Zweck überlebt danach nur über rekonstruierbare Event- und Board-Signale.
- PublicEvent-Payloads sind eine zentrale Rekonstruktionsquelle. Wenn ein fachlich relevantes Signal dort fehlt oder nicht side-safe übertragen wird, kann die AI es im Folgefenster nicht als Kontext verwenden.
- BeliefState und OpponentModel sind side-safe Hypothesenmodelle, keine vollständige Wissensbasis.
- DeckDoctrine beeinflusst Gewichtung und Debug, erzeugt aber keine Legalität und ersetzt keinen planstabilen AI-State.
- Corp-Scoring- und Remote-Portfolio-Logik ist umfangreich, bleibt aber eine gewichtete Ist-Heuristik statt eines dauerhaft gespeicherten mehrzügigen Plans.
- AI-Debug und Metrics sind stark ausgebaut; sie belegen viele lokale Korrekturen, garantieren aber keine vollständige strategische Kohärenz über lange Partien.

## Geprüfte Dateien

Primär gesichtete AI- und Integrationspfade:

- `packages/ai/src/index.ts`
- `packages/ai/src/input-dto.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/visible-run-analysis.ts`
- `packages/ai/src/belief-state.ts`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/breaker-ontology-consumer.ts`
- `packages/ai/src/remote-role-ontology-consumer.ts`
- `packages/ai/src/tag-punish-ontology-consumer.ts`
- `packages/ai/src/hint-ontology.ts`
- `packages/ai/src/index.test.ts`
- `packages/shared/src/index.ts`
- `apps/server/src/multiplayer.ts`

Dokumentationspfad:

- `docs/reviews/ai/README.md`

## Bewusste Nicht-Änderungen

Diese Aufgabe hat keine Code-, Strategie-, Profil-, Hint-, Deck-, Engine-, Test- oder Catalog-Änderung vorgenommen. Die Dokumentation beschreibt nur den Ist-Stand der AI-Entscheidungsarchitektur.
