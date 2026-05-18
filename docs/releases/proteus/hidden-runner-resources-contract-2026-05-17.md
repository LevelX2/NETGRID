# Proteus Hidden Runner Resources Contract

Status: Vertragsartefakt, kein Runtime-Release
Stand: 2026-05-17
Primärer Agent: card-enablement-ai-knowledge-agent

## Zweck

Dieses Artefakt definiert den vorbereitenden Vertrag für Proteus-Runner-Resources mit dem Subtyp `hidden`. Es trennt den gemeinsamen Hidden-Resource-Zustand von den späteren kartenindividuellen Resolvern, damit Installation, Reveal, Trash, Aktivierung, PlayerView, PublicEvents, AIInput, Reconnect, Replay und StateHash vor der ersten Kartenumsetzung side-sicher feststehen.

Keine Aussage in diesem Dokument schaltet Proteus-Karten frei. Die Proteus-Daten bleiben Planungsinput ohne Runtime-Resolver, Deck-Legalität oder AI-Hints, bis ein eigenes Release- und Gate-Paket dies explizit umsetzt.

## Führende Quellen

- `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- `data/card-import/proteus-card-basis-2026-05-17.json`
- `docs/source/Proteusspoiler.txt`
- `docs/source/Netrunner Errata 1.70.md`
- `docs/releases/mvp/mvp-0-95-resources-tags/resource-tag-interaction-spec.md`
- `docs/releases/mvp/mvp-0-98-identities-hidden-zones/hidden-zone-tools-spec.md`
- `docs/releases/mvp/mvp-0-96-trace-link-bidding/trace-link-bidding-spec.md`
- `docs/derived/TRACE_OPEN_BIDDING_ALIGNMENT_PLAN_2026_05_16.md`
- `docs/releases/mvp/mvp-0-94-damage-flatline/damage-flatline-spec.md`
- `docs/releases/mvp/mvp-0-97-run-breach-multiaccess/run-breach-multiaccess-spec.md`
- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/full-archives-access-spec.md`

## Proteus-Zielgruppe

Der Cluster `hidden_runner_resources` umfasst 16 Proteus-Karten. Alle bleiben `deepen`, weil vor Runtime-Umsetzung mindestens der gemeinsame Hidden-Resource-Vertrag und danach enge Resolver nötig sind.

| Karte | Primäres Fenster | Zusatzcluster |
| --- | --- | --- |
| `onr_proteus_128_airport-locker` Airport Locker | Encounter, Stack-Search, Install | `hidden_zone_search_install_tutor` |
| `onr_proteus_129_back-door-to-netwatch` Back Door to Netwatch | Trace-Erfolg, Trace-Effekt-Cancel | `bad_publicity_loss_gate`, `trace_link_modifiers`, `tag_flow`, `prevention_avoid_replacement` |
| `onr_proteus_132_bolt-hole` Bolt-Hole | Damage-Prevention | `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement` |
| `onr_proteus_133_chiba-bank-account` Chiba Bank Account | Kosten-/Penalty-Zahlung | `economy_draw_basics` |
| `onr_proteus_136_credit-subversion` Credit Subversion | Erfolgreicher HQ-Run | `trash_forfeit_sabotage`, `run_event_basics` |
| `onr_proteus_137_death-from-above` Death from Above | Erfolgreicher Remote-Run vor Access | `trash_forfeit_sabotage` |
| `onr_proteus_140_expendable-family-member` Expendable Family Member | Tag-Avoid | `tag_flow`, `prevention_avoid_replacement` |
| `onr_proteus_141_get-ready-to-rumble` Get Ready to Rumble | Nach erfolgreichem Meat Damage | `random_die_resolution`, `damage_prevention_and_core_hand_size` |
| `onr_proteus_142_hq-mole` HQ Mole | HQ-Access-Multiaccess | `access_breach_multiaccess_ambush` |
| `onr_proteus_143_liberated-savings-account` Liberated Savings Account | Kosten-/Penalty-Zahlung | `access_breach_multiaccess_ambush`, `economy_draw_basics` |
| `onr_proteus_145_mercenary-subcontract` Mercenary Subcontract | Während aktuellem Access | `trash_forfeit_sabotage` |
| `onr_proteus_147_r-and-d-mole` R&D Mole | R&D-Access-Multiaccess | `access_breach_multiaccess_ambush` |
| `onr_proteus_149_simulacrum` Simulacrum | Encounter-Pass eines AP ICE | keine Zusatzfamilie außer Hidden Resource |
| `onr_proteus_152_swiss-bank-account` Swiss Bank Account | Kosten-/Penalty-Zahlung | `economy_draw_basics` |
| `onr_proteus_153_time-to-collect` Time to Collect | Resource-Trash-Prevention | `prevention_avoid_replacement` |
| `onr_proteus_154_wired-switchboard` Wired Switchboard | Trace-Link-Boost | `trace_link_modifiers` |

## Gemeinsamer Zustandsvertrag

Hidden Runner Resources sind installierte Runner-Resources im Rig, deren Identität für die Korp bis Reveal oder erfolgreichem Trash verdeckt bleibt.

Mindestzustände:

- `concealed_installed`: Die Karte liegt in `runner.rig.resources`, gehört und untersteht dem Runner, ist für den Runner vollständig bekannt und für die Korp nur als verdeckte Runner-Resource sichtbar.
- `revealing_for_activation`: Ein kurzlebiger Resolver-Zustand innerhalb einer LegalAction. Die Karte wird öffentlich identifizierbar, bevor der Effekt vollständig aufgelöst wird.
- `trashed_faceup`: Die Karte liegt im Runner-Heap und ist für beide Seiten nach dem bestehenden Heap-Vertrag sichtbar.
- `prevented_trash`: Die Karte bleibt installiert und verdeckt, wenn ein legaler Prevention-/Replacement-Effekt den Trash vollständig verhindert. Der verhinderte Trash darf ihre Identität der Korp nicht offenlegen, außer die verhindernde Quelle selbst wurde öffentlich revealet.

Der bestehende offene Resource-Vertrag aus V0.95 bleibt für nicht-hidden Resources unverändert. Hidden Resources sind keine neue Zone, sondern ein eigener Sichtbarkeitsmodus installierter Runner-Resources.

## Installation

Eine Hidden Resource darf nur über eine aus `LegalActions` abgeleitete Runner-Install-Aktion installiert werden.

Legalitätsminimum:

- aktive Seite Runner,
- legales Runner-Install- oder kartenindividuell freigegebenes Install-Fenster,
- passende `stateVersion`,
- Karte liegt im Runner-Grip oder in der explizit freigegebenen Quelle,
- Kartentyp `resource`,
- Subtyp `hidden`,
- Installationskosten und zusätzliche Kosten sind zahlbar,
- keine offene Choice oder Timing-Sperre blockiert die Installation.

Effekt:

- Runner zahlt Klick und Kosten nach dem jeweiligen Install-Vertrag.
- Die Karte wechselt nach `runner.rig.resources`.
- Für den Runner bleibt sie vollständig sichtbar.
- Für die Korp entsteht ein redigierter Face-down-Eintrag mit öffentlichem Slot-Bezug, aber ohne Titel, DefinitionId, Regeln, Subtypenliste, Kosten, Counterdetails oder echte Instance-ID.
- Das öffentliche Install-Event darf nur eine abstrakte Hidden-Resource-Installation melden.

Installation aus Grip ist selbst keine Reveal-Aktion. Sie darf keine Kartendaten aus Grip, Stack, Heap, HQ, R&D oder Archives in PublicEvents, Reconnect-Payloads, Logs, Client-Fehler, Undo-Preview oder AIInput der falschen Seite schreiben.

## Reveal und Aktivierung

Proteus-Hidden-Resources werden bei ihrer Aktivierung in der Regel als Kosten getrasht. NETGRID modelliert dies atomar als `reveal_and_trash_for_hidden_resource_activation` innerhalb einer validierten LegalAction.

Ablauf:

1. `getLegalActions` bietet die Aktivierung nur dem Runner an und nur im passenden Timingfenster.
2. Die Runner-Action referenziert die echte Karteninstanz aus der Runner-PlayerView.
3. `applyAction` revalidiert Side, `actionId`, `stateVersion`, Timingpunkt, Quelle, Kosten, Ziel, Choice-Kontext und aktuelle verdeckte Installation.
4. Wenn die Aktivierung legal ist, wird die Quelle öffentlich revealet.
5. Der Trash-Kostenanteil bewegt die Karte faceup in den Runner-Heap, sofern kein vorgelagertes Prevention-/Replacement-Fenster den Trash legal verhindert.
6. Erst danach löst der kartenindividuelle Effekt aus.

PublicEvents dürfen die Karte erst ab Schritt 4 namentlich zeigen. Vorher darf weder die Existenz einer spezifischen verdeckten Quelle noch eine mögliche Optionsliste an die Korp geleakt werden.

## Trash-Vertrag

Hidden Resources können durch mindestens drei Pfade getrasht werden:

- Aktivierungskosten der eigenen Hidden Resource.
- Korp-`trash_resource`, wenn der Runner getaggt ist.
- Karteneffekte, die installierte Runner-Resources trashen.

Für Korp-`trash_resource` gilt ein eigener Target-Vertrag:

- Die Korp darf bei getaggtem Runner redigierte Hidden-Resource-Slots als Ziele sehen, sofern der Effekt allgemein installierte Runner-Resources treffen darf.
- Die LegalAction darf keinen Titel, keine DefinitionId und keine echten privaten Instanzdaten enthalten.
- `applyAction` mappt das redigierte Ziel ausschließlich server-/engine-seitig auf die autoritative Instanz und revalidiert, dass das Ziel noch installiert, Runner-kontrolliert und trashbar ist.
- Wenn der Trash erfolgreich ist, wird die Karte im Runner-Heap faceup und das PublicEvent darf ab diesem Zeitpunkt Titel und DefinitionId enthalten.
- Wenn ein Trash verhindert wird, bleibt die Hidden Resource verdeckt, außer der verhindernde Effekt revealet seine eigene Quelle.

Time-to-Collect-artige Effekte brauchen vor der Kartenfreigabe ein eigenes Resource-Trash-Prevention-Fenster. Dieses Fenster darf nicht alle verdeckten Resource-Identitäten als Optionsliste öffentlich machen.

## PlayerView-Grenzen

Runner-View:

- Runner sieht eigene Hidden Resources im Rig vollständig.
- Runner sieht echte `instanceId`, Titel, DefinitionId, Regeltext, Kosten, Subtypen und counters, soweit sie nach allgemeinem Runner-Vertrag sichtbar sind.
- Runner sieht Aktivierungs-LegalActions nur im legalen Timingfenster.

Korp-View:

- Korp sieht die Anzahl und redigierten Board-Slots verdeckter Runner-Resources.
- Korp darf für verdeckte Slots höchstens `known: false`, einen stabilen öffentlichen Slot-Identifier, Owner/Controller Runner und eine neutrale Darstellung wie `hidden_runner_resource` sehen.
- Korp darf keine Titel, DefinitionIds, Proteus-Collector-Nummern, Regeln, Subtypen außer der abstrakten Hidden-Resource-Klasse, Kosten, Aktivierungsfenster oder AI-Bewertungsdaten sehen.
- Korp-LegalActions zum Trashing dürfen redigierte Slots referenzieren, nicht die echte Identität.

Reconnect, WebSocket, Undo-Preview, Chronik, Logs, Client-Fehler und öffentliche Replays müssen exakt denselben Redaction-Vertrag einhalten.

## PublicEvent-Grenzen

Erlaubt vor Reveal:

- `hidden_resource_installed` mit Actor Runner und redigiertem Slot.
- `hidden_resource_slot_targeted` für einen legalen Korp-Trash-Versuch ohne Identität.
- abstrakte Counts und Timinginformationen, sofern sie ohnehin aus dem Board ersichtlich sind.

Erlaubt ab Reveal oder erfolgreichem Trash:

- Titel und DefinitionId der revealten/getrashten Quelle.
- Effektfamilie und öffentliches Ergebnis, soweit der konkrete Effekt public ist.
- Trash-Ziel und Zonewechsel, wenn die Zielkarte nach dem jeweiligen Sichtbarkeitsvertrag sichtbar ist.

Nicht erlaubt:

- echte verdeckte Instance-IDs in öffentlichen Payloads,
- FullState oder private Resolver-Kontexte,
- verdeckte Runner-Grip-/Stack-Listen,
- Korp-HQ-/R&D-Listen aus Hidden-Resource-Effekten,
- nicht gewählte Hidden-Resource-Optionen,
- AI-Reason-Codes mit gegnerischer verdeckter Identität.

## AIInput-Vertrag

Runner-AI:

- darf eigene Hidden Resources kennen und aktivieren, wenn die LegalAction in der Runner-PlayerView vorhanden ist.
- darf Kostenfenster, Tracefenster, Damagefenster und Accessfenster nur aus LegalActions und side-sicheren PlayerView-Daten bewerten.

Korp-AI:

- darf Anzahl und redigierte Slots verdeckter Runner-Resources kennen.
- darf bei Tag-Trash-Entscheidungen nur redigierte Slots, öffentliche Boardlage und bisher revealte Informationen verwenden.
- darf verdeckte Hidden-Resource-Identitäten nicht aus Katalog, FullState, Card-Hints, Debugdaten, Reconnect oder EventTail erhalten.

Keine Proteus-Hidden-Resource darf `ai_supported` werden, bevor ihre Hidden-Info-Tests und kartenindividuellen AI-Hints den Redaction-Vertrag nachweisen.

## Timingfenster

### Trace

NETGRID bleibt beim offenen Trace-Modell. Korp-Gebote sind sichtbar; Runner-Choices bleiben runner-privat.

- `Wired Switchboard`: modernes post-bid Link-Boost-Fenster. Es darf nach dem normalen Runner-Gebot, aber vor finaler Erfolgsberechnung als Runner-Choice angeboten werden. Es erzeugt `temporaryLinkBoosts` für genau diesen Trace. Es führt kein blindes oder gleichzeitig verdecktes Reveal-Bieten ein.
- `Back Door to Netwatch`: Trace-Erfolg-Cancel-Fenster nach erfolgreicher Trace-Berechnung, aber vor Anwendung des Trace-Erfolgseffekts. Die Bad-Publicity-Folge ist öffentlich, darf aber erst nach Reveal/Trash der Quelle sichtbar werden.

### Damage

- `Bolt-Hole`: Prevention-Fenster vor Random-Grip-Auswahl und Flatline-Entscheidung für den betroffenen Meat-Damage-Anteil.
- `Get Ready to Rumble`: Trigger-Fenster nach erfolgreicher Meat-Damage-Auflösung, wenn das Spiel nicht bereits beendet ist. Der spätere HQ-Random-Discard braucht `RandomDrawRecords` und darf Korp-HQ-Titel erst nach dem Trash/Discard-Vertrag offenlegen.

Damage-Prevention darf keine Grip-Zusammensetzung, Random-Auswahl oder nicht genutzte Prevention-Quellen an die Korp leaken.

### Access und erfolgreicher Run

- `HQ Mole` und `R&D Mole`: Multiaccess-Modifikator im Access-Start-Fenster, bevor die Access-Queue final feststeht. Die zusätzliche Queue darf künftige HQ-/R&D-Karten nicht vorab in PlayerViews oder PublicEvents zeigen.
- `Death from Above`: Remote-Erfolgsfenster nach erfolgreichem Run auf den betroffenen Remote-Server und vor dem ersten Access.
- `Mercenary Subcontract`: Access-Entscheidungsfenster für aktuell accessete Karten. Es darf nur aktuelle Access-Kandidaten betreffen, keine künftigen Queue-Entries.
- `Credit Subversion`: Erfolgreicher-HQ-Run-Fenster nach festgestelltem Erfolg. Vor einer Runtime-Umsetzung muss entschieden werden, ob dies vor oder nach dem normalen HQ-Breach liegt; die Entscheidung gehört in den Kartenresolver, nicht in den gemeinsamen Hidden-Resource-Vertrag.

### Kosten und Penalties

`Chiba Bank Account`, `Swiss Bank Account` und `Liberated Savings Account` benötigen ein Cost-/Penalty-Support-Fenster.

Mindestvertrag:

- Das Hauptvorhaben wird zuerst angekündigt: Installation, Fähigkeit, Trash-Kosten, Trace-Gebot, Steal-/Trash-Kosten oder sonstige Penalty.
- Danach öffnet die Engine side-sicher nur für den zahlenden Runner verfügbare Hidden-Resource-Zahlungsquellen.
- Jede genutzte Quelle wird einzeln vollständig resolved: Reveal, Trash-Kosten, Credit-Gain, PublicEvent ab Reveal.
- Erst danach wird die ursprüngliche Zahlung final validiert und bezahlt.
- Rekursive oder unbegrenzte Cost-Support-Ketten müssen eine eindeutige Engine-Grenze haben, damit Replay und StateHash stabil bleiben.

## Replay und StateHash

Der Vertrag verlangt:

- deterministische Slot-Erzeugung für verdeckte installierte Resources,
- keine Kartendaten in Purpose-Strings, Redaction-IDs oder öffentlichen Hashkontexten,
- `RandomDrawRecords` für Stack-Search-Shuffle, HQ-Random-Discard und HQ-Multiaccess-Auswahl,
- identische StateHashes bei gleichem Seed, Decksnapshot und Action-Stream,
- Undo-Barriere, sobald ein Effekt private Hidden-Zone-Daten ansieht, eine verdeckte Identität revealet oder RandomDrawRecords erzeugt.

Installation einer verdeckten Resource ist keine automatische Hidden-Zone-Search-Barriere. Aktivierung, Reveal, Search, Random-Discard und Hidden-Zone-Multiaccess sind dagegen nach ihrem jeweiligen Effektvertrag Barrieren.

## Testanforderungen

Mindesttests für den ersten Runtime-Slice:

- Runner installiert eine Hidden Resource face down; Runner-PlayerView zeigt Identität, Korp-PlayerView zeigt nur redigierten Slot.
- PublicEvent für Installation enthält keine Titel, DefinitionId, echte Instance-ID oder Regeln.
- Reconnect liefert beiden Seiten denselben Redaction-Stand wie frische PlayerViews.
- Korp-AIInput enthält nur redigierte Slots und keine Hidden-Resource-Identität.
- Korp-`trash_resource` bei getaggtem Runner kann einen redigierten Slot targeten; erfolgreicher Trash revealet die Karte erst im Heap.
- Replay reproduziert Slot, Trash und finalen StateHash.
- `git grep`/Leak-Scan gegen PublicEvents, WebSocket-Payloads, Reconnect, Logs und AIInput findet keine verdeckten Proteus-Titel vor Reveal.

Zusätzliche Tests pro späterer Fensterfamilie:

- Trace: Runner-private post-bid Choices, öffentliche Korp-Bids, kein blindes Reveal-Modell.
- Damage: Prevention vor Random-Auswahl und Flatline, keine Grip-Leaks.
- Access: keine künftigen Queue-Titel in HQ/R&D/Archives, auch nicht bei Multiaccess.
- Cost/Penalty: einzeln resolved Hidden-Resource-Zahlungsquellen, stabile Revalidierung nach jedem Credit-Gain.

## Erster kleiner Umsetzungsslice

Empfohlener erster Slice: `hidden_resource_foundation_no_card_promotion`.

Scope:

- generischer Hidden-Resource-Installationsmodus für importierte, aber nicht promotete Harness-/Testkarten oder eng freigegebene Testfixtures,
- Runner/Korp-PlayerView-Redaction für verdeckte Runner-Resources im Rig,
- PublicEvent-Redaction für Installation,
- Korp-`trash_resource` gegen redigierte Hidden-Resource-Slots bei getaggtem Runner,
- Reveal-on-successful-trash in den Runner-Heap,
- Reconnect-, AIInput-, Replay- und StateHash-Tests.

Nicht im Slice:

- keine Proteus-Kartenfreigabe,
- keine Aktivierungsfähigkeiten,
- keine Trace-, Damage-, Access- oder Cost-/Penalty-Fenster,
- keine Assets oder Bilder,
- keine AI-Hints.

Dieser Slice beweist zuerst den Hidden-Info-Vertrag der installierten verdeckten Runner-Resource. Danach können die Fensterfamilien einzeln folgen: Cost/Penalty-Bankkarten, Damage-Prevention, Trace-Post-Bid/Cancellation, Access-Multiaccess und Encounter-/Search-Effekte.

## Risiken und offene Entscheidungen

- Redigierte Slot-IDs müssen stabil genug für LegalActions und Reconnect sein, dürfen aber keine echte Instance-ID oder Definition ableitbar machen.
- Korp-Targeting verdeckter Resources braucht UI- und AI-Labels, die Zielbarkeit ermöglichen, ohne Identität oder Wertung zu verraten.
- Cost-/Penalty-Support ist die komplexeste Fensterfamilie, weil Hidden-Resource-Credit-Gain in laufende Kostenrevalidierung eingreift.
- `Credit Subversion` braucht vor Umsetzung eine konkrete Reihenfolgenentscheidung relativ zum HQ-Breach.
- `Time to Collect` kann Resource-Trash verhindern, ohne alle verdeckten Zielidentitäten offenzulegen; dieses Prevention-Fenster ist ein eigener späterer Vertragsschnitt.
