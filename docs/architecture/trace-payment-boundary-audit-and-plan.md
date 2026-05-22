# Trace-Payment Boundary Audit and Plan

Stand: 2026-05-22
Auftrag: ARCH-8, reiner Architektur-Audit und Boundary-Plan
Scope: keine Produktionscodeänderung, keine Refactorings, keine Tests, keine Kartenmigrationen, keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderung

## 1. Kurzfazit

ARCH-8 bestätigt die Warnung aus `docs/architecture/engine-module-split-audit-and-plan.md`: Trace darf später als eigene Domäne geschnitten werden, aber Trace-Payment und Revalidation dürfen nicht von der LegalAction-/Execution-Kopplung getrennt werden. Der heutige Trace-Flow liegt fast vollständig in `packages/engine/src/index.ts`; `packages/engine/src/game/payment/*` enthält nach ARCH-7 CostQuote-Helfer für Corp-Rez-/Install-Quotes, aber keine Trace-Logik und keine Trace-Imports.

Empfohlen wird Option C als ARCH-9-Code-Schnitt: zuerst ein kleiner `TracePaymentQuote`-Helper für Korp-Trace-Bids, während der Trace-Flow in `index.ts` bleibt. Zielstruktur bleibt langfristig Option B: `game/trace` orchestriert Trace-Status, Choices und Ergebnis; `game/payment/trace-payment.ts` quotet und zahlt Trace-Bids. Damit bleiben LegalAction-Anzeige, stale Revalidation und echte Zahlung über dieselbe Quote verbunden.

Ausgangspunkt war sauber. Die geforderten ARCH-Vorgänger sind lokal vorhanden:

| Vorgänger | Status |
| --- | --- |
| ARCH-7 `fe3b385c8b1e62cbed3712fc9576f0c06ae68603` | vorhanden |
| ARCH-6 `2b12239d5e4132ba55cd36620fa67fddc8f6e903` | vorhanden |
| ARCH-5R `a83f3fab` | vorhanden |
| ARCH-4 `71967251` | vorhanden |
| ARCH-3 `247f88cb` | vorhanden |
| ARCH-2 `e243e029` | vorhanden |
| ARCH-1-Dokument `docs/architecture/engine-module-split-audit-and-plan.md` | vorhanden |

## 2. Ist-Zustand Trace-Flow

Trace kann heute aus drei relevanten Einstiegen entstehen:

| Einstieg | Aktueller Ort | Verhalten |
| --- | --- | --- |
| Printed ICE-Subroutine | `startTraceFromSubroutine` in `packages/engine/src/index.ts` | läuft aus `continueRun`; markiert die Subroutine als resolved, erzeugt `state.trace`, öffnet Korp-Bid-Choice, setzt `activeSide = "corp"` |
| Korp-Operation oder Agenda-/Asset-Aktion | `startTraceFromOperation` in `packages/engine/src/index.ts` | speichert Return-Kontext (`returnPhase`, `returnTimingPoint`, `returnActiveSide`) und öffnet Korp-Bid |
| Access-Trace aus CardImplementation | Access-Step `kind: "trace"` in `packages/engine/src/ability-engine/definition-types.ts`, Runtime-Start über `index.ts` | nutzt `traceSuccessEffectForCardImplementation`, bleibt aber im bestehenden Trace-State |

`TraceState` liegt in `packages/shared/src/index.ts` und speichert aktuell:

- Identität: `traceId`, `sourceCardInstanceId`, `sourceDefinitionId`, optional `subroutineIndex`.
- Stärke und Limits: `baseTraceStrength`, `corpBidMax`, optional `rabbitTraceLimitReduction`.
- Korp-Zahlungsquellen: optional `parisCityGridPoolSourceCardInstanceId`, `parisCityGridPoolServerId`, `encounterTemporaryTraceCreditSourceIceId`, `encounterTemporaryTraceCreditSourceDefinitionId`.
- Status: `"corp_bid"`, `"base_link"`, `"runner_bid"`, `"post_bid_link"`.
- Ergebnisdaten: `corpBid`, `traceStrength`, `runnerLink`, `baseLinkSourceId`, `baseLinkValue`, `baseLinkCostPaid`, `runnerBid`, `runnerStrength`, `postBidLinkSourceIds`, `postBidLinkBonus`, `successful`.
- Rückkehrdaten für nicht-runbasierte Traces: `returnPhase`, `returnTimingPoint`, `returnActiveSide`.

Aktuelle Sequenz:

1. `startTraceFromSubroutine` oder `startTraceFromOperation` erzeugt `state.trace.status = "corp_bid"` und `pendingChoice.source = "trace:<traceId>"`.
2. Korp wählt `bid_N`; `resolveTraceCorpBid` zahlt sofort nach deterministischer Quellpriorität und berechnet `traceStrength = baseTraceStrength + corpBid`.
3. Wenn Base-Link-Karten verfügbar sind, öffnet `startTraceBaseLinkChoice` ein Runner-Fenster mit `pendingChoice.source = "trace_base_link:<traceId>"`.
4. `resolveTraceBaseLinkChoice` nutzt entweder keine Base-Link-Quelle oder genau eine; danach öffnet `openTraceRunnerBidChoice` den Runner-Bid.
5. Runner wählt `bid_N`; `resolveTraceRunnerBid` zahlt sofort Runner-Link-Bid-Kosten und berechnet `runnerStrength = runnerLink + runnerBid`.
6. Wenn Post-Bid-Link-Pumps verfügbar sind, öffnet `startTracePostBidLinkChoice` ein hidden-info-barrier Fenster mit `pendingChoice.source = "trace_post_bid_link:<traceId>"`.
7. `resolveTracePostBidLinkChoice` kann mehrere Quellen nacheinander anbieten, solange nicht gepasst wird und weitere Quellen legal sind.
8. Abschluss erfolgt entweder direkt in `resolveTraceRunnerBid` oder nach Post-Bid-Fenster in `completeTraceAfterPostBidLink`.
9. Trace ist erfolgreich, wenn `traceStrength > runnerStrength`.
10. Erfolgswirkungen laufen nach Zahlung und Stärkevergleich: Tags, Trace-Counter, Run-Lock, Programm-/Hardware-Trash, unpreventable meat damage, Run-Ende.
11. Cleanup löscht `state.pendingChoice` und `state.trace`, setzt bei Run-Traces `run.traceSuccessBySubroutineIndex`, kehrt sonst in den gespeicherten Korp-Kontext zurück.

Hidden-Info-Grenzen:

- Korp-Bid ist über Choice und PublicPayload offen sichtbar.
- Base-Link-Fenster ist `visibility: "public"`, weil Base-Link-Quellen öffentlich gewählt werden.
- Post-Bid-Link-Fenster ist `visibility: "hidden_info_barrier"`; PublicPayload nennt erst nach Entscheidung `postBidTraceLinkSourceDefinitionId`, Kosten, Bonus und Ergebnis.
- `public-context.ts` forwarded Trace-Felder nur aus `legalAction.payload`; es inferiert keine privaten Choices.
- PublicPayload-Tracefelder sind heute breit in `public-context.ts` whitelisted, darunter `traceId`, `traceStep`, `corpBid`, `traceStrength`, `runnerLink`, `runnerBid`, `runnerStrength`, `traceSuccessful`, Payment-Felder und temporäre Trace-Credit-Felder.

Cleanup-Punkte:

- `delete state.trace` und `delete state.pendingChoice` am Trace-Ende.
- `run.traceSuccessBySubroutineIndex` für Folge-Subroutinen.
- `clearEncounterTemporaryTraceCredits` gibt ungenutzte Pocket-VR-Temporary-Credits beim Encounter-Ende zurück.
- Start-of-turn Refresh-Pfade füllen Krumz, Paris, Hell's Run, PK-6089a und ähnliche Counter/Hosted Credits wieder auf.

## 3. Ist-Zustand Trace-Payment

Trace-Payment liegt nicht in `packages/engine/src/game/payment`. Es liegt in `packages/engine/src/index.ts` und nutzt allgemeine Counter-/Credit-Helfer:

| Zahlungspfad | Aktuelle Funktion | Priorität / Verhalten |
| --- | --- | --- |
| Korp normale Credits | `resolveTraceCorpBid` -> `spendCredits(state, "corp", creditBid)` | nach temporary trace credits und Paris, vor Krumz und Hacker Tracker |
| Krumz | `krumzTraceBitCardIds`, `krumzTraceBitTotal`, `spendKrumzTraceBits` | rezzed Corp-Root-Quellen, sortiert nach CardInstanceId, nach normalen Credits |
| Paris City Grid | `parisCityGridTracePoolSource`, `spendParisCityGridTracePool` | nur während Runs auf demselben Fort, vor normalen Korp-Credits |
| Pocket Virtual Reality | `encounterTemporaryTraceCreditsAvailable`, `spendEncounterTemporaryTraceCredits` | nur für Trace-Subroutinen derselben ICE-Begegnung, vor Paris und Korp-Credits |
| Hacker Tracker Central | `spendHackerTrackerCounters`, `addHackerTrackerTraceCounters` | Rest nach temporary/Paris/Credits/Krumz; erhöht Strength und Limit; bekommt nach jedem Trace Counter |
| Runner normale Credits | `spendRunnerTraceLinkBidCredits` -> `spendCredits(state, "runner", remaining)` | nach trace-link restricted hosted credits |
| Runner restricted hosted credits | `runnerTraceLinkCreditSourceIds` + `restrictedHostedCreditSourceIds(state, "increase_link")` | vor Runner-Credits, sortiert nach CardInstanceId |
| Hell's Run | expliziter Zusatz in `runnerTraceLinkCreditSourceIds` | nicht generischer restricted source; recurring-credit Sonderfall für Link |
| Base-Link-Kosten | `resolveTraceBaseLinkChoice` -> `spendCredits(state, "runner", candidate.creditCost)` | heute nur normale Runner-Credits, keine restricted hosted credits |
| Post-Bid-Link-Kosten | `resolveTracePostBidLinkChoice` -> `spendRunnerTraceLinkBidCredits` | gleiche Quelle wie Runner-Bid |

LegalAction-Kosten und Execution-Zahlung sind uneinheitlich:

- Korp-Bid und Runner-Bid werden als `PendingChoice`-Optionen mit Maximalwerten erzeugt, nicht als einzelne `LegalAction.costs`.
- `corpBidMax` wird beim Trace-Start berechnet und in `TraceState` sowie PublicPayload gespiegelt. Execution revalidiert aktuell nur indirekt über tatsächliche verfügbare Quellen und wirft bei insuffizientem Hacker-Tracker-Rest.
- Runner-Bid-Max wird beim Öffnen der Choice aus `state.runner.credits + runnerTraceLinkCredits(state)` berechnet; Execution revalidiert in `spendRunnerTraceLinkBidCredits`.
- Base-Link- und Post-Bid-Link-Kandidaten werden beim Öffnen gefiltert und bei Execution erneut aus aktuellen Kandidaten berechnet. Das ist die stärkste vorhandene stale-Revalidation.
- Die tatsächliche Zahlungspriorität ist deterministisch, aber nicht als Quote-Objekt gespeichert oder gemeinsam zwischen Anzeige und Zahlung wiederverwendet.

Sensible Boundary-Folgerung: Ein Refactor darf nicht zuerst `resolveTraceCorpBid` als Flow verschieben und Payment im alten `index.ts` lassen. Der erste sichere Schnitt ist ein read/write Quote-Helper, der Quote, Payload und Pay in einem Modul hält und vom alten Flow aufgerufen wird.

## 4. Relevante Karten/Mechaniken

| CardDefinitionId | Karte / Mechanik | Quelle | Trace-Stärke | Bietende Seite | Payment-/Link-Relevanz | Folgeeffekt | Umsetzung | Testnachweis |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| `onr_v1_330_krumz` | Krumz | Corp Asset | - | Korp | 1 hosted bit für Korp-Trace-Bids; refresh Start Korp-Turn | nur Payment-Quelle | CardImplementation + `index.ts` payment helper | `index.test.ts` Krumz-Trace-Bit-Source |
| `onr_v1_365_paris-city-grid` | Paris City Grid | Corp Upgrade/Region | - | Korp | 3 hosted bits für Traces während Runs auf diesem Fort; refresh Start Korp-Turn | nur Payment-Quelle | CardImplementation + `index.ts` fort/run helper | `index.test.ts` city-grid trace pool |
| `onr_v1_325_hacker-tracker-central` | Hacker Tracker Central | Corp Asset | variabel | Korp | hosted Counter erhöhen Trace Strength und Limit; nach jedem Trace +1 Counter | Payment/Strength/Limit | CardImplementation longtail + `index.ts` | `index.test.ts` Fang/HTC |
| `onr_v1_260_pocket-virtual-reality` | Pocket Virtual Reality | ICE | 6, 6 | Korp then Runner | 4 temporary Korp-Credits nur für eigene printed Trace-Subroutinen | Tag auf Erfolg | CardImplementation printedSubroutines + encounter temp credits | `index.test.ts` Pocket VR temporary credits |
| `onr_v1_164_hells-run` | Hell's Run | Runner Resource | - | Runner | hosted recurring bit nur für Link-Erhöhung; expliziter Sonderfall neben restricted source | Link-Bid/Post-Bid-Payment | CardImplementation restricted source + `index.ts` HELLS_RUN_ID | `index.test.ts` Hell's Run trace-link |
| `onr_v1_138_pk-6089a` | PK-6089a | Runner Hardware/Deck | - | Runner | 3 hosted bits für `increase_link` | Link-Bid/Post-Bid-Payment | CardImplementation restrictedHostedCreditSource | `index.test.ts` PK trace-link |
| `onr_v1_003_baedekers-net-map` | Baedeker's Net Map | Runner Program/Base Link | - | Runner | Base Link 1 für 0; Post-Bid +1 für 1 | Link-Fenster | CardImplementation activated trace windows | `index.test.ts` migrated trace link values |
| `onr_v1_004_bakdoor` | Bakdoor | Runner Program/Base Link | - | Runner | Base Link 3 für 0; Post-Bid +1 für 2 | Link-Fenster | CardImplementation activated trace windows | `index.test.ts` migrated trace link values |
| `onr_v1_148_access-through-alpha` | Access through Alpha | Runner Resource/Base Link | - | Runner | Base Link 9 für 1 | Base-Link-Fenster | CardImplementation | `index.test.ts` Access through Alpha base link |
| `onr_v1_149_access-to-arasaka` | Access to Arasaka | Runner Resource/Base Link | - | Runner | Base Link 4 für 2; Post-Bid +1 für 2 | Link-Fenster | CardImplementation | `index.test.ts` trace assets/base link |
| `onr_v1_150_access-to-kiribati` | Access to Kiribati | Runner Resource/Base Link | - | Runner | Base Link 1 für 1; Post-Bid +1 für 1 | Link-Fenster | CardImplementation | `index.test.ts` Access to Kiribati trace link |
| `onr_v1_182_submarine-uplink` | Submarine Uplink | Runner Resource/Base Link | - | Runner | Base Link 4 für 0; Post-Bid +1 für 1; nur während Run; force jack-out marker | Link-Fenster + Run-Folge | CardImplementation + utility longtail | `index.test.ts` Submarine Uplink trace |
| `onr_v1_063_signpost` | Signpost | Runner Program | - | Runner | Post-Bid +2 Link für 1, once per trace/source | Post-Bid-Link | CardImplementation | `index.test.ts` Trace Link Post-Bid Resolvers |
| `onr_v1_181_the-springboard` | The Springboard | Runner Resource | - | Runner | Post-Bid +1 Link für 1, once per trace/source | Post-Bid-Link | CardImplementation | `index.test.ts` Trace Link Post-Bid Resolvers |
| `onr_v1_112_stumble-through-wilderspace` | Stumble through Wilderspace | Runner Prep | - | Runner | +9 Link für jeden Trace während des gestarteten Runs | Run-duration Link Bonus | CardImplementation make_run | `index.test.ts` Stumble trace-link bonus |
| `onr_v1_051_rabbit` | Rabbit | Runner Program | - | Korp-Limit | reduziert Korp-ICE-Trace-Limit um 1 | Limit-Modifier | CardImplementation utility longtail | `index.test.ts` Rabbit trace bid limits |
| `onr_v1_207_netwatch-operations-office` | Netwatch Operations Office | Agenda | 2 | Korp then Runner | normale Trace-Bids; keine Spezialcredits | Tag | CardImplementation agenda activated trace | `index.test.ts` V1.9.3 trace actions |
| `onr_v1_213_private-cybernet-police` | Private Cybernet Police | Agenda | 5 | Korp then Runner | normale Trace-Bids; keine Spezialcredits | Tag | CardImplementation agenda activated trace | `index.test.ts` Private Cybernet Police path |
| `onr_v1_236_data-raven` | Data Raven | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | Tag + Data Raven counter | CardImplementation printedSubroutine | `index.test.ts` Data Raven counter |
| `onr_v1_227_cerberus` | Cerberus | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | Cerberus counter | CardImplementation printedSubroutine | `index.test.ts` Cerberus counter damage |
| `onr_v1_255_mastiff` | Mastiff | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | Mastiff counter | CardImplementation printedSubroutine | `index.test.ts` Mastiff counter |
| `onr_v1_240_fang` | Fang | ICE | 4 | Korp then Runner | normale / restricted / temporary je nach Board | End run + run-lock cost 2 | CardImplementation printedSubroutine | `index.test.ts` Fang run lock |
| `onr_v1_241_fang-2-0` | Fang 2.0 | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | End run + run-lock cost 2 | CardImplementation printedSubroutine | `index.test.ts` Fang 2.0 / HTC |
| `onr_v1_221_asp` | Asp | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | End run + run-lock cost 1 | CardImplementation printedSubroutine | `index.test.ts` trace ICE smoke |
| `onr_v1_249_hunter` | Hunter | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | Tag | CardImplementation printedSubroutine | `index.test.ts` trace ICE smoke |
| `onr_v1_243_fetch-4-0-1` | Fetch 4.0.1 | ICE | 3 | Korp then Runner | normale / restricted / temporary je nach Board | Tag | Shared/CardDefinition + CardImplementation coverage | `index.test.ts` base-link assets |
| `onr_v1_246_fragmentation-storm` | Fragmentation Storm | ICE | 4 | Korp then Runner | normale / restricted / temporary je nach Board | End run + trash program + run lock | CardImplementation printedSubroutine | `index.test.ts` Fragmentation Storm |
| `onr_v1_228_cinderella` | Cinderella | ICE | 6 | Korp then Runner | normale / restricted / temporary je nach Board | End run + trash hardware + unpreventable meat damage | CardImplementation printedSubroutine | `index.test.ts` Cinderella/Homewrecker |
| `onr_v1_248_homewrecker` | Homewrecker | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | End run + trash hardware + unpreventable meat damage | Shared/CardDefinition + coverage path | `index.test.ts` Cinderella/Homewrecker |
| `onr_v1_251_jack-attack` | Jack Attack | ICE | 5 | Korp then Runner | normale / restricted / temporary je nach Board | Tag; separate jack-out lock subroutine | CardImplementation printedSubroutine | `index.test.ts` Jack Attack hardening |

Weitere bekannte trace-relevante, aber nicht primär payment-relevante Fälle: Crybaby (`crying` Counter reduziert Runner-Link), Turbeau Delacroix (Access-Trace), Blood Cat/Audit of Call Records/Chance Observation (Korp-Trace-Einstiege), Replicator (breakt Trace-Subroutinen), Raven Microcyb Eagle/Owl und weitere Link-/Recurring-Quellen. Sie sollten in einem späteren `game/trace`-Flow-Inventar verbleiben, aber ARCH-9 nicht vergrößern.

## 5. Payment-/Revalidation-Risiken

Hoch:

- Korp-Bid-Max und tatsächliche Korp-Zahlung sind heute nicht durch ein Quote-Objekt gekoppelt. Zwischen Choice-Öffnung und Resolve kann sich Boardstate ändern; Teile werden revalidiert, aber die Max-Quote wird nicht strukturiert neu verglichen.
- Korp-Zahlungspriorität ist implizit: Pocket-VR temporary credits, Paris, normale Credits, Krumz, Hacker Tracker. Eine Extraktion ohne Quote kann diese Reihenfolge verändern.
- Runner-Bid und Post-Bid-Link nutzen `spendRunnerTraceLinkBidCredits`, Base-Link dagegen nur `spendCredits`. Ein generischer Link-Payment-Refactor könnte versehentlich Base-Link mit hosted credits bezahlen lassen oder Post-Bid einschränken.
- `recordWilsonRunCapSpend` wird in Runner-Link-Bid- und Post-Bid-Zahlung aufgerufen. Eine Trennung von Trace und Payment könnte diesen run-spending cap umgehen.

Mittel:

- `corpBidMax` enthält Hacker Tracker und Rabbit-Limit-Reduktion; die eigentliche Zahlung prüft nur Hacker-Tracker-Überlauf explizit. Ein Quote sollte Limit und Quellen gemeinsam festhalten.
- `TraceState` speichert Quellen-IDs für Paris und temporary trace credits, aber nicht die vollständige Zahlungszerlegung.
- `LegalAction.costs` transportiert für Trace-Bids keine CostQuote. Die Zahlung hängt an `PendingChoice` plus Payload-Feldern.
- Base-Link- und Post-Bid-Fenster revalidieren Kandidaten gut, aber Payment-Payload wird handgebaut und kann von künftigen Quote-Feldern abweichen.

Niedrig:

- `game/payment/*` importiert keine Trace-Typen; Importzyklen sind aktuell vermeidbar, solange neue Trace-Payment-Helper nur Shared-Typen und kleine Host-Callbacks verwenden.

## 6. Hidden-Info-/PublicPayload-Risiken

- PublicPayload zeigt Korp-Bid, Trace Strength, Runner-Link, Runner-Bid, Runner Strength und Trace-Ergebnis öffentlich. Das passt zur offenen Trace-Sequenz, darf aber nicht auf andere HiddenChoice-Familien übertragen werden.
- Post-Bid-Link ist als hidden-info-barrier modelliert. Ein Flow-Schnitt muss die Choice-Visibility und die PublicPayload erst nach Entscheidung erhalten.
- `traceLinkCreditSourceDefinitionIds` macht verwendete Runner-Zahlungsquellen öffentlich. Das ist für sichtbare hosted credits plausibel, kann bei künftigen hidden resources aber riskant werden.
- `temporaryTraceCreditsSourceDefinitionId`, Paris-ServerId und Krumz-/Hacker-Payloads sind öffentliche Boardinformationen. Neue Quellen brauchen explizite Redaction-Klassifikation.
- `public-context.ts` hat viele Trace-Felder in Whitelists. Wenn `game/trace` eigene Payloads erzeugt, muss diese Whitelist zentral testbar bleiben, nicht pro Flow-Modul dupliziert werden.

## 7. Zielstruktur `game/trace` und `game/payment`

Langfristiges Ziel:

```text
packages/engine/src/game/trace/
  trace-state.ts        read-only TraceState helpers, status guards, ID building
  trace-actions.ts      Choice builders for corp_bid/base_link/runner_bid/post_bid_link
  trace-flow.ts         start/advance/complete orchestration
  trace-result.ts       success calculation and onSuccess dispatch

packages/engine/src/game/payment/
  trace-payment.ts      TracePaymentQuote, quote/pay/assert helpers
```

Wichtige Grenze:

- `game/trace` kennt Trace-Status, Bietfenster, Linkfenster, Resultat und Rückkehr in Run/Operation-Kontext.
- `game/payment/trace-payment.ts` kennt Zahlungsquellen und Revalidation für Trace-Bids, aber nicht den vollständigen Run-/Access-/Subroutine-Flow.
- Beide Module importieren keine Funktionen aus `index.ts`. Wenn Host-Operationen nötig sind, werden sie als kleine Dependencies injiziert oder die Extraktion bleibt vorerst im alten `index.ts`-Aufrufkontext.
- `TraceState` bleibt vorerst in `@netgrid/shared`, weil API-/Replay-/PlayerView-Verträge daran hängen.
- PublicPayload-Felder bleiben zunächst identisch und werden aus Quote/Flow-Ergebnis gebaut, nicht umbenannt.

## 8. Bewertung Option A/B/C

| Option | Bewertung |
| --- | --- |
| A: `game/trace` enthält alles | fachlich attraktiv, aber für ARCH-9 zu groß. Würde Trace-State, Choices, Payment, Link-Pumps, Resultat und onSuccess in einem Schritt bewegen. Höchstes Risiko für Importzyklen und für auseinanderlaufende Payment-Revalidation, weil Payment dann aus `game/payment` herausgezogen würde. |
| B: `game/payment` enthält Trace-Zahlungsquellen, `game/trace` orchestriert | bestes Zielbild. Minimiert doppelte Zahlungspfade, wenn Quote und Pay zusammenbleiben. Verhindert einen verteilten Monolithen, wenn `game/trace` keine Payment-Details dupliziert. Als Sofortschritt aber noch zu breit, weil `game/trace` noch nicht existiert und `index.ts` den Flow trägt. |
| C: zunächst nur `trace-payment` als read/write Helper, Trace-Flow bleibt in `index.ts` | bester nächster Schnitt. Klein, testbar, ohne neue Trace-Engine. Erhält LegalAction/Execution-Revalidation am besten, wenn ARCH-9 Quote-Erzeugung, Payload-Daten und Zahlung für genau einen Bid-Pfad bündelt. Risiko: kann zum Helper-Friedhof werden, wenn ARCH-10 nicht danach Runner-Bid/Post-Bid oder Trace-State gezielt nachzieht. |

Empfehlung: Option C für ARCH-9, Option B als Zielstruktur. Option A verwerfen, bis Korp- und Runner-TracePaymentQuotes stabil sind und die Choice-/Result-Pfade inventarisiert wurden.

## 9. Empfohlene Zielstruktur

Empfohlenes erstes Modul:

```text
packages/engine/src/game/payment/trace-payment.ts
  CorpTracePaymentQuote
  quoteCorpTraceBidPayment
  assertCorpTraceBidQuoteValid
  payCorpTraceBidQuote
  corpTracePaymentPublicPayload
```

Der Helper sollte für ARCH-9 nur Korp-Bids übernehmen:

- Eingaben: `GameState`, `TraceState`, ausgewählter Bid.
- Ausgabe: Quote mit `bid`, `temporaryTraceCredits`, `parisCityGridPool`, `corpCredits`, `krumzBits`, `hackerTrackerCounters`, `traceStrengthContribution`, `corpBidMaxAfterCurrentBoard`.
- Revalidation: assertet, dass Bid nonnegative integer ist, Quellen noch verfügbar und TraceState-Quellen zu aktuellem Run/Fort/ICE passen.
- Zahlung: verbraucht Quellen in der bestehenden Reihenfolge.
- Payload: erzeugt exakt die bestehenden PublicPayload-Felder für Korp-Bid-Payment.

Noch nicht in ARCH-9:

- `game/trace` anlegen.
- Runner-Bid, Base-Link oder Post-Bid-Link verschieben.
- Trace-Erfolg, onSuccess, PendingChoice oder `calculateRunnerLink` bewegen.
- `TraceState`-Typ verschieben.
- PublicPayload-Felder ändern.

## 10. Konkreter ARCH-9-Plan

Ziel:

- Einen kleinen Korp-TracePaymentQuote-Schnitt extrahieren, ohne Trace-Flow zu verschieben.
- `resolveTraceCorpBid` soll weiterhin in `index.ts` bleiben, aber Zahlungszerlegung, Revalidation, Payment und Payload-Fragment über `game/payment/trace-payment.ts` nutzen.

Dateien:

- Neu: `packages/engine/src/game/payment/trace-payment.ts`.
- Ergänzen: `packages/engine/src/game/payment/index.ts` Export.
- Minimal ändern: `packages/engine/src/index.ts` nur an der Korp-Bid-Zahlungsstelle.
- Tests: bestehende `packages/engine/src/index.test.ts` unverändert nutzen oder gezielte neue Unit-Tests nur, wenn der Refactor ohne Teständerung nicht ausreichend abgesichert ist. Keine Testassertions inhaltlich ändern.

Funktionen:

- `quoteCorpTraceBidPayment(deps, state, trace, bid): CorpTracePaymentQuote`
- `assertCorpTraceBidQuoteValid(deps, state, trace, quote): void`
- `payCorpTraceBidQuote(deps, state, trace, quote): CorpTracePaymentReceipt`
- `corpTracePaymentPublicPayload(receipt): Record<string, string | number | boolean>`

Importstruktur:

- `trace-payment.ts` importiert nur Typen aus `@netgrid/shared`.
- Zugriff auf Counter/Credits/Definitionen erfolgt über ein schmales `TracePaymentDeps`-Objekt, damit kein Import aus `index.ts` entsteht.
- `index.ts` baut die Deps aus bestehenden lokalen Helpers und ruft den Helper auf.

Tests:

- `corepack pnpm --filter @netgrid/engine test -- index.test.ts -t "Krumz|Paris City Grid|Pocket Virtual Reality|Hacker Tracker|Trace, Link and Bidding"`
- `corepack pnpm --filter @netgrid/engine typecheck`
- Bei Zeitbudget zusätzlich der volle Engine-Test.

Nicht-Ziele:

- Keine Runner-Bid-/Post-Bid-/Base-Link-Extraktion.
- Keine neue Payment-Engine.
- Keine neue Trace-Engine.
- Keine PublicPayload- oder PlayerView-Vertragsänderung.
- Keine Kartenmigration.

Commit-Message:

```text
refactor(engine): extract corp trace payment quote
```

## 11. Akzeptanzkriterien

- Das neue ARCH-8-Dokument ist das einzige Artefakt dieses Commits.
- Worktree war vor Dokumenterstellung sauber.
- `game/payment/*` bleibt im Audit ohne Trace-Codeänderung.
- Trace-Flow, Trace-Payment-Pfade, relevante Karten/Mechaniken und Risiken sind dokumentiert.
- Zielstruktur nennt explizit, dass Payment und Revalidation zusammenbleiben.
- ARCH-9 ist klein genug, um nur Korp-TracePaymentQuote zu schneiden.
- Keine Produktionscode-, Test-, Karten-, UI-, Server-, WebSocket-, SQLite- oder PublicPayload-Änderung.
- Checks: Engine/Web/Server-Typecheck soweit Paket vorhanden, `git diff --check`, `git diff --cached --check`.

## 12. Offene Fragen

- Soll Base-Link künftig absichtlich nur normale Runner-Credits nutzen, oder sollen restricted hosted `increase_link` Credits auch Base-Link-Kosten zahlen dürfen? Der Ist-Zustand erlaubt hosted credits nur für Runner-Bid/Post-Bid-Link, nicht für Base-Link.
- Soll Krumz vor oder nach normalen Korp-Credits priorisiert werden? Der Ist-Zustand zahlt normale Korp-Credits vor Krumz.
- Soll Hacker Tracker als Payment-Quelle oder als Trace-Strength/Limit-Modifikator modelliert werden? Der Ist-Zustand behandelt ihn wie Restzahlung nach anderen Quellen und als Payload-Boost.
- Soll `corpBidMax` bei Execution strikt gegen eine neu gebaute Quote verglichen werden, oder reicht Quellen-Revalidation plus Bid-Limit-Check?
- Wie werden künftige hidden Runner-Link-Quellen in `traceLinkCreditSourceDefinitionIds` redigiert?
- Soll `TraceState` langfristig in Shared bleiben, oder erst nach stabiler `game/trace`-Fassade in Engine-internen Zustand verschoben werden?

## Messwerte und Fundstellen

Erhobene Messwerte:

| Messwert | Ergebnis |
| --- | ---: |
| Trace-/Link-/Payment-nahe Funktionskandidaten in `index.ts` | 52 |
| LOC dieser Funktionskandidaten | 1.781 |
| `rg`-Treffer `trace|Trace|baseLink|postBidLink|Krumz|Paris|Hell's Run|temporaryTrace|runnerLink` in `index.ts` | 601 |
| direkte trace-payment-relevante `onr_v1_`-Referenzen in `index.ts` | 1 (`HELLS_RUN_ID`) |
| trace-/link-relevante `rg`-Treffer in `index.test.ts` | 649 |
| trace-/link-relevante `describe`/`it`-Kandidaten in `index.test.ts` | 63 |
| Trace-Treffer in `packages/engine/src/game/payment/*` | 0 |

Wichtige aktuelle Code-Fundstellen:

- `packages/engine/src/index.ts`: `startTraceFromSubroutine`, `startTraceFromOperation`, `resolveTraceCorpBid`, `resolveTraceBaseLinkChoice`, `resolveTraceRunnerBid`, `resolveTracePostBidLinkChoice`, `completeTraceAfterPostBidLink`, `spendRunnerTraceLinkBidCredits`.
- `packages/shared/src/index.ts`: `TraceState`, `TraceSuccessEffect`, `SubroutineDefinition`, `LegalAction`, `VisibleCard.baseLink`.
- `packages/engine/src/public-context.ts`: Trace-PublicPayload-Whitelist und traceStarted-Forwarding.
- `packages/engine/src/ability-engine/definition-types.ts`: Trace-Subroutines, Trace Access Steps, `trace_base_link_window`, `trace_post_bid_link_window`, restricted hosted credit uses.
- `packages/engine/src/ability-engine/printed-subroutine-implementations.ts`: Mapping `CardImplementation` printed trace subroutines auf `initiate_trace`.
- `packages/engine/src/ability-engine/trace-implementations.ts`: Mapping deklarativer Trace-onSuccess-Effekte auf `TraceSuccessEffect`; ausdrücklich ohne Bid, Link, Payment oder Payload.
- `packages/engine/src/card-implementations/onr-v1/**`: konkrete Trace-/Link-/Payment-Quellen.
