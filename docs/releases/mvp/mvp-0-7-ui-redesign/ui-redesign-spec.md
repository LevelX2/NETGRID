# UI Redesign 0.7 Spec

Status: Design Freeze
Stand: 2026-05-03

## Ziel

Diese Spezifikation übersetzt die UI-Designsets in eine umsetzbare Next.js/React-Oberfläche. Sie ersetzt nicht die Rules Engine und führt keine neuen Spielregeln ein.

## Designentscheidung

Primäre Struktur ist Design C:

- helle, kontrastreiche Oberfläche,
- klare Topbar,
- Startscreen mit privaten Spielmodi,
- Runner- und Corp-Boards als getrennte Side-Views,
- rechte Action-/Statusspalte,
- Boardzentrum für Zonen, Server und Run-Fokus,
- EventLog und Diagnose nicht als dominante Hauptfläche.

Design D wird nur für aktive Runs und Encounters übernommen. Design B wird zu einem einklappbaren Diagnosebereich.

## Hauptkomponenten

| Komponente | Zweck | Erlaubte Datenquellen | Hidden-Info-Regel |
|---|---|---|---|
| `AppShell` | Topbar, Navigation, Layoutcontainer | lokale UI-State, Matchmetadaten ohne Tokens | keine Tokens, kein FullState |
| `EntryScreen` | Modi, Resume, Deckauswahl, Preflight | Katalog-/Deck-API, öffentliche Matchmetadaten | keine privaten Gegnerdecklisten |
| `RunnerBoard` | Runner-Spielansicht | Runner-`PlayerView`, Runner-`LegalActions`, side-gefilterte Events | Corp-HQ/R&D/unrezzed nur Counts oder redacted |
| `CorpBoard` | Corp-Spielansicht | Corp-`PlayerView`, Corp-`LegalActions`, side-gefilterte Events | Runner-Grip/Stack nur Counts |
| `ServerGrid` | zentrale Server, Remotes, ICE-Lanes | side-sichere Serverdaten aus `PlayerView` | verdeckte Karten generisch darstellen |
| `RunTimeline` | Run-Fortschritt und aktuelle Choice | `PlayerView`, `LegalActions`, Events | keine nicht sichtbaren ICE-Titel |
| `LegalActionsPanel` | aktuelle Aktionen | `LegalActions` | erzeugt nie eigene Actions |
| `ChoiceRequestPanel` | Ziele, Access, Rez, Subroutines | aktuelle `LegalActions`/Choice-Daten | nur aktuelle erlaubte Choices |
| `EventLogPanel` | Public/Side/System/Redacted Events | side-gefilterte Events | keine privaten Payloads |
| `DiagnosticsDrawer` | StateVersion, Hash, Receipts | side-sichere Receipts und Metadaten | keine Tokens, kein FullState |

## Entry

Der Einstieg zeigt:

- Runner vs KI,
- Corp vs KI,
- KI-vs-KI,
- privates Match erstellen,
- Invite beitreten,
- Match fortsetzen,
- Katalog,
- Decks und lokale Deckkopien,
- Preflight-Status: Decks validiert, Hidden-Info safe, Replay ready,
- lokale Card-Display-Einstellung.

Nicht sichtbar sind öffentliche Lobbies, Accounts, Rankings, Chat, Turnierfunktionen oder Klartexttokens.

## RunnerBoard

Die Runner-Ansicht priorisiert:

- Credits, Clicks, Agenda Points, Tags und eigene Zone Counts,
- Grip, Rig, Heap und Stack-Count,
- gegnerische Server mit side-sicherer Redaction,
- aktuellen Run,
- `LegalActions`,
- Choices,
- EventLog,
- Undo/Reconnect.

Runner darf keine Corp-HQ-Titel, verdeckte R&D-Karten, unrezzed ICE-Titel, private Corp-Decklisten oder Asset-IDs verdeckter Karten erhalten.

## CorpBoard

Die Corp-Ansicht priorisiert:

- Credits, Clicks, Agenda Points, HQ, R&D, Archives und Remotes,
- eigene HQ-Karten und eigene unrezzed Karten,
- Runner-Public-Info,
- Runner Hidden Counts,
- Rez-Fenster im aktiven Run,
- `LegalActions`,
- EventLog,
- Receipts.

Corp darf keine Runner-Grip-/Stack-Titel und keine privaten Runner-Decklisten erhalten.

## Diagnose

Diagnostics ist ein Drawer, kein Hauptlayout. Er darf anzeigen:

- StateVersion,
- MatchVersion,
- gekürzter StateHash,
- letzter Receipt-Status,
- Sync-/Reconnect-Zustand,
- Visibility-Status.

Er darf nicht anzeigen:

- SessionToken,
- ReconnectToken,
- JoinToken,
- FullState,
- `cardInstances`,
- private Payloads,
- komplette gegnerische Decklisten.

## Layoutregeln

- Desktop-first.
- Keine verschachtelten Kartencontainer.
- Stabile Grid-Tracks und `aspect-ratio` für Karten und Boardflächen.
- Keine viewportabhängige Schriftskalierung.
- Action Panel bleibt in allen Breiten erreichbar.
- Text darf nicht über Buttons, Karten oder Panels laufen.

## Implementierungsannahmen

Die bestehende Next.js-App darf in V0.7 intern in Komponenten aufgeteilt werden. Die normale Browserseite bleibt vom Engine-Paket getrennt und rendert nur side-sichere Payloads.
