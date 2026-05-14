# Resource and Card Display 1.0.6 Spec

Stand: 2026-05-05
Status: frozen_for_implementation_after_v1_0_5

## Zweck

Diese Spezifikation beschreibt die V1.0.6-Darstellung von Aktionen, Credits und Card Display in der aktiven Spieloberfläche. Sie ist eine reine UI-Spezifikation und erweitert keine Rules Engine.

## Grundsätze

- `clicks` bleibt der technische Engine- und Shared-Type-Begriff.
- Sichtbar heißt die Ressource `Aktionen`.
- Credits bleiben sichtbar `Credits`, erhalten aber eine generische Münz-/Credit-Optik.
- Bild-, Text- und Kompaktmodus sollen Platz und Informationsdichte bewusst steuern.
- Jede Darstellung nutzt nur side-sichere Daten.

## Erlaubte Datenquellen

Erlaubt:

- `PlayerView.side`
- `PlayerView.activeSide`
- `PlayerView.own.clicks`
- `PlayerView.opponent.clicks`
- `PlayerView.own.credits`
- `PlayerView.opponent.credits`
- `LegalActions.costs`
- bekannte/sichtbare `VisibleCard`-Daten aus PlayerView oder Katalogdetails für bereits sichtbare Karten
- lokale UI-Einstellungen wie CardDisplayMode
- tab-lokaler React-State für die aktuelle Action-Slot-Anzeige

Nicht erlaubt:

- `GameState`
- private Payloads
- verdeckte Card-Definition-IDs
- verdeckte Bildpfade
- Decklisten, Tokens oder Reconnect-Token
- Replay-/StateHash-Schreibpfade

## Aktionsanzeige

### Sichtbares Modell

Die sichtbare Ressource heißt `Aktionen`.

Darstellung:

- eckige kleine Slots,
- verfügbar: leer oder hell,
- verbraucht: gefüllt, gedämpft oder grau,
- Bonusaktion: zusätzlicher Slot mit derselben Grundform, optional mit dezentem Bonuszustand.

Die Anzeige soll in Spielerstatus und optional im Gegnerstatus erscheinen. Die eigene Anzeige hat Priorität.

### Normalwerte

Für die erste V1.0.6-Umsetzung gelten als normale Basis:

- Runner: 4 Aktionen,
- Corp: 3 Aktionen.

Diese Werte sind UI-Basiswerte für die Slotdarstellung und ändern keine Engine-Regeln. Wenn `PlayerView.clicks` bei Turnbeginn einen anderen Wert liefert, gewinnt der side-sichere PlayerView-Wert für die sichtbare Slotkapazität.

### Lokale Kapazitätsableitung

Die UI führt pro sichtbarer Seite eine tab-lokale Displaykapazität:

1. Bei Turnwechsel oder neuem Match wird die Kapazität für die aktive Seite auf `max(sideBasis, currentClicks)` gesetzt.
2. Verfügbare Slots entsprechen `currentClicks`.
3. Verbrauchte Slots entsprechen `max(0, displayCapacity - currentClicks)`.
4. Wenn `currentClicks` im Turn durch Karten- oder Regelwirkungen steigt, wird die Kapazität aus `bereits in diesem Zug ausgegebenen Aktionskosten + currentClicks` abgeleitet. Zusätzliche Aktionen erscheinen dadurch als echte weitere Slots, z. B. Korp-Aktionen 4 und 5 nach `Gain two actions`.
5. Bei Seitenwechsel wird die Kapazität der neuen aktiven Seite neu initialisiert.

Diese Ableitung ist nur Anzeige. Sie wird nicht persistiert und nicht an Server oder Engine gesendet.

### Off-Turn und Gegnerstatus

Für die nicht aktive Seite darf die Anzeige kompakter sein:

- `0 Aktionen` oder leere/gedämpfte Slots, wenn die PlayerView `0` liefert,
- keine Vermutung über künftige nächste Turn-Aktionen,
- keine Anzeige gegnerischer geplanter Choices.

Gegnerische Aktionsslots dürfen nur aus `view.opponent.clicks` entstehen. Sie dürfen keine verdeckten Karten- oder Planinformationen enthalten.

### Kostenchips

LegalAction-Kosten sollen als kurze Chips dargestellt werden:

- `1 Aktion`
- `2 Aktionen`
- `3 Aktionen`
- `4 Credits`
- Kombinationen wie `1 Aktion + 2 Credits`

Die visuelle Form:

- Aktionen: eckiges Mini-Slot-Symbol oder eckiger Chip.
- Credits: runde/generische Münzoptik oder Coin-Chip.

Rohe Kostenobjekte wie `{ clicks: 1, credits: 2 }` sind im normalen UI-Text nicht erlaubt.

## Credit-Anzeige

### Ziel

Credits sollen auf einen Blick als Geld-/Wirtschaftsressource erkennbar sein und nicht wie ein weiterer Zählerkasten neben Aktionen wirken.

### Darstellung

Die Anzeige besteht aus:

- Zahl,
- Label `Credits`,
- generischem Coin-/Credit-Symbol,
- optionalem kleinen Stapel-/Münzhintergrund.

Die Credit-Optik darf über CSS oder ein generisches Icon entstehen. Sie darf kein offizielles NETGRID-Symbol, keine offiziellen Assets und keine Card-Frame-Bestandteile verwenden.

### Abgrenzung zu Aktionen

| Ressource | Form | Bedeutung |
| --- | --- | --- |
| Aktionen | eckige Slots/Kästchen | verfügbare und verbrauchte Handlungspunkte |
| Credits | runde Münze/Coin-Badge | Geldressource |
| Agenda | eigener Score-Badge | Siegfortschritt |
| Tags | eigener Warn-/Status-Badge | Runner-Status |

Credits und Aktionen dürfen nicht dieselbe Slotform verwenden.

## Card-Display-Steuerung

### Platzierung

Im aktiven Spiel sitzt die Modussteuerung in oder direkt über der Card Preview:

- neben `Vorschau`,
- an Stelle oder in Nähe des bisherigen Eye-Icons,
- als kleine Icon-/Segmentbuttons,
- ohne eigenen großen gerahmten Einstellungsblock.

Die große `Card Display`-Box mit eigener Außenlinie ist in der aktiven rechten Detailspalte nicht zulässig. In globalen Optionen oder Diagnosebereichen darf eine ausführlichere Einstellung existieren, wenn sie keinen Boardplatz verbraucht.

### Labels

Sichtbare Labels:

- `Kartenanzeige` als Tooltip/technische Einstellungsbezeichnung,
- `Bild`,
- `Text`,
- `Kompakt`.

Die Buttons müssen `aria-label`s haben, z. B. `Bildmodus`, `Textmodus`, `Kompaktmodus`.

## Card-Display-Modi

### Bildmodus

Aufgabe:

- zeigt das vorhandene lokale Kartenbild, wenn für eine bekannte Karte ein Bild verfügbar ist,
- nutzt bei fehlendem Bild einen informativen Text-Fallback statt leerer großer Fläche,
- zeigt Regeltext für bekannte Karten per Tooltip, Fokus-Overlay oder kompakter Zusatzinteraktion.

Nicht erlaubt:

- offizielles Card Back für verdeckte Karten,
- unterscheidbare verdeckte Ladezustände,
- große leere Fläche bei fehlendem Bild.

### Textmodus

Aufgabe:

- zeigt eine dichte Textkarte,
- nutzt Kartenfläche für Titel, Typ/Subtypen, Stärke, Kosten und Regeltext,
- spart den großen Art-Bereich weitgehend ein.

Nicht erlaubt:

- eine große leere Art-Fläche oberhalb des Texts,
- Regeltext nur in einem zweiten Block unterhalb der Karte,
- unlesbare abgeschnittene Regeln in der Card Preview.

### Kompaktmodus

Aufgabe:

- spart vertikalen Platz,
- zeigt mindestens Titel und wichtigste Kurzinfos,
- macht Regeltext per Tooltip, Fokus-Overlay oder Detail-Ausklappung erreichbar,
- hält darunter Platz für Chronicle/Log frei.

Nicht erlaubt:

- eine Preview-Fläche in nahezu derselben Größe wie Textmodus,
- eine große leere Fläche ohne Karteninformation,
- Tooltip nur per Maus ohne Tastaturäquivalent.

## Card Preview Panel

### Informationsregeln

Die Preview darf anzeigen:

- sichtbaren Kartentitel,
- Typ/Subtypen,
- Stärke, Kosten, Advancement- oder andere sichtbare Werte,
- Regeltext bekannter Karten,
- verdeckten Platzhalter für unbekannte Karten.

Die Preview darf nicht anzeigen:

- verdeckte Titel,
- Definition-IDs,
- Bildpfade verdeckter Karten,
- kartenspezifische CSS-Klassen für verdeckte Karten,
- Daten aus nicht sichtbaren Zonen.

### Deduplikation

Wenn ein Modus Kerndaten und Regeltext bereits auf der Karte sichtbar macht, darf darunter kein zusätzlicher `Regeltext`-Block mit denselben Informationen stehen.

Zusatzdetails unter der Preview sind nur erlaubt, wenn:

- der aktive Modus diese Information absichtlich ausblendet,
- der Zusatzblock kompakt ist,
- keine Dublette entsteht,
- die rechte Spalte dadurch nicht den Chronicle verdrängt.

### Leerer Zustand

Wenn keine Karte fokussiert ist:

- kurzer Text: `Wähle eine Karte für die Vorschau.`,
- keine große leere Card-Fläche,
- keine permanente Erklärung der Display-Modi.

## Tooltip- und Overlay-Regeln

- Tooltip/Fokus-Overlay muss per Hover und Tastaturfokus oder per Klick erreichbar sein.
- Tooltip bleibt im Viewport oder klappt nach oben/unten um.
- Tooltip darf nicht vom rechten Panel abgeschnitten werden.
- Tooltip darf keine verdeckten Kartendaten enthalten.
- Auf schmalem Viewport darf ein Klick-/Fokus-Overlay statt Hover-Tooltip verwendet werden.

## Responsive Verhalten

Desktop:

- rechte Spalte zeigt Vorschau, Status und Chronicle ohne unnötige Doppelrahmen,
- Modusbuttons sind klein und stabil,
- Textmodus und Kompaktmodus sparen sichtbar Platz gegenüber Bildmodus.

Schmaler Viewport:

- Modusbuttons bleiben bedienbar,
- keine auslaufenden Buttontexte,
- Tooltips/Overlays bleiben sichtbar,
- Chronicle/Log wird nicht dauerhaft aus dem Blick gedrückt.

## Akzeptanz

Diese Spezifikation ist erfüllt, wenn:

- Aktionen als Aktionen benannt und als eckige Slots dargestellt sind,
- Credits eine klare generische Münzoptik haben,
- Kostenchips Aktionen und Credits unterscheiden,
- Card-Display-Steuerung kompakt am Preview sitzt,
- Bild/Text/Kompakt nicht redundant wirken,
- Textmodus keine große leere Fläche nutzt,
- Kompaktmodus tatsächlich Platz spart,
- Kartendetails nicht unnötig doppelt erscheinen,
- alle neuen Darstellungen side-sicher bleiben.
