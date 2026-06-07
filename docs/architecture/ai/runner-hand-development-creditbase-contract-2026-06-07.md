# Runner-Handentwicklung und Creditbase-Vertrag

Stand: 2026-06-07

## Ziel

Dieser Vertrag definiert, wann die Runner-KI eigene Handkarten, Rig-Aufbau und Creditaufbau höher bewertet als einen weiteren schwachen Run. Er schärft die bestehende AI-STRAT-Linie aus `RunnerRunTargetEvaluation`, `RunnerEconomyPosture`, TacticalGoals und TacticalPlans, ohne neue Strategy-IDs, neue globale Taktiksignaldateien oder Engine-Regeln einzuführen.

## Bestehende AI-STRAT-Anker

Die vorhandenen Goal-IDs reichen für den nächsten Umsetzungsschritt aus. Neue interne Goal-IDs sind nicht nötig; die Folgepakete sollen stattdessen Evidence, Rollen und Subgründe präzisieren.

- `runner.build_economy_base`: primärer Anker, wenn Credits unter dem Floor liegen, nützliche eigene Handkarten wegen Credits blockiert sind, Banktools auszahlbar sind oder nur schwache Runs vorliegen.
- `runner.maintain_credit_and_hand_buffer`: Reserve- und Schutzanker, wenn ein Run oder eine Installation den Runner unter den Mindestfloor drücken würde; allein kein "installiere alles"-Signal.
- `runner.find_or_install_primary_breaker`: nutzt Handentwicklungs-Evidence für Eisbrecher, Rig-Pieces und Memory-Support, wenn dadurch relevante Server erreichbar werden.
- `runner.draw_or_search_for_setup`: greift, wenn keine aktuell nützliche eigene Handkarte legal oder finanzierbar ist, aber Setupbedarf besteht.
- `runner.avoid_low_value_risk_runs`: unterdrückt bekannte oder erwartbar schwache Runs, solange Creditbase oder Handentwicklung relevanter sind.
- `runner.pressure_good_central_target` und `runner.contest_remote_if_score_threat`: übersteuern Economy und Setup nur bei prüfbar hohem Payoff oder Score-Gefahr.

## `RunnerHandDevelopmentEvaluation`

Die Evaluation bewertet eigene Runner-Handkarten side-sicher als Entwicklungsoptionen. Eingaben sind nur die Runner-eigene `PlayerView`, eigene Credits, eigene MU-/Rig-Informationen, `LegalActions`, `ActionSemanticCandidate`-Daten, `DeckCapabilityProfile`, `StrategicIntentProfile` und bereits side-sicheres öffentliches oder Runner-eigenes Wissen. Gegnerische verdeckte Karten, FullState, Storage-Interna, `privatePayload` und gegnerische Decklisten bleiben tabu.

Mindestvertrag pro bewerteter eigener Handkarte:

```ts
type RunnerHandDevelopmentAvailability =
  | "legal_now"
  | "missing_credits"
  | "missing_mu"
  | "timing_blocked"
  | "not_relevant_now";

type RunnerHandDevelopmentRole =
  | "access_payoff"
  | "breaker_or_rig_piece"
  | "memory_support"
  | "economy_engine"
  | "bank_tool"
  | "draw_or_search_engine"
  | "defense_support"
  | "run_event"
  | "duplicate_or_low_value"
  | "unknown";

type RunnerHandDevelopmentEvaluation = {
  schemaVersion: 1;
  cardRef: "own_runner_hand_card_only";
  availability: RunnerHandDevelopmentAvailability;
  developmentRole: RunnerHandDevelopmentRole;
  strategicFit: "strong" | "medium" | "weak" | "blocked";
  currentNeed: "acute" | "useful_now" | "setup" | "later" | "none";
  priority: number;
  fundingNeed?: {
    installOrPlayCost: number;
    missingCredits: number;
    reason: "cannot_pay" | "would_break_floor" | "would_break_run_reserve";
  };
  deferReason:
    | "none"
    | "missing_credits"
    | "missing_mu"
    | "no_current_need"
    | "duplicate"
    | "timing"
    | "preserve_credit_floor"
    | "stronger_override";
  evidence: string[];
};
```

`priority` bleibt AI-intern und soll mit bestehenden TacticalGoal-Prioritäten vergleichbar sein. Debug-Oberflächen dürfen daraus nur redigierte Rollen, Gründe und Counts zeigen, keine vollständigen Hand-, Deck- oder Instanzlisten.

### Verfügbarkeitsregeln

- `legal_now`: Eine passende `LegalAction` aus dem aktuellen KI-Input existiert und ist jetzt bezahlbar.
- `missing_credits`: Die Karte ist als spielbare oder semantisch passende Option erkennbar, aber aktuelle Credits reichen nicht oder die Zahlung würde den Floor brechen.
- `missing_mu`: Die Karte oder ihr Folgeplan ist durch MU/Rig-Kapazität blockiert.
- `timing_blocked`: Die Karte ist fachlich nützlich, aber im aktuellen Timingpunkt gibt es keine passende `LegalAction`.
- `not_relevant_now`: Die Karte ist legal oder bekannt, passt aber aktuell nicht zu Bedarf, Scorelage, Gefahr oder Strategie.

### Rollenregeln

- `access_payoff`: erhöht konkreten Access-Wert, Multiaccess, Steal-/Trash-Fähigkeit oder Serverdruck.
- `breaker_or_rig_piece`: erschließt sichtbare ICE-/Serverpfade oder beseitigt einen Coverage-Blocker.
- `memory_support`: erlaubt einen relevanten Programm-/Rig-Aufbau, der sonst an MU scheitert.
- `economy_engine` und `bank_tool`: verbessern Creditbase über mehrere Turns oder durch Cash-out.
- `draw_or_search_engine`: sucht fehlende Setupstücke, wenn Handoptionen schwach sind.
- `defense_support`: ist hoch nur bei sichtbarer oder generisch plausibler Tag-/Damage-/Flatline-Gefahr; sonst defensiv niedrig.
- `run_event`: ist hoch nur bei konkretem Zielwert und ausreichender Reserve.
- `duplicate_or_low_value` und `unknown`: konservativer Default ohne starken Install- oder Play-Druck.

## `RunnerCreditBasePlan`

`RunnerCreditBasePlan` soll `RunnerEconomyPosture` erweitern oder aus ihr abgeleitet werden, nicht als parallele Strategiequelle gegen sie arbeiten.

Mindestvertrag:

```ts
type RunnerCreditBaseRecommendation =
  | "stable"
  | "build_economy"
  | "cash_out_bank"
  | "can_spend_for_high_payoff"
  | "preserve_floor_for_setup";

type RunnerCreditBasePlan = {
  schemaVersion: 1;
  currentCredits: number;
  minimumCreditFloor: number;
  desiredCreditReserve: number;
  activeRunFundingNeed?: {
    targetServer: string;
    requiredCredits: number;
    missingCredits: number;
    reason: "path_cost" | "steal_or_trash_payoff" | "post_run_floor";
  };
  usefulHandCardsBlockedByCredits: Array<{
    role: RunnerHandDevelopmentRole;
    missingCredits: number;
    redactedReason: string;
  }>;
  highestHandFundingNeed: number;
  recommendation: RunnerCreditBaseRecommendation;
  evidence: string[];
};
```

Prüfbare Floors:

- Basis-Floor: 2 Credits.
- Erhöhter Floor: 3 Credits bei riskantem Universal-Pressure, sichtbaren relevanten Run-Kosten oder akuter Sicherheitslage.
- Gewünschte Reserve: 4 Credits als Normalwert.
- Erhöhte Reserve: 6 Credits bei Banktools, riskantem Universal-Pressure oder mehreren blockierten nützlichen Handentwicklungen.
- Bei 0 bis 2 Credits ist Economy stark bevorzugt, solange keine Übersteuerung greift.
- Bei 3 bis 5 Credits darf Setup eine Economy-Aktion schlagen, wenn Rolle und Bedarf stark sind und der Runner nach der Zahlung den Floor hält oder einen akuten Blocker entfernt.
- Ab 6 Credits kann Druck Vorrang haben, wenn RunTargetEvaluation einen guten Zielwert sieht.

## `RunnerCreditReservePolicy`

Die Contest-Reserve ist ein Nachtrag zu `RunnerCreditBasePlan` und `RunnerEconomyPosture`. Sie soll als internes Bewertungsobjekt oder eingebetteter Abschnitt umgesetzt werden; ein eigener öffentlicher Strategieanker ist nicht nötig. Ziel ist nicht "immer Credits sparen", sondern die Unterscheidung zwischen "Aktion jetzt bezahlbar" und "Runner bleibt nach der Aktion handlungsfähig".

Mindestvertrag:

```ts
type RunnerCreditReservePhase =
  | "opening"
  | "midgame"
  | "late_contest";

type RunnerCreditReservePolicy = {
  schemaVersion: 1;
  phase: RunnerCreditReservePhase;
  currentCredits: number;
  minimumCreditFloor: number;
  breakerUseReserve: number;
  contestReserve: number;
  developmentReserve: number;
  emergencyReserve: number;
  desiredCreditReserve: number;
  remoteScoreThreat: "none" | "possible" | "visible" | "urgent";
  canContestIfFunded: boolean;
  belowReserveNow: boolean;
  spendingWouldDropBelowReserve: boolean;
  creditsAfterAction?: number;
  reserveDrivers: string[];
  reserveOverrides: string[];
  evidence: string[];
};
```

Die Werte sind AI-interne Heuristiken. Debug darf nur Phase, Counts, Reservewerte, Treiber und Override-Gründe zeigen, keine gegnerischen Hand-, Deck-, Remote- oder FullState-Daten.

### Phasen und Startwerte

- `opening`: Normaler Floor 2, gewünschte Reserve 4. Setup-Ausgaben sind eher erlaubt, wenn sie Breaker, Economy, Memory oder konkrete Handentwicklung freischalten.
- `midgame`: Normaler Floor 3, gewünschte Reserve 5 bis 6. Ausgaben brauchen stärkeren Payoff, wenn danach keine relevante Run- oder Setup-Handlungsfähigkeit bleibt.
- `late_contest`: Normaler Floor 3, gewünschte Reserve 6 bis 8. Sichtbare Remote-Score-Gefahr, siegnahe Korp oder installierte Coverage mit fehlenden Credits erhöhen die Contest-Reserve.

Die konkrete Implementation darf Werte kalibrieren, muss aber die Treiber als Evidence ausgeben und darf keine starre "behalte immer X Credits"-Regel bauen.

### Reserve-Treiber

- `breakerUseReserve`: Credits, die ein installierter oder sicher verfügbarer Breaker für relevante Runs braucht. Sichtbare ICE-Pfade, bekannte Breakkosten und konservative Unknown-ICE-Schätzungen dürfen einfließen; verdeckte Kartenwerte nicht.
- `contestReserve`: Credits, die der Runner braucht, um einen sichtbaren oder plausiblen Remote-Score-Threat zu contesten. Sie steigt bei remote installierten/avancierten Karten, Korp-Siegnahe, gutem Runner-Coverage-Profil und bezahlbarem Pfad nach Funding.
- `developmentReserve`: Credits, die nützliche eigene Handkarten in naher Zukunft spielbar machen. Treiber sind `RunnerHandDevelopmentEvaluation`, fehlende Credits für Breaker/Rig/Memory/Economy und konkrete LegalAction-Nähe.
- `emergencyReserve`: Credits für sichtbare Tag-, Trace-, Damage- oder Survival-Lagen. Sie darf nur aus öffentlichen oder Runner-eigenen Informationen entstehen.
- `desiredCreditReserve`: Maximum aus Basisfloor, Breaker-, Contest-, Development- und Emergency-Reserve, begrenzt durch Phase und konkrete Evidence.

### Reservebruch und Malus

`spendingWouldDropBelowReserve` ist ein Bewertungsmalus, keine harte Sperre. Eine Ausgabe, ein Run oder eine Installation unter Reserve darf gewinnen, wenn sie side-sicher hohen Payoff hat oder den aktuellen Blocker direkt löst. Ohne solchen Grund soll Economy, Bank-Cashout, Draw/Search oder günstiger Setup-Aufbau steigen.

Pflicht-Evidence für Reservebrüche:

- `credits_after_action:<n>`
- `desired_credit_reserve:<n>`
- `reserve_breach:true`
- `reserve_driver:<reason>`
- `reserve_penalty:<n>`
- `reserve_override:<reason>` falls der Bruch erlaubt wurde

### Übersteuerungen

Reservebrüche sind erlaubt bei:

- bekannter Agenda, sicherem Steal-/Trash-Payoff oder unmittelbarem Runner-Closeout,
- akutem Remote-Contest, wenn der Run selbst das Score-Fenster schließt,
- Survival-, Tag-, Damage- oder Trace-Notfall,
- Aktion, die einen aktiven Coverage-, MU-, Credit- oder Handentwicklungsblocker direkt löst,
- sehr günstigem Druckfenster ohne sichtbare Remote-Score-Gefahr, wenn das separate PressureBudget die Aktion als plausibel freigibt.

Das Folgepaket `act-2026-06-07-ai-runner-pressure-budget-variation` bleibt bewusst getrennt: Reserve bewertet Kostenbewusstsein und Score-Fenster; PressureBudget erlaubt begrenzte, günstige Druckaktionen trotz aktivem Economy-Aufbau. Deterministische Variation darf nur zwischen sicheren, plausiblen und ähnlich guten Kandidaten greifen.

## `RunnerDrawOverflowAssessment`

Kartenziehen bleibt ein legitimer Weg, um fehlende Antworten zu finden, bekommt aber in der TacticalPlan-Schicht einen situativen Malus, wenn der Runner dadurch das Handlimit überschreitet oder eine bereits zu volle Hand weiter belastet. Die Bewertung ist AI-intern und nutzt nur eigene Runner-Handdaten, `maxHandSize`, `LegalActions`, HandDevelopment-/Creditbase-Evaluations und side-sichere Plan-Evidence.

Mindestvertrag:

```ts
type RunnerDrawOverflowAssessment = {
  currentHandCount: number;
  maxHandSize: number;
  cardsToDraw: number;
  projectedOverflow: number;
  severity: "none" | "minor" | "moderate" | "high";
  discardFodderCount: number;
  valuableCardsAtRisk: number;
  usefulPlayableCardsInHand: number;
  usefulHandCardsBlockedByCredits: number;
  urgencyOverride:
    | "none"
    | "find_breaker_for_score_threat"
    | "find_survival_answer"
    | "find_run_access_payoff"
    | "find_economy";
  penalty: number;
  reasons: string[];
};
```

Bewertungsregeln:

- Overflow 0 erzeugt keinen Malus.
- Overflow 1 erzeugt einen kleinen Malus, wenn keine klare Abwurfkarte bekannt ist.
- Overflow 2 erzeugt einen deutlichen Malus; Draw muss gegen Install-/Creditbase-Alternativen bestehen.
- Overflow 3+ oder bereits überschrittenes Handlimit erzeugt starken Druck gegen weiteren Draw.
- `discardFodderCount` reduziert den Malus, wenn Low-Value-/Duplicate-/nicht relevante eigene Karten erkennbar abwerfbar sind.
- Nützliche spielbare Handkarten und wegen Credits blockierte nützliche Handkarten erhöhen den Druck, erst Handentwicklung oder Creditbase zu wählen.
- Akute Remote-Score-Gefahr darf den Malus reduzieren, wenn Draw die plausible Antwortsuche für fehlende Breaker bleibt.
- Es gibt keine harte Draw-Sperre; wenn keine bessere legale Alternative existiert, kann Draw weiterhin gewählt werden.

Redigierte Debugdaten dürfen nur Counts, Severity, Penalty, Urgency und Gründe zeigen, insbesondere `handLimitPressure`, `projectedOverflow`, `drawOverflowPenalty`, `discardFodderCount`, `usefulPlayableCardsInHand`, `urgencyOverride` und `why_draw_over_install_or_credit`.

## Übersteuerungen

Economy und Handentwicklung werden nur durch klare, side-sichere Gründe übersteuert:

- Remote-Score-Threat: Ein remotes Ziel mit plausibler Agenda-/Score-Gefahr darf Setup schlagen, wenn der Run legal und nicht offensichtlich wertlos ist.
- Bekannter Agenda-Zugriff oder Closeout: Ein bekannter oder sehr wahrscheinlicher Agenda-Payoff darf unter die gewünschte Reserve gehen.
- Survival, Flatline oder Tags: Defensivaktionen und sichere Credit-/Hand-Entscheidungen dürfen Run-Pressure übersteuern.
- Klarer High-Payoff-Run: `run_now` mit bezahlbarem Pfad, bezahlbarem Trash-/Steal-Payoff oder Win-Potential darf `build_economy` verdrängen.
- Schwache oder bekannte Low-Value-Runs, insbesondere `do_not_run_now`, dürfen Creditbase oder sinnvolle Handentwicklung nicht übersteuern.

## TacticalGoal-Mapping

Folgeimplementierungen sollen die bestehenden Goals so mappen:

- `runner.build_economy_base`: wenn `RunnerCreditBasePlan.recommendation` `build_economy` oder `cash_out_bank` ist, wenn ein aktiver Run-FundingNeed besteht oder wenn nützliche Handkarten wegen Credits blockiert sind.
- `runner.maintain_credit_and_hand_buffer`: wenn geplante Runs oder Handkarten den Floor oder die gewünschte Reserve brechen würden.
- `runner.find_or_install_primary_breaker`: wenn `RunnerHandDevelopmentEvaluation` `breaker_or_rig_piece` oder `memory_support` mit starkem Bedarf meldet.
- `runner.draw_or_search_for_setup`: wenn keine nützliche Handkarte legal/finanzierbar ist oder Draw/Search selbst eine starke Setuprolle hat.
- `runner.avoid_low_value_risk_runs`: wenn RunTargetEvaluation schwach ist und Creditbase oder Handentwicklung einen besseren legalen Zug nahelegen.
- Draw-for-Answer-Pläne werden über `RunnerDrawOverflowAssessment` gegen Overdraw-Kosten abgewogen; Handentwicklung und Creditbase dürfen dadurch höher ranken, bleiben aber LegalActions-only.
- Pressure- und Remote-Contest-Goals bleiben die expliziten Übersteuerungsziele.

Zulässige Evidence-Subrollen sind zum Beispiel `hand_role:access_payoff`, `hand_role:memory_support`, `creditbase_reason:useful_hand_blocked`, `creditbase_reason:active_run_funding` und `override:known_agenda`. Sie sind keine neuen Goal-IDs.

## Harte Grenzen

- Die finale Aktion muss immer aus `input.legalActions` stammen.
- `applyAction` bleibt die Regelautorität und validiert wie bisher Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- Der Vertrag ändert keine Engine-Regeln, keine `LegalActions`, kein Replay, keinen StateHash und keine Zufallspfade.
- Keine gegnerischen verdeckten Karten, keine FullState-/Storage-Interna, keine `privatePayload`s und keine gegnerischen Decklisten werden gelesen oder in Debug ausgegeben.
- Public Debug darf nur redigierte Counts, Rollen, Empfehlungen und Gründe zeigen.

## Handoff und Tests

Die bestehenden Folgeactivities bleiben passend:

- `act-2026-06-07-runner-hand-development-evaluation`: implementiert die eigene Handkartenbewertung mit Tests für Access-Payoff, Breaker/Rig, Memory-Support, Economy/Bank, Defense ohne Threat, Duplikate und Unknown-Defaults.
- `act-2026-06-07-runner-credit-base-planning`: erweitert `RunnerEconomyPosture` oder leitet `RunnerCreditBasePlan` daraus ab; Tests müssen 0-2 Credits, 3-5 Credits mit Setup, 6+ Credits mit Druck, Bank-Cashout, aktive Run-Kosten und blockierte Handkarten abdecken.
- `act-2026-06-07-runner-development-tactical-mapping`: mappt Evaluation und Creditbase auf bestehende Goals und TacticalPlans; Tests müssen beweisen, dass schwache Runs unterdrückt werden und die finale Aktion legal bleibt.
- `act-2026-06-07-runner-development-debug-regression`: prüft redigierte Debug-Oberflächen und Regressionen ohne Hidden-Info-Leak.
- `act-2026-06-07-ai-runner-contest-reserve-implementation`: setzt `RunnerCreditReservePolicy` als Erweiterung von `RunnerEconomyPosture`/`RunnerCreditBasePlan` um und kalibriert Reserve-Malus plus Overrides.
- `act-2026-06-07-ai-runner-pressure-budget-variation`: bleibt separater Scope für günstige Probe-/Pressure-Aktionen und deterministische Near-Tie-Variation trotz aktiver Reserve.
