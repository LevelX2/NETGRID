# Proteus Virus-/Antibody-Counter Contract

Stand: 2026-05-17
Status: planning contract, no runtime implementation

## Scope und Quellen

Dieses Artefakt schneidet den Proteus-Cluster `virus_antibody_counter_family` aus `data/rules/proteus-mechanics-coverage-2026-05-17.json` in kleine Vertragsfamilien. Es ist Planungsinput für spätere Engine-Arbeit und promotet keine Proteus-Karte zu `human_playable`, `deck_legal`, `ai_supported` oder Runtime-Resolver.

Lokale Quellen:

- `data/card-import/proteus-card-basis-2026-05-17.json`
- `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- `docs/derived/PROTEUS_MECHANICS_COVERAGE_ANALYSIS.md`
- `docs/releases/mvp/mvp-0-99-hosting-virus-counters/counter-hosting-spec.md`
- `docs/releases/mvp/mvp-0-99-hosting-virus-counters/virus-purge-spec.md`
- `docs/releases/mvp/mvp-0-97-run-breach-multiaccess/run-breach-multiaccess-spec.md`
- `docs/derived/PROTEUS_BAD_PUBLICITY_LOSS_GATE_CONTRACT.md`
- `docs/derived/PROTEUS_PURGE_ACTION_DEBT_CONTRACT.md`
- `docs/source/Netrunner Errata 1.70.md`

## Betroffene Karten

| Karte | Seite | Typ | Rolle im Cluster |
| --- | --- | --- | --- |
| `onr_proteus_009_viral-breeding-ground` | Korp | Agenda | Score- und Access-Effekt mit Advancement-Countern, Programmrückgabe und Installationsfort-Trash. |
| `onr_proteus_054_bel-digmo-antibody` | Korp | Asset/Node | Rez-Shuffle in R&D, R&D-Access-Damage und erzwungenes Zeigen. |
| `onr_proteus_057_doppelganger-antibody` | Korp | Asset/Node | Access-Cost-Choice, Runner-Statuscounter, Runner-Start-of-turn-Creditverlust und Runner-Removal-Aktion. |
| `onr_proteus_068_pattel-antibody` | Korp | Asset/Node | Access-Cost-Choice, Counter auf installierten Icebreakern und Stärke-Modifier. |
| `onr_proteus_075_stereogram-antibody` | Korp | Asset/Node | Archives-Access-Damage plus Shuffle in R&D. |
| `onr_proteus_078_armageddon` | Runner | Program | R&D-Access-Replacement durch Doom-Counter, Corp-Install-Randomcheck. |
| `onr_proteus_084_crumble` | Runner | Program | HQ-Erfolgscounter, kostenfreies Trash-Recht auf HQ-Access. |
| `onr_proteus_089_garbage-in` | Runner | Program | R&D-Erfolgscounter, kostenfreies Trash-Recht auf R&D-Access, Counter-Verbrauch. |
| `onr_proteus_090_highlighter` | Runner | Program | R&D-Erfolgscounter, zusätzlicher R&D-Access. |
| `onr_proteus_094_scaldan` | Runner | Program | HQ-Erfolgscounter, separate Corp-Start-of-turn-Würfe, Bad-Publicity-Loss-Gate. |
| `onr_proteus_097_taxman` | Runner | Program | HQ-Erfolgscounter, Corp-Start-of-turn-Creditverlust pro Zweiergruppe. |
| `onr_proteus_098_vienna-22` | Runner | Program | HQ-Erfolgscounter, zusätzlicher HQ-Access. |
| `onr_proteus_099_viral-pipeline` | Runner | Program | Socket-Counter pro Central-Server, Pipe-Counter und Corp-Start-of-turn-Action-Debt. |

## Counter-Taxonomie

Proteus braucht drei klar getrennte Counter-Klassen. Der Kartensubtype `virus` macht nicht automatisch jeden Counter auf dieser Karte zu einem purgefähigen Virus-Counter.

| Counter-Familie | Beispiele | Empfohlene Speicherung | Purge-Bezug |
| --- | --- | --- | --- |
| Normale Karten-Counter | Advancement-Counter auf `Viral Breeding Ground` | Bestehende `advancementCounters`/Agenda-Felder | Nicht purgefähig; bleiben Advancement-Counter, auch wenn die Karte den Subtype `virus` hat. |
| Antibody-/Korp-Virus-Folgezähler | `Doppelganger` auf Runner, `Pattel` auf installierten Icebreakern | Eigene Counter-Typen wie `doppelganger_antibody` und `pattel_antibody`; Runner-Status oder CardInstance-Counter je Ziel | Nicht durch den Runner-Virus-Purge der Proteus-Runnerprogramme entfernbar; lokale Errata trennen diese Korp-Virus-Folgen ausdrücklich ab. |
| Runner-Virus-Counter | `doom`, `crumble`, `garbage`, `highlighter`, `scaldan`, `tax`, `vienna`, `socket`, `pipe` | Purgefähige Counter-Registry mit Scope `corp`, `server`, `card` oder `effect`; nicht nur CardInstance-Counter | Purgefähig über den Proteus-Purge-Vertrag; Quelle kann bereits aus dem Rig entfernt sein, Counter bleiben trotzdem wirksam, bis sie gepurged oder regelgemäß verbraucht werden. |

Der vorhandene V0.99-Vertrag deckt nur den engen Main-Action-Purge und Karten-Counter hinreichend ab. Proteus verlangt zusätzlich purgefähige Counter außerhalb von Karteninstanzen und einen Action-Debt-/Timingvertrag. Diese Erweiterung ist ein eigenes Folgepaket, bevor irgendeine Proteus-Viruskarte spielbar werden darf.

## Slice 1: Korp-Antibody-Access

Karten: `Bel-Digmo Antibody`, `Doppelganger Antibody`, `Pattel Antibody`, `Stereogram Antibody`.

Vertrag:

- Access aus R&D, HQ, Archives oder installiertem Server muss den Ursprung des aktuellen Access kennen: `accessOriginZone`, `serverId`, `isInstalled`, `isRezzed`, `currentAccessEntry`.
- R&D-/HQ-/Archives-Access darf nur die aktuelle Access-Karte offenlegen, nie künftige Access-Queue-Entries.
- Wenn ein Antibody aus einem installierten Server accessed wird, braucht der spätere Resolver einen Rez-Check, falls der Effekt laut lokaler Errata nur bei rezzed installierter Karte wirksam ist.
- Doppelganger- und Pattel-Kosten sind Korp-Choices im Access-Fenster, maximal einmal pro Access. `applyAction` muss Side, Kosten, aktuellen Access, Ursprung und Stale-State erneut prüfen.
- Doppelganger erzeugt einen Runner-Statuscounter mit Runner-Start-of-turn-Creditverlust und eigener Runner-Removal-Aktion.
- Pattel erzeugt je aktuell installiertem Icebreaker einen Counter auf der Icebreaker-CardInstance; der Stärke-Modifier darf negative Stärke nicht künstlich auf 0 begrenzen.
- Bel-Digmo und Stereogram lösen Damage-/Shuffle-Effekte aus, brauchen aber keine neue purgefähige Counter-Art.

PublicPayload:

- Erlaubt: `accessedCardDefinitionId`, wenn die Karte im aktuellen Access beiden Seiten legal bekannt wird; `accessOriginZone`; `serverId`; `effectKind`; `damageAmount`; abstrakte `counterType`, `counterDelta`, `targetClass`, `targetCount`.
- Verboten: nicht zugegriffene R&D-/HQ-Karten, künftige Queue-Positionen, R&D-Reihenfolge, HQ-Random-Kandidaten, private Choice-Alternativen und FullState.
- Bei Pattel darf ein PublicEvent installierte Icebreaker-Ziele nennen, weil installierte Runner-Programme öffentlich sind; bei Doppelganger genügt ein öffentlicher Runner-Statuscounter ohne private Runner-Hand-/Stackdaten.

## Slice 2: Viral Breeding Ground

Karte: `Viral Breeding Ground`.

Vertrag:

- Advancement-Counter auf dieser Agenda bleiben normale Advancement-Counter und sind nicht purgefähig.
- Der Score-Effekt trasht Karten im oder auf dem Installationsfort der Agenda. Der Resolver braucht den früheren Installationsserver als State-Fakt, auch wenn die Agenda beim Scoren in die Score-Zone wechselt.
- Der Access-Effekt wählt bis zu zwei installierte Runner-Programme pro Advancement-Counter und bewegt sie in die Runner-Hand.
- Wenn ein zurückgegebenes Programm ein Host/Daemon ist, müssen darin gehostete Programme deterministisch getrasht werden. Diese Kaskade darf keine verdeckten Hand-/Stackdaten offenlegen.

PublicPayload:

- Erlaubt: `sourceCardDefinitionId`, `advancementCounterCount`, `trashedInstalledCount`, `returnedProgramCount`, `daemonHostedTrashCount`, öffentliche CardDefinitionIds der zuvor installierten Programme und getrashten offenen Serverkarten.
- Verboten: neue Grip-Reihenfolge, private Grip-Inhalte, nicht betroffene Karten in HQ/R&D/Stack und interne Candidate-Listen, die der wählende Spieler nicht sehen durfte.

## Slice 3: Erfolgreicher Run erzeugt Virus-Counter

Karten: `Crumble`, `Garbage In`, `Highlighter`, `Scaldan`, `Taxman`, `Vienna 22`, `Viral Pipeline`.

Vertrag:

- Triggerbasis ist ein erfolgreicher Run auf dem passenden Server. Die lokale Errata-Basis behandelt Runner-Virus-Counter als End-of-run-Effekt; ein erster Slice sollte daher keine aktuelle Access-Queue nachträglich erweitern, wenn der Counter erst nach dem Access entsteht.
- HQ-Counter: `crumble`, `scaldan`, `tax`, `vienna`.
- R&D-Counter: `garbage`, `highlighter`.
- Central-Server-Counter: `socket_archives`, `socket_hq`, `socket_rd`; drei passende Socket-Counter können in einen `pipe`-Counter überführt werden.
- Counter bleiben wirksam, wenn das Quellprogramm später getrasht oder deinstalliert wird, bis ein passender Purge oder ein karteneigener Verbrauch sie entfernt.

PublicPayload:

- Erlaubt: `runId`, `serverId`, `counterType`, `counterDelta`, `counterTotalAfter`, `sourceCardDefinitionId`, wenn das installierte Runner-Programm öffentlich ist.
- Verboten: Access-Queue-Inhalte, nicht zugegriffene R&D-/HQ-Titel, Stack-/Grip-Daten, interne Random-Kandidaten.

## Slice 4: Access-Modifikatoren und Trash-Rechte

Karten: `Crumble`, `Garbage In`, `Highlighter`, `Vienna 22`.

Vertrag:

- Highlighter und Vienna erhöhen künftige Access-Mengen auf R&D bzw. HQ. Zusätzliche Accesses dürfen installierte Karten im jeweiligen Central-Root nicht miterfassen, solange kein anderer Effekt das explizit erlaubt.
- Crumble und Garbage In erlauben ab zwei passenden Countern ein kostenfreies Trash-Recht auf aktuell accessete Karten aus HQ bzw. R&D, auch wenn die Karte normalerweise nicht trashbar wäre.
- Crumble/Garbage-In-Trash-Rechte gelten auch für Upgrades im jeweiligen Central-Root, wenn diese tatsächlich aktuell accessed werden.
- Garbage In verbraucht nach Nutzung zwei `garbage`-Counter. Der Verbrauch muss in derselben Action-/Choice-Auflösung deterministisch erfolgen.

Hidden-Info-Risiken:

- HQ-Multiaccess muss weiterhin über `RandomDrawRecords` ohne Replacement laufen.
- PublicEvent und PlayerView dürfen nie vorab zeigen, welche weiteren HQ-Karten durch Vienna oder Trash-Rechte erreichbar werden.
- R&D-Zusatzaccess darf nur die aktuelle R&D-Karte beim jeweiligen Access zeigen, nicht die künftige Reihenfolge.

## Slice 5: Start-of-turn-Penalties und Zufall

Karten: `Doppelganger Antibody`, `Taxman`, `Scaldan`, `Armageddon`, `Viral Pipeline`.

Vertrag:

- Doppelganger-Counter wirken am Runner-Start-of-turn und verursachen pro Counter einen Creditverlust, bis der Runner sie durch eine eigene Action mit Kosten entfernt.
- Tax-Counter wirken am Korp-Start-of-turn in Zweiergruppen und verursachen den daraus abgeleiteten Creditverlust.
- Scaldan erzeugt pro Counter einen separaten Start-of-turn-Wurf. Jeder Wurf muss über Seed, `randomCounter` und `RandomDrawRecords` laufen; zwischen getrennten Scaldan-Effekten kann später ein Purge-/Action-Debt-Fenster relevant werden.
- Doom-Counter aus Armageddon wirken bei Korp-Installationen. Pro Doom-Counter wird ein deterministischer Wurf benötigt; je erfolgreichem Treffer wird die installierte Karte getrasht und ein Doom-Counter entfernt.
- Pipe-Counter verursachen am Korp-Start-of-turn Action-Debt. Die Reihenfolge mit Purge-/Start-of-turn-Effekten ist ein eigener Härtungspunkt.

PublicPayload:

- Random-Events dürfen `randomRecordId`, `dieSize`, `result`, `counterType`, `counterIndex` und öffentliche Effektfolgen enthalten.
- Sie dürfen keinen Seed, keine privaten Deckpositionen, keine versteckten Installationskandidaten und keine KI-Debugdaten enthalten.
- Bei Armageddon darf die installierte Karte nur genannt werden, wenn sie durch die Installation oder den anschließenden Trash rechtmäßig öffentlich geworden ist.

## Slice 6: Proteus-Purge und Action-Debt

Proteus-Purge ist nicht identisch mit dem vorhandenen V0.99-Main-Action-Vertrag `click click click: Purge virus counters`.

Der enge Folgekontrakt liegt jetzt in `docs/derived/PROTEUS_PURGE_ACTION_DEBT_CONTRACT.md`. Er bleibt planning-only und erzeugt keine Runtime-Implementierung, keine AI-Hints und keine Kartenpromotion.

Kernaussagen:

- Timingfenster: lokale Errata erlaubt Virus-Removal in Spezialeffekt-/Rez-ähnlichen Fenstern, nicht nur im Korp-Main-Window.
- Kostenmodell: Proteus-Texte sprechen von `forgo its next three actions`; das ist ein zukünftiger Action-Debt, nicht zwingend eine sofortige Drei-Click-Zahlung.
- Kumulation: mehrfaches Purgen kann mehrere Action-Debts stapeln.
- Umfang: Purge entfernt alle purgefähigen Runner-Virus-Counter, auch wenn sie auf `corp`, `server` oder `effect` liegen; Antibody-Folgezähler wie Doppelganger/Pattel und Advancement-Counter bleiben bestehen.
- StateHash: `corp.pendingForgoActions` oder ein äquivalentes strukturiertes Feld muss StateHash-relevant sein.

Bis dieser Vertrag umgesetzt ist, darf ein späterer Runtime-Slice Proteus-Runner-Virusprogramme höchstens als nicht promotete Test-Fixture modellieren.

## Erste kleine Umsetzungsslices

| Slice | Inhalt | Darf noch nicht |
| --- | --- | --- |
| P-VAC-01 | Counter-Typen und purgefähige Scope-Registry ohne Kartenpromotion. | Keine Proteus-LegalActions, keine AI-Hints. |
| P-VAC-02 | Antibody-Access-Fixtures für Doppelganger/Pattel/Bel-Digmo/Stereogram mit Visibility-Tests. | Keine Decklegalität, keine generische Access-Rewrite. |
| P-VAC-03 | Erfolgreicher-Run-Counter-Fixtures für HQ/R&D/Central ohne Purge. | Keine aktuelle Access-Queue erweitern, keine Runtime-Promotion. |
| P-VAC-04 | Access-Modifikator-Fixtures für Highlighter/Vienna und Trash-Rechte für Crumble/Garbage In. | Keine Hidden-Queue-Leaks, keine AI-Bewertung. |
| P-VAC-05 | Start-of-turn-/Random-Fixtures für Taxman, Scaldan, Armageddon und Pipe. | Kein undeterministischer Würfelpfad. |
| P-VAC-06 | Separater Proteus-Purge-/Action-Debt-Vertrag und danach Engine-Harness. | Kein Gleichsetzen mit V0.99-Purge. |

## Testanforderungen für spätere Harnesses

| Test-ID | Schwerpunkt | Erwartung |
| --- | --- | --- |
| P-VAC-T001 | Counter-Taxonomie | Advancement-, Antibody- und purgefähige Runner-Virus-Counter bleiben getrennt; Purge entfernt nur die richtige Familie. |
| P-VAC-T002 | R&D-Access-Antibody | Nur die aktuelle R&D-Access-Karte wird gezeigt; keine künftige R&D-Reihenfolge in PlayerView/PublicEvent. |
| P-VAC-T003 | HQ-Access mit Zusatzaccess | HQ-Auswahl nutzt `RandomDrawRecords`; nicht zugegriffene HQ-Karten bleiben verborgen. |
| P-VAC-T004 | Pattel-Ziele | Nur installierte Icebreaker erhalten Counter; Stärke kann unter 0 fallen; Replay rekonstruiert denselben StateHash. |
| P-VAC-T005 | Viral Breeding Ground | Advancement-Counter steuern Programmauswahl, sind nicht purgefähig; Daemon-Host-Kaskade ist deterministisch. |
| P-VAC-T006 | End-of-run-Counter | Erfolgreiche Runs erzeugen passende Counter ohne aktuelle Access-Queue zu leaken oder nachträglich zu verändern. |
| P-VAC-T007 | Access-Modifikatoren | Highlighter/Vienna erhöhen nur erlaubte Central-Accesses; installierte Root-Karten werden nicht versehentlich mitgezählt. |
| P-VAC-T008 | Trash-Rechte | Crumble/Garbage In erlauben nur aktuellen Access-Trash; Garbage-In-Counter-Verbrauch ist replaystabil. |
| P-VAC-T009 | Start-of-turn-Würfel | Scaldan/Armageddon verwenden `RandomDrawRecords`; Replay reproduziert Resultate und finalen StateHash. |
| P-VAC-T010 | Purge-/Action-Debt | Proteus-Purge erzeugt StateHash-relevanten Debt, ist kumulierbar und entfernt keine Antibody-/Advancement-Counter. |
| P-VAC-T011 | PublicPayload-Redaction | WebSocket, Reconnect, Undo-Preview, Public Replay, Logs und KI-Input enthalten keine Stack-, R&D-, HQ-, Access-Queue- oder verdeckten Installationsdaten jenseits des aktuellen legalen Reveals. |

## Handoff an spätere Implementierung

Der nächste fachliche Schritt ist kein Kartenresolver, sondern ein enger Proteus-Purge-/Action-Debt-Vertrag. Erst danach sollten Runtime-Fixtures für die Runner-Virus-Counter entstehen. Antibody-Access kann separat früher in einem nicht promotenden Fixture-Slice vorbereitet werden, weil Doppelganger/Pattel gerade nicht vom Proteus-Purge abhängen.
