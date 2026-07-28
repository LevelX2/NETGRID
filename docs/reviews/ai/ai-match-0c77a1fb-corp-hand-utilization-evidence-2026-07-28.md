# Evidence: Corp-Handverwertung in Match 0c77a1fb

Status: **P1 Red-Evidence bestätigt**

Stand: 2026-07-28

## Match und Quelle

- Match: `match_0c77a1fb8540644a`
- Modus: `human_runner_vs_corp_ai`
- Ergebnis: Runner gewinnt über Agenda-Punkte
- End-StateVersion: 79
- AI-Traces: 30 von 30 erwarteten Corp-Entscheidungen, keine fehlenden,
  verwaisten oder doppelt verknüpften Traces
- Runtime-SQLite:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Zugriff: kurzlebig und read-only bei nicht erreichbarem Hauptserver

Der Paketprozess übernimmt die bereits fachlich freigegebene Beobachtung zum
ersten Corp-Zug. Eine neue vollständige Matchfehlerliste ist nicht Ziel dieses
Pakets.

## Historischer Entscheidungsanker

Decision 5 bei StateVersion 5 war die dritte und letzte freiwillige
Corp-Aktion des ersten Zugs:

1. Filter auf HQ installieren;
2. Fire Wall auf R&D installieren;
3. Basic Draw wählen.

Side-sicher sichtbarer Zustand vor Decision 5:

- Corp: 5 Credits, 1 Klick, 4/5 Karten in HQ, 0 Agenda-Punkte;
- bekannte HQ-Karten:
  - Project Venice;
  - Accounts Receivable;
  - Efficiency Experts;
  - Setup!;
- LegalActions:
  - Basic Credit;
  - Basic Draw;
  - Project Venice in ein neues Remote installieren;
  - Accounts Receivable spielen;
  - Efficiency Experts spielen;
  - Setup! in ein neues Remote installieren;
  - Zug beenden.

Die historische und aktuelle Plan-first-Auswahl ist:

```text
corp.draw_card
owner: corp.defend_servers
capability: develop_score_protection
effective priority: P4
delegated parent:
  plan:corp.score_agenda:
  agenda:corp_onr_proteus_007_project-venice_1:new_remote
```

Der Draw sucht ein weiteres effektives ICE für den Project-Venice-Scoreplan.
Er verbraucht jedoch den letzten Klick und kann in diesem Zug keine gezogene
Karte mehr konvertieren.

## Accounts-Consumer-Kette

Accounts Receivable ist nicht durch Hint-, LegalAction- oder
Action-Projektionsdrift blockiert:

- LegalAction:
  `corp.play_operation.corp_onr_v1_281_accounts-receivable_3...`
- Kosten: 1 Klick und 5 Credits;
- Engine-Payload: 9 Credits erhalten;
- semantischer Typ: `economy.gain_credit`;
- Projektion:
  - `kind = immediate_liquid`;
  - `grossLiquidCreditGain = 9`;
  - `netLiquidCreditGain = 4`;
  - `cardsConsumed = 1`;
  - `netHandDelta = -1`;
  - `reliability = guaranteed`;
  - `source = legal_action_payload`;
  - `confidence = high`;
- Kompatibilität:
  - `economy.corp_credit_burst`;
  - `role:economy_operation`;
  - `plan_role:recover_economy`.

Efficiency Experts besitzt im selben Zustand ebenfalls eine vollständige
garantierte Projektion mit netto +3 Credits und Handdelta −1.

Die Semantik geht erst in der produktiven Planerkennung verloren:

- `corpEconomyDevelopmentCampaigns` erzeugt reguläre
  `develop_campaign`-Signale nur für Assets;
- beide legalen Economy-Operationen erzeugen keinen eigenen
  `corp.economy`-Plan;
- der Score-Protection-Draw erbt dagegen P4 vom exakten Score-Parent;
- der Scheduler kann deshalb keine Economy-Operation gegen diesen Draw
  abwägen.

Fehlergruppe:
**fehlende Plan-Ownership für vollständig projizierte sofortige
Corp-Economy-Operationen**, nicht fehlende Kartensemantik.

## Checkpoint-Capture

Fixture:

`data/scenarios/ai-decision-checkpoints/cp-0c77a1fb-02-accounts-before-defense-draw-d5.json`

Expectation:

- Accounts Receivable als `play_operation` ist akzeptabel;
- Basic Draw ist verboten;
- `corp.economy` ist akzeptabler Planowner;
- `corp.defend_servers` und `corp.hand_and_agenda_management` sind für diese
  Auswahl verboten.

Strict-Capture:

- Target Decision: 5;
- Warmup-Start: Decision 4;
- Warmup-Decisions: 1;
- Warmup-Drift: 0;
- kompatibler Suffix: 1;
- Eventpräfix: 6 Events.

Der vollständige Strict-Warmup ab Decision 1 scheitert bereits bei
StateVersion 3 an `invalid_support_graph`: Die historische Engine-randomisierte
Central-ICE-Auswahl besitzt in der heutigen Runtime keine wiederverwendbare
actor-private Matchbindung. Das ist ein bekannter Infrastrukturdrift und
keine Evidence für die Handkartenentscheidung.

Die verkürzte Capture-Grenze bedeutet:

- Decision 4 und der unmittelbare D5-Zustand sind auf aktuellem Code ohne
  Drift reproduziert;
- es wird kein residentes Portfolio vor Decision 4 behauptet;
- der Checkpoint prüft die aktuelle produktive Neuerkennung aus dem
  side-sicheren D5-Zustand.

## Roter Nachweis

Der unveränderte Zieltest endet mit:

```text
behavior_regression
selected: corp.draw_card
plan: corp.defend_servers
missing acceptable action: Accounts Receivable
forbidden action selected: draw_card
plan execution mismatch
```

Damit ist der Fehler auf aktuellem Code fachlich rot reproduziert.

## Deck-Hint-/Consumer-Audit

Artefakt:

`docs/reviews/ai/ai-match-0c77a1fb-hand-utilization-deck-consumer-audit-2026-07-28.json`

Umfang:

- 28 eindeutige Karten erfasst und auditiert;
- 45 Karten insgesamt;
- keine ausgeschlossenen Karten;
- Search-Tools: keine;
- Bank-Tool: BBS Whispering Campaign;
- Primärstrategien:
  - `corp.ice_tax_glacier`;
  - `corp.fast_advance`;
  - `corp.overadvance_value`;
- Sekundärstrategien unter anderem:
  - `corp.remote_scoring`;
  - `corp.economy_rez_reserve`;
  - `corp.rush_score`.

Ergebnis:

- Status: `failed`;
- 3 Blocker;
- 0 Warnungen.

Blocker:

1. erwartete `behavior_regression` des neuen D5-Checkpoints;
2. BBS Whispering Campaign:
   `hosted_credit_take_hint_mismatch` für
   `up_to_amount_if_available`;
3. Red Herrings:
   `strategicNotes` ohne Consumervertrag.

Die beiden Kartenblocker werden in P5 als Pilotkarten-/Consumer-Gaps geprüft.
Sie werden in P1 weder als Folge des D5-Fehlers dargestellt noch
stillschweigend korrigiert.

## Karten-Coverage-Baseline und Zielmodell

Für bekannte HQ-Karten soll P3 pro Karteninstanz diesen autoritätslosen
Datensatz erzeugen:

```ts
type CorpHandRouteCoverageRecord = {
  sourceInstanceId: string;
  sourceDefinitionId: string;
  legalActionIds: string[];
  exactCurrentProjections: string[];
  domainClaims: Array<{
    ownerModuleId: string;
    planInstanceId: string;
    parentNeedId?: string;
    readiness: "executable_now" | "executable_with_support" | "blocked";
  }>;
  dispositions: Array<
    | "blocked_funding"
    | "strategic_hold"
    | "redundant"
    | "unsafe_current_route"
    | "unsupported_domain_contract"
  >;
};
```

Der Datensatz wählt keinen Plan und keinen Executor. Er macht lediglich
sichtbar, ob eine bekannte Karte:

- eine konkrete Domainroute besitzt;
- absichtlich gehalten oder blockiert ist;
- redundant oder aktuell riskant ist;
- trotz LegalAction und Projektion keinen Domainvertrag besitzt.

D5-Baseline:

| Karte               | LegalAction/Projektion | produktive Planabdeckung              |
| ------------------- | ---------------------- | ------------------------------------- |
| Project Venice      | Agenda-Install legal   | Score-Parent, aktuell Defense-Support |
| Accounts Receivable | garantiert netto +4    | keine eigene Economy-Route            |
| Efficiency Experts  | garantiert netto +3    | keine eigene Economy-Route            |
| Setup!              | Install legal          | Ambush-Plan vorhanden                 |

## Grüne Sicherheitsgrenzen

Vor dem Fix bleiben folgende vorhandene Regressionen maßgeblich:

- Draw bei voller HQ ist zulässig, wenn eine exakte gleichründige
  Installationskonversion folgt;
- Last-Click-Draw ohne Kapazitätsfreigabe ist unzulässig;
- Day Shift darf nicht als falscher Score-Protection-Draw oder
  HQ-Overflow-Head verwendet werden;
- der D9-Shell-Traders-Checkpoint verbietet Corporate Retreat hinter Filter
  gegen den öffentlich vorbereiteten Rent-I-Con.

## Maßnahmenfreigabe

Vom Nutzer bereits freigegeben:

1. P2 erzeugt generische `corp.economy`-Routen für vollständig projizierte
   sofortige Economy-Operationen.
2. P3/P4 bauen autoritätslose Handfakten und plan-first-konforme
   Draw-Arbitration.
3. P5 prüft die Asset-/Node-Coverage einschließlich der beiden Audit-Gaps.
4. P6 ergänzt eine qualifizierte seed-deterministische Opening-Rush-Varianz
   innerhalb von `corp.score_agenda`.
