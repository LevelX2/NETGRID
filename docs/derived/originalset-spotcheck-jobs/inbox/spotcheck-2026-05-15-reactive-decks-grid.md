---
jobId: spotcheck-2026-05-15-reactive-decks-grid
status: ready_for_implementation
createdAt: 2026-05-15T13:18:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_026_false-echo
    title: False Echo
  - cardId: onr_v1_044_netspace-inverter
    title: Netspace Inverter
  - cardId: onr_v1_067_speed-trap
    title: Speed Trap
  - cardId: onr_v1_068_startup-immolator
    title: Startup Immolator
  - cardId: onr_v1_075_zetatech-software-installer
    title: Zetatech Software Installer
  - cardId: onr_v1_119_arasaka-portable-prototype
    title: Arasaka Portable Prototype
  - cardId: onr_v1_131_microtech-backup-drive
    title: Microtech Backup Drive
  - cardId: onr_v1_136_pandoras-deck
    title: Pandora's Deck
  - cardId: onr_v1_140_raven-microcyb-eagle
    title: Raven Microcyb Eagle
  - cardId: onr_v1_368_roving-submarine
    title: Roving Submarine
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-reactive-decks-grid

## Auswahlprüfung

- Queue- und Register-Dedupe geprüft gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` sowie alle Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/{inbox,in_progress,done,blocked}/`.
- Die zehn Card IDs kamen in keiner dieser Primärquellen vor und sind damit nicht tabu.
- Auswahlbasis war der release- und AI-promotete Originalset-Stand aus den V1.9.x-Manifesten, ergänzt durch die lokale O:NR-v1-Kartensnapshot-Datei für Titel, Typen und Effektzusammenfassungen.
- Zufällige Ziehung aus dem komplexeren Restpool mit Schwerpunkt auf Run-Reaktionsfenstern, installierter Hardware mit wiederkehrenden Kosten, Deck-Einzigartigkeit, Replacement/Hosting und servergebundenen Difficulty-Modifikatoren.
- Relevante bestehende Nachweise liegen vor allem in `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `data/rules/v1922-local-card-facts.json`, `data/manifests/card-implementation-manifest-1.9.16.json`, `data/manifests/card-implementation-manifest-1.9.19.json`, `data/manifests/card-implementation-manifest-1.9.22.json` und den passenden AI-Approval-Manifesten.

## Kartenbefunde

### onr_v1_026_false-echo - False Echo

Bewertung: Engine: derzeit als V1.9.22-Install-only-Programm mit Installkosten 0, MU 1, Wrong-Side-/Stale-Revalidation, PublicPayload und Replay/StateHash abgesichert. Die eigentliche erfolgreiche-Run-Fähigkeit ist laut lokaler Faktenbasis noch ability-gated. Chronik: Installationschronik ist vorhanden, aber kein Chronikeintrag für erzwungenes Corp-Rezzen nach erfolgreichem Run. Tests: Install-only-Smoke deckt keine erfolgreiche Run-Sequenz, keinen Rez-Affordability-Loop und keinen Abbruch bei nicht zahlbarer ICE. Hidden-Info/Replay/StateHash: Ziel ist ein public Fort-/ICE-Rezzustand; keine verdeckten Kartenidentitäten außerhalb ohnehin sichtbarer installierter ICE leaken. Fehlende Härtungen: Triggerfenster unmittelbar nach erfolgreichem Run auf ein Fort, äußere-nach-innere ICE-Reihenfolge, Corp-Rezpflicht nur soweit bezahlbar und Seiten-/Timing-Revalidation in `applyAction`.

Notwendige Umsetzung

- LegalAction für installierten False Echo nur nach erfolgreichem Run auf das betroffene Fort öffnen.
- Corp-Rezsequenz deterministisch von äußerster zu innerster ICE abarbeiten, mit Rez-Kostenprüfung je ICE.
- PublicPayload mit Fortlabel, Anzahl geprüfter ICE, Anzahl gerezzter ICE und Kosten, ohne verdeckte Corp-Zonen.
- KI-Hint so härten, dass die Runner-KI den Effekt nur nutzt, wenn erkennbare unrezzed ICE im erfolgreichen Fort liegen.

Akzeptanzkriterien

- Wrong-side, stale state, falscher Zeitpunkt, nicht erfolgreicher Run und falsches Fort werden abgelehnt.
- Mehrere unrezzed ICE werden in stabiler äußerer Reihenfolge gerezzt, solange die Korp zahlen kann.
- Replay reproduziert exakt dieselbe Rezfolge und denselben StateHash.
- PublicEvent enthält keine HQ/R&D/Archives-Inhalte und keine privaten CardInstance-Dumps.

### onr_v1_044_netspace-inverter - Netspace Inverter

Bewertung: Engine: Install-only-Pfad ist vorhanden, die Fort-ICE-Reversal-Fähigkeit bleibt ability-gated. Chronik: Installation wird öffentlich, aber keine Umkehr-Chronik für Server-ICE. Tests: bestehender gemeinsamer Install-only-Test deckt keine Serverordnung, kein leeres/einzelnes ICE-Fort und keine Reconnect-Ansicht. Hidden-Info/Replay/StateHash: ICE-Positionen sind öffentlich als installierte Kartenpositionen, aber unrezzed Identitäten dürfen nicht aufgedeckt werden. Fehlende Härtungen: erfolgreiches-Run-Fenster, Ziel-Fort-Revalidation, stabile Umkehr der `server.ice`-Liste und public Positionspayload ohne verdeckte Definitionen.

Notwendige Umsetzung

- LegalAction nach erfolgreichem Run auf das konkrete Fort anbieten.
- `server.ice` deterministisch reversen, ohne Rezzed-/Faceup-Status oder CardInstance-Zonen zu verlieren.
- PublicPayload nur mit Serverlabel, ICE-Anzahl und Positionsänderung, nicht mit unrezzed Definition IDs.
- PlayerViews/Reconnect prüfen, dass Runner und Korp dieselbe öffentliche Reihenfolge sehen, verdeckte Identitäten aber verborgen bleiben.

Akzeptanzkriterien

- Kein LegalAction-Angebot vor erfolgreichem Run, während Encounter, bei Archiven ohne ICE-Liste oder ohne installiertes Netspace Inverter.
- Reversal bei null, einer und mehreren ICE ist stabil und validiert.
- StateHash nach Replay identisch.
- Chronik nennt den Server und die Anzahl umgeordneter ICE.

### onr_v1_067_speed-trap - Speed Trap

Bewertung: Engine: Speed Trap ist decklegal, aber laut V1.9.22-Status install-only; das Reaktionsfenster nach Rez eines Upgrades/Nodes ist nicht als LegalAction umgesetzt. Chronik: keine Jack-out- oder Successful-no-access-Chronik. Tests: keine Abdeckung für Upgrade-/Node-Rez-Interrupt, letztes-ICE-Sonderfall, Marked-Accounts-artige nicht-installierte Quellen oder falschen Rez-Kontext. Hidden-Info/Replay/StateHash: Reaktion hängt an public rezzed Upgrade/Node und darf keine Root-/HQ-/R&D-Privatdaten ausgeben. Fehlende Härtungen: Interrupt-Queue zwischen Rez und Effekt, Runner-Choice, Run-Ende mit erfolgreicher Runmarkierung ohne Access nach letztem ICE.

Notwendige Umsetzung

- Speed-Trap-Fenster nach Corp-Rez eines installierten Upgrades/Nodes öffnen, bevor dessen Effekt aufgelöst wird.
- LegalAction mit Quelle Speed Trap, Ziel-Rezkontext und 0-Kosten revalidieren.
- Run-Ende differenzieren: normales Jack-out versus nach letztem ICE erfolgreicher Run ohne Access.
- Nicht-installierte oder nicht betroffene Quellen ausdrücklich ausschließen.

Akzeptanzkriterien

- Wrong-side/stale, falscher Reztyp, nicht installierter Effekt und fehlender Run werden abgelehnt.
- Nach letztem ICE endet der Run als erfolgreich, aber ohne Access/Breach.
- PublicPayload enthält Rezkontext, Run-Ausgang und Access-Unterdrückung, ohne Hidden-Info.
- Replay/StateHash bleibt stabil, auch wenn die Korp mehrere Root-Karten hat.

### onr_v1_068_startup-immolator - Startup Immolator

Bewertung: Engine: Install-only-Pfad ist vorhanden; der Post-Pass-ICE-Trash nach vollständig gebrochenen Subroutinen ist nicht umgesetzt. Chronik: keine Payload für Tap/Kosten/ICE-Trash. Tests: keine Abdeckung für all-subroutines-broken-Tracking, bereits genutzte/tapped Quelle, Rez-Kosten-Zahlung, ICE-Zonenentfernung und Dropp-/Sonderbreaker-Ausschlüsse. Hidden-Info/Replay/StateHash: Ziel-ICE ist installiert und öffentlich positioniert; Definition darf nur leaken, wenn sie gerezzt/öffentlich bekannt ist. Fehlende Härtungen: Run-gebundenes Post-Encounter-Fenster, Zahlung normaler Rez-Kosten durch Runner, source-bound exhausted state und öffentliche Trash-Zusammenfassung.

Notwendige Umsetzung

- Nach dem Passieren einer ICE prüfen, ob alle Subroutinen durch Runner-Aktionen gebrochen wurden.
- LegalAction für installiertes Startup Immolator mit Tap/Exhaust-Kosten und Rez-Kosten-Zahlung anbieten.
- ICE sicher in Archives bewegen und Server-ICE-Liste aktualisieren.
- Payload und Tests für unzureichende Runner-Credits, ungebrochene Subroutine und falsches Timing ergänzen.

Akzeptanzkriterien

- Kein Angebot bei ungebrochenen Subroutinen, außerhalb eines Runs oder wenn Startup Immolator nicht installiert/ready ist.
- Runner zahlt exakt die Rez-Kosten des Ziel-ICE; bei zu wenig Credits wird `applyAction` abgelehnt.
- PublicPayload nennt nur öffentliche Zielposition/Definition, sofern erlaubt, und Trash-Count.
- Replay erzeugt denselben Trash und StateHash.

### onr_v1_075_zetatech-software-installer - Zetatech Software Installer

Bewertung: Engine: deutlich weiter als die meisten V1.9.22-Programme; Installkosten 0, MU 1, zwei Programminstallations-Recurring-Credits, Turn-Start-Refresh und Overlay-Install auf Zetatech sind getestet. Chronik: Overlay-Payload enthält Fähigkeit, Host-Definition, ausgegebene Credits und Runner-Credits. Tests: vorhandene Tests decken Wrong-Side/Stale, Payment, MU/`hostedOn`, PublicPayload und Replay ab. Hidden-Info/Replay/StateHash: öffentliche Rig-/Host-Beziehung ist okay; kritische Restlücke ist Removal/Trash-Kaskade für gehostete Overlay-Programme und Wechselwirkung mit Microtech Backup Drive/Daemon-Hosting. Fehlende Härtungen: Host-Removal-Kaskade, Hosted-Program-Visibility nach Reconnect, Zahlungspriorität bei mehreren Programminstallationsquellen und keine versehentliche Nutzung für Hardware/Resources.

Notwendige Umsetzung

- Bestehenden Overlay-Pfad um Host-Trash-Kaskade und Reconnect-/PlayerView-Assertions erweitern.
- Zahlungsreihenfolge bei Valu-Pak, Zetatech-Recurring und Runner-Credits explizit in Tests festnageln.
- Sicherstellen, dass Zetatech-Recurring-Credits nur Programminstallationen inklusive Overlay bezahlen.
- PublicPayload für Host-Verlust und gehostete Trash-Folge ergänzen, ohne Grip-/Stack-Details.

Akzeptanzkriterien

- Gehostetes Programm wird beim Trash von Zetatech deterministisch mitgetrasht oder nach lokalem Vertrag eindeutig behandelt.
- Hardware-/Resource-Installationen können keine Zetatech-Credits verwenden.
- Mehrere Zahlungsquellen führen zu stabiler, getesteter Kostenreihenfolge.
- Replay/StateHash bleibt bei Overlay, Refresh und Host-Trash identisch.

### onr_v1_119_arasaka-portable-prototype - Arasaka Portable Prototype

Bewertung: Engine: Hardware-Install ist LegalAction-getestet; ein Spotcheck-Artemis-Test zeigt, dass ältere Decks beim Install eines neuen Decks getrasht werden, aber der generische Deck-Einzigartigkeitspfad scheint derzeit nur für einzelne IDs (`Bodyweight Data Creche`, `Artemis 2020`) explizit im Install-Code zu greifen. Chronik: Installpayload deckt öffentliche Installation ab, aber Agenda-Punkt-Zusatzkosten und eigene Deck-Replacement-Ausgabe sind für Arasaka nicht ausreichend isoliert. Tests: vorhandene Hardware-Smokes prüfen Installation, Visibility und Replay; keine enge Prüfung für Agenda-Punkt-Installkosten, eigene Recurring-Icebreaker-Credits und Arasaka-als-neues-Deck-ersetzt-alt. Hidden-Info/Replay/StateHash: Agenda-Forfeit-Kosten und Decktrash müssen public genug sein, ohne ScoreArea-Privatdaten zu leaken. Fehlende Härtungen: installiere Arasaka mit Agenda-Punktkosten, Deck-Einzigartigkeit für alle Hardware-Decks und restricted Run/Icebreaker-Credits.

Notwendige Umsetzung

- Deck-Einzigartigkeit generisch auf Hardware mit Subtype `deck` anwenden, nicht nur auf einzelne IDs.
- Arasaka-Installkosten um exakt 1 Agenda-Punkt-Zusatzkosten mit LegalAction-Zielwahl und `applyAction`-Revalidation erweitern.
- Drei wiederkehrende Credits nur für Icebreaker-Nutzung während Runs bereitstellen und refreshen.
- Chronik für Agenda-Kosten, trashed older decks und Recurring-Load ergänzen.

Akzeptanzkriterien

- Arasaka kann ohne verfügbaren Agenda-Punkt nicht installiert werden.
- Bei mehreren Runner-Score-Area-Kandidaten wird die Forfeit-Auswahl revalidiert und öffentlich zusammengefasst.
- Arasaka ersetzt jedes ältere installierte Hardware-Deck; umgekehrt ersetzen spätere Decks Arasaka.
- Recurring-Credits funktionieren nur in Run-/Icebreaker-Zahlungsfenstern und replayen stabil.

### onr_v1_131_microtech-backup-drive - Microtech Backup Drive

Bewertung: Engine: als Hardware installierbar und replay-/visibility-getestet; Replacement-Fähigkeit für gleichzeitig getrashte installierte Programme und die Aktion zum Zurücknehmen des obersten gehosteten Programms sind nicht erkennbar umgesetzt. Chronik: Installationschronik ist vorhanden, aber keine Replacement-/Host-Order-Chronik. Tests: keine Abdeckung für Mehrprogramm-Trash, Teilwahl, Reihenfolge, Faceup-Hosting, Backup-Drive-Removal-Kaskade und Rücknahme-Aktion. Hidden-Info/Replay/StateHash: installierte Programme sind öffentlich, die Reihenfolge auf Backup Drive muss für beide Seiten konsistent sichtbar sein; keine Grip-Inhalte dürfen zusätzlich leaken. Fehlende Härtungen: Replacement-Window vor Programtrash, private/öffentliche Choice nach Regelvertrag, ordered hosted stack und LegalAction `[A]` für Topkarte in Grip.

Notwendige Umsetzung

- Replacement-Fenster öffnen, wenn ein oder mehrere installierte Runner-Programme gleichzeitig getrasht würden.
- Auswahl any/all und Reihenfolge deterministisch über Choice abbilden; gehostete Karten faceup auf Microtech Backup Drive legen.
- Aktion für Runner: oberste gehostete Karte in die Grip nehmen, mit Side/Stale/Source-Revalidation.
- Entfernen von Microtech Backup Drive trasht alle darauf gehosteten Karten nach klarer, replaybarer Reihenfolge.

Akzeptanzkriterien

- Simultaner Programtrash kann komplett, teilweise oder gar nicht ersetzt werden; Zielmenge wird bei `applyAction` neu validiert.
- Hosted order bleibt in PlayerViews und Reconnect stabil.
- Return-to-grip-Aktion nimmt nur die oberste gehostete Karte und leakt keine übrige Grip.
- Replay/StateHash deckt Choice, Hosting und Removal-Kaskade ab.

### onr_v1_136_pandoras-deck - Pandora's Deck

Bewertung: Engine: Hardware-Install ist im V1.9.22-Hardware-Smoke enthalten, aber der spezifische Deck-Vertrag ist dünn. Chronik: Installation sichtbar; Deck-Ersatz und Link-Recurring-Use fehlen. Tests: keine enge Abdeckung für +2 MU, drei Link-Increase-Recurring-Credits, Turn-Start-Refresh oder generische Deck-Einzigartigkeit mit Pandora als Quelle/Ziel. Hidden-Info/Replay/StateHash: kein Hidden-Zone-Effekt, aber Zahlungsfenster und Decktrash müssen payloadfähig und deterministic sein. Fehlende Härtungen: Deck-Subtype generisch behandeln, Recurring-Credits nur für Link-Erhöhung, Refresh ohne Akkumulation.

Notwendige Umsetzung

- Pandora's Deck beim Install +2 MU geben, drei Recurring-Credits laden und ältere Hardware-Decks trashen.
- Link-Increase-Zahlungsfenster so modellieren, dass Pandora-Credits nur dafür verwendet werden.
- Runner-Zugstart-Refresh auf maximal drei Credits begrenzen.
- Tests mit vorhandenen anderen Decks und mehreren Link-Credit-Quellen ergänzen.

Akzeptanzkriterien

- MU steigt exakt um 2 und fällt korrekt bei Trash/Replacement zurück.
- Pandora-Credits können keine Programminstallationen, Icebreaker-Kosten oder normale Kosten bezahlen.
- Ältere Decks werden beim Install getrasht; spätere Decks ersetzen Pandora.
- Replay/StateHash und PublicPayload bleiben stabil.

### onr_v1_140_raven-microcyb-eagle - Raven Microcyb Eagle

Bewertung: Engine: V1.9.16 deckt Installation, einen Recurring-Credit und Refresh ohne Akkumulation. Chronik: Recurring-Load/Refresh ist indirekt abgesichert, aber die Net-Damage-Prevention der Karte ist nicht im sichtbaren Testausschnitt nachgewiesen. Tests: vorhandener Test prüft Invisibility plus Raven Microcyb Eagle Refresh; keine enge Abdeckung für +1 MU, Deck-Einzigartigkeit und einmal-pro-Turn-Net-Damage-Prevention. Hidden-Info/Replay/StateHash: Prevention-Fenster darf Damage-Zufall und getrashte Grip-Karten nicht leaken; PublicPayload braucht nur prevented/final amount. Fehlende Härtungen: Damage-Prevention-Choice oder Auto-Prevention nach lokalem Vertrag, Reset pro Runner-Zug, Deck-Subtype-Replacement und Run-Credit-Restriktion.

Notwendige Umsetzung

- Raven Microcyb Eagle als Hardware-Deck mit +1 MU, einem Icebreaker-Run-Credit und Deck-Einzigartigkeit prüfen.
- Net-Damage-Prevention einmal pro Runner-Zug über bestehendes Event-Modification-/Prevention-Fenster implementieren oder verifizieren.
- PublicPayload für Prevention nur mit Amounts und SourceDefinitionId versehen.
- Tests für Refresh, Nicht-Akkumulation, Prevention-Verbrauch und Reset ergänzen.

Akzeptanzkriterien

- Ein Net Damage pro Runner-Zug wird verhindert; weiterer Net Damage im selben Zug wird nicht erneut verhindert.
- Prevention-Replay ist stabil und leakt keine zufällig getrashte Grip-Karte.
- Recurring-Credit kann nur für Icebreaker während Runs genutzt werden.
- Deck-Einzigartigkeit funktioniert gegen andere Hardware-Decks.

### onr_v1_368_roving-submarine - Roving Submarine

Bewertung: Engine: als V1.9.19 servergebundener Difficulty-Modifier für Agenda-Scoring umgesetzt; Test weist Score-Difficulty-Reduktion, Overadvance-Payload und Replay nach. Chronik: Score-Payload zeigt Difficulty/Overadvance, aber der eigentliche Roving-Submarine-Run-Lock-Text ist nicht sichtbar als eigener Effekt belegt. Tests: keine enge Abdeckung für Install-only inside subsidiary fort, Auto-Rez-on-install-Region-Regel, one-region-per-fort und Run-Erlaubnis nur nach Install/Advance im Fort im letzten Korpzug. Hidden-Info/Replay/StateHash: Serveraktivitätsmarker dürfen keine verdeckten Root-/ICE-Identitäten leaken; PublicPayload kann Serverlabel und Aktivitätsgrund nennen. Fehlende Härtungen: Region-Installvertrag, Fort-Aktivitätsmarker über Zugwechsel, Run-LegalAction-Gate und Region-Replacement.

Notwendige Umsetzung

- Roving Submarine als Region nur in subsidiary remote forts installierbar machen; Rez beim Install und Kostenpflicht erzwingen.
- Pro Fort nur eine Region zulassen und ältere Region beim Install/Rez nach lokalem Vertrag trashen.
- Fort-Aktivitätsmarker setzen, wenn Korp im letzten Zug in/auf diesem Fort installiert oder advanced hat.
- Runner-Run-LegalActions gegen dieses Fort blockieren, wenn der Marker fehlt; `applyAction` muss erneut prüfen.

Akzeptanzkriterien

- Run auf geschütztes Fort ist nur nach passender Korp-Aktivität im Vorzug legal.
- Install in HQ/R&D/Archives oder nicht-subsidiary Fort wird abgelehnt.
- Region-Replacement und Rez-Kosten sind public payloadfähig.
- Agenda-Difficulty-Modifier bleibt erhalten und Replay/StateHash bleibt stabil.

## Gesamtplan

1. Zuerst die gemeinsamen Runner-Programm-Run-Reaktionsfenster härten: False Echo, Netspace Inverter, Speed Trap und Startup Immolator brauchen klare Timingpunkte, `LegalActions` und `applyAction`-Revalidation.
2. Danach den Hardware-Deck-Vertrag generisch machen: alle Hardware mit Subtype `deck` müssen Einzigartigkeit, MU-Änderung, Trash-/Replacement-Folge und PublicPayload konsistent nutzen.
3. Anschließend Restricted-/Recurring-Credit-Pfade trennen: Zetatech für Programminstallationen, Arasaka/Raven für Icebreaker-Run-Kosten und Pandora für Link-Erhöhung.
4. Danach Microtech Backup Drive als Replacement-/Hosting-Sonderfall umsetzen, weil diese Karte mit Programtrash, Hosting und Zetatech/Daemon-Kaskaden kollidieren kann.
5. Zuletzt Roving Submarine als servergebundenen Region-/Run-Gate-Vertrag nachziehen und den bestehenden Agenda-Difficulty-Pfad regressionssichern.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test -- --runInBand`
- Fokussierte Engine-Smokes für `V1.9.22 Per-card Longtail WIP`, `V1.9.16 Program Subtypes`, `V1.9.19 Agenda/Overadvance` und neue Spotcheck-Fälle.
- `pnpm --filter @netgrid/catalog test`
- `pnpm --filter @netgrid/ai test`
- `pnpm typecheck`
- `pnpm test`
- Leak-Scan in neuen PublicPayload-/PlayerView-Assertions: keine `grip`, `hq`, `rd`, `cardInstances`, privaten Choice-Labels oder unrezzt-verdeckten Definition IDs.
