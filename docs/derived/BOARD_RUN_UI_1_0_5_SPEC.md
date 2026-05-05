# Board and Run UI 1.0.5 Spec

Stand: 2026-05-05
Status: frozen_for_implementation

## Zweck

Diese Spezifikation beschreibt die V1.0.5-Darstellung von RunTimeline, Runner-Rig, zentralen Servern, Server-Lanes, ICE-Ausrichtung, Counts und Archives-/Archive-Sichtbarkeit.

Alle Regeln in diesem Dokument sind Darstellungsregeln. Sie verändern keine Engine-Zustände, keine LegalActions, keine PlayerActions, keine PlayerViews, kein Replay und keinen StateHash.

## Datenquellen

Erlaubt:

- `PlayerView.side`
- `PlayerView.activeSide`
- `PlayerView.run`
- `PlayerView.servers`
- `PlayerView.own`
- `PlayerView.opponent` mit bereits side-sicheren Counts und public Rig-Daten
- `LegalActions`
- side-gefilterte `PublicGameEvent`s
- side-sichere Card Catalog Details nur für bereits sichtbare Karten
- lokale UI-Einstellungen wie CardDisplayMode, Farbe, Audio und reduzierte Bewegung

Nicht erlaubt:

- `GameState`
- `cardInstances` aus FullState
- private Payloads
- vollständige Decklisten
- Session-/Reconnect-/Invite-Tokens
- verdeckte Card-Definition-IDs oder Bildpfade
- künftige Breach-/Access-Queue-Karten vor ihrem legalen Access

## RunTimeline

### Ziel

Die RunTimeline soll beantworten:

1. Welcher Server wird angegriffen?
2. Wo im Run steht der Runner?
3. Ist gerade Annäherung, Begegnung, Bewegung, Zugriff oder Abschluss?
4. Gibt es ein Jack-out-Fenster?
5. Welche ICE/Karte ist gerade sichtbar relevant?
6. Ist der Zugriff bereits in einer Zugriffsphase/Breach-Queue?

### Phasenmodell für die UI

| Engine-/Runphase | Sichtbares Label | Kurzbeschreibung |
| --- | --- | --- |
| kein aktiver Run | Kein aktiver Run | Keine Timeline-Phase aktiv. |
| Ziel/Start | Ziel | Run wurde angesagt, Zielserver sichtbar. |
| `approach_ice` | Annäherung | Runner nähert sich ICE. |
| `encounter_ice` | Begegnung | ICE-Begegnung läuft; gerezztes ICE und Subroutinen/Breaker-Fokus. |
| `break` oder Breaker-Actions offen | Brechen | Runner kann pumpen/brechen oder Begegnung fortsetzen. |
| `movement` | Bewegung | ICE wurde passiert; Runner kann weiterlaufen oder im erlaubten Fenster abbrechen. |
| `access` ohne aktiven aktuellen Access | Zugriffsphase | Erfolgreicher Run; Breach/Access-Queue wird verarbeitet. |
| aktueller `access_card`/offene Access-Choice | Zugriff | Genau eine Karte ist legal zugreifbar oder gerade sichtbar. |
| `complete` oder Run-Ende | Abschluss | Run ist beendet oder Ergebnis wird gezeigt. |

`Approach`, `Encounter`, `Break`, `Access` und `Breach` sind nicht als normale Hauptlabels erlaubt.

### Darstellung

RunTimeline besteht aus:

- Headline: `Run auf <Serverlabel>` oder `Kein aktiver Run`.
- Phasenleiste mit stabilen Segmenten: `Ziel`, `Annäherung`, `Begegnung`, `Brechen`, `Bewegung`, `Zugriff`, `Abschluss`.
- Aktuelles Segment visuell markiert.
- Encounter-Fokus, wenn `view.run.encounteredIce` vorhanden ist.
- Jack-out-Hinweis, wenn LegalActions `jack_out` enthalten.
- Zugriff-Fortschritt, wenn `view.run.breach` side-sichere öffentliche Fortschrittsdaten enthält.

### Encounter-Fokus

Wenn das aktuelle ICE sichtbar ist:

- Titel, Typ und side-sicherer Regeltext dürfen angezeigt werden.
- Highlight darf auf sichtbare ICE-Karte und RunTimeline zeigen.

Wenn das aktuelle ICE nicht sichtbar ist:

- Label: `Verdecktes ICE`
- kein Titel, keine Definition-ID, keine Bild-URL, keine unterscheidbare verdeckte Darstellung.

### Jack-out

Wenn `jack_out` legal ist:

- Hinweis: `Du kannst den Run jetzt abbrechen (Jack-out).`
- Action bleibt im Panel `Mögliche Aktionen`.
- Timeline markiert `Bewegung`.

Wenn `jack_out` nicht legal ist:

- Kein dauerhafter erklärender Text nötig.
- Kein ausgegrauter Button, der einen nicht vorhandenen LegalAction-Pfad suggeriert.

### Zugriff und Zugriffsphase

Bei Breach/Multiaccess:

- Die UI darf zeigen, dass eine Zugriffsphase läuft.
- Erlaubt sind abstrakte Counts/Fortschritt wie `Zugriff 1 von 2`, wenn diese Daten side-sicher im PlayerView oder PublicEvent vorhanden sind.
- Nicht erlaubt sind Titel, Definition-IDs oder Bilder künftiger Queue-Karten.
- Die aktuell legal accessete Karte darf nach `access_card` wie bisher sichtbar werden.

## Zentrale Server

### Labels

| Server-ID | Hauptlabel | Zusatz |
| --- | --- | --- |
| `hq` | HQ | optional `Hand der Corp` als Tooltip/Meta für Anfänger. |
| `rd` | F&E (R&D) | optional `Corp-Deck` als Tooltip/Meta. |
| `archives` | Archive | nicht `Archives` als normales deutsches Hauptlabel. |
| `remote_N` | Remote N | bestehende Nummerierung bleibt. |

Technische Server-IDs bleiben unverändert.

### Counts

Counts sind nur aus side-sicheren PlayerView-Daten abzuleiten:

| Server | Runner-Sicht | Corp-Sicht |
| --- | --- | --- |
| HQ | Count der Corp-Hand, keine Titel außer legal accessed/revealed | eigene HQ-Karten sichtbar, Count ableitbar |
| F&E/R&D | Count des Corp-Decks, keine Topkarten-Titel | eigene R&D-Karten nur so sichtbar wie PlayerView erlaubt |
| Archive | sichtbare Archive-Karten nach PlayerView, Count side-sicher | eigene Archive-Karten nach PlayerView |
| Remote | sichtbare/rezzed/public Karten; verdeckte Root/ICE anonym | Corp sieht eigene installierte Karten nach PlayerView-Vertrag |

Counts dürfen keine verdeckte Kartenidentität verraten. Wenn ein genauer Count für eine Seite nicht side-sicher vorhanden ist, wird kein Count angezeigt.

### Archive-Sichtbarkeit

Für V1.0.5 gilt der vorhandene Engine-/PlayerView-Vertrag:

- Archive werden verständlicher dargestellt, aber nicht regelmechanisch erweitert.
- Facedown-Archives-Ausbau bleibt außerhalb V1.0.5, soweit er nicht bereits in früheren engen Gates enthalten ist.
- Keine neue Archive-Reveal-Logik.
- Keine Anzeige künftiger Breach-Queue-Titel.

## Server-Lanes und ICE-Ausrichtung

### Zielbild

Ein Server zeigt mindestens:

- Serverkopf mit Label und Count/Meta.
- ICE-Lane.
- Root-/Serverkarten-Lane.
- Highlight-Zustand für Cues/Run.

### ICE-Reihenfolge

Die UI muss die vorhandene `server.ice`-Reihenfolge stabil darstellen. V1.0.5 darf die visuelle Richtung verbessern, aber nicht die semantische Reihenfolge ändern.

Empfehlung:

- Horizontal oder vertikal konsistent pro Viewport.
- Eindeutige Annäherungsrichtung markieren, z. B. `Runner nähert sich von außen`.
- Keine Sortierung nach Titel, Rez-Status, Typ oder Kosten.
- Keine Animation, die Kartenpositionen dauerhaft vertauscht.

### Remote- und zentrale Server

- HQ, F&E/R&D und Archive sind sichtbar als zentrale Server gruppiert.
- Remotes bleiben getrennte Serverkarten.
- ICE-Lanes sollen für zentrale und Remote-Server gleich logisch wirken.
- Root-Karten dürfen nicht mit ICE vermischt werden.

## Runner-Rig

### Sichtbarkeit

Das gegnerische Runner-Rig ist aus Corp-Sicht öffentlich, soweit `PlayerView.opponent.rig` diese Karten bereitstellt. Es darf keine Runner-Grip-, Stack- oder verdeckten Such-/Queue-Daten anzeigen.

Runner-Sicht hat weiterhin das eigene Rig im eigenen Boardbereich.

### Gruppierung

V1.0.5 gruppiert Rig-Karten:

| Kartentyp | Gruppe |
| --- | --- |
| `program` | Programme |
| `hardware` | Hardware |
| `resource` | Ressourcen |
| sonstige sichtbare Karte | Sonstiges |

Gruppen ohne Karten können ausgeblendet oder als kompakte Nullanzeige erscheinen. Wichtig ist, dass die Gruppe keine Information über nicht installierte oder verdeckte Karten andeutet.

### Darstellung

- Gruppentitel klein und scannbar.
- Karten bleiben als kompakte CardViews oder MiniCards sichtbar.
- Kein nested-card-in-card Layout.
- Bei schmalem Viewport gruppiert stapeln oder horizontal scrollbar machen, ohne RunTimeline zu verdrängen.
- Highlight auf Rig oder konkrete sichtbare Karte bleibt side-sicher.

## Eigene Hand/HQ und eigene Rig-Zone

V1.0.5 darf sichtbare Labels glätten:

- Runner eigene Hand: `Grip`
- Corp eigene Hand: `HQ`
- Runner eigene installierte Karten: `Rig`

Die UI darf eigene versteckte Karten der eigenen Seite anzeigen, soweit PlayerView das erlaubt. Das ist kein Leak, solange es nicht in gegnerische Payloads oder DOM-Zustände der Gegenseite gelangt.

## Layout- und Textfit-Regeln

- Boardsektionen haben stabile Größen oder responsive Constraints.
- Hover-/Highlight-Zustände dürfen Layout nicht verschieben.
- Buttons und Labels brechen um, statt aus ihrem Container zu laufen.
- Schmaler Viewport darf Panels stapeln, aber nicht unlesbar überlagern.
- Cue-Overlay darf RunTimeline, Action Panel oder Access-Entscheidung nicht dauerhaft verdecken.
- Reduzierte Bewegung respektiert `prefers-reduced-motion`.

## No-Leak-Prüfpunkte

V1.0.5-Board-/Run-UI darf nicht enthalten:

- `cardInstances` im Browsercode als FullState-Pfad,
- `GameState` im aktiven Browsercode,
- `privatePayload`,
- `sessionToken`,
- `reconnectToken`,
- `joinToken`,
- verdeckte Corp-HQ-/R&D-/unrezzed-Titel in Runner-Sicht,
- Runner-Grip-/Stack-Titel in Corp-Sicht,
- künftige Breach-Queue-Titel vor legalem Access,
- lokale verdeckte Bildpfade.

## Akzeptanz

Diese Spezifikation ist erfüllt, wenn:

- RunTimeline die Phase mit deutschen Labels klar zeigt,
- Jack-out-/Movement-Fenster verständlich sichtbar ist, wenn legal,
- Encounter und Zugriff side-sicher fokussiert sind,
- Runner-Rig aus Corp-Sicht nach Programmen/Hardware/Ressourcen gruppiert ist,
- HQ, F&E/R&D und Archive zentrale Server mit sicheren Counts und Lanes sind,
- Layout und Cues auf Desktop und schmalem Viewport nicht kollidieren,
- keine Engine-/Replay-/StateHash- oder Hidden-Info-Verträge geändert werden.
