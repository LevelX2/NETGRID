# Trace Open Bidding Alignment Plan

Status: Policy-Abgleich umgesetzt
Stand: 2026-05-17
Primärer Agent: card-enablement-ai-knowledge-agent

## Zielbild

NETGRID bleibt bei der modernen, offenen Trace-Logik:

- Die Korp wählt zuerst ein sichtbares Trace-Gebot.
- Der Runner wählt danach sein Link-Gebot mit Kenntnis von Basis-Trace, Korp-Gebot, aktueller Trace-Stärke und eigenem Link.
- Ein Trace ist erfolgreich, wenn `traceStrength > runnerStrength`.
- Gleichstand genügt dem Runner, um den Trace abzuwehren.
- Die Zahl bei "Trace N" ist die Basis-Trace-Stärke, nicht die gesamte Obergrenze.
- "Unbegrenzt" meint nicht unendlich, sondern "bis zur aktuell zahlbaren Regelobergrenze".

Damit weicht NETGRID bewusst vom ursprünglichen blinden beziehungsweise gleichzeitig verdeckten Netrunner-Auktionsgefühl ab. Diese Abweichung ist gewollt, weil die offene Android-Netrunner-nahe Sequenz für digitale Bedienung, KI-Entscheidungen, Chronik und Debugging praktikabler ist.

Dieses Dokument war ursprünglich ein Planungsartefakt. Der P0-Regel- und Dokumentationsabgleich ist am 2026-05-17 umgesetzt worden; verbleibende P1/P2-Punkte bleiben als Folgearbeit beschrieben.

## Umsetzungsergebnis 2026-05-17

- Die offene sequenzielle Trace-Regel ist als verbindliche NETGRID-Regel bestätigt: Korp-Gebot zuerst, danach Runner-Gebot mit sichtbarer Trace-Stärke.
- Der Kernvertrag bleibt `traceStrength = baseTraceStrength + corpBid` und `runnerStrength = runnerLink + runnerBid + temporaryLinkBoosts`; erfolgreich ist nur `traceStrength > runnerStrength`.
- Öffentlich sichtbare Korp-Gebote sind ein erlaubter Trace-Schritt und kein Hidden-Info-Leak.
- Runner-`PendingChoice`-Daten bleiben runner-privat; Reconnect, KI, PublicEvents, Undo-Preview und Chronik dürfen keine privaten Choice-Rohdaten der falschen Seite enthalten.
- Signpost und The Springboard sind nicht mehr offen: `spotcheck-2026-05-16-trace-link-post-bid-resolvers` hat beide Karten auf moderne post-bid Trace-Link-Choices gebracht.
- DEV-007 bleibt als historische MVP-0.1-Abweichung erhalten, ist für Trace/Link aber durch V0.96 und V1.9.14 normalisiert.

## Führende Quellen

### Lokale NETGRID-Spezifikation

- `docs/releases/mvp/mvp-0-96-trace-link-bidding/trace-link-bidding-spec.md`
- `docs/releases/mvp/mvp-0-96-trace-link-bidding/requirements.md`
- `docs/releases/mvp/mvp-0-96-trace-link-bidding/implementation-review.md`
- `data/rules/mechanics-coverage-0.96.json`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-14-trace-tag-resource/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-14-trace-tag-resource/final-review.md`
- `data/rules/mechanics-coverage-1.9.14.json`

### Originalquellen als Abgleichsmaterial

- `docs/source/Netrunner Errata 1.70.md`
- `docs/source/Runnerspoiler 1.0.txt`
- `docs/source/Corpspoiler 1.0.txt`

### Aktuelle technische Anker

- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `packages/shared/src/index.ts`
- `apps/web/app/chronicle.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/chronicle.test.ts`

## Aktueller Implementierungsstand

### Engine

Die Engine startet Trace-Fenster offen und sequenziell. Bei ICE-Subroutinen wird die Basis-Trace-Stärke aus der Subroutine gelesen, dann ein Korp-Bid-Fenster geöffnet. Die Korp kann innerhalb der zahlbaren Obergrenze bieten. Danach wird die sichtbare Trace-Stärke berechnet und ein Runner-Bid-Fenster geöffnet.

Der Kernvergleich ist aktuell:

```text
traceStrength = baseTraceStrength + corpBid
runnerStrength = runnerLink + runnerBid
traceSuccessful = traceStrength > runnerStrength
```

Das ist für die gewählte moderne Logik korrekt.

### Chronik

Die Chronik zeigt aktuell öffentlich, welches Korp-Gebot gewählt wurde. Unter der beschlossenen offenen Logik ist das kein Leak, sondern erwartetes Spielverhalten. Der Screenshot mit "Die Korp-KI hat im Trace 2 Credits geboten" ist deshalb regelkonform für NETGRID.

### KI

Die Korp-KI bietet aktuell sehr einfach abhängig vom Schwierigkeitsgrad. Die Runner-KI bietet so, dass sie bei ausreichenden Mitteln mindestens Gleichstand erreicht. Das passt zum offenen Modell, ist aber noch nicht vollständig quellen- und karteneffektsensitiv.

### Regeln und Kartentexte

Die größte verbleibende Drift liegt nicht im Trace-Kern, sondern in Kartentexten und Spezialkarten, die besondere Trace-/Link-Budgetquellen mitbringen. Die frühere Signpost-/Springboard-Drift aus "nach dem Aufdecken der Gebote" ist durch moderne post-bid Link-Choices geschlossen.

## Nicht-Ziele

- Keine Rückkehr zu blindem oder gleichzeitig verdecktem Bieten.
- Keine verdeckte Korp-Gebotsphase in der UI.
- Keine Umsetzung in diesem Planungsschritt.
- Keine Änderung an Originalquellen unter `docs/source/`.
- Keine Freischaltung weiterer Karten ohne gültigen Release- und Gate-Bezug.
- Keine Abschwächung der Hidden-Information-, LegalActions-, StateHash- oder Replay-Prinzipien.

## Bewertung

### Was bereits korrekt ist

- Offene Korp-Gebote in der Chronik sind unter dem NETGRID-Zielmodell korrekt.
- Runner-Entscheidung nach sichtbarem Korp-Gebot ist korrekt.
- Gleichstand zugunsten des Runners ist korrekt.
- `Trace N` als Basiswert plus Korp-Gebot ist korrekt.
- "Unbegrenzt" ist als "bis zur zahlbaren Obergrenze" gemeint, sollte aber sprachlich präziser werden.

### Was noch abzugleichen ist

- Kartentexte mit Originalformulierungen wie "after both players reveal their bids" müssen weiter in NETGRID-Begriffe übersetzt werden, wenn sie in aktiven Anzeige- oder Katalogtexten auftauchen.
- Base-Link-Karten sind aktuell teils vereinfacht oder inkonsistent gegenüber den Originalwerten.
- Wiederkehrende Link-Bid-Credits sind noch nicht vollständig quellenübergreifend modelliert.
- UI, Chronik und Entscheidungsflächen sollten das offene Modell deutlicher erklären, ohne technische Interna sichtbar zu machen.
- KI-Entscheidungen sollten die zusätzlichen Link- und Trace-Budgetquellen berücksichtigen.

## Prioritäten

### P0 - Regelentscheidung und Sicherheitsrahmen

Diese Punkte müssen vor weiteren Trace-/Link-Karten eindeutig feststehen.

1. Moderne offene Trace-Regel als verbindlichen NETGRID-Policy-Eintrag dokumentieren.
2. Alte oder stale Deviation-Einträge prüfen, insbesondere Einträge, die Trace noch als nicht implementiert beschreiben.
3. Öffentliche Korp-Gebote ausdrücklich als erlaubte PublicEvents markieren.
4. Reconnect-, Undo-, Replay- und KI-Payloads gegen unerwünschte Zusatzinformationen absichern.
5. Tests erhalten oder ergänzen, die zeigen: Korp-Bid ist öffentlich, Runner-PendingChoice ist nur Runner-sichtbar.

Abnahmekriterien:

- Eine aktuelle Regelstelle benennt die offene Trace-Sequenz als gewollte NETGRID-Regel.
- Es gibt keine aktuelle Dokumentationsstelle mehr, die für NETGRID blindes Trace-Bieten fordert.
- Der Trace-Kern bleibt deterministisch und replayfähig.

### P1 - Kartentext- und Mechanikabgleich

Diese Punkte betreffen spielbare Karten und müssen vor breiterer Kartenfreischaltung geklärt werden.

1. Signpost und The Springboard modernisieren.
2. Base-Link-Karten systematisch gegen Originalwerte und lokale NETGRID-Vereinfachungen prüfen.
3. Wiederkehrende Link-Bid-Credit-Quellen vollständig inventarisieren.
4. Korp-Trace-Bid-Quellen wie Hacker Tracker Central, Krumz und Rabbit sprachlich und technisch eindeutig machen.
5. Trace- und Link-Begriffe in UI, Katalog und Kartentexten vereinheitlichen.

Abnahmekriterien:

- Jede freigeschaltete Trace-/Link-Karte hat eine NETGRID-taugliche, moderne Regelformulierung.
- Keine spielbare Karte verlangt ein verdecktes Reveal-Fenster.
- Alle bid-relevanten Zusatzquellen erhöhen die angezeigte und validierte Obergrenze konsistent.

### P2 - Bedienbarkeit, KI und Tests

Diese Punkte verbessern Verständlichkeit und Robustheit.

1. Entscheidungsfläche zeigt verständlicher, wie viel der Runner zum Abwehren braucht.
2. "Unbegrenzt" wird durch eine konkrete Maximalangabe oder eine klare Kurzform ersetzt.
3. Chronik erklärt offene Korp-Gebote als sichtbaren Trace-Schritt.
4. KI nutzt Link-Booster und wiederkehrende Link-Credits bei Runner-Geboten.
5. Szenario- und UI-Tests decken Data Raven, Rabbit, Hacker Tracker Central und Link-Booster ab.

Abnahmekriterien:

- Ein Spieler kann aus der UI erkennen, warum Gebote von 0 bis N angeboten werden.
- Die KI erzeugt keine offensichtlich schlechten Runner-Gebote, obwohl verfügbare Link-Quellen vorhanden sind.
- Regressionstests schützen die offene Sequenz.

## Kartenmatrix

| Karte | Aktueller Befund | Planbedarf | Priorität |
| --- | --- | --- | --- |
| Data Raven | Trace 5 nutzt den offenen Trace-Kern. | Kein Logikwechsel. UI soll klarer zeigen, dass 5 die Basis ist und Korp-Gebot addiert wird. | P2 |
| Signpost | Umgesetzt im Folgejob `spotcheck-2026-05-16-trace-link-post-bid-resolvers`. | Runner-Option im offenen post-bid Link-Fenster: `1 Credit: +2 Link für diesen Trace`, einmal pro Trace. | abgeschlossen |
| The Springboard | Umgesetzt im Folgejob `spotcheck-2026-05-16-trace-link-post-bid-resolvers`; statischer Base-Link wurde entfernt. | Runner-Option im offenen post-bid Link-Fenster: `1 Credit: +1 Link für diesen Trace`, einmal pro Trace. | abgeschlossen |
| Rabbit | Original reduziert Trace Limit bei ICE. Engine berücksichtigt eine Korp-Bid-Obergrenzenreduktion für ICE-Traces. | Text auf moderne Begriffe bringen: reduziert die Korp-Bid-Obergrenze bei ICE-Traces, nicht die Basis-Trace-Stärke. | P1 |
| Hacker Tracker Central | Original: Counter nach jedem Trace; Counter können Trace-Stärke und Trace Limit erhöhen. Engine nutzt Counter als Korp-Bid-Quelle. | Text und Tests auf moderne Gebotsquelle abstimmen. Quelle in Payload/Chronik nachvollziehbar machen. | P1 |
| Krumz | Engine unterstützt Krumz-Bits als Korp-Trace-Bid-Quelle. | Quellenanzeige, Tests und Katalogtext prüfen. | P1 |
| Hell's Run | Engine kennt diese Quelle für Runner-Trace-Link-Credits. | Behalten und gegen weitere Quellen abgleichen. | P1 |
| Pandora's Deck | Original und lokale Definition deuten wiederkehrende Link-Credits an. Engine nutzt sie noch nicht als Runner-Bid-Quelle. | In Link-Credit-Inventar aufnehmen und Implementierungsbedarf prüfen. | P1 |
| Bodyweight Data Creche | Lokale Definition enthält Link-Credit-Mechanik. Engine nutzt sie noch nicht als Runner-Bid-Quelle. | In Link-Credit-Inventar aufnehmen und Text/Mechanik angleichen. | P1 |
| PK-6089a | Lokale Fakten deuten wiederkehrende Link-Credits an, aktuelle Definition wirkt generischer. | Originalwert, Release-Gate und gewünschte NETGRID-Fassung prüfen. | P1 |
| Techtronica Utility Suit | Originaltext enthält Link-Credit-Bezug, aktuelle Definition fokussiert Schadenprävention. | Prüfen, ob Link-Credits im aktuellen Release überhaupt freigeschaltet werden sollen. | P1 |
| Baedeker's Net Map | Base-Link-Karte. | Wert und Kosten gegen Zielmodell prüfen. | P1 |
| Bakdoor | Originalwert wirkt höher als aktuelle lokale Definition. | Base-Link-Wert und Kostenmodell klären. | P1 |
| Access through Alpha | Aktueller Workspace deutet bereits auf hohen Base-Link-Wert hin. | Gegen Original, Gate und gewünschte Vereinfachung prüfen. | P1 |
| Access to Arasaka | Original enthält Base-Link und Link-Erhöhung. Aktuelle Definition wirkt vereinfacht. | Wert, Zusatzfähigkeit und Kostenmodell klären. | P1 |
| Access to Kiribati | Base-Link-Karte. | Wert und Kosten gegen Zielmodell prüfen. | P1 |
| Back Door to Hilliard | Original enthält Base-Link und Link-Erhöhung. | Wert, Zusatzfähigkeit und Kostenmodell klären. | P1 |
| Back Door to Orbital Air | Original enthält Base-Link und Link-Erhöhung. | Wert, Zusatzfähigkeit und Kostenmodell klären. | P1 |
| Submarine Uplink | Original enthält Base-Link, Link-Erhöhung und Jack-out-Folge. | Prüfen, ob Zusatzfolge im aktuellen Release gebraucht wird oder bewusst verschoben bleibt. | P1 |
| Microtech 'Trode Set | Aktuell als +1 Link vereinfacht. | Gegen Base-Link-Zielmodell prüfen. | P1 |
| Crybaby | Engine berücksichtigt Counter-Reduktion auf Runner-Link. | Tests und Anzeige beibehalten beziehungsweise ergänzen. | P2 |
| Paris City Grid | Trace-Quelle im Corp-Upgrade-/City-Grid-Umfeld. | Nur Terminologie prüfen, kein offenes Bietmodell ändern. | P2 |

## Regelmodell für offene Link-Booster

Für Karten wie Signpost und The Springboard sollte kein neues verdecktes Reveal-Fenster eingeführt werden. Stattdessen sollte die moderne Sequenz so erweitert werden:

1. Korp wählt sichtbares Trace-Gebot.
2. Engine berechnet vorläufige Trace-Stärke.
3. Runner-Bid-Fenster enthält normale Credit-Gebote und verfügbare Link-Booster.
4. Runner kann Link-Booster bezahlen oder einsetzen, solange sie für diesen Trace legal sind.
5. Engine berechnet `runnerStrength = runnerLink + runnerBid + temporaryLinkBoosts`.
6. Trace-Erfolg bleibt `traceStrength > runnerStrength`.

Vorteile:

- Keine verdeckte Zusatzphase.
- Passt zur gewählten offenen Android-Netrunner-nahen Bedienlogik.
- LegalActions bleiben die einzige Quelle erlaubter Entscheidungen.
- KI und UI können die benötigte Runner-Stärke transparent berechnen.

Offene Detailentscheidung:

- Link-Booster als eigene Choices vor dem finalen Runner-Bid modellieren oder als kombinierte Runner-Bid-Option mit Zusatzquellen.
- Empfehlung: zunächst kombinierte Runner-Bid-Optionen, wenn das zur bestehenden `bid_amount`-Struktur passt; andernfalls eigenes, aber weiterhin Runner-sichtbares Modifier-Fenster.

## Base-Link-Zielmodell

Der aktuelle Code berechnet Runner-Link offenbar aus Identität plus statischen Quellen und wählt bei installierten Base-Link-Karten einen wirksamen Maximalwert. Das ist spielbar, aber nicht vollständig originalgetreu, weil mehrere Originalkarten Kosten für Base Link oder zusätzliche Link-Erhöhung nennen.

Es gibt zwei realistische Zielmodelle.

### Option A - Praktische NETGRID-Vereinfachung

Base-Link-Karten liefern installierte, offene statische Linkwerte. Die Engine wählt automatisch den besten anwendbaren Wert. Kosten aus Originaltexten werden nicht oder nur als Installations-/Freischaltungsmodell übernommen.

Vorteile:

- Passt zur aktuellen Implementierung.
- Sehr gut für KI und UI.
- Weniger Zusatzentscheidungen pro Trace.

Nachteile:

- Muss als bewusste NETGRID-Regelabweichung dokumentiert werden.
- Originalformulierungen müssen deutlich lokalisiert werden.

### Option B - Näheres Originalmodell

Base-Link-Karten werden als explizite Runner-Entscheidung im Trace-Fenster modelliert, gegebenenfalls mit Kosten pro Nutzung.

Vorteile:

- Näher am Original.
- Kartentexte lassen sich genauer abbilden.

Nachteile:

- Mehr UI-Komplexität.
- Mehr KI- und Testaufwand.
- Höheres Risiko für Timing- und LegalActions-Drift.

Empfehlung:

Kurzfristig Option A beibehalten und sauber dokumentieren. Option B nur dann planen, wenn die Base-Link-Karten als eigenes Release-Thema priorisiert werden.

## Sprach- und UI-Abgleich

### Begriffe

- `Trace N`: Basis-Trace-Stärke N.
- `Korp-Gebot`: sichtbare Zusatzstärke, bezahlt aus zulässigen Korp-Quellen.
- `Trace-Stärke`: Basis-Trace-Stärke plus Korp-Gebot plus zulässige Trace-Modifikatoren.
- `Runner-Link`: statischer aktueller Link des Runners vor Runner-Gebot.
- `Runner-Gebot`: bezahlte Zusatzstärke aus Credits und zulässigen Link-Bid-Quellen.
- `Runner-Stärke`: Runner-Link plus Runner-Gebot plus temporäre Link-Booster.
- `Korp-Bid-Obergrenze`: maximal wählbares Korp-Gebot nach Credits, Zusatzquellen und Limits.
- `Runner-Bid-Obergrenze`: maximal wählbares Runner-Gebot nach Credits und Zusatzquellen.

### UI-Verbesserungen

1. Im Runner-Entscheidungsbereich anzeigen:
   - `Trace-Stärke: 7`
   - `Dein Link: 0`
   - `Zum Abwehren benötigt: 7`
   - `Max. Gebot: 10`
2. "Unbegrenzt" durch konkrete Obergrenze ersetzen, wenn die Engine sie kennt.
3. Chroniktext optional ergänzen:
   - `Die Korp-KI hat im offenen Trace 2 Credits geboten.`
4. Tooltip oder Kurzinfo:
   - `Korp-Gebote sind in NETGRID sichtbar, bevor der Runner bietet.`

## Testbedarf

### Engine

- Data Raven: Basis 5, Korp-Gebot 2, Runner-Link 0, Runner-Gebot 6 => Trace erfolgreich.
- Data Raven: Basis 5, Korp-Gebot 2, Runner-Link 0, Runner-Gebot 7 => Trace abgewehrt.
- Gleichstand schützt Runner.
- Rabbit reduziert nur die Korp-Bid-Obergrenze bei ICE-Traces.
- Hacker Tracker Central erhöht verfügbare Korp-Bid-Quellen und erhält nach Trace Counter.
- Krumz-Bits werden korrekt als Korp-Bid-Quelle verbraucht.
- Link-Booster können nur im Runner-Fenster nach sichtbarem Korp-Gebot genutzt werden.
- Wiederkehrende Link-Credits werden korrekt einbezogen und verbraucht.

### Server und Hidden Information

- Korp-PendingChoice nur für Korp sichtbar.
- Runner-PendingChoice nur für Runner sichtbar.
- Öffentliches Event enthält Korp-Gebot, aber keine verdeckten Korp-Hand- oder Deckinformationen.
- Reconnect-Payloads zeigen nur side-legale PendingChoices.
- Undo-Preview leakt keine verdeckten Alternativen.

### Web

- Chronik zeigt Korp-Gebot absichtlich öffentlich.
- Runner-Entscheidung zeigt benötigtes Gebot verständlich.
- Buttons reichen nur legale Gebote ein.
- Maximalwerte bleiben stabil, auch wenn Rabbit, Hacker Tracker Central oder Link-Credit-Quellen aktiv sind.

### KI

- Runner-KI bietet bei offenem Trace mindestens bis Gleichstand, wenn möglich.
- Runner-KI berücksichtigt Link-Booster und wiederkehrende Link-Credits.
- Korp-KI überschreitet nie die aktuelle Bid-Obergrenze.
- KI-Reason-Codes nennen sichtbare moderne Trace-Entscheidungen.

## Dokumentationsbedarf

1. Erledigt: Die aktuelle Trace-Policy ist in diesem Artefakt und in `docs/releases/v1/v1-9-originalset-completion/v1-9-14-trace-tag-resource/spec.md` festgehalten.
2. Erledigt: `TRACE_LINK_BIDDING_0.96_SPEC.md` bleibt führendes Grundmodell und wird durch den V1.9.14-Status ergänzt.
3. Erledigt: `docs/releases/mvp/mvp-0-1-local-core/deviation-registry.md` ordnet DEV-007 als historische MVP-Abweichung ein und benennt die Trace-Normalisierung.
4. Erledigt: Der Spotcheck-Job `trace-link-post-bid-resolvers` ist abgeschlossen und beschreibt moderne post-bid Trace-Link-Choices.
5. Offen als Folgearbeit: Kartenkatalogtexte für weitere freigeschaltete Trace-/Link-Karten normalisieren.

## Umsetzungsschnitt

### Phase 0 - Dieses Planungsartefakt

Ergebnis:

- Detaillierter Plan liegt vor.
- Keine Engine-, UI-, KI- oder Kartendefinitionsänderung.
- P0-Policy-Abgleich wurde am 2026-05-17 dokumentarisch abgeschlossen.

### Phase 1 - Regel- und Dokumentationsabgleich

Betroffene Artefakte:

- Trace-Policy oder Trace-Spezifikation
- Deviation Registry
- Spotcheck-Job für Signpost und The Springboard
- Mechanics-Coverage-Hinweise

Ergebnis:

- Abgeschlossen am 2026-05-17.
- Offenes Bieten ist projektweit eindeutig.
- Blindes oder gleichzeitig verdecktes Bieten taucht nur noch als Originalreferenz oder bewusst verworfene Alternative auf.

### Phase 2 - Signpost und The Springboard

Betroffene Bereiche:

- Engine-Choice-Modell
- Shared-Kartendefinitionen
- Runner-UI
- KI
- Engine- und Webtests

Ergebnis:

- Abgeschlossen durch `spotcheck-2026-05-16-trace-link-post-bid-resolvers`.
- Beide Karten arbeiten im modernen post-bid Runner-Link-Fenster.
- Keine Karte erzeugt ein verdecktes Reveal- oder Nach-Reveal-Fenster.

### Phase 3 - Wiederkehrende Link-Credit-Quellen

Betroffene Karten:

- Hell's Run
- Pandora's Deck
- Bodyweight Data Creche
- PK-6089a
- Techtronica Utility Suit

Ergebnis:

- Alle freigeschalteten Quellen sind vollständig im Runner-Bid-Maximum und in der Zahlung enthalten.
- Verbrauch und Anzeige sind deterministisch und nachvollziehbar.

### Phase 4 - Base-Link-Karten

Betroffene Karten:

- Baedeker's Net Map
- Bakdoor
- Access through Alpha
- Access to Arasaka
- Access to Kiribati
- Back Door to Hilliard
- Back Door to Orbital Air
- Submarine Uplink
- Microtech 'Trode Set

Ergebnis:

- Base-Link-Werte, Kosten und Zusatzfähigkeiten sind entweder korrekt modelliert oder als NETGRID-Vereinfachung dokumentiert.
- UI und Kartentexte widersprechen der Engine nicht.

### Phase 5 - UI, KI und Regression

Betroffene Bereiche:

- Runner-Entscheidungsbereich
- Chronik
- Vorschau und Kartentexte
- KI-Reason-Codes
- End-to-end- und Szenariotests

Ergebnis:

- Spieler verstehen die offenen Trace-Zahlen ohne Regelwissen aus dem Originalspiel.
- KI und Tests schützen die beschlossene Logik.

## Offene Entscheidungen

1. Soll Option A für Base-Link-Karten verbindlich werden, also automatische statische NETGRID-Vereinfachung?
2. Welche wiederkehrenden Link-Credit-Quellen sind im aktuellen Release wirklich freigeschaltet?
3. Wie ausführlich soll die UI die offene Trace-Regel erklären: nur konkrete Zahlen oder zusätzlich ein kurzer Tooltip?

## Empfohlene nächste Entscheidung

Als nächstes sollte zuerst Phase 1 umgesetzt werden. Danach ist die Projektregel eindeutig genug, um Signpost, The Springboard, wiederkehrende Link-Credits und Base-Link-Karten ohne erneutes Grundsatzrütteln umzusetzen.
