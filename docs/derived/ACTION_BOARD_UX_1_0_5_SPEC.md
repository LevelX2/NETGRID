# Action Board UX 1.0.5 Spec

Stand: 2026-05-05
Status: frozen_for_implementation

## Zweck

Diese Spezifikation beschreibt die aktive Spieloberfläche für V1.0.5 aus Sicht der Präsentationsschicht: Gegneraktions-Cues, Board-Fokus, lokale Entscheidungen, Audio-/Optionen, Spielerperspektive und deutsche sichtbare Hauptbegriffe.

Die Spezifikation erweitert nicht die Rules Engine. Sie beschreibt ausschließlich, wie vorhandene side-sichere Daten auf dem Board dargestellt werden.

## Grundsätze

- Die Rules Engine bleibt alleinige Regelautorität.
- UI, Audio, Highlights und Cues sind lokale Präsentation.
- Die UI nutzt nur `PlayerView`, `LegalActions`, side-gefilterte PublicEvents, side-sichere Match-Payloads und lokale UI-Einstellungen.
- Keine Darstellung darf aus `GameState`, privaten Payloads, Tokens, Decklisten, verdeckten Card-IDs oder lokalen verdeckten Bildpfaden abgeleitet werden.
- Eigene und gegnerische Aktionen müssen schnell erfassbar sein, ohne das Board dauerhaft zu verdecken.
- Deutsche sichtbare Begriffe folgen `docs/derived/V1_0_5_REQUIREMENTS.md`.

## Informationsarchitektur im aktiven Spiel

Die aktive Spieloberfläche hat fünf Hauptbereiche:

| Bereich | Aufgabe | V1.0.5-Regel |
| --- | --- | --- |
| Topbar | Versions-/Session-Kontext, Verbindung, Audio, Link, Aufgabe, Verwerfen | Bleibt kompakt; Audio bleibt Popover, kein dauerhaft offenes Optionspanel. |
| Linke Spalte | Gegnerstatus, KI-Takt, mögliche Aktionen, Zurücknehmen | Entscheiden und Zurücknehmen sind sofort erreichbar; keine technischen Überschriften. |
| Boardmitte | Spielerperspektive, Runner-Rig, RunTimeline, Server, eigene Zone | Primärer Spielzustand, darf nicht durch Cues dauerhaft verdeckt werden. |
| Rechte Spalte | Card Preview, Spielerstatus, Chronicle, Diagnostics | Detail- und Verlaufsebene, keine primären Aktionsbuttons verstecken. |
| Overlay/Highlight | Kurze Gegneraktion, lokaler Fokus | Nur temporär; muss dismissbar sein und darf keine verdeckten Daten enthalten. |

## Sichtbare Labels

### BoardHeader

Statt `Runner View` oder `Corp View`:

- Runner-Seite: `Deine Runner-Sicht`
- Corp-Seite: `Deine Corp-Sicht`

Aktivitätszeile:

- Eigene Seite aktiv: `Du bist am Zug`
- Gegenseite aktiv: `Gegenseite ist am Zug`
- Eigene Choice offen: `Du bist gefragt`
- KI aktiv: `KI-Zug läuft` oder `KI wartet auf Schritt`, je nach Pacing.

### Action Panel

Statt `LegalActions`:

- Panel-Überschrift: `Mögliche Aktionen`
- Leerer Zustand: `Keine Aktion in diesem Fenster.`
- Action-Gruppen dürfen nicht aus rohem `action.type.replaceAll("_", " ")` als Endnutzertext entstehen. Sie müssen über ein UI-Mapping laufen.

Empfohlenes Gruppenmapping:

| Action-Typ-Familie | Gruppe |
| --- | --- |
| `draw_card`, `mandatory_draw` | Karten ziehen |
| `gain_credit` | Credits |
| `install_card` | Installieren |
| `play_event`, `play_operation` | Spielen |
| `start_run`, `continue_run`, `jack_out` | Run |
| `rez_ice`, `decline_rez`, `break_subroutine`, `pump_breaker` | Begegnung |
| `access_card`, `trash_accessed_card`, `decline_trash`, `steal_agenda` | Zugriff |
| `score_agenda`, `advance_card` | Agenda/Server |
| `remove_tag`, `trash_resource` | Tags/Ressourcen |
| `purge_virus_counters` | Virus-Counter |
| unbekannt | Weitere Aktionen |

Action-Button-Labels aus der Engine dürfen verwendet werden, wenn sie nutzerverständlich sind. Rohe ActionTypes sind nicht als Haupttext erlaubt.

### Undo Panel

Statt `Undo`:

- Panel-Überschrift: `Zurücknehmen`
- Button: `Letzte Aktion anfragen`
- Eingehende Anfrage: `<Runner/Corp> fragt Zurücknehmen an.`
- Blockiert nach Hidden Info: `Nach verdeckter Information ist Zurücknehmen nicht möglich.`

Der technische Begriff `Undo` darf in Debug-/Diagnosekontext vorkommen, nicht im normalen aktiven Spielpanel.

### Reconnect

Statt normalem Hauptlabel `Reconnect`:

- Button: `Wieder verbinden`
- Tooltip oder technische Detailzeile darf `Reconnect` nennen.

## Gegneraktions-Cues

### Platzierung

V1.0.5-Cues dürfen nicht mittig als dauerhaftes Modal wirken. Empfohlen:

- Desktop: rechts oben oder oberhalb der rechten Detailspalte, ohne RunTimeline/ServerGrid zu verdecken.
- Schmaler Viewport: kompakter Toast unter Topbar oder am unteren Rand, mit maximaler Breite und Auto-Dismiss.
- Cue muss per Button dismissbar sein.
- Cue darf Board-Highlights triggern, aber keine Layoutgröße des Boards verändern.

### Inhalt

Ein Cue zeigt:

- Akteur: `Runner`, `Corp`, Anzeigename oder `Corp-KI`/`Runner-KI`.
- Titel in normalem Deutsch.
- Optionale Beschreibung aus side-sicherem Chronicle-/AI-Text.
- Optionaler kurzer Status wie `Du bist gefragt`.

Nicht erlaubt:

- `aiReasonCode` als sichtbarer Haupttext.
- `cardDefinitionId`, private `cardInstanceId`, Session-/Reconnect-/Invite-Tokens.
- verdeckte Kartentitel oder Bilddaten.
- rohe technische ActionTypes als Haupttext.

### Redaction

Verdeckte gegnerische Corp-Installationen bleiben anonym:

- Titel: `Die Corp hat eine verdeckte Karte installiert.`
- Optionaler Server: `in Remote 1`, wenn der Server aus side-sicherem Payload/PlayerView kommt.
- Highlight: abstrakter Server-/Lane-Fokus.
- Sound: generischer verdeckter Installationssound, nicht kartenspezifisch.

## Highlight-Regeln

Highlights dürfen nur auf abstrakte oder sichtbare Bereiche zeigen:

| Highlight | Erlaubt | Nicht erlaubt |
| --- | --- | --- |
| Server | HQ, R&D/F&E, Archive, Remote N, ICE-/Root-Lane | verdeckte Kartentitel oder versteckte Card-IDs |
| Karte | nur sichtbare Karte aus PlayerView oder bewusst public Event | verdeckte Corp-Karte |
| Zone | Grip/HQ/Stack/R&D/Archive/Rig/ScoreArea als Count oder public Zone | verdeckte Titel |
| Run | Zielserver, aktuelle Runphase, Encounter-Fokus | künftige Breach-Queue |
| Decision | eigene Actions/Choice | gegnerische private Choice |

Highlights sind kurz, ruhig und dürfen durch `prefers-reduced-motion` reduziert werden.

## Lokale Aufmerksamkeit

Wenn nach gegnerischem Event eine lokale Choice oder eigene LegalActions offen sind:

- Cue darf `Du bist gefragt` anzeigen.
- Action Panel oder Choice-Bereich wird hervorgehoben.
- KI-Pacing im `paced`/`manual`-Modus wartet auf lokale Handlung.
- Human-vs-Human wird dadurch nicht remote blockiert.

## Audio und Optionen

Audio bleibt:

- opt-in,
- lokal synthetisiert,
- tab-lokal oder browserlokal gespeichert,
- ohne Server-/Engine-/Replay-/StateHash-Wirkung.

V1.0.5-Darstellung:

- Topbar zeigt einen Icon-Button für Audio.
- Klick öffnet ein Popover mit Ein/Aus und Lautstärke.
- Das Popover nimmt keinen dauerhaften Boardplatz ein.
- Beim Aktivieren darf ein kurzer Testton Audio entsperren.
- Alte Bootstrap-/Reconnect-Events lösen keinen Ton aus.

## KI-Pacing Controls

KI-Takt bleibt erreichbar, aber nicht dominanter als Spieleraktionen:

- `paced`: `Getaktet`
- `manual`: `Einzelschritt`
- `fast`: `Schnell`
- Advance-Button: `KI-Schritt`
- Bei nicht aktiver KI: Button deaktiviert mit sicherem Hinweis.

Die Controls ändern nur Orchestrierung/Präsentation. Sie erzeugen keine Engine-Regelentscheidung und geben der KI keine zusätzlichen Daten.

## Chronicle

Chronicle bleibt Detailhistorie. Es darf technische Details stärker enthalten als die Board-Hauptfläche, aber:

- normale Eventtitel und Chips folgen dem V1.0.5-Glossar,
- Hidden-Info-Redaction bleibt identisch zu V1.0.2,
- alte Events nach Reconnect erscheinen nur im Chronicle, nicht als neue Audio-/Overlay-Cues,
- StateHash darf in Diagnostics/Review-Kontext sichtbar bleiben, aber nicht als Haupttext der Spielaktion.

## Responsive Mindestverhalten

Desktop:

- linke Aktionsspalte, Boardmitte und rechte Detailspalte sind gleichzeitig nutzbar,
- Overlay verdeckt nicht dauerhaft die Boardmitte,
- zentrale Server und RunTimeline bleiben sichtbar.

Schmaler Viewport:

- Topbar kann umbrechen,
- linke Spalte, Board und rechte Details stapeln sich kontrolliert,
- Actions bleiben vor reinem Chronicle-Detail erreichbar,
- Cues sind kompakt und dismissbar,
- Texte laufen nicht aus Buttons/Panels.

## Akzeptanz

Diese Spezifikation ist erfüllt, wenn:

- normale aktive Spieltexte keine gesperrten technischen Hauptlabels mehr enthalten,
- Cues kompakt, side-sicher und dismissbar sind,
- Action-/Undo-/Reconnect-/KI-Pacing-Controls deutsch und verständlich sind,
- Audiooptionen kompakt bleiben,
- Hidden-Info-, AI-Input-, Replay-/StateHash- und V1.0.4-Lifecycle-Verträge grün bleiben.
