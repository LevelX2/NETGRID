# MVP 0.4 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze  
Stand: 2026-05-03  
Empfohlener Phasenname: `MVP 0.4 card pool and rules breadth requirements`

## 1. Kurzentscheidung

MVP 0.4 ist die kontrollierte Kartenpool- und Regelbreite-Phase.

V0.4 erweitert den vorhandenen Demo-Kartenpool nicht breit, sondern testgetrieben und in klar getrennten Mechanik-Schnitten. Die Phase baut auf V0.3 auf: Erst wenn Runner-KI, Corp-KI v2, KI-vs-KI-Simulation, Erklärmodus und AI-Visibility-Gates stabil sind, werden zusätzliche Karten und Regeln freigegeben.

Kernformel:

> Mehr Karten nur mit mehr Tests: Jede neue Karte bekommt Manifest, Resolver, Szenario, Visibility-Prüfung, Replay/StateHash und KI-/Simulation-Regression.

## 2. Ziel

V0.4 soll aus der bisherigen technischen Demo einen etwas breiteren, aber weiterhin kuratierten Lern- und Testkartenpool machen.

Die Spielbasis soll danach mehr Variation bieten:

- zusätzliche einfache Events, Operationen, ICE, Breaker, Assets und Upgrades,
- größere interne Demo-Decks,
- eingeschränkte Deckvalidierung für kuratierte Decks,
- erste begrenzte Regelbreite über Tags,
- optional oder als eigenes Teilgate einfache Damage-Regeln.

Die Phase bleibt intern und privat. Es geht nicht um offizielle Karten, offizielle Artworks, öffentliche Plattformfunktionen oder freien Deckbau.

## 3. Ausgangslage

Vorhanden aus MVP 0.1:

- `CardType` umfasst aktuell `identity`, `event`, `program`, `agenda`, `operation`, `asset`, `ice`.
- `ActionType` umfasst Grundaktionen, Install, Play, Advance, Score, Run, Rez, Breaker-Pump, Break, Access, Steal, Trash und End Turn.
- RunnerState enthält bereits `tags`, aber Tags sind noch nicht aktiv implementiert.
- RunnerRig enthält aktuell nur `programs`.
- Demo-Decks bestehen aus 13 `playable_mvp` Karten.
- Demo-Siegwert ist `agendaPointsToWin = 6`, weil das Corp-Demo-Deck genau 6 Agenda Points enthält.

Vorhanden aus MVP 0.2:

- serverautoritative Action-Pipeline,
- side-gefilterte REST-/WebSocket-Payloads,
- Reconnect und Undo,
- Hidden-Info-Barrieren für relevante Informationsgewinnung,
- Multiplayer-Tests und Smokes.

Geplant aus MVP 0.3:

- Runner-KI,
- Corp-KI v2,
- KI-vs-KI-Simulation,
- AI-Visibility-Gates,
- reproduzierbare Simulationen über Seeds und StateHash.

V0.4 darf erst produktiv umgesetzt werden, wenn V0.3 diese Regressionsbasis liefert oder der Blocker ausdrücklich akzeptiert wird.

## 4. Nicht-Ziele

V0.4 baut nicht:

- offiziellen Kartenpool,
- externe Kartendatenbank-Abhängigkeit,
- offizielle Kartentexte als automatische Regelquelle,
- offizielle Artworks, Logos, Card Frames oder Card Backs,
- freien Deckbuilder,
- Formatlegalität, Rotation, Einfluss oder Banlisten,
- breite Fraktionsidentitäten,
- Traces,
- Viren,
- Hosting/Hosted Cards,
- Multiaccess,
- Bypass,
- Server-Umleitung,
- Forced Encounters,
- Prevention, Avoid, Replacement oder Interrupts als vollständige Systeme,
- öffentliche Plattformfunktionen,
- Matchmaking,
- Accounts,
- Chat oder Zuschauer als Produktfeature.

## 5. Leitprinzipien

1. Jede neue Karte erhöht Testlast.
2. Jede neue Mechanik wird einzeln gegatet.
3. Keine Karte wird `playable_mvp`, bevor Manifest, Tests und Visibility-Prüfung bestehen.
4. Gedruckter Kartentext bleibt Dokumentation, nicht Regelinterpreter.
5. Resolver bleiben rein engine-intern und haben keine UI-, Server-, Storage- oder KI-Abhängigkeiten.
6. UI, KI und Server nutzen weiter nur `LegalActions`.
7. Neue Hidden-Info-Berührungen aktualisieren Undo-, Reconnect-, Replay-, AI- und WebSocket-Tests.
8. V0.4 erweitert interne Demo-Karten, nicht offizielle Produktkarten.

## 6. V0.4-Scope

### 6.1 Must

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V04-MUST-001 | V0.4-Baseline | `rules-baseline-0.4.json` trennt Engine-, Karten-, Deck- und Szenario-Versionen sichtbar von V0.1/V0.2. |
| V04-MUST-002 | Versionierte Kartenartefakte | V0.4-Karten, Manifest und Decks liegen als eigene versionierte Artefakte vor; V0.1-Demo-Artefakte bleiben nachvollziehbar. |
| V04-MUST-003 | Manifest-Erweiterung | Jede neue Karte hat Status, Resolver/Ability, erlaubte Decks, Tests, Limitierungen und Visibility-Notizen. |
| V04-MUST-004 | Eingeschränkte Deckvalidierung | Kuratierte Decks werden gegen Side, Identity, erlaubte Karten, Manifeststatus, Mengen und Agenda Points geprüft. |
| V04-MUST-005 | Safe Card Batch | Zusätzliche einfache Karten ohne Tags/Damage funktionieren mit Unit-, Szenario-, Visibility- und Replay-Tests. |
| V04-MUST-006 | CardType-Erweiterung | Engine und Views unterstützen mindestens `hardware` und `upgrade`, sofern V0.4-Karten sie verwenden. |
| V04-MUST-007 | Resolver-/Ability-Modell | Ein kontrolliertes Effektmodell oder Resolver-Modell deckt neue einfache Karteneffekte ohne Freitextinterpretation ab. |
| V04-MUST-008 | Existing Gates bleiben grün | MVP-0.1-, MVP-0.2- und MVP-0.3-Gates bleiben nach V0.4-Kartenänderungen grün. |
| V04-MUST-009 | AI-/Simulation-Regression | KI-vs-KI-Smokes laufen mit V0.4-Decks ohne illegale Aktionen, Invariant-Fehler oder Hidden-Info-Leak. |
| V04-MUST-010 | Kein FullState-Leak | Neue Karten, neue Actions, neue Events und neue UI-Daten bleiben side-gefiltert. |

### 6.2 Should

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V04-SHOULD-001 | Tag-Slice | Tags werden als erste neue Regelgruppe implementiert: Runner kann Tags erhalten und mit Grundaktion entfernen. |
| V04-SHOULD-002 | Tag-Punishment-Testkarte | Eine interne Corp-Testkarte darf nur bei getaggtem Runner wirken und hat negative Tests. |
| V04-SHOULD-003 | Damage-Slice | Einfache Damage-Regel wird erst nach Safe Card Batch und Tag-Gate als eigenes Teilgate umgesetzt. |
| V04-SHOULD-004 | 7-Punkte-Ziel prüfen | Größere Corp-Demo-Decks enthalten genug Agenda Points, um optional den normalen 7-Punkte-Zielwert zu testen. |
| V04-SHOULD-005 | Simulation Report | V0.4-Simulationsberichte nennen Kartenpool-Version, Deck-Version, Winner, Seed und finalen StateHash. |

### 6.3 Could

| ID | Idee | Bedingung |
|---|---|---|
| V04-COULD-001 | Simple Resource-Typ | Nur wenn Tags sinnvoll genutzt werden und `trash_resource` bewusst noch nicht benötigt wird. |
| V04-COULD-002 | Mehrere kuratierte Deckvarianten | Nur als interne feste Decks, ohne freien Deckbuilder. |
| V04-COULD-003 | UI-Kartenkatalog für interne Karten | Nur Datenansicht, keine offizielle Asset-Nutzung. |

## 7. Gestaffelte Teilphasen

### V0.4-A Requirements und Baseline

Ergebnisse:

- `docs/derived/MVP_0.4_REQUIREMENTS.md`
- `docs/derived/CARD_POOL_0.4_SPEC.md`
- `docs/derived/RULE_MECHANICS_0.4_SPEC.md`
- `docs/derived/DECK_VALIDATION_0.4_SPEC.md`
- `docs/derived/MVP_0.4_TEST_MATRIX.md`
- `docs/derived/MVP_0.4_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-0.4.json`

Gate:

- Alle Must-Anforderungen sind testbar.
- Jede geplante Karte hat Test- und Visibility-Zuordnung.
- Jede Mechanik ist entweder `in_scope`, `deferred` oder `blocked` markiert.
- `ready_for_implementation: true` erst nach Review.

### V0.4-B Card-System- und Datenmodell-Härtung

Ziel:

Die Engine bekommt die minimal nötige Struktur, um mehr Karten zu tragen, ohne sofort komplexe Regeln einzubauen.

Mögliche Änderungen:

- `CardType` erweitern um `hardware`, `resource`, `upgrade`, falls für V0.4 freigegeben.
- `RunnerRig` erweitern um `hardware` und optional `resources`.
- Corp-Root-Zonen klar zwischen Agenda, Asset und Upgrade behandeln.
- `CardDefinition` um begrenzte Effekt-/Ability-Metadaten erweitern.
- `ActionType` gezielt erweitern, z. B. um `trigger_ability` und später `remove_tag`.
- CardImplementation-Manifest auf `0.4.0` versionieren.

Gate:

- Alte Demo-Decks funktionieren unverändert.
- Neue Datenartefakte parsen.
- Keine Karte ohne zulässigen Manifeststatus wird in kuratierten Decks erlaubt.

### V0.4-C Safe Card Batch

Ziel:

Neue Spieltiefe ohne neue riskante Regelgruppe.

Empfohlene interne Testkarten:

| Karte | Seite | Typ | Zweck | Neue Regelkomplexität |
|---|---|---|---|---|
| `simple_draw_event` | Runner | Event | Runner zieht 2 Karten. | gering, Zufall/DrawRecord prüfen |
| `simple_setup_hardware` | Runner | Hardware | +1 Memory Limit. | mittel, Rig-Schema erweitern |
| `efficient_fracter` | Runner | Program | Alternative Barrier-Lösung. | gering, Breaker-Regression |
| `efficient_decoder` | Runner | Program | Alternative Code-Gate-Lösung. | gering, Breaker-Regression |
| `efficient_killer` | Runner | Program | Alternative Sentry-Lösung. | gering, Breaker-Regression |
| `simple_priority_agenda` | Corp | Agenda | 3 Agenda Points oder alternative Adv-Anforderung. | gering bis mittel, Siegwert prüfen |
| `simple_taxing_barrier_ice` | Corp | ICE | ETR plus Runner verliert 1 Credit. | gering, Subroutine-Variante |
| `simple_taxing_code_gate_ice` | Corp | ICE | Corp gewinnt Credit plus ETR oder zusätzliche Tax. | gering |
| `simple_upgrade` | Corp | Upgrade | Verdeckt installieren, rezzen, beim Access trashbar. | mittel, neuer CardType |
| `simple_draw_operation` | Corp | Operation | Corp zieht 2 Karten. | gering, HQ/Visibility prüfen |

Regel:

Diese Karten dürfen keine Tags, Damage, Trace, Hosting, Multiaccess, Bypass, Prevention, Replacement oder zusätzliche Steal-Kosten benötigen.

Gate:

- Jede Karte hat Unit-, Szenario-, Visibility- und Replay-Abdeckung.
- AI-vs-KI-Smoke kann mit Safe-Batch-Decks laufen.
- Multiplayer-StateUpdates bleiben side-sicher.

### V0.4-D Tag-Slice

Ziel:

Tags als erste neue echte Regelgruppe kontrolliert einführen.

Empfohlener Umfang:

- RunnerState `tags` wird aktiv genutzt.
- Subroutine-/Effect-Typ `tag_runner` oder `give_runner_tag`.
- Basic Action `remove_tag`: Runner zahlt 1 Click und 2 Credits, entfernt 1 Tag.
- Condition `runner_is_tagged` für einzelne Testkarten.
- Keine Trace-Mechanik; Tags entstehen direkt durch klare Karteneffekte.
- Keine Ressourcen-Trash-Regeln als Pflicht.

Empfohlene interne Testkarten:

| Karte | Seite | Typ | Zweck |
|---|---|---|---|
| `simple_tag_ice` | Corp | ICE / Sentry oder Code Gate | Ungebrochene Subroutine gibt Runner 1 Tag und kann Run beenden. |
| `simple_tag_punishment_operation` | Corp | Operation | Nur spielbar, wenn Runner getaggt ist; z. B. Runner verliert Credits oder Corp gewinnt Credits. |
| `simple_tag_clear_event` | Runner | Event | Optionaler Testeffekt, der Tags entfernt oder Credits für Remove-Tag vorbereitet. |

Gate:

- Tags sind in PlayerViews öffentlich korrekt sichtbar.
- `remove_tag` ist nur legal, wenn Runner getaggt ist und Kosten zahlen kann.
- Tag-Punishment ist illegal, wenn Runner nicht getaggt ist.
- Reconnect und WebSocket zeigen Tag-Zahl, aber keine privaten Hand-/Deckdaten.
- Undo-Regel ist dokumentiert: Tag-Erhalt allein ist keine Hidden-Info-Barrier, Damage oder Access aber schon.
- KI-Simulationen können mit Tags umgehen und laufen nicht in Tag-Endlosschleifen.

### V0.4-E Damage-Slice

Ziel:

Einfache Damage-Regeln nur als separates Teilgate nach Safe Card Batch und vorzugsweise nach Tag-Slice.

Empfohlener Umfang:

- Ein Effect-Typ `do_damage` mit `amount`.
- Damage trashte Karten aus Runner Grip deterministisch per Seed/RandomDrawRecord oder nach klarer MVP-Regel.
- Keine Prevention, keine Replacement-Effekte, keine Damage-Vermeidung.
- Keine komplexe Unterscheidung von Net/Meat/Core als produktive Mechanik, falls nicht ausdrücklich entschieden.
- Damage ist eine Hidden-Info-Barrier für Undo.

Empfohlene interne Testkarten:

| Karte | Seite | Typ | Zweck |
|---|---|---|---|
| `simple_damage_sentry` | Corp | ICE | Ungebrochene Subroutine verursacht 1 Damage und ggf. ETR. |
| `simple_damage_asset` | Corp | Asset | Beim Access oder Rez verursacht es 1 Damage nach klarer MVP-Regel. |

Gate:

- Damage mit leerer Grip ist definiert und getestet.
- Trash aus Grip ist deterministisch und replaybar.
- PublicEvents und private Events leaken keine nicht zulässigen Informationen.
- Runner Heap/Public Visibility ist bewusst beschrieben.
- Undo nach Damage wird blockiert.
- AI-Input erhält keine unzulässigen Grip-Details.

### V0.4-F Größere kuratierte Demo-Decks

Ziel:

Neue Karten werden in feste interne Decks integriert.

Empfehlung:

- `demo_runner_002`: Runner Demo Deck 02 - Setup & Pressure.
- `demo_corp_002`: Corp Demo Deck 02 - Build, Tax & Score.

Deckregeln:

- keine offiziellen Karten,
- nicht turnierlegal,
- alle Karten `playable_mvp` oder `playable_full`,
- Side passt,
- Identity vorhanden,
- keine `data_only`, `stub_visible_not_playable` oder `blocked` Karten,
- Agenda Points explizit dokumentiert,
- `agendaPointsToWin` pro Deckpaar festgelegt.

Entscheidung zu Agenda-Zielwert:

- Legacy-Demo-Decks behalten `agendaPointsToWin = 6`.
- V0.4-Decks sollen genug Agenda Points für einen 7-Punkte-Test enthalten, falls die Requirements-Phase dies bestätigt.

### V0.4-G Hardening und Final Review

Ergebnisse:

- `docs/derived/MVP_0.4_FINAL_REVIEW.md`
- aktualisierte Wissensbasis,
- aktualisierter Codex-Status,
- aktualisierte Abweichungen,
- finale Checks.

Gate:

- `MVP_0.4_done: true` nur bei grünem Card-, Rules-, Visibility-, Replay-, AI-Simulation-, Multiplayer-, Typecheck-, Test- und Build-Gate.

## 8. Mechanik-Entscheidungen

### 8.1 Tags

Empfehlung: Tags in V0.4 aufnehmen.

Begründung:

- RunnerState enthält bereits `tags`.
- Tags sind öffentlich sichtbar und deshalb weniger hidden-info-riskant als Damage.
- Tags ermöglichen erste tagabhängige Karten und Runner-Gegenaktionen.
- Eine `remove_tag` Grundaktion erweitert das Spiel spürbar, ohne Full-Trace-System.

Nicht in V0.4:

- Trace.
- NBN-artiges breites Tag-Punishment.
- Ressourcen-Trash als Pflicht.
- Bad-Publicity-Sonderregeln.

### 8.2 Damage

Empfehlung: Damage nur als `Should` oder V0.4.x-Teilgate.

Begründung:

- Damage berührt Runner Grip und damit Hidden Information.
- Damage braucht Zufall, RandomDrawRecords, EventPayload-Sorgfalt, Undo-Barrieren und AI-Visibility-Tests.
- Ohne Prevention/Replacement bleibt Damage mechanisch einfacher, aber fairnesskritisch.

Minimalregel, falls freigegeben:

- Damage trashte zufällige Karten aus Grip per Seed/RandomDrawRecord.
- Wenn weniger Karten im Grip sind als Damage, werden alle verfügbaren Karten getrasht.
- Runner Heap ist nach der Bewegung sichtbar, aber der Auswahlprozess darf keine zusätzlichen Infos leaken.
- Keine Prevention oder Replacement.

### 8.3 Upgrades

Empfehlung: Upgrades im Safe Card Batch aufnehmen.

Begründung:

- Upgrades testen Root-Zonen, Rezzed/Unrezzed-Visibility und Access-Trash ohne komplexe Timingfenster.
- Ein einfaches Upgrade kann zunächst nur sichtbar/rez/trashbar sein oder einen sehr kleinen statischen Effekt haben.

Nicht in V0.4:

- Serverweite komplexe Modifikatoren,
- zusätzliche Kosten auf Access/Steal,
- Redirects,
- Bypass-/Run-Umleitungslogik.

### 8.4 Hardware und Resources

Empfehlung:

- Hardware als Safe-Batch aufnehmen, z. B. +1 Memory Limit.
- Resources nur als `Could`, weil tagabhängiges Trashen sonst weitere Regeln erzwingt.

## 9. Datenartefakte

Die Requirements-Phase soll neue Artefakte erzeugen, statt die eingefrorenen V0.1-Artefakte still zu überschreiben.

Empfohlene Dateien:

- `data/rules/rules-baseline-0.4.json`
- `data/cards/demo-cards-0.4.json`
- `data/decks/demo-decks-0.4.json`
- `data/manifests/card-implementation-manifest-0.4.json`
- `data/deviations/rule-deviations-0.4.json`
- `data/scenarios/v04-safe-card-batch-smoke.json`
- `data/scenarios/v04-upgrade-access-trash.json`
- `data/scenarios/v04-tag-runner-and-remove-tag.json`
- `data/scenarios/v04-tag-punishment-blocked-when-untagged.json`
- `data/scenarios/v04-damage-random-grip-statehash.json`
- `data/scenarios/v04-expanded-deck-ai-vs-ai-smoke.json`
- `tests/specs/card-pool-0.4-acceptance-tests.todo.md`

## 10. Engine-Änderungen

### 10.1 Typen

Mögliche Erweiterungen:

```ts
type CardType =
  | "identity"
  | "event"
  | "program"
  | "hardware"
  | "resource"
  | "agenda"
  | "operation"
  | "asset"
  | "upgrade"
  | "ice"
```

```ts
type ActionType =
  | ExistingActionType
  | "trigger_ability"
  | "remove_tag"
```

Damage sollte als Engine-Effekt modelliert werden, nicht zwingend als PlayerAction.

### 10.2 RunnerRig

Mögliche Erweiterung:

```ts
type RunnerRig = {
  programs: CardInstanceId[]
  hardware: CardInstanceId[]
  resources: CardInstanceId[]
}
```

Wenn Resources nicht V0.4-Must werden, darf `resources` strukturell vorbereitet, aber ohne spielbare Resource-Karten bleiben.

### 10.3 Effect-Modell

V0.4 sollte ein explizites, begrenztes Effect-Modell einführen oder vorbereiten:

```ts
type EffectDefinition =
  | { type: "gain_credits"; side: Side; amount: number }
  | { type: "draw_cards"; side: Side; amount: number }
  | { type: "modify_memory_limit"; amount: number }
  | { type: "give_runner_tag"; amount: number }
  | { type: "remove_runner_tag"; amount: number }
  | { type: "do_damage"; amount: number }
  | { type: "runner_lose_credits"; amount: number }
  | { type: "corp_gain_credit"; amount: number }
  | { type: "end_the_run" }
```

Regel:

Effekte werden nicht aus Kartentext geparst. Jede spielbare Karte referenziert explizite Effects oder einen Resolver.

## 11. Visibility- und Security-Regeln

Neue Karten und Mechaniken müssen folgende Regeln erfüllen:

- Corp sieht keine Runner-Grip- oder Stack-Titel.
- Runner sieht keine Corp-HQ- oder R&D-Reihenfolge.
- Runner sieht unrezzed Assets/Upgrades/ICE nur verdeckt.
- Rezzed Assets/Upgrades sind öffentlich sichtbar.
- Installierte Runner-Hardware und Runner-Programme sind öffentlich sichtbar.
- Runner-Resources sind, falls eingeführt, öffentlich im Rig sichtbar.
- Tags sind öffentliche Runner-Counter.
- Damage-Auswahl aus Grip darf keine zusätzlichen Infos leaken; getrashte Karten werden erst nach der definierten Bewegung sichtbar.
- LegalActions dürfen private Targets nur der berechtigten Seite zeigen.
- WebSocket, Reconnect, Undo, AI-Inputs, Erklärungen, Simulationslogs und Errors müssen neue Kartenfelder filtern.

Undo-Regel:

- Tags allein sind keine automatische Hidden-Info-Barrier.
- Damage ist eine Hidden-Info-Barrier.
- Access bleibt Hidden-Info-Barrier, sobald verdeckte Information sichtbar wurde.
- Zufällige Auswahl aus versteckter Zone ist Hidden-Info-Barrier.

## 12. KI- und Simulation-Anpassungen

V0.4 hängt von V0.3 ab. Jede neue Karte muss für KI und Simulation mindestens eines liefern:

- ignorierbare Standardheuristik,
- spezifische Priorität,
- negative Entscheidung, wenn Karte nicht sinnvoll nutzbar ist,
- Fallback-Pfad ohne illegale Action.

Neue KI-Erwartungen:

- Runner-KI entfernt Tags, wenn getaggt und bezahlbar, abhängig von Difficulty.
- Runner-KI berücksichtigt Damage-Risiko nur über sichtbare Informationen.
- Corp-KI kann Tag-Punishment nur wählen, wenn die Engine es legal anbietet.
- Corp-KI installiert/rezzt Upgrades ohne private Daten zu leaken.
- KI-vs-KI mit V0.4-Decks läuft über mehrere Seeds stabil.

## 13. Tests

### 13.1 Daten- und Manifest-Tests

Pflicht:

- V0.4-JSON-Artefakte parsen.
- Jede Karte hat eindeutige ID.
- Jede Karte hat Manifesteintrag.
- Kein Deck nutzt `data_only`, `stub_visible_not_playable` oder `blocked`.
- Jede `playable_mvp` Karte hat Unit-, Szenario-, Visibility- und Replay-Zuordnung.

### 13.2 Card-Tests

Pflicht pro neuer Karte:

- Kosten,
- Timing,
- LegalActions,
- `applyAction`-Revalidierung,
- Effekt,
- Zonenbewegung,
- EventLog,
- Visibility,
- Replay/StateHash,
- negativer Test für falsche Seite oder nicht erfüllte Bedingung.

### 13.3 Mechanik-Tests

| Mechanik | Pflichtfälle |
|---|---|
| Hardware | Install, MU-Erhöhung, Sichtbarkeit, Replay. |
| Upgrade | Install facedown, Rez, Access, Trash Cost, Runner-Visibility vor/nach Rez. |
| Tags | Give tag, remove tag, cannot remove without tag, cannot remove without credits/click. |
| Tag-Punishment | Legal nur bei Runner tags > 0; illegal ohne Tags. |
| Damage | Random/Seed, Grip zu Heap, leerer Grip, Hidden-Info-Barrier, Replay. |
| Deckvalidierung | falsche Seite, blocked card, fehlende Identity, unzureichende Agenda Points. |

### 13.4 Multiplayer-Tests

V0.4 muss beweisen, dass neue Karten über den Serverpfad funktionieren:

- neue LegalActions werden side-sicher per WebSocket gesendet,
- Tag- und Damage-Events erreichen beide Seiten korrekt gefiltert,
- Reconnect während Tag-/Damage-/Upgrade-Access-Zustand ist korrekt,
- Undo nach Damage blockiert,
- Undo vor rein öffentlicher Tag-Aktion folgt definierter Regel,
- kein FullState im Browser.

### 13.5 KI-/Simulation-Tests

Pflicht:

- AI-vs-AI Smoke mit V0.4-Safe-Decks.
- AI-vs-AI Smoke mit Tags, falls Tag-Slice implementiert ist.
- Damage-Szenario nur nach Damage-Freigabe.
- Jede Simulation loggt Seed, Kartenpool-Version, Deck-Version, finalen StateHash.

## 14. UI-Anforderungen

V0.4 ist keine UI-Politurphase, aber neue Karten müssen bedienbar sein.

Mindestanforderungen:

- UI zeigt neue CardTypes verständlich an.
- Hardware, Programme und ggf. Resources sind im Runner-Rig sichtbar.
- Upgrades erscheinen in Server-Root-Zonen mit richtiger verdeckter/offener Darstellung.
- Tags sind als Runner-Counter sichtbar.
- Damage und Tag-Events erscheinen im EventLog ohne private Leaks.
- Neue Buttons entstehen nur aus `LegalActions`.
- Keine Regelduplikate im Browser.

Nicht Ziel:

- vollständiger Kartenkatalog,
- Drag-and-drop-Board,
- Mobile-first-Layout,
- offizielle Card Frames.

## 15. Akzeptanzkriterien

MVP 0.4 gilt als abgeschlossen, wenn:

- V0.3-Gates vorher bestanden haben oder der Einstieg ausdrücklich akzeptiert wurde.
- V0.4-Requirements und Testmatrix bestanden sind.
- V0.4-Baseline und Datenartefakte versioniert vorliegen.
- Safe Card Batch vollständig implementiert und getestet ist.
- Eingeschränkte Deckvalidierung funktioniert.
- Falls Tags in Scope sind: Tag-Gate besteht.
- Falls Damage in Scope ist: Damage-Gate besteht.
- Alle neuen `playable_mvp` Karten haben Manifest, Unit-Test, Szenario, Visibility-Test und Replay-/StateHash-Abdeckung.
- Alte V0.1/V0.2-Demo-Szenarien bleiben grün.
- V0.3-KI-/Simulation-Smokes bleiben grün.
- WebSocket, Reconnect, Undo, Errors, Logs, AI-Inputs und UI leaken keine Hidden Info.
- Build-, Typecheck-, Lint- und Testbefehle bestehen.

## 16. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Zu viele Karten auf einmal | Fehler schwer isolierbar | Safe Batch klein halten, Mechaniken einzeln gaten. |
| Tags plus Damage parallel | Visibility und KI werden unklar | Tags zuerst, Damage als eigenes Teilgate. |
| Damage leakt Grip-Information | Hidden-Info-Bruch | RandomDrawRecord, Payload-Oracle, Undo-Barriere. |
| Upgrades leaken unrezzed Titel | Multiplayer unfair | PlayerView- und WebSocket-Visibility-Tests. |
| Deckvalidierung wächst zum Deckbuilder | Scope-Verlust | Nur kuratierte feste Decks, kein freier Import. |
| AI kann neue Karten nicht bedienen | Simulationen hängen oder wählen schlecht | Fallback und spezifische Heuristiken pro neuer Mechanik. |
| StateHash bricht durch neue Effekte | Replay unbrauchbar | Replay-Test pro Mechanik und Karte. |

## 17. Offene Entscheidungen

| ID | Frage | Empfehlung |
|---|---|---|
| V04-O-001 | V0.4-Must-Mechaniken | Safe Card Batch und Deckvalidierung als Must; Tags als Should/Must nach Requirements-Review. |
| V04-O-002 | Damage in V0.4 oder V0.4.x? | Damage nur als eigenes Teilgate nach Tags oder als V0.4.x. |
| V04-O-003 | Normaler 7-Punkte-Sieg | Für V0.4-Decks prüfen; Legacy-Decks behalten 6. |
| V04-O-004 | Resource-Typ | Struktur vorbereiten, aber nicht mit Trash-Regeln überladen. |
| V04-O-005 | Externe Kartendaten | Nicht in V0.4; interne fiktive Testkarten bleiben Standard. |
| V04-O-006 | Wie viele neue Karten? | Klein starten: ca. 8 bis 12 neue interne Karten, danach Erweiterung nur bei grünen Gates. |

## 18. Empfohlener Requirements-Prompt

```text
Create or continue a persistent goal named "MVP 0.4 card pool and rules breadth requirements".

Read:
- AGENTS.md
- docs/codex/CODEX_STATUS.md
- docs/derived/POST_MVP_0.2_ROADMAP.md
- docs/derived/MVP_0.3_DETAILED_PLAN.md
- docs/derived/MVP_0.4_DETAILED_PLAN.md
- docs/Netrunner_Dokumentenpaket_MVP_0_1_0_2/02_spezifikationen/Kartenimplementierungsleitfaden.md
- docs/Netrunner_Dokumentenpaket_MVP_0_1_0_2/02_spezifikationen/Rules_Engine_Spezifikation.md
- docs/Netrunner_Detailliertes_Testkonzept_MVP_0_1_0_2.md
- data/cards/demo-cards.json
- data/decks/demo-decks.json
- data/manifests/card-implementation-manifest.json
- data/deviations/rule-deviations.json

Task:
Derive executable MVP 0.4 requirements for controlled card pool and rules breadth expansion. Do not implement code.

Create or update:
- docs/derived/MVP_0.4_REQUIREMENTS.md
- docs/derived/CARD_POOL_0.4_SPEC.md
- docs/derived/RULE_MECHANICS_0.4_SPEC.md
- docs/derived/DECK_VALIDATION_0.4_SPEC.md
- docs/derived/MVP_0.4_TEST_MATRIX.md
- docs/derived/MVP_0.4_REQUIREMENTS_REVIEW.md
- data/rules/rules-baseline-0.4.json
- data/cards/demo-cards-0.4.json
- data/decks/demo-decks-0.4.json
- data/manifests/card-implementation-manifest-0.4.json
- data/deviations/rule-deviations-0.4.json
- tests/specs/card-pool-0.4-acceptance-tests.todo.md

Rules:
- MVP 0.4 remains gated by MVP 0.3 unless explicitly accepted otherwise.
- Use only internal fictional demo cards.
- No official art, card frames, logos, card backs or external card database dependencies.
- No free deckbuilder.
- Every playable card must have manifest, unit, scenario, visibility and replay coverage.
- Tags and Damage must be separate gated slices; Damage must include Hidden-Info-Barrier and replay tests.

Final response:
- files created or updated,
- chosen V0.4 mechanics,
- assumptions,
- risks,
- ready_for_implementation: true | false.
```
