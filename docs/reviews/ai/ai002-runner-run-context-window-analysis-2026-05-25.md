# AI002 Runner Run-Kontext / Timingfenster-Analyse

Aufgabe-ID: AI002

Datum im Aufgabenauftrag: 2026-05-25

Arbeitsart: reine Ist-Analyse zum Runner-Run-Kontext über Run-Timingfenster hinweg

## Kurzfazit

Der aktuelle Runner-Run-Kontext ist in mehreren Schichten vorhanden, aber nicht als persistierter Run-Zweck oder Intent gespeichert.

Im Engine-State existiert ein `RunState` mit `runId`, `attackedServerId`, Phase, Position, approached/encountered/accessed ICE/Card-IDs, Access-/Breach-Informationen und einigen Run-Duration-Markern. Der AI-Input sieht daraus nur den side-safe Ausschnitt aus `PlayerView.run`: `attackedServerId`, `phase`, `position`, optional `approachedIce`, `encounteredIce`, `accessedCard`, `breach`, `badPublicityCredits` und `successful`.

Die AI kann den Run-Zweck aktuell nur rekonstruieren:

- aus der aktuellen LegalAction-Menge,
- aus `PlayerView.run`,
- aus sichtbaren Server-/ICE-/Root-Daten,
- aus PublicEvents/EventTail,
- aus BeliefState-Memory,
- aus visible-run-analysis,
- aus AI-Hints/Ontology-Rollen,
- aus Debug-/Evidence-Markern der aktuellen Entscheidung.

Nicht als AIInput-First-Class-Felder vorhanden sind der ursprüngliche Run-Zweck, der ursprüngliche ReasonCode, ein Run-Intent, `runId`, vollständige Passed-ICE-Historie, explizit aufgelöste Payment-/Harm-Schritte, `accessCount` und ein stabiler Intent-Fulfillment-Zusammenhang zwischen Run-Start, Access und Trash.

## Bezug zu AI001

AI001 hat festgehalten, dass die AI LegalAction-basiert entscheidet und keine persistierten Intents besitzt. AI002 bestätigt dies für Runner-Runs im Detail: Run-Kontext ist technisch side-safe rekonstruierbar, aber die Rekonstruktion verteilt sich über LegalActions, PlayerView, PublicEvents, BeliefState, Planer-Scoring, visible-run-analysis und Metrics. Sie ersetzt keinen gespeicherten Runner-Intent.

## Scope und Nicht-Ziele

Diese Review beschreibt den Ist-Zustand. Sie bewertet keine Zielstruktur und plant keine Folgearbeit.

Bewusst nicht enthalten:

- keine Zielarchitektur,
- keine Roadmap,
- keine Folgepakete,
- keine Umsetzungsempfehlung,
- keine Priorisierung,
- keine Codeänderung,
- keine Teständerung,
- keine Engine-Regeländerung,
- keine LegalAction-Änderung,
- keine Action-Score-Änderung,
- keine PlanWeight-Änderung,
- keine Profil-/Default-Umschaltung,
- keine Deck-, Catalog-, Proteus- oder AI-Hintdaten-Änderung.

## Geprüfte Fundstellen

Primär geprüft:

- `packages/ai/src/index.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/visible-run-analysis.ts`
- `packages/ai/src/input-dto.ts`
- `packages/ai/src/belief-state.ts`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/index.test.ts`
- `packages/shared/src/index.ts`
- `packages/engine/src/game/turn/runner-main-actions.ts`
- `packages/engine/src/game/run/start-run-action-execution.ts`
- `packages/engine/src/game/run/run-core-execution.ts`
- `packages/engine/src/game/run/encounter-actions.ts`
- `packages/engine/src/game/run/run-movement.ts`
- `packages/engine/src/game/run/run-access-transition.ts`
- `packages/engine/src/game/access/access-actions.ts`
- `packages/engine/src/game/access/access-flow.ts`
- `packages/engine/src/public-context.ts`
- `docs/reviews/ai/ai001-decision-architecture-inventory-2026-05-25.md`

## Run-Start-Kontext

### LegalAction beim Run-Start

Der Run-Start ist eine Runner-`LegalAction` vom Typ `start_run`.

Die normale Main-Action-Generierung erzeugt sie in `runner-main-actions.ts` mit:

- `type: "start_run"`,
- Label `Run auf <Server>`,
- Quelle `basic_action`,
- Kosten typischerweise `clicks: 1` plus optionale Run-Start-Taxes,
- Payload mit `serverId`.

Varianten desselben Action-Typs können zusätzliche Payloadfelder tragen, etwa:

- `bonusRunNoClick`,
- `bonusRunSource`,
- `pirateBroadcastRun`,
- `wilsonRunOnlyAction`,
- `runSpendingCap`,
- `runStartTaxCredits`,
- Run-Start-Tax-Quellenfelder.

Im AIInput bleiben durch `input-dto.ts` davon nur allowlistete primitive Payloadfelder erhalten. Für den normalen Run-Start ist `serverId` das zentrale robuste Feld.

### Engine-State nach Run-Start

`startRun` erzeugt im Engine-State einen `RunState` mit unter anderem:

- `runId`,
- `attackedServerId`,
- `phase: "approach_ice"`,
- `position` als äußerstes ICE oder Serverposition,
- leeren `brokenSubroutineIndexes` und `resolvedSubroutineIndexes`,
- `successful: false`,
- `accessCount`,
- optionale Successful-Run-Replacement- und Access-Modifier-Felder.

Die AI sieht davon nicht den vollständigen `RunState`, sondern den PlayerView-Ausschnitt.

### AI-sichtbare Startdaten

Beim Run-Start selbst oder unmittelbar danach sind für die AI verfügbar:

- Zielserver über `LegalAction.payload.serverId`,
- später im Run über `PlayerView.run.attackedServerId`,
- Servertyp indirekt aus Server-ID (`hq`, `rd`, `archives`, `remote_*`) und `PlayerView.servers`,
- aktueller sichtbarer ICE-/Root-Zustand über `PlayerView.servers`,
- eigene Credits, Hand, Rig, Tags und Memory,
- bekannte Root-Karten und known/rezzed ICE,
- planfähige Run-Familie über Runner-Planer-Kandidaten:
  - `pressure_rnd`,
  - `pressure_hq`,
  - `contest_remote`,
  - `safe_probe_run`,
- ReasonCodes wie `runner.run.visible_pressure`, `runner.run.blocked_by_rezzed_ice`, `runner.run.empty_remote_low_value` oder Plan-ReasonCodes wie `runner.plan.contest_remote`.

Nicht gespeichert wird:

- ein expliziter ursprünglicher Run-Zweck wie `trash known asset`, `steal/contest agenda`, `central pressure`, `HQ/R&D multiaccess`, `force rez` oder `probe`,
- der ursprüngliche Runner-ReasonCode im RunState,
- ein Run-Intent-Objekt.

### Rekonstruierbarer Run-Zweck

Der ursprüngliche Zweck ist teilweise rekonstruierbar:

- Remote mit bekanntem trashbarem Root: aus `PlayerView.servers[*].root`, Hints/Rollen, Trashkosten und `assessKnownRezzedIcePath`.
- Remote-Agenda/Contest: aus known Agenda/Advancement-Countern, Root Count, Remote-Threat-Profil und Corp-Scoring-Threat.
- Central Pressure: aus Zielserver, R&D/HQ-Memory, installierten Interface-/Multiaccess-Rollen und `runnerCentralPressureOpportunity`.
- Known no-access: aus `assessKnownRezzedIcePath`, Breaker-/Credit-Sicht und visible effective run quote.
- Repeat-Kontext: aus PublicEvents/EventTail und BeliefState.

Diese Rekonstruktion ist verteilt. Sie ist kein persistierter Zweck.

## Encounter-Kontext

### AI-sichtbarer Encounter-Zustand

Im Encounter sieht die AI über `PlayerView.run`:

- `attackedServerId`,
- `phase: "encounter_ice"`,
- `position` mit Server-ID und ICE-Index,
- `encounteredIce`, sofern side-safe sichtbar,
- sichtbare ICE-Daten inklusive `effectiveRunQuote`,
- den gesamten sichtbaren Serverpfad in `PlayerView.servers`,
- eigene Rig-/Breaker-Daten,
- aktuelle Runner-Credits.

Die LegalActions im Encounter können enthalten:

- `pump_breaker`,
- `break_subroutine`,
- `continue_run`,
- Sonderfenster-/Ability-Aktionen.

`continue_run` im Encounter trägt bei ausgelösten ungebrochenen Subroutinen eine Payload mit:

- `encounterContinue: true`,
- `sourceDefinitionId`,
- `unbrokenSubroutineCount`,
- `encounterWillEndRun`,
- `payOrTrashProgramSubroutineIndexes`,
- `payOrTrashProgramSubroutinePayment`,
- `payOrEndRunSubroutineIndexes`,
- `payOrEndRunSubroutinePayment`.

Diese Conditional-Payment-Felder sind in der AIInput-Allowlist enthalten.

### Encounter-Bewertung

Die Baseline in `index.ts` bewertet:

- `break_subroutine` über `encounterRunRemainderEffectAssessment`,
- `pump_breaker` über `pumpViabilityAssessment`,
- `continue_run` über Restwirkung, Future-Path-Risiko und Conditional-Payment-Effekte.

`encounterRunRemainderEffectAssessment` nutzt:

- `currentEncounteredIceCard(input)?.effectiveRunQuote`,
- die aktuelle Run-Position,
- verbleibende ICE aus dem sichtbaren Serverpfad,
- unbroken run effects,
- sichtbare Future-Path-Blocker,
- Conditional-Payment-Payloadfelder.

Debug/Evidence kann dabei etwa enthalten:

- `run_remainder_subroutine_effect:true`,
- `future_effect_remaining_ice:<n>`,
- `future_path_blocked_if_unbroken:<bool>`,
- `future_path_cost_delta_if_unbroken:<n>`,
- `run_remainder_effect_must_break:true`,
- Conditional-Payment-Wirkung über Score/Evidence der gewählten Continue-Action.

### Encounter-Kontextverlust

Der ursprüngliche Run-Zweck ist im Encounter nicht als Feld vorhanden. Die AI bewertet Encounter-Entscheidungen primär aus:

- aktuellem ICE,
- sichtbaren Subroutinen,
- Breaker-/Credit-Lage,
- verbleibendem sichtbarem Pfad,
- optionaler Remote-/Central-Rekonstruktion aus dem Planer.

Es gibt kein AIInput-Feld, das sagt:

- dieser Run wurde gestartet, um eine konkrete bekannte Remote-Karte zu trashen,
- dieser Run wurde gestartet, um HQ/R&D-Multiaccess zu nutzen,
- dieser Run-Zweck besteht nach dem Encounter weiterhin,
- dieses ICE wurde passiert und der dabei gezahlte Schaden/Kostenpunkt erfüllt einen Intent-Fortschritt.

## Jack-out-Fenster

### Verfügbare Daten im `run.jack_out_window`

Im Jack-out-Fenster hat der AIInput ein `playerView.run`-Objekt. Es enthält side-safe:

- `attackedServerId`,
- `phase`,
- `position`,
- optional `approachedIce`,
- optional `encounteredIce`,
- optional `accessedCard`,
- optional `breach`,
- optional `badPublicityCredits`,
- `successful`.

Die Position unterscheidet:

- `position.kind: "ice"` mit `serverId` und `iceIndex`,
- `position.kind: "server"` direkt vor Access.

Aus `PlayerView.servers` kann die AI ableiten:

- sichtbare ICE-Liste,
- Root-Liste,
- bekannte/rezzed ICE,
- bekannte Root-Ziele,
- rechnerisch remaining ICE oder next ICE aus Position und Serverpfad.

Nicht direkt als AIInput-Feld vorhanden:

- `currentRun` als vollständiger Engine-RunState,
- `runId`,
- passed ICE count,
- vollständige passed ICE IDs,
- explizit resolved previous ICE,
- ob Payment/Harm am vorherigen ICE vollständig intent-relevant erledigt wurde,
- ursprünglicher ReasonCode,
- ursprünglicher Run-Zweck,
- `accessCount`,
- ursprünglicher erwarteter Payoff.

### LegalActions im Jack-out-Fenster

`buildRunnerMovementActions` erzeugt typischerweise:

- `jack_out`,
- `continue_run`.

Bei Jack-out-Lock gibt es nur `continue_run`. Bei Zusatzkosten kann `jack_out` Kosten und Payload wie `jackOutAdditionalCost` tragen. `jack_out` selbst trägt keinen Run-Zweck.

### Bewertung `jack_out` vs `continue_run`

Die Baseline behandelt `jack_out` unterschiedlich:

- Wenn `runnerReachedAccessMovement(input)` wahr ist, bekommt `jack_out` einen sehr niedrigen Score, ReasonCode `runner.run.jack_out_before_access_low_value` und Evidence `access_window_reached`.
- Sonst ist `jack_out` ein sicherer Exit mit ReasonCode `runner.run.jack_out_safe_exit`.

Der Runner-Planer behandelt `continue_run` und `jack_out` als `safe_probe_run`-Kandidaten. Die Action-Priority bevorzugt `continue_run`, wenn:

- Access-Bewegung erreicht ist,
- das aktuelle Movement-ICE bezahlbar ist,
- `runnerShouldContinueCurrentRemoteRun(input)` wahr ist.

`runnerShouldContinueCurrentRemoteRun` prüft im Ist-Stand:

- Timing `run.jack_out_window`,
- Run-Phase `movement`,
- Position an ICE,
- Remote-Ziel,
- vorhandene Root-Karten,
- known/rezzed aktuelles ICE über `runnerCanAffordCurrentMovementIce`,
- sonst Remote-Contest-Profil inklusive relevantem Trash, Coverage, known ICE cost und Post-Run-Reserve.

Damit wird der Remote-/Central-Payoff im Jack-out-Fenster teilweise neu berechnet. Er wird aber nicht aus einem gespeicherten ursprünglichen Intent geladen.

### Washed-Up-Fall

Der aktuelle Test `continues toward a remote payoff after paying Washed-Up before unrezzed ICE` belegt:

- Run-Start auf `remote_1`,
- Conditional Payment im Encounter als `continue_run` mit 1 Credit,
- danach `run.jack_out_window`,
- `run.approachedIceId` auf das nächste ICE,
- AI wählt `continue_run`,
- ReasonCode `runner.plan.safe_probe_run`,
- Evidence `remote_score_threat_visible:true`.

Der Ist-Stand enthält also eine lokale Kontextbrücke für diesen Fall. Der ursprüngliche Remote-Zweck bleibt aber nicht als eigener Intent erhalten; er wird im Fenster aus Remote-Zustand, LegalActions und Planerheuristik neu rekonstruiert.

Ein Fall, in dem nach bezahltem Continue trotzdem `jack_out` höher scoren kann, ist im aktuellen Codebild erklärbar, wenn die rekonstruierenden Bedingungen nicht greifen:

- kein `runnerReachedAccessMovement`,
- aktuelles Movement-ICE nicht bezahlbar oder nicht als known/rezzed einschätzbar,
- Remote-Profil nicht `contestable` oder nicht `relevantTrash`,
- blockiert durch Breaker-Coverage, known ICE cost oder Post-Run-Reserve,
- kein side-safe Event-/Root-Signal für den ursprünglichen Zweck.

Das ist eine Ist-Beschreibung der Scoringbedingungen, keine Fixempfehlung.

## Continue-run und Access

### Continue-run

`continue_run` kann in mehreren Phasen auftreten:

- Encounter: Subroutinen auslösen/weiterlaufen, optional mit Conditional Payment.
- Movement: zur nächsten ICE-Approach-Phase oder in Access übergehen.
- Access: Zugriff abschließen, wenn kein weiterer Access-Kandidat offen ist.

Beim Movement-Continue nutzt `continueFromMovement` den Engine-RunState:

- bei `position.kind === "ice"` wird das nächste ICE approached/encountered,
- bei `position.kind === "server"` startet Access aus erfolgreichem Run.

Die AI sieht vor der Entscheidung genug, um Server, Phase, Position und sichtbaren Pfad zu erkennen. Sie sieht aber keinen expliziten ursprünglichen Zweck.

### Access

Beim Access sieht die AI über `PlayerView.run`:

- `phase: "access"`,
- `attackedServerId`,
- `successful: true`,
- optional `breach` mit `serverId`, `currentIndex`, `remainingCount`, `completed`,
- optional `accessedCard`,
- LegalActions wie `access_card`, `steal_agenda`, `trash_accessed_card`, `decline_trash`, `continue_run`.

`access_card` öffnet die aktuelle Karte. `trash_accessed_card` und `decline_trash` entstehen aus `access-actions.ts`, wenn die Zugriffskarte und Kostenlage passen.

Bei Remote-Access verbindet die AI die aktuelle bekannte Karte mit Trash-Wert über:

- `runnerRemoteTrashAccessContext` in der Baseline,
- `currentRemoteTrashAccessContext` im Planer,
- Rollen aus AI-Hints/Ontology,
- Trashkosten,
- Dedicated Credits,
- Finite-Pool-Erkennung,
- BBS-Whispering-Campaign-Sondererkennung,
- Reserve-/Budget-Kontext,
- akutem Remote-Threat-Kontext.

Was nicht als direkte Beziehung gespeichert ist:

- Run wurde wegen bekannter Remote-Karte gestartet,
- Access wurde erreicht,
- Trash ist legal,
- ursprünglicher Zweck ist erfüllt oder verfehlt.

Diese Beziehung entsteht aktuell nur im Moment der Access-Entscheidung aus aktuellem Zustand und Historie.

### Access-/Trash-Metriken

Die Metrics-Schicht dokumentiert viele Access-/Trash-Fälle, unter anderem:

- `runnerRemoteAccessWithRelevantTrashableCard`,
- `runnerAffordableRelevantRemoteTrashOpportunity`,
- `runnerRelevantRemoteTrashTaken`,
- `runnerSkippedAffordableRelevantRemoteTrash`,
- `runnerRemoteTrashDeclined`,
- `runnerBbsWhisperingCampaignAccessed`,
- `runnerBbsWhisperingCampaignTrashLegal`,
- `runnerBbsWhisperingCampaignTrashTaken`,
- `runnerBbsWhisperingCampaignTrashSkipped`,
- `runnerBbsWhisperingCampaignTrashSkippedAffordable`,
- Repeat-/FixGate-Metriken für Remote-Trash.

Diese Metriken belegen den Ist-Zustand, sind aber kein Live-Intent-State.

## Repeat-Run-Kontext

### Verfügbare Historie

Repeat-Erkennung nutzt:

- `playerView.publicEvents`,
- `eventTail`,
- BeliefState-Rekonstruktion,
- serverId-Felder oder serverLabel-Fallbacks,
- ActionTypes wie `start_run`, `access_card`, `trash_accessed_card`, `decline_trash`, `jack_out`,
- stateVersion-Abstände.

`belief-state.ts` klassifiziert `start_run`, `jack_out` und `continue_run` als Run-Familie; `access_card` als Access; `trash_accessed_card` als Trash. Server-IDs werden aus `serverId`, `attackedServerId`, `targetServerId`, `server` oder Labels normalisiert.

### Vorhandene Repeat-Fixes

Vorhandene lokale Wiederholungsbremsen:

- R&D/HQ/Archives-Stale-Repeat-Penalties über BeliefState-Memory.
- `recentRemoteJackOutRepeatRunPenalty` in der Baseline.
- `recentSameRemoteJackOutWithoutAccess` im Planer.
- `evaluateRunnerPlanContinuationAbort` mit kurzlebiger Intent-Rekonstruktion.
- `evaluateRunnerOutcomeFollowup` mit `central_no_value`, `remote_empty_or_low_value`, `remote_value`, `jack_out_blocked`, `economy_or_rig_ready`.
- `remoteServerHasKnownRelevantTrashTarget`.
- `recentRunnerDeclinedRelevantRemoteTrash`.
- known no-access / unpayable / unbreakable über `assessKnownRezzedIcePath`.
- Central-Pressure-Gating an `accessReachable`.
- Remote-Trash-Repeat-Evidence `runner_repeat_remote_after_declined_trash_penalized:true`.

Diese Fixes sind verteilt über Baseline, Runner-Planer, visible-run-analysis, BeliefState und Metrics. Sie sind nicht als einheitlicher Repeat-State modelliert.

### Noch nicht zuverlässig abgedeckte Repeat-Kontexte im Ist-Stand

Als Ist-Risiken, ohne Lösungsvorschlag:

- Wiederholung nach einem Zweckverlust, wenn kein PublicEvent den Zweck oder das verfehlte Outcome side-safe trägt.
- Wiederholung nach bezahltem Conditional Payment, wenn Remote-/Central-Payoff im späteren Fenster nicht erneut rekonstruierbar ist.
- Wiederholung bei Multiaccess-/Interface-Erwartung, wenn AccessCount oder erwarteter Payoff nicht durch AIInput-Felder erhalten bleibt.
- Wiederholung nach Jack-out/No-Access, wenn Serverzustand scheinbar unverändert ist, aber die relevante Ursache nicht als Event/Evidence erhalten wurde.

## Datenquellen-Tabelle

| Informationsbedarf            | Run-Start                                | Encounter                         | Jack-out-Fenster                    | Continue-run                      | Access                            | Repeat-Bewertung                          | Quelle                                       | vorhanden | zuverlässig | side-safe |
| ----------------------------- | ---------------------------------------- | --------------------------------- | ----------------------------------- | --------------------------------- | --------------------------------- | ----------------------------------------- | -------------------------------------------- | --------- | ----------- | --------- |
| attacked server               | `LegalAction.payload.serverId`           | `PlayerView.run.attackedServerId` | `PlayerView.run.attackedServerId`   | `PlayerView.run.attackedServerId` | `PlayerView.run.attackedServerId` | PublicEvents/EventTail                    | LegalAction, PlayerView, PublicEvents        | ja        | ja          | ja        |
| server type                   | aus Server-ID ableitbar                  | aus Server-ID ableitbar           | aus Server-ID ableitbar             | aus Server-ID ableitbar           | aus Server-ID ableitbar           | aus Event-Server-ID ableitbar             | PlayerView, PublicEvents                     | ja        | ja          | ja        |
| ursprünglicher Run-Zweck      | Plan/ReasonCode nur als aktuelle Auswahl | nicht als Feld                    | nicht als Feld                      | nicht als Feld                    | nicht als Feld                    | nur rekonstruiert                         | Planer, ReasonCode, EventTail                | teilweise | nein        | ja        |
| erwarteter Payoff             | aus Board/Plan/Hints berechnet           | aus Zustand neu berechnet         | aus Zustand neu berechnet           | aus Zustand neu berechnet         | aus Zugriffskarte neu berechnet   | aus Outcome-Follow-up                     | PlayerView, Hints, Planer                    | teilweise | nein        | ja        |
| known remote target           | bekannte Root-Karten sichtbar            | weiterhin über Server sichtbar    | weiterhin über Server sichtbar      | weiterhin über Server sichtbar    | `run.accessedCard` sichtbar       | Event-/Belief-Rekonstruktion              | PlayerView.servers, PlayerView.run           | ja        | ja          | ja        |
| known central multiaccess     | installierte Rollen/Run-Events sichtbar  | indirekt                          | indirekt                            | indirekt                          | Breach-Ausschnitt sichtbar        | teils über Belief/PublicEvents            | Rig/Hints/Breach/PublicEvents                | teilweise | nein        | ja        |
| known/rezzed ICE path         | sichtbarer Serverpfad                    | aktuelles ICE plus Pfad           | aktuelles/nächstes ICE plus Pfad    | aktuelles/nächstes ICE plus Pfad  | meist nicht mehr relevant         | known path penalties                      | PlayerView.servers, visible-run-analysis     | ja        | ja          | ja        |
| missing breaker coverage      | aus Pfadanalyse ableitbar                | aus Encounter/Pfad ableitbar      | aus Movement-ICE/Pfad ableitbar     | aus Movement-ICE/Pfad ableitbar   | nicht primär Access-Feld          | Repeat-No-Access                          | visible-run-analysis, Rig, Hints             | ja        | ja          | ja        |
| conditional payment resolved  | nein                                     | LegalAction-Payload der Zahlung   | nicht als expliziter History-State  | nur über Event/aktuellen Zustand  | nicht als Zweck-Feld              | nur aus Events/Evidence                   | LegalAction, PublicEvents                    | teilweise | nein        | ja        |
| paid harm prevention          | nein                                     | je nach LegalAction/Payload       | nicht einheitlich als AIInput-State | nicht einheitlich                 | nicht als Intent-Fulfillment      | nur aus Events/Evidence                   | LegalAction, PublicEvents                    | teilweise | nein        | ja        |
| remaining ICE / next ICE      | aus Position/Serverpfad nach Run-Start   | aus Position/Serverpfad           | aus Position/Serverpfad             | aus Position/Serverpfad           | nein, außer Breach/Access-Kontext | nicht als gespeicherter Wert              | PlayerView.run.position, servers             | ja        | ja          | ja        |
| canReachAccess                | berechnet                                | berechnet                         | berechnet                           | berechnet                         | Access erreicht                   | berechnet aus known path                  | visible-run-analysis                         | ja        | ja          | ja        |
| credits after payment/path    | berechnet                                | berechnet/aktuelle Credits        | berechnet/aktuelle Credits          | berechnet/aktuelle Credits        | aktuelle Credits/Trashkosten      | berechnet                                 | PlayerView.own.credits, visible-run-analysis | ja        | teilweise   | ja        |
| trash legal and affordable    | für bekannte Remote-Root-Karte berechnet | noch nicht direkt legal           | noch nicht direkt legal             | noch nicht direkt legal           | LegalAction `trash_accessed_card` | Event-/Plan-Rekonstruktion                | LegalActions, Access, RemoteTrashContext     | ja        | ja          | ja        |
| previous access outcome       | nein                                     | nein                              | über PublicEvents rekonstruierbar   | über PublicEvents rekonstruierbar | aktuelles Outcome entsteht gerade | Outcome-Follow-up                         | PublicEvents, BeliefState                    | teilweise | teilweise   | ja        |
| previous declined trash       | nein                                     | nein                              | über EventTail rekonstruierbar      | über EventTail rekonstruierbar    | aktueller Decline möglich         | `recentRunnerDeclinedRelevantRemoteTrash` | EventTail, PublicEvents                      | ja        | teilweise   | ja        |
| state changed since prior run | indirekt                                 | indirekt                          | indirekt                            | indirekt                          | indirekt                          | Refresh-Events/Invalidierungen            | BeliefState, PublicEvents                    | teilweise | teilweise   | ja        |

## Kontextverluststellen

Für die geprüften Stellen blieb keine relevante Verluststelle als `unknown`
stehen; nicht belegbare Punkte wurden nicht in die Tabelle aufgenommen.

| Klassifikation                          | Beschreibung                                                                                                                                                      | Phase                       | Beispielbezug                 | Risiko für KI-Verhalten                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `available_and_used`                    | `attackedServerId`, Phase und Position werden aus `PlayerView.run` genutzt.                                                                                       | Encounter, Jack-out, Access | Washed-Up, Data Wall          | gering für Zielserver-Erkennung                                           |
| `available_and_used`                    | Known/rezzed ICE-Pfad wird über `assessKnownRezzedIcePath` bewertet.                                                                                              | Run-Start, Jack-out         | Data Wall / HQ Interface      | gering für bekannte no-access Fälle, soweit Pfad sichtbar ist             |
| `available_and_used`                    | Remote-Trash-Kontext nutzt accessedCard, Trashkosten, Rollen, Finite-Pool und BBS-Erkennung.                                                                      | Access                      | BBS / Remote-Trash            | gering im aktuellen Access-Fenster, wenn Karte bekannt und legal trashbar |
| `available_and_used`                    | `runnerReachedAccessMovement` schützt die Serverposition direkt vor Access gegen Jack-out.                                                                        | Jack-out-Fenster            | Last-ICE-Access-Test          | gering direkt vor Access                                                  |
| `available_but_not_carried_forward`     | ursprünglicher ReasonCode existiert als Entscheidungsausgabe, wird aber nicht in RunState/AIInput getragen.                                                       | Run-Start bis Access        | alle drei Live-Befunde        | späterer Zweck muss neu rekonstruiert werden                              |
| `available_but_not_carried_forward`     | Engine-`runId` existiert, ist aber nicht in `PlayerView.run`/AIInput.                                                                                             | alle Run-Fenster            | Multiaccess-/Payment-Historie | Events lassen sich nicht über ein AIInput-RunId-Feld an den Run binden    |
| `available_but_not_carried_forward`     | `accessCount` existiert im Engine-RunState und PublicContext, ist aber nicht im AIInput-Run-Ausschnitt sichtbar.                                                  | Run-Start, Access           | HQ/R&D Multiaccess            | erwarteter Central-Payoff bleibt indirekt                                 |
| `available_but_not_carried_forward`     | Passed-ICE-IDs und last-passed Marker existieren für Engine-Followups, aber nicht als allgemeiner AIInput-Kontext.                                                | nach Encounter              | Washed-Up / Post-Pass-Fenster | bezahlter/überstandener Pfadfortschritt bleibt nur indirekt sichtbar      |
| `reconstructable_but_not_reconstructed` | ursprünglicher Zweck `trash known remote asset` kann aus Start-Run, Root, Access und Trash hergeleitet werden, ist aber kein expliziter Intent-Fulfillment-State. | Access, Repeat              | BBS / Remote-Trash            | Zweck kann bei fehlendem Event-/Root-Signal verloren gehen                |
| `reconstructable_but_not_reconstructed` | Central-Multiaccess-Payoff ist über Rig/Hints/Breach teilweise herleitbar, aber kein durchgehender Run-Zweck.                                                     | Run-Start, Access, Repeat   | Data Wall / HQ Interface      | Multiaccess kann ohne Reachability als Wert erscheinen, wenn Gates fehlen |
| `missing_from_ai_input`                 | expliziter ursprünglicher Run-Zweck fehlt.                                                                                                                        | alle Run-Fenster            | alle drei Live-Befunde        | spätere Fenster bewerten isolierter                                       |
| `missing_from_ai_input`                 | explizit aufgelöste Conditional-Payment-/Harm-Historie fehlt als Run-Kontext.                                                                                     | nach Encounter              | Washed-Up Solo Construct      | Zahlung kann vom ursprünglichen Payoff entkoppelt werden                  |
| `missing_from_legal_action_payload`     | `continue_run` im Movement hat normalerweise keinen Ziel-/Payoff-Payload.                                                                                         | Jack-out, Continue-run      | Washed-Up Solo Construct      | Continue muss aus `PlayerView.run`/Planer neu verstanden werden           |
| `missing_from_public_events`            | PublicEvents tragen Aktionen und ausgewählte Payloads, aber keinen kanonischen RunIntent.                                                                         | Repeat                      | BBS / Repeat-Remote           | Repeat-Erkennung bleibt heuristisch                                       |
| `missing_from_debug_only`               | Evidence dokumentiert lokale Gründe, ist aber kein Regel- oder Intent-State für spätere Entscheidungen.                                                           | alle AI-Entscheidungen      | BBS, Data Wall, Washed-Up     | Debug kann Verhalten erklären, aber nicht stabil fortführen               |

## Beispiele aus den Live-Befunden

### BBS / Remote-Trash

Ist-Stand:

- Beim Remote-Run ist `serverId`/`attackedServerId` sichtbar.
- Eine bekannte Root-Karte kann über `PlayerView.servers` sichtbar sein.
- Beim Access ist `PlayerView.run.accessedCard` sichtbar.
- `trash_accessed_card` ist als LegalAction vorhanden, wenn die Engine sie anbietet.
- BBS Whispering Campaign wird in Remote-Trash-Kontext und Metrics als Finite-Pool-Economy erkannt.
- Tests belegen Trash bei bezahlbarem BBS und Repeat-Penalty nach declined affordable trash.

Kontextverlust:

- Der ursprüngliche Zweck `Run wegen bekannter BBS` wird nicht als Feld gespeichert.
- Die Erfüllung `BBS getrasht` oder Verfehlung `Trash declined` wird nur über Action/Event/Metrics rekonstruiert.

### Data Wall / HQ Interface

Ist-Stand:

- `assessKnownRezzedIcePath` erkennt bekannte rezzed ETR-Pfade, fehlende Breaker-Coverage und no-access.
- Tests belegen Data-Wall-Missing-Coverage als `canReachAccess: false`, `missing_breaker_coverage`, `unbreakableIceTitle: "Data Wall"`.
- Central-Pressure-Gates nutzen `accessReachable`, sodass Interface-/Multiaccess-Wert an erreichbaren Access gekoppelt werden kann.

Kontextverlust:

- HQ-/R&D-Multiaccess ist kein Run-Zweckfeld.
- `accessCount` ist nicht im AIInput-Run-Ausschnitt.
- Wenn Reachability-Gates nicht greifen, kann der Wert einer Central-Pressure-Idee vom tatsächlichen Zugang entkoppelt werden.

### Washed-Up Solo Construct

Ist-Stand:

- Conditional-Payment-Aktionen sind als `continue_run` mit `payOrTrashProgramSubroutine*`-Payload sichtbar.
- Die Baseline schützt diese Zahlungsfenster.
- Nach Zahlung kann das Jack-out-Fenster über `attackedServerId`, Position, nächstes ICE und Remote-Profil weiterbewertet werden.
- Ein Test belegt die Fortsetzung Richtung Remote-Payoff nach bezahltem Washed-Up-Fenster.

Kontextverlust:

- Die Zahlung wird nicht als Intent-Fortschritt `Remote-Zweck weiter offen` im AIInput getragen.
- Nach dem Encounter gibt es keinen gespeicherten ursprünglichen ReasonCode.
- Die Entscheidung im Jack-out-Fenster hängt davon ab, ob der Payoff aus aktuellem Board und Planerbedingungen erneut sichtbar ist.

## Wirklich fehlende Felder im AIInput oder LegalAction-Payload

Im geprüften Ist-Stand fehlen als AIInput- oder LegalAction-First-Class-Felder:

- ursprünglicher Run-Zweck,
- ursprünglicher Run-ReasonCode,
- Runner-Run-Intent/Commitment,
- Run-Fulfillment-Status,
- `runId` im AIInput,
- vollständige passed ICE IDs/counts im AIInput,
- generischer resolved-payment-/resolved-harm-Verlauf im AIInput,
- `accessCount` im `PlayerView.run`-AI-Ausschnitt,
- erwarteter Access-/Trash-/Steal-Payoff als eigenes Feld,
- direkte Relation `Run-Start -> Access -> Trash legal -> Zweck erfüllt/verfehlt`.

Vorhanden, aber nicht dauerhaft fortgetragen:

- ReasonCode und Evidence der aktuellen AI-Entscheidung,
- Engine-interne `runId`,
- Engine-interner `accessCount`,
- einzelne passed-ICE-/post-pass Marker für Engine-Followups,
- PublicContext-Details, soweit sie nicht in der AIInput-Allowlist stehen.

## Bewusst nicht bewertet oder geplant

Diese Review enthält keine Entscheidung darüber, ob ein Runner-Intent-Layer eingeführt werden soll. Sie beschreibt nur, welche Daten heute vorhanden sind, wo sie verloren gehen und welche Informationen im Ist-Stand fehlen.

## Bewusst nicht geändert

Es wurden keine Code-, Test-, Engine-, LegalAction-, Profil-, Hint-, Deck-, Catalog-, Proteus- oder Scoring-Dateien geändert.
