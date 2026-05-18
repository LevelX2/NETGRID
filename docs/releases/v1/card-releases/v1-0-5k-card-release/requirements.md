# V1.0.5K Card Release Requirements

Stand: 2026-05-05
Status: done

## Zweck

V1.0.5K ist ein kleines Kartenfreigabe-Release nach V1.0.5. Es aktiviert eine eng begrenzte Auswahl lokal geprüfter O:NR-v1-Karten für Deckbau und Spiel, ohne den V1.0.5-UI-Scope zu verwässern und ohne große neue Mechanikfamilien in ein Karten-Nachrelease zu schmuggeln.

Das `K` steht projektintern für Kartenfreigabe. V1.0.5K ist kein neues großes Mechanikrelease.

## Quellen

- `docs/releases/v1/v1-0-5-action-board-ux/requirements.md`
- `docs/architecture/card-rules/mechanics-coverage-matrix.md`
- `data/manifests/card-implementation-manifest.json`
- Private lokale Textkontrolle unter `data/local/card-import/onr-v1-limited/text-review-galleries/`
- Private lokale Mapping-Notiz unter `data/local/card-import/onr-v1-limited/scan-mapping-fix.local.md`

Die privaten lokalen Dateien unter `data/local/` und `data/local-assets/` bleiben bewusst nicht versionierte Arbeitsartefakte. Versionierte Release-Dokumente führen daher nur Kartenname, Mechanikstatus und Scope-Entscheidung, nicht die vollständigen privaten Kontrolltexte.

## Scope-Regel

V1.0.5K darf maximal 20 Karten aktivieren.

Die tatsächliche Freigabe darf weniger als 20 Karten enthalten, wenn eine Karte beim Implementierungscheck eine nicht freigegebene Zusatzmechanik, unklare Textlage, falsche Bildzuordnung oder fehlende Testbarkeit zeigt.

Eine Karte ist für V1.0.5K nur `deck_legal` und `playable`, wenn alle folgenden Punkte erfüllt sind:

- Der Kartentext ist aus lokaler Nutzerkontrolle oder bereits belastbarer lokaler Implementierung hinreichend bestätigt.
- Alle benötigten Mechaniken sind in `MECHANICS_COVERAGE_MATRIX` mindestens `implemented` oder `implemented_limited`.
- Es gibt eine konkrete Karten-/Ability-/Subroutine-Definition in der Engine-nahen Kartendatenquelle.
- Das Kartenmanifest weist die Karte als implementiert aus.
- Deckvalidierung und Matchstart akzeptieren die Karte.
- Unit- und Szenariotests decken die Karte oder ihre Kartenfamilie ab.
- Visibility-, Replay- und StateHash-Verträge bleiben grün.
- Keine verdeckten Daten gelangen in PlayerViews, PublicEvents, KI-Inputs, WebSocket-/Reconnect-Payloads, Undo-Previews oder Logs.

## Nicht-Ziele

- Keine neue allgemeine Replacement-/Interrupt-/Prevention-Engine.
- Keine breite offizielle Kartenpoolfreigabe.
- Keine automatische Freigabe aller Karten mit importiertem Bild oder OCR-Text.
- Keine neue öffentliche Plattformfunktion.
- Keine offiziellen Artworks oder externen Kartendatenbank-Abhängigkeiten.
- Keine Karten mit noch unklarer Bild-/Namenszuordnung.
- Keine Karte mit neuer Zusatzmechanik, nur um die Zahl 20 zu erreichen.

## Finale V1.0.5K-Freigabe

Nach Implementierungscheck werden 12 Karten freigegeben: Codeslinger, Raffles, Raptor, Tinweasel, Tycho Mem Chip, Zetatech Mem Chip, Hostile Takeover, Cortical Scanner, Crystal Wall, Data Wall, Data Wall 2.0 und Endless Corridor.

Zurückgestellt bleiben Dogcatcher, Flak, Reflector, Shield, Corporate War, Political Overthrow und die übrigen Reservekandidaten, weil sie zusätzliche Ziel-, Subroutine-Kategorie-, Prevention-, bedingte Agenda- oder scored-agenda-Ability-Logik benötigen.

Versionierte Umsetzungsdokumente:

- `docs/releases/v1/card-releases/v1-0-5k-card-release/implementation-review.md`
- `data/manifests/card-implementation-manifest-1.0.5k.json`
- `data/scenarios/v105k-card-release-smoke.json`

## V1.0.5K Kernkandidaten

Diese Karten bilden den bevorzugten ersten Freigabekern. Sie nutzen vorhandene oder sehr nahe vorhandene Mechanikfamilien.

| Nr. | Karte | Seite | Typ | Mechaniklesung | V1.0.5K-Entscheidung |
|---:|---|---|---|---|---|
| 015 | Codeslinger | Runner | Program / Icebreaker / Killer | Sentry-Subroutine brechen, 1 MU | Kernkandidat |
| 018 | Dogcatcher | Runner | Program / Icebreaker | Pump, Break gegen Pit Bull/Hellhound/Bloodhound/Watchdog | Kernkandidat, wenn ICE-Subtype-Zielprüfung schlank möglich ist |
| 027 | Flak | Runner | Program / Icebreaker | Pump, Break gegen AP-Subroutinen | Kernkandidat, wenn AP-Subroutine-Tagging schlank möglich ist |
| 052 | Raffles | Runner | Program / Icebreaker | Pump, Code-Gate-Subroutine brechen, 1 MU | Kernkandidat |
| 054 | Raptor | Runner | Program / Icebreaker / Killer | Pump, Sentry-Subroutine brechen, 1 MU | Kernkandidat |
| 070 | Tinweasel | Runner | Program / Icebreaker | Code-Gate-Subroutine brechen, 1 MU | Kernkandidat |
| 144 | Tycho Mem Chip | Runner | Hardware / Chip | +3 MU | Kernkandidat |
| 146 | Zetatech Mem Chip | Runner | Hardware / Chip | +2 MU | Kernkandidat |
| 230 | Cortical Scanner | Corp | ICE / Code Gate | Drei End-the-run-Subroutinen | Kernkandidat |
| 232 | Crystal Wall | Corp | ICE / Wall | Eine End-the-run-Subroutine | Kernkandidat |
| 237 | Data Wall | Corp | ICE / Wall | Eine End-the-run-Subroutine | Kernkandidat, vorhandene lokale Stärke prüfen/korrigieren |
| 238 | Data Wall 2.0 | Corp | ICE / Wall | Eine End-the-run-Subroutine | Kernkandidat, vorhandene lokale Stärke prüfen/korrigieren |
| 239 | Endless Corridor | Corp | ICE / Code Gate | Zwei End-the-run-Subroutinen | Kernkandidat |

## Erweiterungskandidaten bis zur 20er-Grenze

Diese Karten sind mechanisch verstanden, aber nur aufzunehmen, wenn der Implementierungscheck zeigt, dass die benötigte Zusatzlogik bereits ausreichend vorhanden ist oder sehr eng ergänzt werden kann.

| Nr. | Karte | Seite | Mechanik | Risiko |
|---:|---|---|---|---|
| 019 | Dropp™ | Runner | Break beliebige ICE-Subroutine; Nutzung beendet Run | Break-any plus Run-Ende-Nebeneffekt |
| 055 | Reflector | Runner | Break stun/hellbolt/knockout-Subroutine | Subroutine-Kategorie-Tagging |
| 061 | Shield | Runner | Bis zu 2 Net Damage pro Turn verhindern | Prevention/Turn-Reset, daher vermutlich zurückstellen |
| 196 | Corporate War | Corp | On-score bedingter Credit-Gewinn/-Verlust | On-score conditional resolver |
| 203 | Hostile Takeover | Corp | On-score Credit-Gewinn | Einfachster Agenda-Economy-Kandidat |
| 210 | Political Overthrow | Corp | Scored-agenda Action: Gain Credits | Aktive scored-agenda Ability |

## Zurückgestellte bestätigte Karten

Diese Karten sind textlich verstanden, gehören aber nicht in den kleinen V1.0.5K-Kern, solange ihre Zusatzmechanik nicht ohnehin umgesetzt wird.

| Karte | Rückstellgrund |
|---|---|
| Snowball | Run-lokaler Stärkezähler pro gebrochener Subroutine |
| Hammer | Stealth-Ressourcenverlust |
| Japanese Water Torture | Verzicht auf zukünftige Aktionen |
| False Echo | Erzwungene Corp-Rez-Sequenz nach erfolgreichem Run |
| Netspace Inverter | ICE-Reihenfolge eines Forts umkehren |
| Poltergeist / Scatter Shot | Hosted recurring credits für Trash-Kosten |
| Speed Trap | Interrupt-Fenster nach Rez eines Upgrades/Nodes |
| Startup Immolator | Tap-Fähigkeit, just-broken-Tracking, ICE trashen |
| Core Command: Jettison Ice | Successful-HQ-run-Flag und Zielauswahl rezzed ICE |
| Forged Activation Orders | Corp-Entscheidung: rezzen oder trashen |
| If You Want It Done Right… | Stack ansehen, Karte wählen, Rest sortieren |
| misc.for-sale / Organ Donor | Multi-Auswahl aus installierten Karten bzw. Hand |
| Open-Ended® Mileage Program | Tag-Entfernung plus Rücknahme-Option |
| Security Code WORM Chip | Successful-HQ-run-Flag und Zielauswahl unrezzed ICE |
| Valu-Pak Software Bundle | Eingeschränkte Extra-Aktionssequenz |
| Hardware-Decks mit recurring credits | Deck-Einzigartigkeit, hosted/recurring credits, Link-System oder Extra-Run-Trigger |
| Banpei / D’Arc Knight / Data Naga | Program-Trash-Subroutine noch nicht als freigegebener V1.0.5K-Basismechanismus |
| Code Corpse / Cortical Scrub | Brain/Core-Damage-Klärung vor Freigabe |
| Trace-/Counter-/Run-Lock-ICE | Persistente Counter, Trace-Folgen oder Action-Clearance |

## Umsetzungsanforderungen

### Kartendaten

- Für jede freigegebene Karte müssen Kosten, Stärke, MU, Typ und Subtypen aus bestätigtem Text oder belastbarer lokaler Implementierung übernommen werden.
- Bekannte lokale Mapping-Fehler müssen vor Freigabe entweder korrigiert oder für die betroffene Karte ausgeschlossen sein.
- Bereits vorhandene O:NR-Definitionen mit abweichenden bestätigten Werten, insbesondere Stärke bei `Data Wall` und `Data Wall 2.0`, müssen vor Decklegalität korrigiert oder bewusst als Blocker markiert werden.

### Engine

- Bestehende Runner-Icebreaker-Actions bleiben `pump_breaker` und `break_subroutine`.
- ICE-Subroutinen bleiben in gedruckter Reihenfolge deterministisch.
- Die Runner darf nur Subroutinen brechen, die zur Fähigkeit und zum Encounter-ICE passen.
- Stärkevergleiche, Kosten, Timingpunkt und Seite werden in `applyAction` erneut validiert.
- Neue Karten dürfen keine UI-seitige Regelautorität einführen.

### Decks und Matchstart

- Freigegebene Karten werden lokal `deck_legal`.
- Mindestens ein lokaler Smoke-Deck-Snapshot muss die neuen Karten im Deckbau akzeptieren.
- Matchstart darf nur mit Karten gelingen, deren `playable`/`deck_legal`-Status vollständig gesetzt ist.

### Tests

V1.0.5K braucht mindestens:

- Unit-Tests für neue oder korrigierte Karten-Definitionen.
- Encounter-Szenario mit Runner-Breaker gegen passende ICE.
- Negative Tests für unpassende Breaker-Ziele.
- Tests für MU-Limit durch Mem Chips.
- Score-Test für freigegebene Agenda-Economy-Karten, falls `Hostile Takeover` oder `Corporate War` aufgenommen wird.
- Visibility-/Replay-/StateHash-Regression über bestehende Pflichtchecks.
- Deckvalidation- und Matchstart-Smoke mit V1.0.5K-Karten.

## Release-Gate

V1.0.5K ist fertig, wenn:

- Eine konkrete finale Kartenliste mit höchstens 20 Karten dokumentiert ist.
- Jede Karte in der Liste `playable`, `deck_legal`, Manifest- und Testabdeckung besitzt.
- Alle Rückstellungen mit Grund dokumentiert sind.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` und `pnpm build` bestehen.
- Keine privaten lokalen Bild-/Textartefakte versehentlich versioniert werden.
