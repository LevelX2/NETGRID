# V1.0.6 Browser-/Playtest-Smoke

Stand: 2026-05-05
Status: repeatable_smoke

## Zweck

Dieser Smoke prüft V1.0.6 in realen Browserflüssen. Er konzentriert sich auf Aktionen, Credits und Card Display. Er erweitert keine Regeln, Karten, offiziellen Assets oder Plattformfunktionen.

## Voraussetzung

- Server und Web laufen lokal.
- Mindestens ein Human-vs-KI-Spiel kann gestartet werden.
- Für Zwei-Seiten-Stichproben sind zwei Tabs oder zwei Browserprofile verfügbar.
- Schmaler Viewport kann per DevTools oder Fenstergröße geprüft werden.

## Smoke A: Aktionen im eigenen Zug

1. Starte ein Spiel als Runner.
2. Prüfe den eigenen Statusbereich.
3. Erwartung:
   - Label lautet `Aktionen`, nicht `Clicks` oder `Klicks`.
   - Vier eckige Slots sind verfügbar.
   - Credit-Anzeige sieht nicht wie diese Slots aus.
4. Führe eine Aktion aus, z. B. Credit nehmen.
5. Erwartung:
   - Ein Slot ist verbraucht/gefüllt/gedämpft.
   - Verbleibende Slots bleiben leer/hell.
   - Zahl und Slots widersprechen sich nicht.

## Smoke B: Corp-Aktionsbudget

1. Wechsle oder starte ein Spiel in Corp-Sicht.
2. Prüfe den Corp-Turn.
3. Erwartung:
   - Corp zeigt drei verfügbare Aktionen.
   - Nach einer Aktion sind ein verbrauchter und zwei verfügbare Slots sichtbar.
   - Off-Turn-Anzeigen sind gedämpft oder kompakt und suggerieren keine geplanten Actions.

## Smoke C: Bonusaktionen

1. Nutze eine Testfixture, einen UI-Unit-Zustand oder eine spätere Karte, die mehr verbleibende Aktionen liefert als die normale Side-Basis.
2. Erwartung:
   - Die Slotanzeige erweitert sich um zusätzliche Slots.
   - Zusätzliche Slots erscheinen nicht als Credits, Agenda oder Tags.
   - Die Erweiterung bleibt rein lokal sichtbar.

## Smoke D: Credits

1. Prüfe Spieler- und Gegnerstatus.
2. Erwartung:
   - Credits zeigen Zahl plus generisches Münz-/Credit-Symbol.
   - Credits sind klar von Aktionsslots unterscheidbar.
   - Es werden keine offiziellen Symbole, Logos oder Card-Frame-Elemente verwendet.
3. Führe eine Credit-Aktion aus.
4. Erwartung:
   - Credit-Zahl ändert sich korrekt.
   - Credit-Optik bleibt stabil und verursacht keine Layoutsprünge.

## Smoke E: Kostenchips

1. Öffne `Mögliche Aktionen`.
2. Prüfe Aktionen mit Action- und Credit-Kosten.
3. Erwartung:
   - Kosten erscheinen als verständliche Chips, z. B. `1 Aktion`, `2 Credits`.
   - Rohe technische Kostenobjekte sind nicht sichtbar.
   - Action- und Credit-Kosten sind visuell unterscheidbar.

## Smoke F: Kartenanzeige-Steuerung

1. Fokussiere eine bekannte Karte.
2. Prüfe die rechte Vorschau.
3. Erwartung:
   - Modusbuttons sitzen kompakt am oder direkt über dem Vorschau-Header.
   - Keine große gerahmte `Card Display`-Box belegt in der aktiven rechten Spalte Platz.
   - Die sichtbaren Labels sind deutsch oder sinnvoll als Icon-Tooltips zugänglich.

## Smoke G: Bildmodus

1. Wähle Bildmodus.
2. Prüfe eine Karte mit Bild und eine bekannte Karte ohne Bild.
3. Erwartung:
   - Vorhandenes Bild wird angezeigt.
   - Bei fehlendem Bild erscheint ein informativer Text-Fallback statt großer leerer Fläche.
   - Regeltext ist per Tooltip/Fokus/Overlay erreichbar.

## Smoke H: Textmodus

1. Wähle Textmodus.
2. Prüfe eine bekannte Karte mit Regeltext.
3. Erwartung:
   - Titel, Typ/Subtypen, relevante Werte und Regeltext sind direkt in der Kartenfläche sichtbar.
   - Es gibt keine große leere Art-Fläche.
   - Unterhalb der Karte wird derselbe Regeltext nicht noch einmal doppelt angezeigt.

## Smoke I: Kompaktmodus

1. Wähle Kompaktmodus.
2. Prüfe die rechte Spalte mit Chronicle/Log darunter.
3. Erwartung:
   - Die Kartenpreview ist deutlich kleiner als Text-/Bildmodus.
   - Regeltext ist per Tooltip, Fokus-Overlay oder gleichwertiger Interaktion erreichbar.
   - Der Chronicle/Log gewinnt sichtbar Platz.
   - Keine große leere Fläche bleibt zurück.

## Smoke J: Tooltip, Fokus und schmaler Viewport

1. Prüfe Tooltips per Maus und Tastaturfokus.
2. Stelle einen schmalen Viewport ein.
3. Erwartung:
   - Tooltip/Overlay bleibt im sichtbaren Bereich.
   - Modusbuttons bleiben bedienbar.
   - Texte laufen nicht aus Buttons, Slots oder Preview.
   - Kompaktmodus bleibt wirklich kompakt.

## Smoke K: Hidden-Info-Stichprobe

1. In einem Zwei-Tab-Spiel installiert die Corp eine verdeckte Karte.
2. Runner fokussiert die verdeckte Karte oder den zugehörigen Platzhalter.
3. Erwartung:
   - Keine verdeckten Titel.
   - Keine Definition-ID.
   - Keine Bild-URL.
   - Keine kartenspezifische CSS-Klasse oder Tooltip-Information.
   - Card-Display-Moduswechsel öffnet keine versteckten Daten.

## Pflicht-Stichproben

- Browsercode importiert keine Engine-Regelmodule in die aktive Spielseite.
- Neue lokale UI-State-Werte für Aktionsslots erscheinen nicht in WebSocket-, Reconnect-, Server-, Replay- oder StateHash-Daten.
- Credit-Symbole sind generisch.
- Bestehende V1.0.5-Funktionen bleiben sichtbar bedienbar.

## Ergebnisnotiz für Final Review

Nach Umsetzung soll der Final Review pro Smoke A bis K festhalten:

- `pass`, `partial` oder `fail`,
- getesteter Browser/Viewport,
- auffällige UI-Restpunkte,
- Hidden-Info-/Payload-Auffälligkeiten,
- ob automatisierte Tests dieselbe Stelle bereits abdecken.
