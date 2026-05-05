# V1.0.4 Next Release Candidates

Stand: 2026-05-05

## Zielbild

V1.0.4 ist als kleiner UX-Haertungsschritt nach V1.0.3 vorgesehen. Der Release soll keine neuen Engine-Regeln, Karten, Mechaniken, offiziellen Assets, Accounts, Matchmaking-, Ranking- oder Plattformfunktionen einfuehren.

Nach Abgleich mit dem Planungsbranch liegen zusätzlich vor:

- `docs/derived/RELEASE_PLANNING_2026-05-05.md`
- `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md`
- `docs/derived/V1_0_5_ACTION_BOARD_UX_PLAN.md`
- `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`
- `docs/derived/LONG_TERM_PRODUCT_VISION_EXECUTIVE_SUMMARY.md`

Empfohlene Reihenfolge: zuerst V1.0.4 Private Match Lifecycle und Session Recovery, danach V1.0.5 Action Board UX und Board-Klarheit.

## Konsolidierungsentscheidung 2026-05-05

Dieses Dokument ist ab jetzt das Kandidaten- und Herkunftsdokument, nicht der kanonische Detailumfang fuer V1.0.4. Der kanonische V1.0.4-Scope ist `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md`.

Die Kandidaten "Deutsche Regelbegriffe und UI-Glossar", "Serverlayout und ICE-Ausrichtung" sowie "Spieloberflaeche und Informationsarchitektur" gehoeren nur dann in V1.0.4, wenn sie direkt fuer Cancel/Leave/Forfeit/Reconnect oder Gegnernamen noetig sind. Ansonsten sind sie V1.0.5 Action Board UX zugeordnet.

## Kandidaten

### Match abbrechen und aufgeben

Spielende- und Abbruchaktionen sollen als eigener, side-sicherer Scope geplant werden.

- Erstelltes Match zurücknehmen: Der Host kann eine noch nicht aktive Einladung entwerten, Einstellungen oder Decks ändern und danach bewusst ein neues Match mit neuem Join-Link erstellen.
- Lobby-Abbruch vor Matchstart: Eine Person kann ein noch nicht aktives privates Match abbrechen; beide Seiten sehen einen klaren Endzustand.
- Aktives Spiel aufgeben: Eine Person kann nach Bestaetigung aufgeben; die Gegenseite sieht das Ergebnis eindeutig.
- Alte Join-Links und Session-/Reconnect-Tokens eines zurückgenommenen Matches werden nicht weiterverwendet.
- Reconnect auf abgebrochene oder aufgegebene Matches zeigt keinen falschen Wartezustand.
- Umsetzung muss vorab klaeren, ob aktive Aufgabe als Engine-Game-Ende, Server-Match-Metadatum oder expliziter terminaler Matchstatus modelliert wird.
- Replay, StateHash, PublicGameEvents, ResultSummary und Hidden-Info-Grenzen duerfen nicht implizit veraendert werden.

### Gegnernamen sichtbar anzeigen

Die Anzeige des gegnerischen Anzeigenamens soll nach dem Beitritt und im aktiven Match sichtbarer werden.

- Lobby, Spielkopf und Reconnect-Zustand zeigen den Anzeigenamen der Gegenseite, sobald diese Session bekannt ist.
- Die Anzeige bleibt Match-Metadatum und transportiert keine gegnerischen Decknamen, Deckhashes, Decklisten oder versteckten Kartendaten.
- Fallbacks fuer noch nicht verbundene, getrennte oder wiederverbundene Gegenseiten bleiben verstaendlich.
- Tests muessen absichern, dass nur Anzeigename und Verbindungsstatus ergaenzt werden, nicht Deck- oder Tokeninformationen.

### Deutsche Regelbegriffe und UI-Glossar

Die laufende UI nutzt aktuell an mehreren Stellen gemischte deutsche und englische Run-Begriffe, zum Beispiel `Approach`, `Encounter`, `Break` und `Access`. Vor einer Umbenennung sollte ein deutscher Regeltext- oder Handbuchabgleich erfolgen.

- Quelle pruefen: deutsches Handbuch oder offizielles deutschsprachiges Glossar als lokale Projektquelle aufnehmen, falls vorhanden und nutzbar.
- Mapping dokumentieren: technische Engine-IDs bleiben englisch, sichtbare UI-Begriffe koennen deutsch lokalisiert werden.
- Konsistenz pruefen: Run-Zeitstrahl, Chronik, Aktionsbuttons, Tooltips und Eventtexte sollen dieselben sichtbaren Begriffe verwenden.
- Hidden-Info-, Replay-, StateHash-, AI- und PublicEvent-Vertraege duerfen durch die Lokalisierung nicht veraendert werden.

### Serverlayout und ICE-Ausrichtung

Die visuelle Darstellung zentraler Server soll gegen Handbuch, Spielpraxis und vorhandene UI-Konventionen geprueft werden.

- Pruefen, ob ICE vor zentralen Servern wie `HQ`, `R&D` und `Archives` in der physischen Darstellung gedreht bzw. quer ausgerichtet dargestellt werden sollte.
- Pruefen, ob Remote-Server, zentrale Server, Root-Karten und ICE-Lanes visuell unterscheidbarer werden muessen.
- Umsetzung nur als reine Darstellung: Keine Aenderung an Engine, Serverstruktur, PlayerView, Hidden-Info, Replay, StateHash, AI oder PublicGameEvents.
- Bei Umsetzung responsive Layout und Lesbarkeit testen, damit gedrehte Karten oder Labels nicht ueberlappen.

### Spieloberflaeche und Informationsarchitektur

Die aktive Spieloberflaeche braucht einen eigenen UX-Pass, damit wichtige Informationen sichtbar bleiben, ohne Platz mit dauerhaft offenen Nebenoptionen zu verbrauchen.

- Pruefen, welche Einstellungen im Spiel nur als aufklappbare Werkzeuge erreichbar sein sollen, zum Beispiel Audio, Kartendarstellung und Diagnose.
- Pruefen, welche Informationen dauerhaft sichtbar sein muessen, zum Beispiel eigene Hand, relevante Server, gegnerisches Runner-Rig, aktuelle Choices und Run-Status.
- Pruefen, ob rechte/linke Seitenleisten, Overlays und einklappbare Bereiche fuer schmale Fenster anders priorisiert werden muessen.
- Umsetzung darf keine neuen Regeln, PublicEvents, StateHash-, Replay-, AI- oder Hidden-Info-Vertraege einfuehren.

## Vorlaeufige Testideen

- Server: Lobby-Abbruch und Aufgabe erzeugen reproduzierbare terminale Payloads fuer beide Seiten.
- Server: Reconnect auf abgebrochene/aufgegebene Matches liefert denselben terminalen Status.
- Web: Abbruch-/Aufgabe-Buttons haben Bestaetigungszustand und klare Resultanzeige.
- Web: Zurückgenommenes Match fuehrt zur Matchstart-Maske zurueck, alte Join-Daten sind sichtbar ungueltig.
- Web: Run-Zeitstrahl und Chronik nutzen einheitliche zentrale Serverlabels wie `HQ`, `R&D`, `Archives` und `Remote N`.
- Web: Lokalisierte Run-Begriffe sind per Glossar-Test gegen die freigegebene Quelle abgesichert.
- Web/Browser-Smoke: Zentrale Server und ICE-Ausrichtung sind auf Desktop und schmalem Fenster lesbar und ueberlappungsfrei.
- Web/Browser-Smoke: Aufklappbare Spieloptionen verdecken keine Pflichtinformationen dauerhaft und bleiben mit Tastatur/Maus bedienbar.
- Visibility: Gegnername ist erlaubt, Gegnerdecks, Tokens und versteckte Kartendaten bleiben verboten.

## Gate-Hinweis

Vor Umsetzung braucht V1.0.4 einen kleinen Requirements-Freeze auf Basis von `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md`, besonders fuer die Frage, wie aktive Aufgabe mit Engine, Replay, StateHash und Ergebnisdarstellung zusammenspielt.
