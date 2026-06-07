# HQ-Hand-Wissensvertrag und Ereignismatrix

Stand: 2026-06-07

## Ziel

Dieser Vertrag beschreibt, wie die Runner-KI rechtmäßig gewonnenes HQ-Hand-Wissen der Korp erhalten, reduzieren oder invalidieren darf. Er ersetzt keine Engine-Regel und erzeugt keine Legalität. Er ist ein Handoff für spätere Umsetzungspakete in `packages/ai/src/belief-state.ts`.

## Ist-Stand

`KnownHqHandMemory` ist aktuell eine flache Ableitung:

- `knownDefinitions`: sicher bekannte Definitionen als Liste.
- `knownCount`: Anzahl sicher bekannter Definitionseinträge.
- `allCardsKnown`: true, wenn `knownCount === handCount`.
- `invalidationReasons`: Gründe aus sichtbaren Events.

Bei `install_card` ohne `cardDefinitionId` erzeugt `hqHandMemoryAdjustment` aktuell `unknown_departure`; `deriveKnownHqHandMemory` leert danach alle bekannten HQ-Karten. `deriveHiddenRemoteCandidateMemory` kann aus zuvor bekannten HQ-Karten bereits Remote-Kandidaten ableiten, leert danach aber ebenfalls das HQ-Hand-Wissen. Der Zielvertrag trennt diese beiden Effekte: Kandidaten werden mehrdeutig, aber logisch sichere Restkarten bleiben erhalten.

## Zielmodell Ledger

Ein späteres Ledger darf intern mehr ausdrücken als die vorhandenen externen Felder:

| Feld | Zweck | Sichtbarkeitsgrenze |
| --- | --- | --- |
| `safeDefinitions` | Definitionen, die sicher weiter in HQ liegen, jeweils mit Count und Quellen. | Nur aus sichtbaren Zugriffen, Full-HQ-Looks oder sichtbaren Folgeevents. |
| `unknownRestCount` | Anzahl HQ-Karten ohne bekannte Definition. | Nur aus `playerView.opponent.handCount` und sichtbaren Zu-/Abgängen. |
| `candidateGroups` | Mehrdeutige Gruppen für verdeckte Abgänge, z. B. "eine von zwei bekannten ICE wurde installiert". | Keine Instanz-IDs, keine Deckliste, keine PrivatePayload. |
| `remoteCandidateRefs` | Side-sichere Verknüpfung zu installierten Positionen für spätere Rez-/Reveal-Auflösung. | Nur `serverId`, `installPlacement`, öffentliche Positionsreferenz und `sourceEventId`. |
| `invalidationReasons` | Warum Wissen reduziert, mehrdeutig oder vollständig invalidiert wurde. | Keine verdeckte Kartenidentität. |

Die bisherigen Consumer-Felder bleiben abgeleitet:

- `knownDefinitions` = nur `safeDefinitions`, nicht Kandidaten.
- `knownCount` = Summe sicherer Definitionseinträge.
- `allCardsKnown` = `safeDefinitions` decken `handCount` vollständig ab und es gibt weder `unknownRestCount` noch offene `candidateGroups`.
- `sourceEventIds` = Quellen sicherer Definitionen plus relevante Kandidatenquellen.

## Side-sichere Eventfelder

Für verdeckte Install-Abgänge braucht die spätere Umsetzung stabile öffentliche Metadaten. Zulässig sind:

- `serverId`: öffentlich angegriffener oder installierter Server, z. B. `remote_1`, `hq`, `rd`.
- `installPlacement`: `"ice"` oder `"root"`.
- `installedPositionKey`: öffentliche Position, z. B. `ice:<serverId>:<index>` oder `root:<serverId>:<slot>`.
- `sourceEventId`: öffentliches Event, das den Kandidaten erzeugt.
- `zoneLabel`: nur als Anzeige-Fallback; nicht als alleiniger stabiler Vertragsanker.

Nicht zulässig sind verdeckte `cardDefinitionId`, Instanz-IDs, Decklisten, Engine-FullState, Storage-Daten, `cardInstances`, `privatePayload`, Reconnect-Tokens oder Session-Tokens.

## Ereignismatrix

| Ereignis | Sichtbare Mindestdaten | Ledger-Verhalten | Vollinvalidierung erlaubt? |
| --- | --- | --- | --- |
| Runner greift HQ-Karte zu | `actionType: access_card`, `serverId: hq`, `cardDefinitionId` für Runner sichtbar | Definition als sicher bekannt hinzufügen oder Count erhöhen. Bestehende sichere Karten bleiben. | Nein. |
| Voller HQ-Look | side-sicheres privates Look-Payload nur für Runner-AIInput | Ledger durch exakt gesehene Multimenge ersetzen; `unknownRestCount = max(0, handCount - seenCount)`. | Nein, außer Payload ist nicht side-safe. |
| Korp zieht von R&D | `mandatory_draw` oder `draw_card`, Count wenn vorhanden | Bekannte R&D-Top-Sequenz in HQ übertragen, soweit die Reihenfolge rechtmäßig bekannt ist; übrige Draws erhöhen `unknownRestCount`. | Nein. |
| Korp spielt bekannte Operation | `play_operation`, `cardDefinitionId` öffentlich | Eine passende sichere Definition entfernen; falls sie nur Kandidat ist, Kandidatengruppe reduzieren. | Nein. |
| Korp spielt Operation ohne Definition | `play_operation`, keine Definition | Zuerst `unknownRestCount` reduzieren. Wenn keine unbekannten Karten plausibel sind, konservativ Kandidatengruppe/anomaly markieren. | Nur bei Widerspruch ohne sichere Auflösung. |
| Korp installiert bekannte Karte | `install_card`, `cardDefinitionId` öffentlich | Eine passende sichere Definition entfernen; Remote-/Positionswissen darf als bekanntes installiertes Objekt fortgeführt werden. | Nein. |
| Korp installiert verdeckt als ICE | `install_card`, `installPlacement: ice`, `serverId`, öffentliche ICE-Position | Bekannte Nicht-ICE bleiben sicher in HQ. Bekannte ICE werden zu einer Kandidatengruppe mit Departure-Count 1. `unknownRestCount` bleibt als zusätzlicher möglicher Kandidat erhalten, wird aber nicht als bekannte Karte gezählt. | Nein, wenn Placement vorhanden ist. |
| Korp installiert verdeckt in Root | `install_card`, `installPlacement: root`, `serverId`, öffentliche Root-Position | Sicher nicht-root-installierbare Karten bleiben sicher in HQ. Assets, Upgrades, Agendas und andere root-plausible Karten werden Kandidaten. Unbekannte Restkarten bleiben mögliche Kandidaten. | Nein, wenn Placement vorhanden ist. |
| Verdeckter Install ohne Placement | `install_card`, kein `cardDefinitionId`, keine stabile Placement-Info | Nur `unknownRestCount` reduzieren, wenn vorhanden. Bei vollständig bekannter HQ-Hand keine sichere Zuordnung; Ledger für HQ darf als Kandidatengruppe "unknown placement" markiert werden. | Ja, wenn keine side-sichere Unterscheidung möglich ist. |
| Korp discardet aus HQ | Discard-Event, möglichst `cardDefinitionId` | Mit Definition: passende sichere Definition/Kandidat entfernen. Ohne Definition: `unknownRestCount` reduzieren; wenn nur bekannte Karten plausibel sind, Kandidatengruppe statt Total-Reset. | Nur bei nicht auflösbarer Hidden-Zone-Mischung. |
| Steal/Trash/Score aus HQ | `serverId: hq`, Definition wenn sichtbar | Mit Definition entfernen. Ohne Definition wie unbekannter Abgang behandeln; keine verdeckte Identität erraten. | Nur bei Widerspruch. |
| Move aus HQ in bekannte öffentliche Zone | `move`, Zielzone/Position, Definition wenn sichtbar | Mit Definition entfernen und ggf. Positionswissen anlegen. Ohne Definition Kandidatengruppe oder unbekannten Rest reduzieren. | Nur wenn Ziel/Quelle nicht side-sicher ist. |
| Pure HQ-Reorder | `hiddenZoneAction` zeigt reine HQ-Reihenfolgeänderung | Multimenge bleibt erhalten; Reihenfolge wird nicht modelliert. Keine Invalidierung der HQ-Hand-Multimenge. | Nein. |
| HQ mit anderer Hidden-Zone mischen | Shuffle/Swap/Arrange mischt HQ mit R&D, Archives oder unbekannter Quelle | Betroffene sichere HQ-Definitionen und Kandidaten invalidieren, sofern sichtbare Counts keine sichere Ableitung erlauben. | Ja. |
| R&D-Shuffle ohne HQ-Bezug | Event betrifft nur R&D | HQ-Ledger bleibt; nur R&D-Top-Wissen invalidieren. | Nein für HQ. |
| Späteres Rez einer Kandidatenposition | `rez_ice`, gleiche öffentliche Position, `cardDefinitionId` sichtbar | Kandidatengruppe reduzieren: offenbarte Definition aus der Kandidatenmenge entfernen; logisch zwingende Restkandidaten wieder sicher machen. | Nein bei Match; konservativ bei Mismatch. |
| Späteres Access/Expose/Reveal einer Kandidatenposition | öffentliche Position und Definition sichtbar | Wie Rez: Kandidatengruppe anhand der offenbarten Definition und Position reduzieren. | Nein bei Match; konservativ bei Mismatch. |
| Kandidatenposition wird getrasht/gestohlen/gescored | Position, Definition falls sichtbar | Kandidatengruppe schließen oder reduzieren; sichere HQ-Restkarten wieder ableiten, wenn logisch zwingend. | Nur bei Positionsmismatch. |
| Reconnect mit gleicher side-sicherer Projektion | `playerView.publicEvents` und `eventTail` ohne private Decoys | Gleiche Ledger-Signatur wie Live-Historie. | Nein. |
| Undo/Rollback | spätere Events fehlen aus der sichtbaren Historie | Ledger wird nur aus verbleibender Historie rekonstruiert; zurückgerollte Fakten verschwinden. | Nein. |

## Beispiel

Ausgangslage nach vollem HQ-Look:

- `safeDefinitions`: `ICE A`, `ICE B`, `Operation X`, `Asset Y`
- `unknownRestCount`: 0
- `handCount`: 4

Verdeckter ICE-Install nach `remote_1`:

- `safeDefinitions`: `Operation X`, `Asset Y`
- `candidateGroups`: eine Karte aus `[ICE A, ICE B]`, `installPlacement: ice`, `serverId: remote_1`
- `knownDefinitions`: nur `Operation X`, `Asset Y`
- `allCardsKnown`: false, weil die ICE-Gruppe mehrdeutig ist

Späteres Rez der installierten Karte als `ICE A`:

- Kandidatengruppe wird geschlossen.
- `ICE B`, `Operation X`, `Asset Y` sind wieder sichere HQ-Restkarten, soweit `handCount` und sichtbare Abgänge dazu passen.
- Keine Instanzidentität oder verdeckte Deckinformation wurde benötigt.

## Handoff an Umsetzungspakete

1. `act-2026-06-07-ai-hq-memory-ledger-foundation`: Ledger intern einführen, alte Consumer-Felder weiter ableiten, Safety-Regressionen ergänzen.
2. `act-2026-06-07-ai-hq-hidden-install-candidates`: verdeckte ICE-/Root-Installs nach Placement in Kandidatengruppen überführen und sichere Restkarten erhalten.
3. `act-2026-06-07-ai-hq-candidate-reconciliation`: Kandidaten durch Rez, Reveal, Expose, Access, Trash, Steal und Score wieder abgleichen.
4. `act-2026-06-07-ai-hq-memory-debug-surface`: DecisionDebug erweitert sichere, unbekannte und mehrdeutige HQ-Anteile redigiert anzeigen.

## Offene Regelfragen

- Falls aktuelle PublicEvents noch keine stabile `installPlacement`-/`installedPositionKey`-Kombination liefern, ist vor der Install-Kandidatenlogik ein enges side-sicheres Eventfeld-Paket nötig.
- Root-Installierbarkeit muss kartentypisch und regelkonform geprüft werden; bis dahin konservativ lieber Kandidat behalten als sicher ausschließen.
- Pure HQ-Reorder ist für die Hand-Multimenge kein Reset-Grund, muss aber von echten Hidden-Zone-Mischungen eindeutig unterscheidbar sein.
