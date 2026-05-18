# NETGRID Consolidated Release Roadmap

Status: verbindliche konsolidierte Release-Roadmap
Stand: 2026-05-10
Startpunkt: nach V1.1.2K
Aktueller Ausführungsstand: V1.9.0 Mechanikpaket I ist abgeschlossen; nächster verpflichtender Umsetzungsscope ist V1.9.1.

## Verbindlichkeit

Dieses Dokument ist die führende Release-Roadmap ab V1.1.3, solange `docs/codex/CODEX_STATUS.md` keinen neueren verbindlichen Planungsstand benennt.

Es konsolidiert:

- die aktive Anschlussplanung `docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/post-v1-1-2-roadmap.md`,
- die langfristige Produktvision `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`,
- das KI-Briefing `docs/KI-Player/NETGRID_KI_Releaseplanung_Codex_Briefing.md`,
- die historischen Roadmaps nach MVP 0.2, MVP 0.4 und V1.0.x,
- den Mechanik-Komplettierungsplan und die Mechanik-Coverage-Matrix.

Die Grundlinie der neueren Post-V1.1.2-Planung bleibt erhalten: Erst Mechanik- und Karten-Gates, danach darauf aufbauende KI-Stärke. Die alte isolierte Idee eines späten `V1.7 AI v2` ist ersetzt. KI-Entwicklung läuft ab V1.1.3 als eigene Spur in jedem Mechanik- und Kartenrelease mit.

Ältere Roadmaps bleiben historische Quellen und Begründungen, sind aber bei Konflikten diesem Dokument nachgeordnet.

## Leitlinien

- Engine-Korrektheit bleibt wichtiger als Releasebreite.
- Die Rules Engine bleibt die einzige Regelautorität.
- UI, Server, menschliche Spieler und KI reichen nur `PlayerActions` ein, die aus `LegalActions` abgeleitet wurden.
- `applyAction` validiert Side, ActionId, StateVersion, Timingpunkt, Kosten, Ziele und Choices erneut.
- Hidden Info darf nicht in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews, öffentlichen Replays, Logs, Fehlern oder DOM-/Asset-Metadaten leaken.
- Replay, StateHash, Seed, RandomCounter und RandomDrawRecords bleiben Gate-Pflichten.
- Neue Karten folgen Mechanik-Coverage, nicht umgekehrt.
- Keine Karte wird durch Import, Katalog, Bild, Deckeditor oder lokale Verfügbarkeit automatisch spielbar.
- Jede neue `playable` oder `deck_legal` Karte braucht Resolver/Ability, Manifest, Unit- oder Szenariotest, Visibility-Test, Replay/StateHash-Test, Multiplayer-Smoke und KI-Smoke.
- Eine Karte darf erst in KI-Decks, wenn sie `ai_supported` ist.
- Hard-, Advanced- oder Competitive-KI darf mehr planen, aber nicht mehr wissen.
- API-/LLM-KI darf später Analyse, Testfallgenerierung oder Coaching unterstützen, aber nie Live-Regelakteur oder Action-Erzeuger sein.
- Öffentliche Plattformfunktionen starten erst nach eigenen Auth-, Security-, Datenschutz-, Moderations-, Betriebs- und Rechtsgates.

## Standardstruktur je Release

Jedes zukünftige Release-Dokument muss diese drei fachlichen Kapitel enthalten:

1. Allgemeine Produkt- und Feature-Ziele.
2. Mechaniken, Kartenfreigabe und Effekt-Vervollständigung.
3. KI-Spieler: Fortschritt, Hints, Scoring, Tests und Soaks.

Zusätzlich müssen je Release dokumentiert werden:

- Scope und Nicht-Ziele.
- Requirements, Spezifikation, Testmatrix und Requirements Review vor Code.
- Implementation Review und Final Review nach Code.
- Webclient-Versionsnummer wird am Releaseende auf den Zielstand angehoben und im Final Review als eigener Gatepunkt nachgewiesen.
- aktualisierte Mechanik-Coverage, Card-Support-Daten und KI-Support-Daten, sofern betroffen.
- `CODEX_STATUS.md` und Wissensbasis-Update nur für wiederverwendbare Entscheidungen oder Statusänderungen.

## Releasefolge ab V1.1.3

### V1.1.3 Mechanics-AI-Card Baseline

Ziel:

V1.1.3 ist ein Planungs- und Normalisierungsrelease ohne Engine-, Server-, Web- oder KI-Code. Es setzt nach V1.1.2K eine belastbare Startlinie für Mechanik-Coverage, Kartenstatus, AI-Level und nächste Karten-Unlocks.

#### Allgemeine Produkt- und Feature-Ziele

1. Aktuellen Projektstand nach V1.1.2K als Roadmap-Basis einfrieren.
2. Neue verbindliche Roadmap-Referenz in Status und Wissensbasis setzen.
3. V1.1.2 und V1.1.2K unverändert abgeschlossen lassen.
4. V1.0.5-Finalartefakt-Lücke historisch markieren, aber nicht als Blocker für V1.1.3 führen.
5. Laufende private lokale O:NR-v1-Freigaben als eigenen Kartenpool-Scope abgrenzen.
6. Alte V0.x-, V1.0.x- und V2/V3-Planung eindeutig als historisch oder nachgeordnet markieren.
7. Nächste Releasekandidaten nach Kartenwert, Mechanikrisiko und KI-Nutzen priorisieren.
8. Keine öffentlichen Plattformfunktionen in die V1.1.x/V1.2.x-Linie ziehen.
9. Requirements-Artefakte für V1.2.0 vorbereiten, aber noch keinen Code starten.
10. Offene Rechts-/Asset-Fragen getrennt von Spielbarkeit halten.
11. Bestehende lokale Deckbibliothek und Runtime-Kartenfreigabe als Eingangsdaten erfassen.
12. Eine klare Entscheidung treffen, ob V1.2.x vor weiteren K-Kartenreleases kommt.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `MECHANICS_COVERAGE_MATRIX` auf den tatsächlichen Stand nach V1.1.2K aktualisieren.
2. Maschinenlesbare Mechanik-Coverage nach V1.1.2K planen oder erzeugen.
3. Mechanikstatus für Setup, Mulligan, Discard, Handlimit, Core Damage und Full Archives Access normalisieren.
4. Event Modification, Prevention, Avoid, Interrupt und Replacement als wichtigste offene Hochrisiko-Familie markieren.
5. Set Aside, Remove from Game, Ownership und Control als Special-Zone-Familie priorisieren.
6. Deckbuilding-/Formatregeln von der reinen Matchstart-Deckvalidierung trennen.
7. Card-Freigabestatus verbindlich auf `listed`, `engine_supported`, `human_playable`, `ai_supported` erweitern.
8. Bestehende 52 O:NR-v1 Runtime-Karten gegen das neue Statusmodell mappen.
9. Kartenkandidaten nach blockierenden Mechaniken clustern.
10. Karten mit Prevention/Avoid/Replacement ausdrücklich zurückstellen.
11. Karten mit Special-Zone-/Control-Bedarf ausdrücklich zurückstellen.
12. Karten mit nur vorhandenen Resolvern als mögliche spätere kleine K-Releases markieren.
13. Required-Mechanics-Feld für Kartenmanifest-Erweiterungen vorbereiten.
14. Statusmodell für `deck_legal` an `human_playable` koppeln.
15. Regel festschreiben: `ai_supported` setzt `human_playable`, AI-Hints und Szenario-Smoke voraus.

#### KI-Spieler

1. Bestehende KI gegen AI-Level 0 bis 6 auditieren.
2. AI-Level 0 als erfüllt dokumentieren, sofern LegalAction-only, PlayerView-only, Timeout und Fallback weiter grün sind.
3. AI-Level 1 für Corp und Runner als heuristische Basis-KI abgrenzen.
4. AI-Level 2 für Rollen-/Scoringlogik und Difficulty-Profile einordnen.
5. AI-Level 3 Plansequenzen als offen markieren.
6. AI-Level 4 Belief State und Gegner-Modell als offen markieren.
7. AI-Level 5 faire Simulation als offen markieren.
8. AI-Level 6 Selfplay/Tuning als offen markieren.
9. AI-Hints-Schema als verbindlichen Planungsvertrag festlegen.
10. `AiDecisionDebug`-Sollschema mit AI-Level, Scores, Confidence, Risk Summary, Fallback und Seed festlegen.
11. Bestehende AI-Smokes für V1.0.5K, V1.0.6K und V1.1.2K gegen das neue Statusmodell mappen.
12. Liste bereits menschlich spielbarer, aber nicht AI-supported Karten erstellen.
13. KI-Deckpools ausdrücklich von allgemeinen decklegalen Karten trennen.
14. Soak-/Benchmark-Kandidaten für V1.4.x vorbereiten.
15. Hidden-State-Invariance als KI-Gate für spätere Belief-/Simulation-Releases festlegen.

#### Gate

- Keine Codeänderung.
- Neues Statusmodell ist dokumentiert.
- Nächstes Mechanik-Gate ist begründet priorisiert.
- Keine Karte oder KI-Deckfreigabe wird implizit erweitert.

### V1.2.0 Event Modification Foundation

Ziel:

V1.2.0 baut das Fundament für Prevention, Avoid und Interrupts. Es ist ein enges Hochrisiko-Mechanikgate und darf keine breite Kartenmatrix erzwingen.

#### Allgemeine Produkt- und Feature-Ziele

1. Einen testbaren Event-Modification-Kern schaffen.
2. Release als Engine-/Timing-/Choice-Slice führen, nicht als Kartenbreitenrelease.
3. Bestehende Partien ohne Event Modification unverändert grün halten.
4. UI nur für Engine-gelieferte Choices erweitern.
5. Multiplayer-Submit, Reconnect, Undo und EventTail für neue Choice-Fenster härtbar machen.
6. Debug- und Fehlerausgaben ohne Hidden-Info-Leak erweitern.
7. Keine neuen öffentlichen Plattformfeatures aufnehmen.
8. Keine automatische Kartentextinterpretation einführen.
9. Keine Replacement Effects in diesem Release miterledigen.
10. Nur Pilotkarten oder Harness-Fälle zulassen, wenn sie den Mechanikvertrag testen.
11. Performancebudget für `getLegalActions` bei neuen Fenstern festlegen.
12. Requirements für V1.2.1 aus dokumentierten Lücken ableiten.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `would`-/`prevent`-/`avoid`-/`interrupt`-Pipeline als Engine-Vertrag spezifizieren.
2. Event-Objekt mit Quelle, Ziel, Betrag, Typ, Sichtbarkeit und Modifikationsfenster modellieren.
3. Imminent instruction als noch nicht final aufgelöstes Event einführen.
4. PendingChoice-Fenster für berechtigte Seite anbieten.
5. Kosten und Targets jeder Prevention-/Avoid-Entscheidung engine-seitig revalidieren.
6. Erfolgreiche und abgelehnte Event-Modification im EventLog rekonstruierbar machen.
7. Damage Prevention als bevorzugten Pilotfall prüfen.
8. Avoid für klar definierte Tag- oder Run-Fälle als Alternativpilot prüfen.
9. Mehrere anwendbare Effekte zunächst blockierend oder streng geordnet behandeln.
10. Jede neue Entscheidung als Hidden-Info-Barriere klassifizieren, wenn private Hand- oder Boardinformation betroffen ist.
11. Replay/StateHash für veränderte und unveränderte Events testen.
12. Undo vor und nach Event-Modification-Fenstern definieren.
13. Visibility-Regeln für PlayerViews, PublicEvents, Reconnect und WebSocket festlegen.
14. Karten ohne vollständigen Event-Modification-Vertrag bleiben `listed` oder `engine_supported`, aber nicht `human_playable`.
15. Mechanik-Coverage auf `implemented_limited` nur für die tatsächlich getesteten Pilotfälle setzen.

#### KI-Spieler

1. KI darf Prevention/Avoid/Interrupt nur wählen, wenn eine LegalAction existiert.
2. KI erzeugt keine eigenen Event-Modification-Vorschläge.
3. `AiDecisionDebug` enthält gewählte Modifikation, Confidence und Fallback-Grund.
4. KI behandelt nicht unterstützte Event-Modification-Karten als nicht `ai_supported`.
5. KI-Smoke prüft, dass neue Choice-Fenster nicht hängen bleiben.
6. KI-Fallback muss bei Zeitüberschreitung eine legale Pass- oder No-op-Entscheidung wählen.
7. KI-Input darf keine gegnerischen privaten Modifikationsoptionen enthalten.
8. Damage-/Tag-/Run-Risiko darf nur aus sichtbaren Informationen bewertet werden.
9. AI-Szenarien enthalten mindestens einen Fall mit verfügbarer und einen ohne verfügbare Modifikation.
10. Difficulty-Profile dürfen Event Modification nicht mit Hidden-Info-Vorteil nutzen.
11. Soak-Helfer müssen neue Fenstertypen abbrechen oder legal passieren können.
12. Regression prüft, dass alte KI-Decks ohne Event-Modification-Karten unverändert laufen.

#### Gate

- Kein Event wird still verändert.
- Jede Modifikation ist replaybar und StateHash-stabil.
- Hidden-Info-, KI- und Multiplayer-Gates bestehen.

### V1.2.1 Replacement Effects

Ziel:

V1.2.1 ergänzt Replacement Effects als eigenes Gate auf Basis von V1.2.0. Replacement darf nicht mit Prevention/Avoid vermischt werden.

#### Allgemeine Produkt- und Feature-Ziele

1. Replacement als klar getrennten Mechaniktyp etablieren.
2. Kleine Pilotfälle statt breite Kartenabdeckung umsetzen.
3. Konflikte sichtbar blockieren statt still raten.
4. UI-Choices nur aus Engine-Vertrag rendern.
5. Multiplayer und Reconnect für Replacement-Fenster absichern.
6. Undo-Regeln für ersetzte Events eindeutig festlegen.
7. EventLog und Replay für ursprüngliches und ersetztes Event verständlich halten.
8. Keine Special-Zone- oder Control-Arbeit in diesen Release ziehen.
9. Keine neuen Format-/Deckbuilding-Regeln aufnehmen.
10. Keine KI-Strategie für nicht AI-supported Replacement-Karten versprechen.
11. Testmatrix für Reihenfolge, Mehrfachanwendung und einmal-pro-Fenster erstellen.
12. Dokumentierte Lücken in V1.2.2 oder spätere Spezialgates verschieben.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Replacement-Pipeline nach `would` und vor finaler Eventauflösung modellieren.
2. Originalevent und Replacementevent kanonisch im EventLog abbilden.
3. Einmal-pro-Fenster-Regeln einführen.
4. Reihenfolge bei mehreren Replacement-Kandidaten deterministisch festlegen.
5. Mehrdeutige oder nicht spezifizierte Konflikte als Blocker behandeln.
6. Pilotfall für Access-Replacement prüfen.
7. Pilotfall für Trash- oder Steal-Replacement prüfen.
8. Pilotfall für Damage-Replacement nur aufnehmen, wenn V1.2.0-Damage-Pilot stabil ist.
9. Replacement-Targets und Kosten über LegalActions revalidieren.
10. Hidden-Info-Barrieren bei ersetzten Access-/Trash-/Steal-Events definieren.
11. Replay/StateHash für ersetzte und nicht ersetzte Events testen.
12. PublicEvents dürfen keine nicht aufgedeckten Replacement-Interna leaken.
13. MechanicSupport-Matrix mit `replacement.<type>`-Granularität vorbereiten.
14. Karten werden nur für exakt unterstützte Replacementtypen `human_playable`.
15. Cards mit ungetestetem Replacement bleiben zurückgestellt.

#### KI-Spieler

1. KI darf Replacement nur aus LegalActions wählen.
2. KI bewertet Replacement strategisch nur, wenn die konkrete Mechanik `ai_supported` ist.
3. AI-Hints müssen Replacement-Rolle und requiredMechanics nennen.
4. KI-Scorer erhalten keine echten versteckten Replacement-Auslöser der Gegenseite.
5. KI-Fallback passiert Replacement-Fenster legal, wenn keine Bewertung existiert.
6. `AiDecisionDebug` dokumentiert Originalaction, Replacementwahl und Abwägung.
7. KI-Szenarien prüfen mindestens einen angenommenen und einen abgelehnten Replacement-Fall.
8. Hidden-State-Invariance-Test für gleiche sichtbare Projektion ergänzen.
9. KI-Deckpool erweitert sich nicht automatisch.
10. Soak-Läufe prüfen keine illegalen Actions bei Replacement-Fenstern.
11. DecisionDebug darf keine nicht sichtbaren Kartenidentitäten nennen.
12. Difficulty-Profile unterscheiden nur Bewertungsqualität, nicht Informationszugang.

#### Gate

- Replacement bricht Replay und StateHash nicht.
- Konflikte sind dokumentiert oder blockiert.
- Keine KI- oder PublicEvent-Leaks.

### V1.2.2 Special Zones, Ownership und Control

Ziel:

V1.2.2 ergänzt Sonderzonen und Kartenkontrolle als Basis für spätere Kartenfamilien.

#### Allgemeine Produkt- und Feature-Ziele

1. Spezialzonen als Engine-Bestandteil, nicht als Kartensonderfall modellieren.
2. Owner und Controller sauber trennen.
3. UI- und PlayerView-Projektionen für neue Zonen definieren.
4. Reconnect und Undo für Special-Zone-Moves härtbar machen.
5. Bestehende Host-/Trash-/Move-Invarianten erneut prüfen.
6. Keine Format-/Public-Plattformarbeit aufnehmen.
7. Keine breite Kartenfreigabe in denselben Release ziehen.
8. Migrations- oder Snapshot-Auswirkungen dokumentieren.
9. Replay/StateHash für neue ZoneRefs stabilisieren.
10. Special-Zone-Testkarten nur als Harness nutzen.
11. Deckvalidierung darf keine Special-Zone-Karten automatisch freigeben.
12. V1.2.3-Kartenkandidaten auf Basis dieses Gates vorbereiten.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `set_aside` als Zone oder ZoneState definieren.
2. `removed_from_game` als Zone oder ZoneState definieren.
3. Owner-/Controller-Felder in CardInstance-Verträgen prüfen.
4. Control-Wechsel als deterministischen Move oder StateChange modellieren.
5. Ownership bleibt unveränderlich, außer offiziell spezifizierte Sonderfälle verlangen anderes.
6. Host-Trash-Kaskaden mit Controller-Wechsel prüfen.
7. Public/private Sichtbarkeit je Spezialzone festlegen.
8. ZoneRef-Invarianten erweitern.
9. Move-/Trash-/Remove-Events klassifizieren.
10. Reconnect-Payloads für sichtbare und unsichtbare Spezialzonen testen.
11. Undo-Barrieren bei neuen Informationen aus Spezialzonen definieren.
12. Replay/StateHash-Szenario mit Set Aside und Remove from Game erstellen.
13. Karten mit Ownership-/Control-Bedarf erst nach grünen Harnesses freigeben.
14. Mechanik-Coverage fein genug für `special_zones`, `remove_from_game`, `control_change` führen.
15. Spezialfälle ohne Kartenbedarf dokumentiert zurückstellen.

#### KI-Spieler

1. KI erhält keine zusätzlichen Hidden-Zone-Daten.
2. AI-Hints müssen requiredMechanics für Special-Zone-Karten nennen.
3. KI bewertet Control-Wechsel nur für AI-supported Karten.
4. KI-Fallback kann Special-Zone-LegalActions legal ignorieren oder passieren.
5. KI-Input-Projektionen für sichtbare Spezialzonen testen.
6. DecisionDebug nennt nur sichtbare Spezialzoneninformationen.
7. Belief-Vorbereitung markiert Zoneinformationen mit Sichtbarkeitsklasse.
8. Soak-Läufe prüfen keine Hänger bei Set-Aside-/RFG-Zuständen.
9. KI-Deckpools bleiben ohne Special-Zone-AI-Hints unverändert.
10. Runner- und Corp-KI bekommen getrennte Szenarien für eigene und fremde Zoneinformationen.
11. KI-Simulation bleibt bis V1.4.x ohne echten Hidden-State-Zugriff.
12. AI-supported Status wird nur pro Karte und Mechanik erteilt.

#### Gate

- ZoneRef-, Owner- und Controller-Invarianten bleiben grün.
- PlayerViews und Reconnect leaken keine neuen Informationen.
- Kartenfreigaben bleiben getrennt.

### V1.2.3 Mechanic Unlock Card Release 1

Ziel:

V1.2.3 ist der erste Karten-Unlock nach V1.2.0 bis V1.2.2. Es macht nur Karten spielbar, deren Mechaniken wirklich abgedeckt sind.

#### Allgemeine Produkt- und Feature-Ziele

1. Reviewbaren Kartenbatch statt breitem Kartenpool liefern.
2. Kartenwert, Mechanikabdeckung und KI-Nutzen gemeinsam bewerten.
3. Human-playable und AI-supported bewusst trennen.
4. Decklegalität serverseitig revalidieren.
5. Katalog, Deckeditor und Matchstart konsistent aktualisieren.
6. Keine neuen Mechanikfamilien einführen.
7. Keine offiziellen Assets oder externen Laufzeitdaten einführen.
8. Rückstellungen klar benennen.
9. Runtime-Gate analog V1.0.5K/V1.0.6K/V1.1.2K nutzen.
10. Szenario-Smoke für den gesamten Kartenbatch erstellen.
11. Multiplayer- und E2E-Smoke mit neuen Decks prüfen.
12. Final Review mit Liste aller freigegebenen, zurückgestellten und AI-supported Karten erstellen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Kandidatenliste aus V1.1.3-Clustern übernehmen.
2. Jede Karte mit `requiredMechanics` versehen.
3. Jede Karte einem bestehenden oder neuen Resolver-/Ability-Verweis zuordnen.
4. Pro Karte Manifeststatus setzen.
5. Pro Karte Unit- oder Integrationstest ergänzen.
6. Mindestens ein Batch-Szenario mit finalem StateHash ergänzen.
7. Visibility-Test für neue Kartenbewegungen oder Hidden-Info-Effekte ergänzen.
8. Replay/StateHash-Test für neue Effekte ergänzen.
9. Deckvalidierung für neue Karten prüfen.
10. Nicht vollständig abgedeckte Karten zurückstellen.
11. Karten mit nur menschlicher Spielbarkeit als `human_playable` ohne `ai_supported` markieren.
12. Karten mit AI-Hints und Szenarien als `ai_supported` markieren.
13. Alte Runtime-Karten weiter unverändert lassen.
14. Keine Karte durch Katalogstatus automatisch freigeben.
15. Mechanik-Coverage nur erweitern, wenn neue Mechanik wirklich implementiert wurde.

#### KI-Spieler

1. AI-Hints für jede AI-supported Karte erstellen.
2. Rollen wie Economy, ICE, Breaker, Damage, Prevention oder Bait explizit setzen.
3. KI-Deckpool nur um AI-supported Karten erweitern.
4. KI-vs-KI-Smoke mit AI-supported Teildeck ausführen.
5. Human-vs-KI-Smoke für Runner- und Corp-Seite prüfen.
6. DecisionDebug für neue Kartenrollen prüfen.
7. KI darf human-playable-only Karten im Deckbau ignorieren.
8. Fallback-Verhalten für unbekannte Kartenrollen testen.
9. Soak-Läufe auf illegale Actions und Hänger prüfen.
10. Karten mit erforderlicher strategischer Bewertung, aber ohne AI-Hints, zurückstellen.
11. Kein FullState-Zugriff zur Bewertung neuer Karten.
12. AI-supported Status im Review pro Karte begründen.

#### Gate

- Mehr Karten sind menschlich spielbar.
- KI nutzt nur freigegebene AI-supported Karten.
- Manifest, Tests und Runtime-Gate sind konsistent.

### V1.3.0 Format und Deckbuilding Foundation

Ziel:

V1.3.0 macht größere Kartenmengen praktisch nutzbar, ohne ungedeckte oder illegale Decks in Matches zu lassen.

#### Allgemeine Produkt- und Feature-Ziele

1. Lokale Formatprofile versionieren.
2. Deckvalidierung näher an echte NETGRID-Deckregeln bringen.
3. Matchstart-Revalidierung stärken.
4. Deckeditor-Feedback für Formatfehler verbessern.
5. Deck-Snapshots und persönliche Deckbibliothek sauber trennen.
6. Keine öffentliche Formatlegalität ohne Review versprechen.
7. Keine Public Ranked- oder Turnierfunktionen aufnehmen.
8. Katalogstatus, Spielbarkeit und Formatlegalität getrennt halten.
9. Migration alter lokaler Decks prüfen.
10. Import/Export mit Formatprofil-Metadaten ergänzen.
11. Gegnerische Decklisten und Deckhashes weiterhin side-sicher halten.
12. KI-Deckbau nur auf AI-supported Pool zulassen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Faction-Werte in Deckvalidierung berücksichtigen.
2. Influence-Kosten und Influence-Limit modellieren.
3. Mindestdeckgröße je Identity prüfen.
4. Agenda-Dichte oder Agenda-Punktanforderungen prüfen.
5. Kopienlimit pro Name einführen.
6. Explizite Kopienlimit-Ausnahmen unterstützen.
7. Identity-Deckregeln als lokale Formatprofil-Daten führen.
8. Formatprofil-Version in Decksnapshot schreiben.
9. Server validiert Decks beim Matchstart erneut.
10. `deck_legal` setzt weiterhin Mechanik- und Kartenfreigabe voraus.
11. Karten ohne human_playable Status bleiben in validierten Matchdecks gesperrt.
12. Regelabweichungen pro Formatprofil dokumentieren.
13. Tests für legale und illegale Beispieldecks ergänzen.
14. Deckimport darf unbekannte Karten nicht spielbar machen.
15. Mechanik-Coverage wird nicht durch Formatregeln erweitert.

#### KI-Spieler

1. KI-Deckbau nutzt nur AI-supported Karten.
2. Deckrollenprofil aus AI-Hints und Decksnapshot berechnen.
3. Corp-KI erkennt Agenda-/ICE-/Economy-Verteilung.
4. Runner-KI erkennt Breaker-/Economy-/Run-Event-Verteilung.
5. AI-Hints-Validierung prüft Format- und Side-Kompatibilität.
6. KI lehnt Decks mit nicht AI-supported Karten ab oder nutzt Ersatzdeck.
7. Difficulty-Profile erhalten keine verdeckten Decklisten der Gegenseite.
8. KI-Szenarien mit legalen und illegalen Decks ergänzen.
9. KI-Deckpool pro Formatprofil versionieren.
10. DecisionDebug nennt nur eigenes Deckrollenprofil und öffentliche Gegnerdaten.
11. Soaks mit mindestens zwei validierten Deckprofilen vorbereiten.
12. AI-Level-Audit nach Formatvalidierung aktualisieren.

#### Gate

- Decks sind formatversioniert.
- Formatprofil aktiviert keine ungedeckten Karten.
- KI-Deckbau bleibt AI-supported-only.

### V1.3.1 Card Data Pipeline v2

Ziel:

V1.3.1 macht Kartenpflege skalierbarer, ohne Kartentextparser oder automatische Spielbarkeit einzuführen.

#### Allgemeine Produkt- und Feature-Ziele

1. Source Registry für Kartendaten pflegen.
2. Provenienz und Review-Status jeder Quelle dokumentieren.
3. Import-Diff und Rollback ermöglichen.
4. Katalog-, Manifest- und Runtime-Status konsistent halten.
5. Kartentext- und Errata-Versionen als Anzeige- und Prüfmaterial verwalten.
6. Keine Laufzeitabhängigkeit auf externe Kartendatenbank einführen.
7. Keine automatisierte Regelumsetzung aus Kartentext erlauben.
8. Lokale private Assetpfade weiter getrennt halten.
9. Lizenz-/Nutzungsentscheidungen sichtbar machen.
10. Datenpipeline test- und reviewbar halten.
11. Statusreports für blockierte Karten erzeugen.
12. V1.4.x-KI-Hints und Kartenrollen aus derselben Datenbasis speisen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Importstatus von Engine- und Decklegalitätsstatus trennen.
2. `requiredMechanics` reviewpflichtig machen.
3. Resolver-/Ability-Verweise reviewpflichtig machen.
4. AI-Hints als eigene validierte Datenstruktur führen.
5. Card-Diff zeigt Text-, Status-, Hints- und Mechanikänderungen.
6. Rollback für fehlerhafte Datenstände vorbereiten.
7. Katalog kann `listed`, `engine_supported`, `human_playable`, `ai_supported` anzeigen.
8. Karten ohne Resolver bleiben nicht spielbar.
9. Karten ohne Mechanik-Coverage bleiben nicht decklegal.
10. Karten ohne AI-Hints bleiben aus KI-Decks draußen.
11. Snapshot-Dateien deterministisch erzeugen.
12. Tests für Importvalidierung und Statusübergänge ergänzen.
13. Datenfehler dürfen Matchstart nicht durchlaufen.
14. Errata-Änderungen erzeugen keine stille Regeländerung.
15. Mechanik-Coverage bleibt die Autorität für Spielbarkeit.

#### KI-Spieler

1. AI-Hints-Schema technisch validieren.
2. Rollen, Werte und requiredMechanics pro Karte prüfen.
3. Side- und Typ-Kompatibilität von Hints prüfen.
4. KI-Deckpool-Export aus AI-supported Karten vorbereiten.
5. Fehlende Hints als KI-Blocker reporten.
6. Kartenrollen für Corp- und Runner-Scorer normalisieren.
7. ArchetypeTags als spätere planbasierte Grundlage vorbereiten.
8. DecisionDebug kann Kartenrollen referenzieren, ohne private Daten zu leaken.
9. KI-Benchmarks nutzen versionierte Karten-/Hints-Snapshots.
10. KI-Soaks protokollieren verwendete Card-Pipeline-Version.
11. Hint-Änderungen brauchen Regression gegen KI-Szenarien.
12. Keine LLM-Auslegung von Kartentext als KI-Regelquelle.

#### Gate

- Kartendatenpflege ist reproduzierbar.
- Import erzeugt keine automatische Spielbarkeit.
- AI-Hints werden Pflichtdaten für KI-Freigabe.

### V1.4.0 Planbasierte Corp-KI

Ziel:

V1.4.0 hebt die Corp-KI von Action-Scoring auf Planbewertung für den unterstützten Kartenpool.

#### Allgemeine Produkt- und Feature-Ziele

1. Corp-Pläne als eigene Entscheidungseinheit modellieren.
2. Bestehende Difficulty-Profile auf Planqualität abbilden.
3. DecisionDebug für Planwahl ausbauen.
4. KI-Pacing im Web weiter side-sicher halten.
5. Server-Zeitbudget und Fallback für Planbewertung festziehen.
6. Human-vs-Corp-KI-Partien stabil halten.
7. KI-vs-KI-Harness als Regression nutzen.
8. Keine neue Regelautorität in KI einführen.
9. Keine planbasierte Runner-KI in denselben Release ziehen.
10. Keine AI-supported-Karten ohne Szenarien aufnehmen.
11. Benchmark-Baselines festlegen.
12. Playtest- und Soak-Reports dokumentieren.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Keine neue Mechanik als Hauptscope.
2. Nur Mechaniken aus V1.1.x bis V1.3.x bewerten.
3. Kartenrollen aus AI-Hints verwenden.
4. Agenda-, ICE-, Asset-, Upgrade-, Operation- und Economy-Rollen normalisieren.
5. Scoring-Remote-Status aus erlaubten Daten ableiten.
6. HQ-/R&D-/Archives-Risiko aus sichtbarer Historie bewerten.
7. Rez-Kosten und ICE-Wirkung maschinenlesbar nutzen.
8. Advance-Anforderungen von Agendas nutzen.
9. Trash-Kosten sichtbarer Assets/Upgrades nutzen.
10. Keine verdeckten Runner-Hand- oder Stackdaten einbeziehen.
11. Karten ohne AI-supported Status ignorieren oder fallbacken.
12. Szenarien für Score Now, Score Next Turn und Remote Build erstellen.
13. Szenarien für HQ/R&D-Schutz erstellen.
14. Szenarien für Economy Recovery erstellen.
15. Karten- oder Mechaniklücken als Blocker statt als Heuristiktrick behandeln.

#### KI-Spieler

1. Corp-Planmodell `score_now` implementieren.
2. Corp-Planmodell `score_next_turn` implementieren.
3. Corp-Planmodell `build_scoring_remote` implementieren.
4. Corp-Planmodell `protect_hq` implementieren.
5. Corp-Planmodell `protect_rnd` implementieren.
6. Corp-Planmodell `recover_economy` implementieren.
7. Corp-Planmodell `bait_runner` implementieren.
8. AgendaRiskEvaluator ergänzen.
9. ServerThreatEvaluator ergänzen.
10. EconomyReserveEvaluator ergänzen.
11. IceRezEvaluator ergänzen.
12. ScoringWindowEvaluator ergänzen.
13. RemoteIntentMemory aus erlaubten Informationen ergänzen.
14. PlanGenerator und PlanEvaluator trennen.
15. Corp-KI gegen alte Baseline messen.
16. KI erklärt gewählten Plan mit sichtbaren Gründen.
17. KI-Fallback wählt LegalAction ohne Planergebnis.
18. Soak prüft keine illegalen Actions, Timeouts oder Hänger.

#### Gate

- Corp-KI verbessert definierte Szenariometriken.
- Keine zusätzliche Hidden Info.
- DecisionDebug ist nachvollziehbar und side-sicher.

### V1.4.1 Planbasierte Runner-KI

Ziel:

V1.4.1 hebt die Runner-KI auf planbasierte Run-, Rig- und Remote-Contest-Entscheidungen.

#### Allgemeine Produkt- und Feature-Ziele

1. Runner-Pläne als eigene Entscheidungseinheit modellieren.
2. Human-vs-Runner-KI-Partien stabilisieren.
3. Corp-Rezfenster und Runner-KI-Pacing robust halten.
4. DecisionDebug für Runner-Pläne ausbauen.
5. Server-Zeitbudget und Fallback anwenden.
6. Keine FullState-Simulation einführen.
7. Keine planbasierte Corp-Regression verursachen.
8. KI-vs-KI-Harness mit planbasierter Runner-Seite nutzen.
9. Benchmark-Baselines für Runner-Szenarien festlegen.
10. UI-Erklärungen nur aus sichtbaren Daten generieren.
11. Keine neuen Karten ohne AI-supported Gate aufnehmen.
12. Playtest-Reports für schlechte Run-Entscheidungen aufnehmen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Stabiles Run-System als Voraussetzung nutzen.
2. ICE-/Breaker-Interaktionen maschinenlesbar bewerten.
3. Jack-out-Fenster in Planbewertung einbeziehen.
4. Breach-/Access-Wert aus erlaubten Daten berechnen.
5. Trash-Kosten sichtbarer Karten nutzen.
6. Remote-Bedrohung aus Board- und Eventdaten ableiten.
7. Corp-Scoring-Gefahr aus sichtbarer Agenda-/Advance-Lage ableiten.
8. Rig-Aufbau und MU berücksichtigen.
9. Creditreserve und Run-Kosten bewerten.
10. Multiaccess-Wert nur für unterstützte Mechaniken bewerten.
11. Keine verdeckten HQ-/R&D-/Remote-Titel einbeziehen.
12. Cards ohne Runner-AI-Hints ignorieren oder fallbacken.
13. Szenarien für R&D-Druck, HQ-Druck und Remote-Contest erstellen.
14. Szenarien für Rig-Aufbau und Economy Recovery erstellen.
15. Szenarien für Asset-Trash und Safe Probe Run erstellen.

#### KI-Spieler

1. Runner-Planmodell `pressure_rnd` implementieren.
2. Runner-Planmodell `pressure_hq` implementieren.
3. Runner-Planmodell `contest_remote` implementieren.
4. Runner-Planmodell `build_rig` implementieren.
5. Runner-Planmodell `recover_economy` implementieren.
6. Runner-Planmodell `draw_for_answers` implementieren.
7. Runner-Planmodell `trash_asset` implementieren.
8. Runner-Planmodell `safe_probe_run` implementieren.
9. RunnerRigEvaluator ergänzen.
10. RunCostEstimator ergänzen.
11. ServerAccessValueEvaluator ergänzen.
12. RemoteThreatEvaluator ergänzen.
13. CorpScoringThreatEvaluator ergänzen.
14. PlanGenerator und PlanEvaluator für Runner trennen.
15. Runner-KI gegen Random/Basic Corp messen.
16. Runner-KI gegen planbasierte Corp-KI smoke-testen.
17. Keine sinnlosen Runs in definierten Szenarien.
18. DecisionDebug erklärt Run-, Setup- und Contest-Entscheidungen.

#### Gate

- Runner-Szenario-Gates bestehen.
- Runner-KI trifft bessere Run-/Setup-Entscheidungen.
- Keine Hidden-Info-Vorteile.

### V1.4.2 Belief State und Gegner-Modell

Ziel:

V1.4.2 ergänzt fairen Belief State aus PlayerView, side-gefilterten Events und Replay-Historie.

#### Allgemeine Produkt- und Feature-Ziele

1. Belief State als rekonstruierbares KI-Memory modellieren.
2. Öffentliche, eigene private und hypothetische Informationen trennen.
3. Undo und Reconnect für Memory korrekt behandeln.
4. DecisionDebug für Annahmen und Unsicherheit erweitern.
5. Kein echter Hidden State in Memory oder Simulation.
6. Gleich sichtbare Zustände gleich oder deterministisch unsicher behandeln.
7. Memory-Versionierung für Replays vorbereiten.
8. KI-Schwierigkeit durch bessere Annahmen, nicht mehr Wissen.
9. Debug-Ansichten side-sicher halten.
10. Soak-Läufe mit Memory-Rekonstruktion prüfen.
11. Keine LLM-Deutung von Gegnerabsichten als Regelquelle.
12. Belief State als Voraussetzung für spätere Simulation markieren.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Keine neue Spielmechanik als Hauptscope.
2. Sichtbarkeitsklassen aus PublicEvents und PlayerViews nutzen.
3. Ereignisse für Rez, Install, Advance, Access, Score, Steal und Trash klassifizieren.
4. Remote-Kandidaten nur als Hypothesen führen.
5. HQ-/R&D-/Stack-/Grip-Informationen nur über erlaubte Projektionen schätzen.
6. Archives-Information nach V1.1.2 korrekt behandeln.
7. Reveal/Expose-Informationen als bekannte Fakten markieren.
8. Search/Arrange/Shuffle-Effekte aus sichtbarer Projektion rekonstruieren.
9. Hidden-Info-Barrieren für Memory-Rekonstruktion beachten.
10. Replay-Historie als Quelle für Belief State verwenden.
11. Zone-Moves mit unbekannter Identität abstrakt modellieren.
12. Mechanik-Support-Matrix markiert Belief-Relevanz.
13. Karten mit bluff- oder trap-relevanten Hints können Hypothesen beeinflussen.
14. Keine neue Karte wird durch Belief-Fähigkeit spielbar.
15. Tests mit gleicher sichtbarer Projektion und unterschiedlichem Hidden State ergänzen.

#### KI-Spieler

1. Memory-System pro KI-Seite implementieren.
2. RunnerThreatModel für Corp ergänzen.
3. RunnerAggressionMemory ergänzen.
4. BreakerAvailabilityEstimate ergänzen.
5. RemoteContestProbability ergänzen.
6. HQPressureEstimate ergänzen.
7. RNDPressureEstimate ergänzen.
8. CorpPlanEstimate für Runner ergänzen.
9. RemoteCardBelief ergänzen.
10. UnrezzedIceRiskModel ergänzen.
11. HQAgendaDensityEstimate ergänzen.
12. RNDValueEstimate ergänzen.
13. CorpCreditReserveInterpretation ergänzen.
14. Memory nach Undo/Reconnect rekonstruieren.
15. DecisionDebug zeigt Annahmen ohne private Wahrheit.
16. Hidden-State-Invariance-Test bestehen.
17. Difficulty-Profile ändern Gewichtung, nicht Informationszugang.
18. Soaks prüfen Memory-Stabilität über lange Partien.

#### Gate

- Belief State ist aus side-sicherer Historie rekonstruierbar.
- Gleiche sichtbare Projektionen erzeugen gleiche oder erlaubte deterministische Unsicherheit.
- Kein Hidden-State-Cheating.

### V1.4.3 Simulation, Selfplay und Exploit-Regression

Ziel:

V1.4.3 macht KI-Stärke messbar und verbessert sie über faire Simulation, Selfplay und Exploit-Regression.

#### Allgemeine Produkt- und Feature-Ziele

1. KI-vs-KI-League als lokales Testinstrument einführen.
2. Benchmark-Gegner versionieren.
3. Holdout-Seeds für Regression definieren.
4. Exploit-Szenarien dauerhaft in Tests überführen.
5. Soak-Reports erzeugen.
6. Performancebudget für Simulation und Planbewertung festlegen.
7. Keine Live-Simulation mit echtem Hidden State erlauben.
8. Kein Public Replay oder Spectator aufnehmen.
9. Lokale Analyseartefakte von Produktpayloads trennen.
10. Entscheidung treffen, welche Metriken Release-Gate sind.
11. Tuning-Änderungen nachvollziehbar dokumentieren.
12. KI-Stärke nicht als allgemeingültig außerhalb definierter Baseline behaupten.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Keine neue Mechanik als Hauptscope.
2. Simulation nutzt nur implementierte Mechaniken.
3. Hypothetische Welten entstehen aus Belief State, nicht aus echtem Hidden State.
4. GameState-Kopien dürfen echten Matchstate nie verändern.
5. Simulierte LegalActions werden neu berechnet.
6. RNG in Simulation ist deterministisch und getrennt protokolliert.
7. ChoiceRequests in Simulation haben Zeitbudget und Fallback.
8. StateHash echter Partien bleibt unabhängig von Simulation.
9. Karten mit nicht simulierten Mechaniken werden in Simulationsdeckpools ausgeschlossen.
10. MechanicSupport-Matrix erhält Simulation-Support-Spalte.
11. Regressionen für Access, Damage, Trace, Replacement und Special Zones nachziehen.
12. Multiaccess-/Archives-Simulation bleibt side-sicher.
13. Replay-Auswertung kann Metriken berechnen.
14. Exploit-Szenarien erhalten eigene Fixture-IDs.
15. Keine Karte wird nur durch Simulation spielbar.

#### KI-Spieler

1. RandomLegalBot als Benchmark führen.
2. BasicCorpAI und BasicRunnerAI als Baselines halten.
3. Planbasierte Corp- und Runner-KI als Kandidaten führen.
4. PreviousReleaseAI gegen CurrentCandidateAI vergleichen.
5. Winrate, Agenda-Punkte, Spielzüge, Timeouts und illegale Actions messen.
6. Remote-Verlustmuster, unnötige Rez-Kosten und verschenkte Scoring Windows messen.
7. Runner-Fehlruns und verpasste Remote-Contests messen.
8. KI-vs-KI-Soak mit mindestens 1.000 Partien oder äquivalenten Testläufen definieren.
9. Stärkeres Gate mit 5.000 Partien für spätere Strong-AI-Freigabe vormerken.
10. Exploits als Regression festschreiben.
11. Tuning nur mit Holdout-Vergleich akzeptieren.
12. DecisionDebug für kritische Entscheidungen speichern.
13. Keine illegale KI-Aktion akzeptieren.
14. Keine Endlossuche oder Action-Explosion.
15. Fallback bei Zeitbudgetüberschreitung testen.
16. Metrikverbesserung oder bewusster Tradeoff dokumentieren.

#### Gate

- 0 illegale KI-Aktionen in definiertem Soak.
- 0 Hidden-Info-Leaks.
- Tuning verbessert definierte Metriken oder dokumentiert Tradeoffs.

### V1.5.x Private Replay, Analyse und Lernhilfe

Ziel:

V1.5.x schafft private Analyse- und Lernfunktionen auf Basis stabiler Mechanik-, Karten- und KI-Gates.

#### Allgemeine Produkt- und Feature-Ziele

1. Private Replay Browser bereitstellen.
2. Replay-Timeline mit StateHash-Verifikation anzeigen.
3. Side-sichere Perspektiven im Replay unterstützen.
4. Export lokaler Replays erlauben.
5. Analyse- und Lernhinweise klar von Regelautorität trennen.
6. Kein Public Replay aufnehmen.
7. Kein Spectator- oder öffentlicher Plattformmodus aufnehmen.
8. UI für DecisionDebug nur side-sicher oder lokal privat gestalten.
9. Replay-Versionierung für alte RulesBaselines berücksichtigen.
10. Local-only Analyseartefakte von Matchstate trennen.
11. Datenschutz und lokale Pfade dokumentieren.
12. Replay-Regression in Quality Gate aufnehmen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Replay zeigt nur erlaubte Kartentitel pro Perspektive.
2. Hidden-Info-Barrieren bleiben im Replay sichtbar.
3. StateHash wird pro Schritt prüfbar.
4. RandomDrawRecords werden nachvollziehbar, aber nicht leakend dargestellt.
5. Access-, Damage-, Trace-, Replacement- und Special-Zone-Events renderbar machen.
6. Öffentliche und private Payloads sauber trennen.
7. Alte RulesBaseline-Replays validierbar machen oder als inkompatibel markieren.
8. Replay darf keine neue Karte oder Mechanik freigeben.
9. Replay-Export enthält keine Tokens oder privaten Sessions.
10. Eventklassifikation im Replay prüfen.
11. Mechanik-Coverage nutzt Replay-Fehler als Gate-Signal.
12. Analyse kann Kartenstatus und Mechaniklücken anzeigen.

#### KI-Spieler

1. DecisionDebug im Replay kontextualisieren.
2. KI-Planwahl und Action-Scores anzeigen.
3. KI-Fallbacks und Timeouts sichtbar machen.
4. AI-Hints und Kartenrollen nur für sichtbare/eigene Karten anzeigen.
5. Post-Game-Analyse aus erlaubten Projektionen vorbereiten.
6. LLM/API-Analyse höchstens als optionaler Post-Game-Analyzer.
7. Kein LLM als Live-Spielzug-Controller.
8. Lernhinweise dürfen nur LegalActions erklären, keine illegalen Vorschläge erzeugen.
9. KI-Exploits aus Replays als Testfallkandidaten exportieren.
10. Soak-Reports mit Replay-Beispielen verlinken.
11. Hidden-Info-Leaktests für DecisionDebug-Ansichten ergänzen.
12. Coaching-Ausgaben klar als Empfehlung, nicht als Regelentscheidung markieren.

#### Gate

- Private Replays sind nutzbar und StateHash-verifizierbar.
- Keine öffentliche Hidden-Info-Projektion.
- Analyse bleibt Beratung, nicht Regelautorität.

### V1.6.x Tutorial und Regelhilfe

Ziel:

V1.6.x macht NETGRID lernbarer, ohne KI oder LLM zur Regelautorität zu machen.

#### Allgemeine Produkt- und Feature-Ziele

1. Geführte Kernablauf-Szenarien erstellen.
2. Tutorialmodus für erste Runner- und Korp-Partien bereitstellen.
3. Regelhilfe aus projektinternen freigegebenen Begriffen und Quellen ableiten.
4. Kontext-Hilfe im UI anbieten.
5. Keine automatischen Spielzüge außerhalb LegalActions erzeugen.
6. Keine breite offizielle Regelvollständigkeit behaupten.
7. Tutorial-Szenarien replaybar machen.
8. Lernmodus von normalen Matches trennen.
9. Accessibility-Grundlagen für Hilfetexte beachten.
10. UI-Texte deutsch und fachlich konsistent halten.
11. Keine öffentlichen Plattformfeatures aufnehmen.
12. Tutorial-Inhalte versionieren.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Tutorial-Szenarien nur mit freigegebenen Mechaniken verwenden.
2. Run, Encounter, Break, Access, Score, Steal und Flatline erklären.
3. Discard, Handlimit und Core Damage als spätere Lektionen aufnehmen.
4. Full Archives Access erklären.
5. Trace, Tags, Resources und Counter nur bei unterstützten Karten erklären.
6. Prevention/Replacement nur nach V1.2.x-Freigabe erklären.
7. Keine Tutorialkarte ohne Manifest- und Mechanik-Coverage nutzen.
8. Tutorial-Replays mit finalem StateHash prüfen.
9. Hidden-Info-Beispiele side-sicher gestalten.
10. Kartenbilder nur als private Anzeige-Artefakte und ohne Regelwirkung verwenden.
11. Glossar mit UI-Begriffen synchronisieren.
12. Regelabweichungen sichtbar als NETGRID-Scope markieren.

#### KI-Spieler

1. Basis-KI als sparringfähiger Tutorialgegner einsetzen.
2. KI-Erklärungen nur aus sichtbaren Gründen nutzen.
3. Schwierigkeit als Lernprofil, nicht als Informationsvorteil, gestalten.
4. Coach-Hinweise nur aus PlayerView, LegalActions und PublicEvents ableiten.
5. Keine verdeckten gegnerischen Karten in Lernhinweisen.
6. KI kann absichtlich einfache Linien spielen, wenn Difficulty das erlaubt.
7. Tutorial-Runner-KI und Tutorial-Corp-KI getrennt testen.
8. DecisionDebug in Lernsprache übersetzen, ohne Regelautorität zu werden.
9. Exploit- oder Fehlerhinweise aus Tutorialpartien als QA-Signal speichern.
10. Optionaler API-/LLM-Coach bleibt post-game oder side-safe und nie Action-Erzeuger.
11. KI-Hinweise müssen LegalActions referenzieren.
12. Tests prüfen, dass Lernhilfe keine Hidden Info leakt.

#### Gate

- Neue Spieler können Kernabläufe lernen.
- Tutorial ist replaybar.
- Keine Hilfe wird zur Regelautorität.

## V1.6.1 bis V1.9.x Mechanik-Komplettierung O:NR-v1

Ziel:

Nach V1.6.0 folgt verpflichtend zuerst eine Mechanik- und Kartenfreigabe-Sequenz für das alte O:NR-v1-Set. V2.x-Scopes wie Accounts, Cloud-Decks, Datenschutz- und Social-Gates bleiben nachgelagert.

Geplanter Erst-Release für noch nicht spielbare Karten (Stand 2026-05-09):

- V1.6.1: 111 Karten
- V1.6.2: 50 Karten
- V1.6.3: 23 Karten
- V1.7.0: 36 Karten
- V1.7.1: 48 Karten
- V1.7.2: 28 Karten
- V1.8.0: 13 Karten
- V1.8.1: 15 Karten
- V1.9.0: 5 Karten

### V1.6.1 Mechanikpaket A: Damage, Prevention und Resolver-Gate

#### Allgemeine Produkt- und Feature-Ziele

1. Fehlende Kernmechaniken mit höchstem Kartenhebel zuerst schließen.
2. Release als schmales Mechanik-/Karten-Gate führen.
3. Keine Account-, Cloud-, Chat- oder Plattformfeatures in diesen Scope ziehen.
4. Per-Card-Textvalidierung vor Freigabe weiter verpflichtend halten.
5. Kartenfreigaben nur über Manifest-, Test- und Review-Gate.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L1B_PerCard_Resolver_Test_Gate`.
2. `L2_Damage_Familien_und_Flatline_Integration`.
3. `L3_Core_Brain_Damage_Erweiterungen`.
4. `L3_Prevention_Avoid_Replacement`.
5. Zielhebel: Erstfreigabe für 111 aktuell nicht spielbare Karten.

#### KI-Spieler

1. AI-Hints nur für tatsächlich neu freigegebene Karten ergänzen.
2. Keine pauschale `ai_supported`-Ausweitung.
3. KI bleibt strikt auf PlayerView, LegalActions und side-sichere PublicEvents begrenzt.

#### Gate

- Alle Effektfamilien sind implementiert, pro Karte getestet und im Manifest verankert.
- Keine Hidden-Info-Leaks in Damage-, Avoid- oder Replacement-Pfaden.

### V1.6.2 Mechanikpaket B: Assets, Nodes und persistente Modifier

#### Allgemeine Produkt- und Feature-Ziele

1. Häufige Corp-Board-Effekte in generische Bausteine überführen.
2. Sonderfälle in wiederverwendbare Effektbausteine normalisieren.
3. Kartenfreigaben weiter releasegebunden und testgetrieben halten.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_Globale_Statische_Modifier_ICE_Cost_Strength`.
2. `L3_Generische_Asset_Node_Faehigkeiten`.
3. `L3_Persistente_Modifier_und_Sonderzustaende`.
4. Zielhebel: Erstfreigabe für weitere 50 aktuell nicht spielbare Karten.

#### KI-Spieler

1. KI-Rollen/Hints für neue Asset-/Node-Muster ergänzen.
2. Keine Nutzung verdeckter Kartentitel als Heuristikabkürzung.
3. Neue KI-Soaks nur mit AI-supported Karten fahren.

#### Gate

- Persistente Zustände bleiben replay- und statehash-deterministisch.
- Neue Asset-/Node-Resolver bestehen Visibility- und Reconnect-Tests.

### V1.6.3 Mechanikpaket C: Upgrades, Uninstall und ChoiceFlow

#### Allgemeine Produkt- und Feature-Ziele

1. Upgrade-/Installations-Sonderfälle auf gemeinsamen Resolververtrag bringen.
2. Gegnerentscheidungen und Guessing-Fälle deterministisch und side-sicher modellieren.
3. Karten mit seltenen, aber blockierenden Lebenszyklusfällen freischalten.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_ChoiceFlow_Gegnerentscheidung_und_Guessing`.
2. `L3_Generische_Upgrade_Faehigkeiten`.
3. `L3_Uninstall_und_InstalledCard_Destroy`.
4. Zielhebel: Erstfreigabe für weitere 23 aktuell nicht spielbare Karten.

#### KI-Spieler

1. KI-Choice-Handhabung nur über LegalActions-Choices.
2. Keine versteckten Guessing-Informationen in DecisionDebug.
3. Reaktive KI-Fälle mit neuen Upgrade- und Uninstall-Resolvern regressionssichern.

#### Gate

- ChoiceFlow- und Upgrade-Fälle sind deterministisch replaybar.
- Install-/Uninstall-Lifecycles brechen keine Ownership-/Control-Invarianten.

### V1.7.0 Mechanikpaket D: Subtypen, Hosting, Recurring und Unique

#### Allgemeine Produkt- und Feature-Ziele

1. Programmsubtypen und Hosting-Familien als nächstes großes Kartencluster freigeben.
2. Recurring- und Start-of-Turn-Resolver vereinheitlichen.
3. Deck-Unique-Regeln klar und testbar in die Runtime integrieren.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_Deck_Unique_Constraint`.
2. `L2_Hosting_und_Hosted_Resource_Modelle`.
3. `L2_Recurring_Pools_und_StartOfTurn_Resolver`.
4. `L3_Programm_Subtypen_Daemon_Stealth_Worm_BaseLink`.
5. Zielhebel: Erstfreigabe für weitere 36 aktuell nicht spielbare Karten.

#### KI-Spieler

1. KI-Rigbewertung um Hosting-/Recurring-Muster erweitern.
2. Subtypen-abhängige Breaker-/Programmrollen nur für AI-supported Karten nutzen.
3. Keine KI-Abkürzungen an Hidden Hosting-Information.

#### Gate

- Hosting-Kaskaden bleiben deterministisch und leakfrei.
- Recurring-/Start-of-Turn-Fälle bestehen Simulations- und Replay-Regression.

### V1.7.1 Mechanikpaket E: Search/Reveal, Access und Run-Erweiterungen

#### Allgemeine Produkt- und Feature-Ziele

1. Hidden-Zone-Such- und Reveal-Fälle als breiten Kartenhebel priorisieren.
2. Access-/Breach- und Run-Lock-Sonderfälle gemeinsam stabilisieren.
3. Karten mit vielen Text-Sonderfällen auf standardisierte Resolver heben.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_Access_Breach_und_Multiaccess_Erweiterungen`.
2. `L2_HiddenZone_Search_Reveal_Reorder_Shuffle`.
3. `L2_Run_Flow_Erweiterungen_und_RunLocks`.
4. Zielhebel: Erstfreigabe für weitere 48 aktuell nicht spielbare Karten.

#### KI-Spieler

1. Search/Arrange/Shuffle nur aus erlaubter Projektion planen.
2. Run-Lock-Bewertung ohne Hidden-Info-Annahmen.
3. Access-Reihenfolge in KI-Entscheidungen replaybar begründen.

#### Gate

- Hidden-Zone- und Access-Fälle sind side-sicher und deterministisch.
- Run-Locks erzeugen keine Deadlocks oder illegale Actionpfade.

### V1.7.2 Mechanikpaket F: Trace/Tag/Resource und Handsize/Action-Economy

#### Allgemeine Produkt- und Feature-Ziele

1. Trace- und Tag-Interaktionen als große offene Regelfamilie abschließen.
2. Resource-Tag-Sonderfälle und Handsize-/Action-Modifier konsolidieren.
3. Restliche häufige Interaktionslogik vor Agenda-/Counter-Folgestufen schließen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_Handsize_und_ActionEconomy_Modifier`.
2. `L2_Resource_Tag_Interactions`.
3. `L2_Tag_Bedingungen_Remove_Avoid`.
4. `L2_Trace_Link_Bidding_und_BaseLink_Windowing`.
5. Zielhebel: Erstfreigabe für weitere 28 aktuell nicht spielbare Karten.

#### KI-Spieler

1. KI-Trace-Bidding und Tag-Management pro Difficulty nachvollziehbar machen.
2. Resource-Risiko nur aus sichtbaren Daten bewerten.
3. Handsize-/Action-Economy-Modifier in Planbewertung integrieren.

#### Gate

- Trace/Tag-Fenster funktionieren side-sicher in Multiplayer, Replay und Undo.
- Modifier verändern keine bestehenden Action-Kosten unkontrolliert.

### V1.8.0 Mechanikpaket G: Agenda-Difficulty und Scored-Agenda-Statics

#### Allgemeine Produkt- und Feature-Ziele

1. Agenda-nahe Sonderlogik und Overadvance-Fälle schließen.
2. Scored-Agenda-Statik in stabile, wiederverwendbare Resolver überführen.
3. Scoring-/Steal-Familien für breiteren O:NR-v1-Einsatz härten.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_Agenda_Difficulty_und_Overadvance_Details`.
2. `L3_Scored_Agenda_Active_Static_Overadvance`.
3. Zielhebel: Erstfreigabe für weitere 13 aktuell nicht spielbare Karten.

#### KI-Spieler

1. KI-Scoringpläne um variable Agenda-Difficulty erweitern.
2. DecisionDebug trennt sichtbar zwischen statischen Agendaeffekten und situativen Risiken.
3. Keine KI-Sonderbehandlung für nicht freigegebene Agendaresolver.

#### Gate

- Agenda-Scoring/Steal bleibt statehash-stabil und side-sicher.
- Overadvance-/Scored-Statics brechen keine bestehenden Siegbedingungen.

### V1.8.1 Mechanikpaket H: Counter-System und Virus/Purge-Trigger

#### Allgemeine Produkt- und Feature-Ziele

1. Counter-Familien übergreifend konsolidieren.
2. Virus-/Purge-Trigger in robuste Triggerketten bringen.
3. Hohe Kartenabdeckung mit kleinem, klar testbarem Scope erzielen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_Counter_System_und_Virus_Purge_Trigger`.
2. Zielhebel: Erstfreigabe für weitere 15 aktuell nicht spielbare Karten.

#### KI-Spieler

1. KI-Purge-/Counter-Entscheidungen auf freigegebene Counterzustände begrenzen.
2. Counter-bezogene Hints pro Karte nachziehen.
3. Keine KI-Annahmen über verdeckte Counter-Zustände.

#### Gate

- Counter-/Purge-Ketten sind deterministisch und replaybar.
- Triggerreihenfolge ist stabil und vollständig getestet.

### V1.9.0 Mechanikpaket I: Ambush, deterministischer Zufall und Rest-Sonderresolver

#### Allgemeine Produkt- und Feature-Ziele

1. Verbleibende Einzelfälle und seltene Sonderresolver gezielt schließen.
2. Karten mit kartenindividuellem Zufalls- oder Ambush-Verhalten freigeben.
3. Mechaniklinie vor V2.x formal komplettieren.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. `L2_Ambush_auf_Access_Resolver`.
2. `L3_Deterministischer_Wuerfel_Zufall`.
3. `L4_Konkreter_Sonderresolver_noch_offen`.
4. Zielhebel: Erstfreigabe für weitere 5 aktuell nicht spielbare Karten.

#### KI-Spieler

1. KI behandelt Ambush nur über erlaubte Access-/Reveal-Signale.
2. Zufallsresolver bleiben seed-deterministisch und debugbar.
3. Keine Hidden-Info-Anreicherung über Ambush- oder Zufallspfade.

#### Gate

- Ambush- und Zufallsfälle sind deterministisch, side-sicher und regressionsgeprüft.
- Offene Sonderresolver sind entweder implementiert oder als blockiert dokumentiert.

## Verbindliche Anschlusslinie V1.9.1 bis V1.9.8

Planentscheid vom 2026-05-10: Die bisherige Grobplanung `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/open-points-grobplan-to-v1-9-8.md` ist als gleichberechtigter und verpflichtender Teil dieser Roadmap übernommen.

Damit gilt:

1. V1.9.1 bis V1.9.8 sind vor V2.0 strikt sequenziell umzusetzen.
2. V2.x-Produktfeatures bleiben bis nach grünem Abschluss von V1.9.8 gesperrt.
3. Jeder V1.9.x-Release folgt weiterhin der Standardstruktur aus Produkt/Feature, Mechanik/Karten/Effekte und KI-Spieler.
4. Pro Release sind Requirements, Spezifikation, Testmatrix, Requirements-Review, Implementation-Review und Final-Review Pflicht.

Verbindliche Reihenfolge der acht Releases:

1. V1.9.1 Deferred-Auflösung und Restfälle deterministischer Zufall.
2. V1.9.2 Hidden-Zone-/Access-/Run-Kernverbreiterung.
3. V1.9.3 Trace-/Tag-/Resource-/Action-Fenster-Konsolidierung.
4. V1.9.4 Damage-/Prevention-/Core-Erweiterungen.
5. V1.9.5 Persistente Boardlogik und globale Modifier-Skalierung.
6. V1.9.6 Agenda-/Counter-/Virus-Lifecycle-Schließung.
7. V1.9.7 Upgrade-/Programm-/Hosting-/Destroy-Lifecycle-Schließung.
8. V1.9.8 Resolver-Longtail und Vollabdeckungs-Gate.

Ergänzende verbindliche KI-Härtung in dieser Sequenz:

- V1.9.8 enthält zusätzlich ein side-sicheres KI-Gedächtnispräzisions-Gate für rechtmäßig gesehene Hidden-Zone-Informationen (positionsgenaues Nachhalten, deterministische Invalidation, klare Trennung Fakt/Hypothese).
- Dieser Punkt stärkt die Spielqualität der KI, ohne den Hidden-Info-Vertrag aufzuweichen und ohne V2.x-Scope vorzuziehen.

## V2.x Geschlossene Community und öffentliche Multiplayer-Basis

V2.x darf erst beginnen, wenn die Sequenz V1.6.1 bis V1.9.x grün abgeschlossen ist, private Internet-Gates stabil sind und Auth-, Datenschutz-, Moderations-, Betriebs- und Rechtsentscheidungen getroffen wurden.

### V2.0 Closed Accounts Alpha

#### Allgemeine Produkt- und Feature-Ziele

1. Accountmodell für bekannte Nutzer einführen.
2. Session Management mit Revocation.
3. Private Cloud-Decks als optionale Ergänzung zu lokalen Decks.
4. Datenexport und Löschung vorbereiten.
5. Datenschutzmodell dokumentieren.
6. Auth-Provider oder Passkey/OAuth-Entscheidung treffen.
7. Account Recovery bewusst festlegen.
8. Keine öffentliche Lobby einführen.
9. Keine Rankings oder Turniere einführen.
10. Security-Tests für Auth, Sessions, CSRF und Origin ergänzen.
11. Logs und Diagnoseflächen personenbezogen redigieren.
12. Lokale Gast-/Privatmodi weiter unterstützen oder bewusst abgrenzen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Keine neue Spielmechanik.
2. Deck-Snapshots und Account-Decks trennen.
3. Matchstart validiert weiterhin Mechanik-Coverage und Card-Status.
4. Cloud-Decks speichern keine Hidden-Matchdaten.
5. Formatprofile bleiben versioniert.
6. Kartenfreigaben bleiben releasegebunden.
7. Keine öffentliche Kartendatenquelle als Laufzeitabhängigkeit.
8. Migration lokaler Decks nur mit Nutzerentscheidung.
9. Decklisten-Sichtbarkeit pro Match und Account festlegen.
10. Replay-Zugriff accountgebunden und side-sicher definieren.
11. Backup/Restore für Accountdaten planen.
12. Keine Karte wird durch Accountsystem spielbar.

#### KI-Spieler

1. KI-Profile accountunabhängig halten.
2. KI-Deckpools bleiben AI-supported-only.
3. Accountdaten nicht als KI-Input verwenden, außer explizite lokale Schwierigkeitseinstellung.
4. KI-Statistiken nur aggregiert und datenschutzkonform speichern.
5. DecisionDebug nicht öffentlich machen.
6. KI-Coaching bleibt aus LegalActions/PlayerView/PublicEvents.
7. Keine Hidden-Info aus Account-Replays in Live-KI.
8. KI-Benchmarks unabhängig von Nutzerdaten halten.
9. Nutzerbezogene KI-Anpassung nur nach eigener Datenschutzentscheidung.
10. Sicherheitsgate prüft KI-Debug-Leaks.

### V2.1 Private Friends/Invites

#### Allgemeine Produkt- und Feature-Ziele

1. Freundesliste für bekannte Accounts.
2. Private Invite-Flows.
3. Blockieren und Entblocken.
4. Presence nur mit Privacy-Regeln.
5. Keine öffentliche Matchmaking-Queue.
6. Keine öffentliche Lobby.
7. Privacy Controls dokumentieren.
8. Friend-Request-Abuse begrenzen.
9. Rate Limits und Audit Events ergänzen.
10. Einladungen ohne Token-Leaks.
11. UI für private Einladungen.
12. Reconnect und Session Recovery accountkompatibel halten.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Keine neue Mechanik.
2. Private Invites ändern keine RulesBaseline.
3. Deckvalidierung unverändert serverseitig.
4. Gegner sieht keine Deckliste vor erlaubtem Zeitpunkt.
5. Invite-Payloads enthalten keine Karten- oder Hidden-Matchdaten.
6. Friend-Status beeinflusst keine Spielregeln.
7. Replay-Freigaben nur explizit.
8. Match-Historie side-sicher.
9. Deckhashes weiter redigiert.
10. Keine Kartenfreigabe durch Social-Funktionen.

#### KI-Spieler

1. KI bleibt optionaler Controller.
2. Freunde/Blocks beeinflussen KI nicht.
3. Human-vs-KI-Invites nur als private Session, wenn gewünscht.
4. KI-Debugdaten nicht an Freunde teilen.
5. KI-Deckauswahl bleibt release- und AI-supported-gebunden.
6. Keine Gegnerprofilierung aus Friend-Daten.
7. KI-Soaks nutzen keine Nutzerdaten.
8. KI-Hilfe bleibt side-sicher.
9. Keine Hidden-Info in Invite-/Status-Cues.
10. Tests decken KI-Modi in accountbasierten Flows ab.

### V2.2 Minimal Chat Gate

#### Allgemeine Produkt- und Feature-Ziele

1. Match- oder Lobbychat nur mit Report-/Block-/Retention-Modell.
2. Kein globaler öffentlicher Chat.
3. Moderationsrichtlinie schreiben.
4. Retention und Export/Löschung klären.
5. Rate Limits und Spam-Schutz.
6. Chat-Payloads von GameEvents trennen.
7. UI für Meldungen.
8. Audit- und Moderationszugriff begrenzen.
9. Kein Chat ohne Datenschutz-Review.
10. Keine Chatdaten in Replays ohne explizite Entscheidung.
11. Abuse-Tests ergänzen.
12. Chat nicht als Regel- oder Action-Kanal nutzen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Keine neue Mechanik.
2. Chat hat keinen Einfluss auf GameState.
3. Chat erscheint nicht in StateHash.
4. Chat ist kein PublicGameEvent.
5. Hidden-Info-Leaks durch Chat-Previews vermeiden.
6. Reconnect lädt Chat nur nach Berechtigung.
7. Logs redigieren Tokens und private Matchdaten.
8. Keine Kartenfreigabe durch Chat.
9. Chat-Meldungen dürfen keine automatischen Aktionen auslösen.
10. Replay- und Matchdaten bleiben getrennt.

#### KI-Spieler

1. KI nimmt nicht am Chat teil, außer später explizit freigegeben.
2. Chatdaten sind kein KI-Input.
3. KI-Coaching nutzt Chat nicht als Regelquelle.
4. DecisionDebug bleibt außerhalb Chat.
5. Abuse-/Moderationsanalyse nicht mit Live-KI vermischen.
6. Keine LLM-Chatmoderation ohne eigenes Gate.
7. KI-Spieler darf keine Chatnachrichten als Aktionen interpretieren.
8. Tests prüfen Trennung von Chat und AIInput.
9. Hidden-Info in Chat bleibt soziale Verantwortung, nicht Engine-Input.
10. KI-Soaks bleiben chatfrei.

### V2.3 Public Lobby Alpha

#### Allgemeine Produkt- und Feature-Ziele

1. Öffentliche Casual-Lobbies als Alpha.
2. Filter nach Format, Modus und privater Sichtbarkeit.
3. Kein Ranked.
4. Kein automatisches Matchmaking.
5. Public Platform Risk Review vor Start.
6. Spam-/Rate-Limit-Gates.
7. Lobby-Metadaten ohne Decklisten- oder Token-Leaks.
8. Moderations- und Abuse-Pfade aktiv.
9. Health/Observability für Lobbybetrieb.
10. Region/Latenz nur als Anzeige oder einfache Filter.
11. UI für Lobbyerstellung und Beitritt.
12. Rollback-Plan für Public Alpha.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Public Lobby aktiviert keine Karten.
2. Formatprofile bestimmen erlaubte Decks.
3. Lobby zeigt nur erlaubte Metadaten.
4. Decklisten bleiben privat.
5. Matchstart revalidiert Decks serverseitig.
6. Keine neuen RulesBaselines ohne Review.
7. Public Matches nutzen dieselben Engine-Gates.
8. Replay-Policy vor Public-Replay-Freigabe getrennt.
9. Cardpool-Version in Lobby sichtbar, aber nicht als Deckinhalt.
10. Keine offiziellen Assets ohne Asset-Gate.

#### KI-Spieler

1. KI-Lobbies nur, wenn AI-supported Deckpool vorhanden ist.
2. KI-Schwierigkeit in Lobby sichtbar, aber kein Hidden-Info-Vorteil.
3. KI-Debugdaten nicht öffentlich anzeigen.
4. KI-Deckpool format- und AI-supported-gebunden.
5. Public-Lobby-Soaks mit KI optional getrennt.
6. KI darf keine Userdaten zur Strategie nutzen.
7. Lobby-Cues leaken keine KI-internen Hidden-Annahmen.
8. Human-vs-KI-Pacing für öffentliche Spiele stabil halten.
9. Tests prüfen AIInput-Redaction in Public-Lobby-Matches.
10. Kein LLM-Live-Controller.

### V2.4 Spectator Private/Delayed

#### Allgemeine Produkt- und Feature-Ziele

1. Private Spectator Links.
2. Delayed public view nur nach eigenem Gate.
3. Zuschauerrollen von PlayerViews trennen.
4. Delay und Projektion testen.
5. Kein Live-Hidden-Leak.
6. Consent und Matchsettings definieren.
7. Spectator-Reconnect.
8. UI für erlaubte Zuschauerperspektive.
9. Abuse- und Sniping-Risiken dokumentieren.
10. Public Spectator nicht mit Public Replay verwechseln.
11. Rate Limits und Linkschutz.
12. Final Review mit Projection-Leaktest.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Spectator ist keine Regelmechanik.
2. Spectator erhält eigene Projektion.
3. Hidden-Zones bleiben verborgen.
4. Delay-Puffer darf keine privaten Daten vorzeitig senden.
5. Access/Reveal/Expose zeitlich korrekt projizieren.
6. Spectator-Payloads nicht in StateHash.
7. Replay- und Spectator-Projektionen getrennt versionieren.
8. Keine Kartenfreigabe durch Spectator.
9. Offizielle Assets bleiben eigenes Gate.
10. Tests für alle Hidden-Info-Barrieren.

#### KI-Spieler

1. KI-DecisionDebug nicht an Spectator senden.
2. KI-Erklärungen nur als erlaubte öffentliche Cues, wenn freigegeben.
3. Spectator-Daten kein KI-Input.
4. KI-Soaks bleiben intern.
5. Delayed Replay kann KI-Metriken anonymisiert nutzen.
6. Keine Gegner-Modell-Daten öffentlich machen.
7. Coaching aus Spectator-Sicht eigenes spätes Gate.
8. Tests prüfen keine AIInput-Leaks in Spectator-Payloads.
9. KI-Schwierigkeitsgrad kann angezeigt werden, nicht KI-Memory.
10. LLM-Kommentator nur nach eigenem Gate und side-sicher.

### V2.5 Matchmaking Casual

#### Allgemeine Produkt- und Feature-Ziele

1. Casual Queue ohne Rating.
2. Region/Latenz/Timeout berücksichtigen.
3. Queue-Cancel und Timeout sauber modellieren.
4. Abuse- und Smurfing-Grundschutz.
5. Kein Ranked.
6. Keine Turniere.
7. Matchmaking-Transparenz im UI.
8. Loadtests für Queue.
9. Format- und Cardpool-Kompatibilität prüfen.
10. Private Invites bleiben separat.
11. Moderation und Reports integriert halten.
12. Rollback bei Queue-Problemen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Matchmaking ist keine Spielmechanik.
2. Matchstart revalidiert RulesBaseline.
3. Queue vergleicht Formatprofile.
4. Decklisten bleiben verborgen.
5. Keine neuen Karten durch Queue.
6. Public Queue nutzt nur freigegebene Formate.
7. Matchresultate side-sicher speichern.
8. Replays nur gemäß Replay-Policy.
9. StateHash und Replay unverändert.
10. Tests für Queue-Abbruch ohne Matchstate-Schaden.

#### KI-Spieler

1. KI-Gegner können optional als Queue-Fallback geplant werden, aber nur mit klarer Kennzeichnung.
2. KI nutzt keine Account- oder Queue-Metadaten als Strategieinput.
3. KI-Decks müssen formatkompatibel und AI-supported sein.
4. KI-Matches getrennt von Human-Casual-Metriken auswerten.
5. Keine versteckte Schwierigkeitserhöhung durch Nutzerdaten.
6. KI-Soaks können Queue-Last simulieren.
7. DecisionDebug bleibt privat.
8. AIInput-Leaktests für Matchmaking-Flows.
9. KI darf kein Matchmaking-Ergebnis beeinflussen.
10. Bot-Erkennung und KI-Gegner nicht verwechseln.

### V2.6 Moderation Console

#### Allgemeine Produkt- und Feature-Ziele

1. Reports, Sanktionen, Evidenz und Audit.
2. RBAC für Moderatoren.
3. Minimale notwendige Datenansicht.
4. Datenschutz und Retention klären.
5. Missbrauch durch Adminzugriff verhindern.
6. Evidence-Export definieren.
7. Moderator-Runbook erstellen.
8. Security-Tests für Rollenrechte.
9. Audit-Logs manipulationsarm.
10. Keine Regelentscheidung durch Moderation.
11. Appeals oder Review-Pfad planen.
12. Public-Betrieb ohne Moderation nicht weiter ausbauen.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Moderation ist keine Spielmechanik.
2. Moderatoren sehen Hidden-Matchdaten nur nach strenger Policy.
3. Public-Replay-Evidenz redigiert Hidden Info.
4. Chat- und Matchdaten getrennt auswerten.
5. GameState bleibt unverändert.
6. Keine Kartenfreigabe.
7. Replay/StateHash können Evidenzintegrität stützen.
8. Decklisten nur nach Policy sichtbar.
9. Audit-Zugriffe versionieren.
10. Tests für Hidden-Info-Redaction in Moderationsansicht.

#### KI-Spieler

1. KI-Debugdaten nicht pauschal moderationssichtbar.
2. KI-Missbrauchssignale getrennt von Chat-/Userreports.
3. KI-Coaching-Ausgaben nur nach Policy.
4. Keine automatisierte Sanktion durch LLM ohne eigenes Gate.
5. Bot-/Exploit-Erkennung als späterer Analysepfad.
6. AIInput und DecisionDebug vor Moderationsleaks schützen.
7. KI-Soaks nicht mit echten Nutzerdaten mischen.
8. Moderation kann KI-Fehlerberichte aufnehmen.
9. Tests für KI-Datenzugriff in RBAC.
10. Keine Hidden-Info-Offenlegung durch KI-Erklärungen.

### V2.7 Observability/Scale

#### Allgemeine Produkt- und Feature-Ziele

1. Metrics, Traces und Health für Public-Betrieb.
2. Autoscaling-ready Match Worker planen.
3. SLOs und Runbooks definieren.
4. Loadtests und Failover-Drills.
5. Alerting ohne Token-/Hidden-Info-Leaks.
6. Datenbank-Skalierung prüfen.
7. Backups und Restore-Drills für Accountdaten.
8. Deployment-Rollback.
9. Rate-Limit- und Abuse-Metriken.
10. Privacy-konforme Logs.
11. Keine Featurebreite ohne Betriebsstabilität.
12. Post-release Soak.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Observability ist keine Spielmechanik.
2. Engine-Metriken dürfen keine Hidden Cards enthalten.
3. StateHash-Fehler anonymisiert melden.
4. Replay-Divergenzen als QA-Signal erfassen.
5. Matchworker erhalten keine Clientregelautorität.
6. Cardpool-Versionen als Labels ohne Decklisten.
7. Formatprofile als Labels ohne private Inhalte.
8. Keine Kartenfreigabe.
9. Performancebudgets für Engine und KI messen.
10. Tests für Log-Redaction.

#### KI-Spieler

1. KI-Latenz und Timeout-Rate messen.
2. KI-Fallback-Rate messen.
3. Illegale KI-Actions als kritisches Signal.
4. KI-Soak-Metriken von Produktmetriken trennen.
5. DecisionDebug nicht in normale Logs schreiben.
6. AIInput redigieren.
7. Schwierigkeit und AI-Version als technische Labels.
8. Kein Userprofiling für KI ohne Datenschutzgate.
9. KI-Performancebudget in Alerts.
10. Exploit-Regressionen aus Metriken ableiten.

### V2.8 Public Replay

#### Allgemeine Produkt- und Feature-Ziele

1. Public sanitized Replays.
2. Consent- und Privacy-Settings.
3. Replay-Policy schreiben.
4. Public/private Replay-Projektionen trennen.
5. Hidden Info erst zeigen, wenn Policy es erlaubt.
6. Export und Teilen kontrollieren.
7. Löschung/Unlisting.
8. Abuse- und Moderationsintegration.
9. Versionierung alter RulesBaselines.
10. Replay-Suche nur mit erlaubten Metadaten.
11. Kein Public Spectator automatisch.
12. Redaction-Tests als Gate.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Public Replay ist keine Spielmechanik.
2. Public-Projektion aus EventLog ableiten.
3. Hidden-Info-Barrieren respektieren.
4. StateHash-Verifikation öffentlich möglich, ohne private Daten zu leaken.
5. PublicEvents und private Payloads getrennt.
6. Kartenbilder nur nach Asset-Gate.
7. Decklisten nur nach Consent/Policy.
8. Keine Kartenfreigabe.
9. Replay alter Mechanikversionen kennzeichnen.
10. Tests für Projection-Leaks.

#### KI-Spieler

1. KI-DecisionDebug nicht öffentlich standardmäßig.
2. KI-Zuggründe nur redigiert und side-sicher.
3. KI-Matches als solche markieren.
4. Public Replays nicht als Live-KI-Input nutzen.
5. Post-game Analyse nur aus public-safe Projektion.
6. AI-Coaching aus Public Replay eigenes Gate.
7. Keine Hidden-Belief-Daten veröffentlichen.
8. KI-Soak-Replays nur anonymisiert.
9. Tests für AI-Debug-Redaction.
10. LLM-Zusammenfassungen nur nach eigenem Safety-Gate.

## V3.x und V4.x Endprodukt-Gates

Diese Stufe darf erst beginnen, wenn V2.x belastbar läuft und die Produktentscheidung für eine öffentliche Plattform positiv gefallen ist.

### V3.0 Ranked Foundation

#### Allgemeine Produkt- und Feature-Ziele

1. Ratingmodell.
2. Seasons.
3. Casual/Ranked-Trennung.
4. Concede Policy.
5. Anti-Abuse.
6. Ergebnis-Audit.
7. Kein Turniermodus.
8. Ranked Queue getrennt von Casual.
9. Deck-/Format-Snapshot für Ranked.
10. Privacy und Moderation.
11. Loadtests.
12. Rollback und Season-Korrekturpfad.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Ranked nutzt nur freigegebene Formate.
2. Decklegalität beim Matchstart und Ergebnis speichern.
3. Keine Kartenfreigabe durch Ranked.
4. StateHash und Replay für Audits.
5. Formatrotation versionieren.
6. Banlist-Snapshots festhalten.
7. Concede ist Match-Lifecycle, kein Engine-Siegfake.
8. Hidden Info bleibt geschützt.
9. Public Replay nach Policy.
10. Tests für Ergebnisintegrität.

#### KI-Spieler

1. KI nicht in Ranked gegen Menschen, außer explizite Produktentscheidung.
2. KI kann als Benchmark außerhalb Ranked dienen.
3. KI-Difficulty nicht als Ratinggegner tarnen.
4. Keine KI-Nutzung von Ranked-Daten ohne Datenschutzgate.
5. Exploit-Erkennung kann KI-Soaks nutzen.
6. DecisionDebug bleibt privat.
7. KI-Coaching in Ranked nur nach sehr hartem Gate.
8. Tests gegen Hidden-Info-Leaks.
9. KI-Benchmark-Versionen dokumentieren.
10. Keine LLM-Regelautorität.

### V3.1 Tournament/Liga Beta

#### Allgemeine Produkt- und Feature-Ziele

1. Swiss oder Liga.
2. Check-in.
3. Drops.
4. Pairing-Simulation.
5. Decklist Policy.
6. Kein offizieller OP-Anspruch ohne Freigabe.
7. Admin-/TO-Rollen.
8. Ergebnisprüfung.
9. Zeitlimits.
10. Abuse- und Moderation.
11. Export.
12. Kleine private Beta zuerst.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Turnier nutzt versionierte Formate.
2. Decklisten-Sichtbarkeit nach Policy.
3. Keine Kartenfreigabe.
4. Matchresultate StateHash-/Replay-gestützt.
5. Concede/Timeout-Regeln getrennt.
6. Format- und Banlist-Snapshot pro Event.
7. Hidden Info in Adminansichten begrenzen.
8. Pairings ohne Deckleaks.
9. Tests für Drops und Rejoins.
10. Regelabweichungen sichtbar.

#### KI-Spieler

1. KI nicht als regulärer Turniergegner ohne eigenes Gate.
2. KI kann Pairing-/Load-Simulation unterstützen.
3. KI kann Testspieler in internen Probeläufen sein.
4. Keine KI-Nutzung echter Turnierdecks als Hidden-Wissen.
5. Coaching im Turnier standardmäßig aus.
6. DecisionDebug nicht TO-sichtbar ohne Policy.
7. Exploit-Regression aus Turnierfehlern möglich.
8. KI-Benchmarks getrennt von Turnierwertung.
9. Tests für KI-Abwesenheit in offiziellen Flows.
10. Keine LLM-Regelentscheidungen.

### V3.2 Full Format Coverage

#### Allgemeine Produkt- und Feature-Ziele

1. Standard, Startup, Eternal und Snapshot-Formate prüfen.
2. Vollständige Formatquellen-Entscheidung.
3. Rotation und Banlists versionieren.
4. Format-Update-Prozess.
5. Compatibility Matrix.
6. Deckbuilder-Komfort erweitern.
7. Katalogfilter für Formate.
8. Keine unrechtmäßigen Assets.
9. Release Notes für Formatupdates.
10. Regression für Beispieldecks.
11. Datenpipeline mit Review.
12. Public-Produktkommunikation präzisieren.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Vollständige Formatregeln auf Basis der bis V1.9.x freigegebenen Mechaniken abbilden.
2. Agenda-Dichte und Mindestgrößen je Identity.
3. Influence und Faction vollständig.
4. Kopienlimits und Ausnahmen.
5. Rotation/Banlist/Effektivdatum.
6. Keine Karte ohne Mechanik-Coverage spielbar.
7. Kartenstatus bleibt getrennt von Formatlegalität.
8. Per-card manifests für Lücken.
9. Tests für legale/illegale Decks.
10. Format-Snapshot in Matchstate.
11. Keine automatische Regelinterpretation.
12. Mechanik-Lücken blockieren Karten.

#### KI-Spieler

1. KI-Deckbau formatbewusst.
2. AI-supported Pool pro Format.
3. ArchetypeTags nutzen.
4. KI-Benchmarks pro Format.
5. KI lehnt nicht AI-supported Decks ab.
6. Formatänderungen triggern KI-Regressionssuite.
7. Deckrollenprofile aus Formatdeck.
8. Keine gegnerische Deckliste als Live-Wissen.
9. DecisionDebug mit Formatversion.
10. Soaks pro Formatprofil.

### V3.3 Full Cardpool Engine Pass

#### Allgemeine Produkt- und Feature-Ziele

1. Jede Karte statusgeprüft.
2. Coverage Matrix für gesamten Kartenpool.
3. Blocked/imported/playable/deck_legal/ai_supported klar.
4. Keine Auto-Parser-Autorität.
5. Per-card Review.
6. Regression für Kartenfamilien.
7. Release Notes für Freigaben.
8. Performance für breiten Pool.
9. Katalog- und Deckeditor-Skalierung.
10. Rechts-/Quelle-Gate weiter beachten.
11. Maintenance-Prozess.
12. Karten ohne Tests nicht spielbar.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Alle bis V1.9.x geplanten Mechaniken sind umgesetzt oder als blockiert dokumentiert; V3.3 ist kein Erst-Implementierungsrelease für neue Kernmechaniken.
2. Jede `playable` Karte hat Resolver/Ability.
3. Jede `playable` Karte hat Unit-/Szenariotest.
4. Jede Hidden-Info-Karte hat Leaktest.
5. Jede zufällige Karte nutzt RandomDrawRecords.
6. Jede Event-Modification-Karte hat Replaytest.
7. Jede Hosting-/Control-Karte hat Invariantentest.
8. Jede Formatkarte hat Deckvalidierung.
9. Jede Abweichung hat Removal Condition.
10. Keine `unknown` Mechanik in Coverage Matrix.
11. Per-card manifest vollständig.
12. Runtime-Gates versioniert.

#### KI-Spieler

1. AI-supported pro Karte separat.
2. AI-Hints für alle KI-Deckkarten.
3. Kartenrollen und Archetypen vollständig genug.
4. KI-Benchmark mit breiterem Kartenpool.
5. KI kann nicht unterstützte Karten ignorieren.
6. KI-Deckbau ohne blockierte Karten.
7. Soaks mit mehreren Archetypen.
8. Exploit-Regressionssuite erweitern.
9. DecisionDebug bleibt verständlich.
10. Kein FullState oder LLM-Regelcontroller.

### V3.4 Public Asset Path

#### Allgemeine Produkt- und Feature-Ziele

1. Assetpfad nur nach positiver Rechtsentscheidung.
2. Lizenzierte oder erlaubte Bilder.
3. Generische Assets als Fallback.
4. Keine Card Backs/Frames ohne Freigabe.
5. CDN-/Cache-Policy.
6. Asset-Metadaten redigieren.
7. Private lokale Assets weiter getrennt.
8. Public-Distribution prüfen.
9. DOM-/Payload-/Cache-Leaktests.
10. Accessibility-Alttexte ohne Hidden-Info.
11. Rollback auf generische Assets.
12. Dokumentierte Asset-Policy.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Assets haben keinen Engine-Einfluss.
2. Assets nicht in StateHash.
3. Assets nicht in Replay-Entscheidungen.
4. Assets nicht in AIInput.
5. Hidden Cards zeigen generische Platzhalter.
6. Unbekannte Karten laden keine unterscheidbaren URLs.
7. Katalogbilder getrennt von Matchsicht.
8. Keine Kartenfreigabe durch Bildverfügbarkeit.
9. Asset-IDs unabhängig von CardInstance-IDs.
10. Tests gegen Bild-URL-Leaks.

#### KI-Spieler

1. KI nutzt keine Bilder.
2. KI nutzt keine Asset-Metadaten.
3. DecisionDebug enthält keine Bilddaten.
4. AI-Hints bleiben Text-/Datenvertrag.
5. LLM-Bildanalyse nicht als Regelquelle.
6. KI-Coaching nutzt keine Hidden-Asset-Signale.
7. Tests prüfen AIInput assetfrei.
8. Soaks unabhängig von Assets.
9. Public Asset Path verändert KI-Ergebnisse nicht.
10. Keine Screenshot-Auswertung als Live-Controller.

### V3.5 Mobile/Tablet Excellence

#### Allgemeine Produkt- und Feature-Ziele

1. Touch-first Board.
2. Tablet-optimierte Layouts.
3. PWA optional.
4. Responsive Board ohne Überlappungen.
5. Textfit und Viewport-Smokes.
6. Gesture-Design ohne versehentliche Actions.
7. LegalActions weiter Engine-gesteuert.
8. Reconnect und Offline-Hinweise.
9. Mobile Performance.
10. Kein nativer App-Zwang.
11. Accessibility-Basis.
12. Browser-E2E auf mobilen Viewports.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Mobile ändert keine Regeln.
2. Keine FullState-Daten in Client.
3. Hidden Cards bleiben redigiert.
4. Action Confirmations für riskante Actions.
5. Run-/Access-/Choice-Flows touch-sicher.
6. Kartenzoom ohne Leaks.
7. Assets nur nach Policy.
8. Replay und StateHash unverändert.
9. Keine Kartenfreigabe.
10. Tests für DOM-Leaks.

#### KI-Spieler

1. KI-Pacing mobile-tauglich.
2. DecisionDebug-Ansicht optional einklappbar.
3. KI-Hinweise ohne Boardüberdeckung.
4. Human-vs-KI auf Tablet smoke-testen.
5. KI-Choice-Fortsetzung ohne Hänger.
6. Keine KI-Daten im Mobile-Debug.
7. AIInput unverändert.
8. Soaks unabhängig von UI.
9. Lernhilfe mobile-tauglich.
10. Kein Screenshot-KI-Controller.

### V3.6 Accessibility Full Pass

#### Allgemeine Produkt- und Feature-Ziele

1. Screenreader-Summaries.
2. Keyboard-Navigation.
3. Reduced Motion.
4. Farbkontrast.
5. Fokusführung.
6. Semantische Board-Struktur.
7. Hilfetexte ohne Überladung.
8. Accessibility-Tests automatisiert und manuell.
9. Keine Komfortausrede für Hidden-Leaks.
10. Einstellungen persistent und privat.
11. Replay barrierearm.
12. Tutorial barrierearm.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. A11y ändert keine Regeln.
2. Screenreader bekommt nur PlayerView-Daten.
3. Hidden Cards bleiben anonym.
4. PublicEvents side-sicher.
5. Access-/Reveal-Momente korrekt angekündigt.
6. Keyboard-Actions nur LegalActions.
7. Keine CardBack-/Alttext-Leaks.
8. Replay-Projektion side-sicher.
9. Keine Kartenfreigabe.
10. Tests für a11y-hidden-info.

#### KI-Spieler

1. KI-Hinweise screenreader-tauglich.
2. DecisionDebug barrierearm.
3. KI-Pacing respektiert Reduced Motion.
4. Keine Hidden-Info in gesprochenen Hinweisen.
5. AIInput unverändert.
6. Lern-Coach barrierearm und side-sicher.
7. KI-Fortsetzen per Tastatur.
8. Tests für KI-Cues ohne Leaks.
9. Keine LLM-Regelautorität.
10. Soaks unverändert.

### V3.7 AI Coaching

#### Allgemeine Produkt- und Feature-Ziele

1. Side-sichere Beratung.
2. Lernmodus.
3. Post-game Analysis.
4. Keine Live-Regelautorität.
5. Kein Action-Erzeuger außerhalb LegalActions.
6. Coaching nur aus erlaubten Projektionen.
7. Nutzerkontrolle und Opt-in.
8. Datenschutz und Logging.
9. Fehlerhinweise als Empfehlung markieren.
10. LLM-Grenze dokumentieren.
11. Abuse- und Cheating-Risiko prüfen.
12. Tests gegen Hidden-Info-Leaks.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Coaching ändert keine Regeln.
2. Vorschläge referenzieren LegalActions.
3. Keine versteckten Kartendaten.
4. Keine automatische Kartentextauslegung.
5. Mechanik-Erklärungen aus freigegebenen Spezifikationen.
6. Abweichungen klar anzeigen.
7. Replay-Coaching aus Replay-Projektion.
8. Keine Kartenfreigabe.
9. Format- und Kartenstatus respektieren.
10. Tests für falsche oder illegale Vorschläge.

#### KI-Spieler

1. Coach-KI getrennt von Gegner-KI.
2. Gegner-KI bekommt kein Coachingwissen.
3. Coaching nutzt PlayerView, LegalActions und PublicEvents.
4. LLM höchstens Beratung/Testfallgenerator.
5. Kein LLM Live-Spielzug-Controller.
6. Coach erklärt Risiken ohne Hidden Info.
7. DecisionDebug kann als Quelle dienen, wenn side-sicher.
8. Coach darf keine gegnerischen verdeckten Annahmen als Fakten nennen.
9. Evaluationssuite für Coachingqualität.
10. Hard AI bleibt ohne Informationsvorteil.

### V3.8 Long-Term Maintenance

#### Allgemeine Produkt- und Feature-Ziele

1. Release Trains.
2. Migration Policy.
3. LTS Data Snapshots.
4. Deprecation-Modell.
5. Changelog.
6. Upgrade/Rollback-Drills.
7. Compatibility Matrix.
8. Post-release Soak.
9. Security Patch Prozess.
10. Datenquellen-Review.
11. Testbudget und Performancebudget.
12. Dokumentationspflege.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. RulesBaseline-Versionierung.
2. Mechanik-Coverage-Versionierung.
3. Cardpool-Snapshots.
4. Format-Snapshots.
5. Replay-Kompatibilität.
6. Migration alter Matches.
7. Kartenstatus-Deprecation.
8. Abweichungen mit Removal Condition.
9. Keine stille Regeländerung.
10. Regression für alte Kernfixtures.

#### KI-Spieler

1. AI-Versionierung.
2. AI-Hints-Versionierung.
3. Benchmark-Versionierung.
4. Soak-Historie.
5. Tuning-Changelog.
6. Difficulty-Kompatibilität.
7. DecisionDebug-Schema-Migration.
8. Exploit-Regressionen langfristig halten.
9. Keine KI-Änderung ohne Hidden-Info-Gate.
10. LLM-/Coach-Grenzen regelmäßig prüfen.

### V4.0 Quasi Complete Product

#### Allgemeine Produkt- und Feature-Ziele

1. Vollständige Regeln oder dokumentierte Restabweichungen.
2. Vollständiger rechtlich sauberer Kartendatenpfad.
3. Private und öffentliche Multiplayerpfade.
4. Deckbuilder, Katalog, Replays, Tutorials und Regelhilfe.
5. Mobile, Tablet und Desktop gut nutzbar.
6. Accessibility realistisch erfüllt.
7. Accounts, Moderation, Datenschutz und Betrieb belastbar.
8. Ranked und Turniere nur nach stabilen Gates.
9. Langfristige Wartbarkeit.
10. Keine ungelösten Rechtsgates.
11. Vollständige Regression/Load/Security.
12. Final Product Review.

#### Mechaniken, Kartenfreigabe und Effekt-Vervollständigung

1. Keine Mechanik mit Status `unknown`.
2. Jede Mechanik `implemented`, `implemented_limited`, `deferred`, `blocked` oder `out_of_scope`.
3. Jede `playable` Karte getestet.
4. Jede `deck_legal` Karte formatvalidiert.
5. Jede `ai_supported` Karte mit Hints und Szenarien.
6. Full Cardpool Engine Pass abgeschlossen oder blockierte Karten dokumentiert.
7. Replay/StateHash über unterstützte Baselines stabil.
8. Hidden-Info-Gates umfassend.
9. Format- und Banlist-Pipeline wartbar.
10. Assetpfad rechtlich sauber oder generisch.
11. Migrationen und LTS-Snapshots.
12. Abweichungsregister vollständig.

#### KI-Spieler

1. Corp- und Runner-KI mindestens planbasiert für AI-supported Kartenpool.
2. Belief State fair und getestet.
3. Simulation ohne echten Hidden State.
4. Selfplay/Benchmarking etabliert.
5. Exploit-Regressionen dauerhaft.
6. Difficulty-Profile messbar.
7. AI Coaching side-sicher, falls freigegeben.
8. Keine KI mit Informationsvorteil.
9. Keine LLM-Regelautorität.
10. DecisionDebug und Replay-Analyse nachvollziehbar.
11. KI-Stärke nur für definierte Baselines behaupten.
12. KI-Support-Matrix vollständig.

## Nächster verbindlicher Schritt

Nächster Release nach abgeschlossenem V1.9.0 ist V1.9.1.

Die nächsten vier Pflicht-Releases sind strikt sequenziell: V1.9.1, V1.9.2, V1.9.3 und V1.9.4.

Pflicht für den Start:

1. `AGENTS.md` und `docs/codex/CODEX_STATUS.md` lesen.
2. Diese Roadmap als führenden Planungsstand verwenden.
3. V1.9.1-Requirements, Spezifikation, Testmatrix und Requirements-Review vor Implementierung einfrieren.
4. No-Scope-Grenzen aus V1.9.0 beibehalten und nur explizit freigegebene V1.9.1-Blöcke aktivieren.
5. V2.0 darf erst nach grünem Abschluss von V1.9.8 gestartet werden.
