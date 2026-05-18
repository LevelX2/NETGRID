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
- Deutsche sichtbare Begriffe folgen `docs/releases/v1/v1-0-5-action-board-ux/requirements.md`.

## Informationsarchitektur im aktiven Spiel

Die aktive Spieloberfläche hat fünf Hauptbereiche:

| Bereich | Aufgabe | V1.0.5-Regel |
| --- | --- | --- |
| Topbar | Versions-/Session-Kontext, Verbindung, Audio, Link, Aufgabe, Verwerfen | Bleibt kompakt; Audio bleibt Popover, kein dauerhaft offenes Optionspanel. |
| Linke Spalte | Gegnerstatus, KI-Takt, mögliche Aktionen, Zurücknehmen | Globale Entscheidungen und Pflichtfenster sind sofort erreichbar; kartengebundene Aktionen erscheinen im Auswahlkontext. |
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

Der BoardHeader ist kein Selbstzweck. V1.0.5-Standard ist: Der separate gerahmte Header oberhalb des Boards wird entfernt. Die bisherige Information wird verteilt:

- Spielerperspektive und Gegenseite stehen kompakt in Topbar/OpponentPanel.
- `Du bist am Zug`, `Du bist gefragt`, `Gegenseite ist am Zug` oder `KI-Zug läuft` stehen dort, wo sie handlungsrelevant sind: Action Panel, KI-Takt oder RunTimeline.
- Die Boardmitte beginnt ohne redundanten Sicht-/Fensterkasten direkt mit Run-/Boardinformation.

Ein neuer oder beibehaltener Header ist nur erlaubt, wenn er eine konkrete Aufgabe erfüllt und kein bloßer Wiederholungskasten mit `Deine Corp-Sicht`/`Dein Fenster` ist.

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

### Kontextuelle Kartenaktionen

Das Action Panel darf nicht mehr alle karten- und objektgebundenen Aktionen flach anzeigen. Ziel ist, dass mehrere Handkarten mit gleichartigen Actions nicht als ununterscheidbare Button-Serie erscheinen.

V1.0.5-Standardumsetzung: Hybrid ohne frei schwebendes Kontextmenü als Pflicht. Karten und Boardobjekte werden visuell auswählbar markiert; die zugehörigen Aktionen erscheinen als Abschnitt `Ausgewählte Karte` oder `Ausgewähltes Objekt` im linken Action Panel. Ein kleines Popover direkt an der Karte ist optional für Desktop, aber nicht nötig, solange die Zuordnung im linken Panel eindeutig ist.

Permanente Anzeige in `Mögliche Aktionen`:

- globale Basisaktionen wie Credit nehmen, Karte ziehen, Tag entfernen, Virus-Counter purgen und Zug beenden,
- offene Choices und Access-/Run-/Encounter-Pflichtentscheidungen,
- Aktionen ohne konkrete sichtbare Karten- oder Boardobjektbindung,
- optional ein kompakter Hinweis, dass ausgewählte Hand- oder Boardkarten weitere Aktionen haben.

Sortier-/Prioritätsregel:

1. Pending Choice und Access-/Run-/Encounter-Pflichtentscheidungen bleiben immer sichtbar.
2. Basisaktionen und Zugende bleiben sichtbar.
3. Karten-/Objektaktionen werden nur im Auswahlkontext angezeigt.
4. Falls eine Action sowohl kontextuell als auch aktuell entscheidungsrelevant ist, gewinnt die Entscheidungsrelevanz und sie bleibt sichtbar.

Kontextuelle Anzeige nach Auswahl:

- Klick oder Tastaturfokus auf eine eigene sichtbare Hand-/HQ-/Grip-Karte zeigt nur Actions, deren `source`, `payload.cardId`, `payload.resourceId`, `payload.breakerId` oder Ability-Quelle zu dieser Karte gehören.
- Klick oder Tastaturfokus auf ein sichtbares Boardobjekt zeigt nur passende objektgebundene Actions, z. B. rezzen, advancen, scoren, trashen, pumpen oder brechen.
- Der Kontextkopf nennt die ausgewählte sichtbare Karte oder das sichtbare Objekt, z. B. `Aktionen für Wall of Static`.
- Corp-ICE auf der eigenen Hand zeigt darunter die legalen Zieloptionen wie `Vor HQ installieren`, `Vor F&E (R&D) installieren`, `Vor Archive installieren` oder `Vor Remote 1 installieren`.
- Die UI reicht beim Ausführen immer die originale `actionId` der Engine ein; sie konstruiert keine PlayerAction aus UI-Text.

Matching-Regel für die erste Umsetzung:

- Kartenkontext matcht `action.source`, wenn `source` eine sichtbare CardInstanceId ist.
- Zusätzlich matcht er `payload.cardId`, `payload.resourceId`, `payload.breakerId`, `abilityRef.sourceCardInstanceId` und `targetRequirements[].sourceIceRef`, soweit diese Felder vorhanden und in der PlayerView sichtbar sind.
- Serverkontext matcht `payload.serverId` und sichtbare Server-IDs aus `PlayerView.servers`.
- Subroutinen-/Encounter-Kontext darf über `targetRequirements[].sourceIceRef` oder das sichtbare `view.run.encounteredIce` abgeleitet werden.
- Technische Felder werden nicht sichtbar ausgegeben; sie dienen nur zum Filtern vorhandener LegalActions.

Lebenszyklus:

- Auswahl wird bei `stateVersion`-Wechsel beibehalten, wenn dieselbe sichtbare Karte/dasselbe Objekt noch in der PlayerView vorhanden ist.
- Auswahl wird gelöscht, wenn die Karte verschwindet, verdeckt wird, die Seite wechselt, ein Match endet oder eine Action aus diesem Kontext erfolgreich gesendet wurde.
- Der Kontext zeigt einen leeren Zustand wie `Keine Aktion für diese Karte in diesem Fenster.`, wenn eine sichtbare ausgewählte Karte aktuell keine LegalActions hat.

Hidden-Info-Grenzen:

- Eigene Hand-/HQ-/Grip-Karten dürfen als Kontextquelle dienen, weil sie in der eigenen PlayerView sichtbar sind.
- Gegnersicht auf verdeckte Corp-Karten darf keine kartenkonkreten Actions, Titel, Definition-IDs oder unterscheidbaren Kontextmenüs erhalten.
- Kontextfilterung darf keine Actions aus Daten außerhalb von PlayerView, LegalActions, side-sicheren Events und lokalen UI-Einstellungen ableiten.
- Wenn keine Karte ausgewählt ist, bleiben kartengebundene Handkartenaktionen aus der flachen Standardliste heraus, statt mehrdeutig angezeigt zu werden.

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

V1.0.5-Cues dürfen in der Standardkonfiguration nicht mittig als dauerhaftes Modal wirken. Die Position soll aber lokal anpassbar sein, damit der Spieler das Overlay aus dem eigenen Blickfeld schieben kann.

- Desktop-Default: rechts oben oder oberhalb der rechten Detailspalte, ohne RunTimeline/ServerGrid zu verdecken.
- Schmaler-Viewport-Default: kompakter Toast unter Topbar oder am unteren Rand, mit maximaler Breite und Auto-Dismiss.
- Zielumsetzung: Cue kann an einem klaren Drag-Handle gezogen werden; spätere Cues erscheinen dort wieder.
- Presets sind zusätzlich Pflicht, damit Tastaturbedienung und Reset möglich bleiben: `Oben rechts`, `Oben links`, `Unten rechts`, `Unten links`, `Mitte`, `Zurücksetzen`.
- Fallback, falls Drag in V1.0.5 technisch instabil bleibt: Presets alleine erfüllen den Mindestumfang.
- Eine mittige Position ist nur als bewusste lokale Einstellung erlaubt, nicht als ungefragter Default.
- Cue muss per Button dismissbar sein.
- Cue darf Board-Highlights triggern, aber keine Layoutgröße des Boards verändern.
- Gespeicherte Cue-Positionen sind lokale UI-Einstellungen; sie dürfen nicht in Server, Engine, Replay, StateHash oder Match-Payloads geschrieben werden.

Persistenz- und Viewport-Regeln:

- Empfohlener lokaler Schlüssel: `netgrid.actionCuePosition.v1`.
- Custom-Positionen werden viewport-relativ gespeichert, z. B. als Prozentwerte, nicht als Matchdaten.
- Beim Resize werden Positionen in den sichtbaren Bereich geklemmt; bei ungültigen gespeicherten Daten fällt die UI auf `Oben rechts` zurück.
- Drag darf keine Textauswahl, Buttonklicks oder Dismiss-Aktion unbedienbar machen.

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

Der aktive Run-Zielserver ist kein allgemeines Cue-Highlight, sondern ein eigener Boardzustand aus `PlayerView.run.attackedServerId`. Er muss eindeutig nur am angegriffenen Server erscheinen und darf nicht pauschal auf alle Server angewendet werden.

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
- gespeicherte Cue-Positionen werden in den sichtbaren Viewport geklemmt oder auf eine sichere Preset-Position zurückgesetzt,
- Texte laufen nicht aus Buttons/Panels.

## Akzeptanz

Diese Spezifikation ist erfüllt, wenn:

- normale aktive Spieltexte keine gesperrten technischen Hauptlabels mehr enthalten,
- Cues kompakt, side-sicher und dismissbar sind,
- Cues per Drag oder mindestens per Preset lokal positionierbar sind,
- karten-/objektgebundene Actions erst im eindeutigen Auswahlkontext erscheinen,
- der redundante BoardHeader entfernt oder durch echte Statusinformation ersetzt ist,
- Action-/Undo-/Reconnect-/KI-Pacing-Controls deutsch und verständlich sind,
- Audiooptionen kompakt bleiben,
- Hidden-Info-, AI-Input-, Replay-/StateHash- und V1.0.4-Lifecycle-Verträge grün bleiben.
