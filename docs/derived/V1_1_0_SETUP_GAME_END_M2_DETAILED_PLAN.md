# V1.1.0 Setup/Game-End M2 und NETGRID-Statusklarheit

Status: `implemented_and_locally_verified`
Stand: 2026-05-07

## Zweck

Dieses Dokument plante die Gesamtheit des Releases `V1.1.0 Setup/Game-End M2` in maximaler fachlicher und technischer Detailtiefe vor der Freigabe. Die Umsetzung ist am 2026-05-07 erfolgt und in `docs/derived/V1_1_0_IMPLEMENTATION_REVIEW.md` sowie `docs/derived/V1_1_0_FINAL_REVIEW.md` dokumentiert.

Der Release verbindet zwei bislang getrennt betrachtete Themen, weil sie sich im Produkt sichtbar berühren:

1. Setup- und Game-End-M2 aus den früheren 0.93-Anforderungen.
2. NETGRID-Statusklarheit durch konsistente Icons, sichtbare Agenda-Siegschwelle und einheitliche UI-Schreibweise `Korp`.

Die Zusammenlegung ist bewusst: Setup, Mulligan, Siegbedingungen und sichtbare Statuswerte gehören für Spieler in denselben Wahrnehmungsraum. V1.1.0 soll daher nicht nur regeltechnisch sauberer werden, sondern auch besser erklären, was gerade passiert und wie nah Runner oder Korp am Sieg sind.

## Release-Einordnung

V1.1.0 bleibt der bereits in der Langfristplanung vorgesehene Release `Setup/Game-End M2`.

Der zwischenzeitlich erstellte Entwurf `V1.0.10 NETGRID Icon Language` wird durch diesen Plan abgelöst. Die dort geklärten Entscheidungen werden nicht verworfen, sondern als UI-/Statusklarheitsanteil in V1.1.0 integriert.

V1.1.0 ist damit kein allgemeiner UI-Polish-Release. Die UI-Arbeit ist nur in dem Umfang enthalten, in dem sie zentrale Spielwerte, Seitenrollen, Setup-Entscheidungen und Game-End-Verständlichkeit verbessert.

## Verbindliche Entscheidungen

- Sichtbare UI-Schreibweise: `Korp`.
- Technische IDs, interne Typen und regelnahe Code-Bezeichner bleiben `corp`, sofern sie bereits so existieren.
- Das Symbol auf dem Außenserver selbst darf bleiben.
- Der problematische Button ist der Button zum Starten eines Runs auf einen Außenserver.
- Rollenmarker werden mit Lucide-Icons umgesetzt, nicht als frei gezeichnete Mini-Porträts.
- Agenda-Symbolrichtung: Projekt/Dossier, klare Linien, Agenda-Blau.
- Agenda-Symbolik soll nicht primär Trophäe, Schild, Schutz oder Kampf suggerieren.
- Agenda-Fortschritt wird zentral als aktueller Wert plus Zielwert dargestellt, regulär `0 / 7`.
- Sonderzielwerte sind nur dann sichtbar abweichend, wenn der laufende GameState tatsächlich eine andere `agendaPointsToWin` trägt. Produktstandard ist 7.
- `Korb` wird nicht verwendet.

## Quellenbasis

Primäre Quellen für diesen Plan:

- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- `docs/derived/MVP_0.93_REQUIREMENTS.md`
- `docs/derived/MVP_0.93_FINAL_REVIEW.md`
- `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`
- `docs/codex/CODEX_STATUS.md`
- aktuelle NETGRID-Anforderungssammlung aus dem Chat vom 2026-05-07

Dieser Plan ersetzt keine Regelreferenz. Bei zweifelhaften offiziellen Spielregeln gilt weiterhin die Regelreferenz als Kontrollquelle, ohne den MVP-Scope zu erweitern.

## Aktueller technischer Stand

### Engine

Die Engine besitzt bereits eine lauffähige implizite Spielerstellung:

- `createGame` erzeugt Identitäten, Decks, Startressourcen und Starthand.
- Decks werden deterministisch über Seed, RandomCounter und RandomDrawRecords gemischt und gezogen.
- Der Startzustand springt aktuell direkt in den ersten Corp-Draw-Timingpunkt.
- `agendaPointsToWin` ist im `GameState` vorhanden.
- Agenda-Siege werden bereits über `state.agendaPointsToWin` geprüft.
- Corp-Deckout bei leerem R&D im mandatory draw führt bereits zum Runner-Sieg.
- Flatline ist als Game-End-Grund bereits im späteren V0.94-Stand vorhanden.
- `pendingChoice` existiert als allgemeiner Mechanismus und wird in `PlayerView` side-gefiltert.
- `resolve_choice` existiert als Action-Typ.
- Identity-Setup-/Static-Modifikatoren existieren bereits im Engine-Code.
- Archives besitzen bereits Grundlagen für Sichtbarkeit über `faceup` und side-spezifische Darstellung.

### Server/Multiplayer

Der Server kann GameStates erzeugen, side-spezifische PlayerViews versenden, Reconnect-Payloads bauen und PendingChoices an Spieler ausliefern. Damit gibt es bereits eine gute Basis für Mulligan und Setup-Choices.

### Web-UI

Die Web-UI zeigt zentrale Statuswerte funktional, aber grafisch noch uneinheitlich:

- Agenda wird als Text-/Zahlenwert gezeigt, bislang ohne Zielwert.
- Tags sind sichtbar, aber ohne eigenes Symbol.
- Runner und Corp/Korp sind textlich bezeichnet, aber grafisch wenig markiert.
- Im Run-Start-Kontext wird ein schildartig wirkendes Symbol verwendet.
- Die Chronik kann Ereignistypen noch stärker visuell strukturieren.

## Release-Ziele

### R1: Expliziter Setup-Flow

Der Spielstart soll als regel- und replayfähiger Setup-Abschnitt modelliert werden, nicht nur als impliziter Zustand nach `createGame`.

Der Flow soll deterministisch, side-safe und für Replay/StateHash voll reproduzierbar sein.

### R2: Mulligan als private Setup-Entscheidung

Runner und Korp sollen je eine private Mulligan-Entscheidung erhalten. Die Entscheidung darf nur der jeweiligen Seite angezeigt werden. Öffentliche Events dürfen keine privaten Details offenlegen.

### R3: Agenda-Siegschwelle normalisieren

Regulärer Produktstandard ist 7 Agenda-Punkte. Die UI soll den Zielwert immer sichtbar machen. Technisch vorhandene Sonderwerte bleiben nur für Tests, Harnesses oder explizit konfigurierte Szenarien erlaubt.

### R4: Game-End-Vertrag konsolidieren

Agenda-Sieg, Corp-Deckout und Flatline sollen als klare Game-End-Gründe durch Engine, Shared Types, Server, Replay, Chronik und UI konsistent laufen.

### R5: Archives-Facedown-Fundament schützen

V1.1.0 soll die Grundlage für faceup/facedown Archives sauber dokumentieren und testen, ohne den für V1.1.2 geplanten vollständigen Archives-Access vorwegzunehmen.

### R6: Identitäts-Setup formalisieren

Identitäten sollen als offene Startkarten und als Quelle für Setup-/Static-Effekte sauber im Setup-Vertrag verankert werden.

### R7: NETGRID-Statusklarheit

Runner, Korp, Agenda, Tags und Run-Start sollen mit einer konsistenten kleinen Lucide-Symbolsprache schneller erfassbar werden.

### R8: UI-Schreibweise vereinheitlichen

Alle sichtbaren UI-Texte verwenden `Korp`. Interne technische Bezeichner bleiben dort, wo nötig, `corp`.

## Nicht-Ziele

V1.1.0 implementiert nicht:

- Prevention/Avoid/Interrupt/Replacement.
- Discard-Phase, Handlimit und vollständige Core-Damage-Ausarbeitung; diese gehören in V1.1.1.
- Vollständige Archives-Access-Erweiterung; diese gehört in V1.1.2.
- Neue offizielle Karten außerhalb des vereinbarten MVP-/Demo-Scopes.
- Offizielle Artworks, Card Frames, Logos, Card Backs oder externe Kartendatenbank-Abhängigkeiten.
- Deckbuilder, Accountsystem, Matchmaking, Rankings oder Plattformfunktionen.
- Ein neues visuelles Designsystem jenseits der gezielten NETGRID-Statusklarheit.
- Mini-Porträts oder generierte Bildassets für Rollenmarker.

## Zielbild des Spielstarts

Der reguläre V1.1.0-Start soll fachlich so aussehen:

1. Match wird mit Format, Baseline, Seed, Decks, Seiten und Controllern angelegt.
2. Engine validiert die übergebenen Demo-/Testdecks gegen den erlaubten Kartenpool.
3. Runner- und Korp-Identität werden als offene Startkarten instanziiert.
4. Stack und R&D werden deterministisch gemischt.
5. Startressourcen werden gesetzt.
6. Initiale Hände werden gezogen.
7. Setup-/Static-Effekte der Identitäten werden angewendet oder als Setup-Schritte ausgeführt, je nach Kartendefinition.
8. Runner erhält eine private Mulligan-Entscheidung.
9. Korp erhält eine private Mulligan-Entscheidung.
10. Nach Abschluss beider Entscheidungen wechselt das Spiel in den ersten regulären Timingpunkt.
11. Erst dann beginnt der normale Corp-Zug.

Die Reihenfolge der Mulligan-Entscheidungen soll deterministisch sein. Aus Implementierungssicht ist ein sequenzieller Single-`pendingChoice`-Flow vorzuziehen, weil das bestehende Engine-Modell nur eine PendingChoice gleichzeitig kennt.

Die UI darf der wartenden Gegenseite anzeigen, dass Setup noch läuft. Sie darf aber nicht anzeigen, ob die andere Seite behalten oder gemulligant hat, solange diese Information nicht bewusst als öffentliches Regelereignis definiert wird.

## Shared-Contract-Plan

### Neue oder geschärfte Setup-Zustandsinformationen

Zu prüfen und voraussichtlich einzuführen:

```ts
type SetupStatus = "not_started" | "mulligan_runner" | "mulligan_corp" | "complete";
```

Alternativ kann der Status über `phase` und `timingPoint` modelliert werden. Die bevorzugte Variante ist:

- `phase` bleibt die grobe Spielphase.
- `timingPoint` benennt den replayfähigen Zustand.
- Ein kleiner `setup`-Block enthält nur Setup-spezifische Fortschrittsdaten.

Mögliche Struktur:

```ts
interface SetupState {
  status: "mulligan_runner" | "mulligan_corp" | "complete";
  initialHandSize: number;
  resolved: Partial<Record<Side, "keep" | "mulligan">>;
  mulligansTaken: Partial<Record<Side, number>>;
}
```

Anforderungen an diese Struktur:

- Sie muss deterministisch serialisierbar sein.
- Sie darf keine privaten Karten oder privaten Optionsdetails enthalten.
- Sie muss in StateHash und Replay eingehen.
- Sie muss bei abgeschlossener Setup-Phase entweder stabil vorhanden bleiben oder in eine eindeutig normalisierte `complete`-Form übergehen.

### Phase und TimingPoint

Empfohlene neue Werte:

- `phase: "setup"` für Setup-Abschnitt.
- `timingPoint: "setup.mulligan.runner"` für Runner-Mulligan.
- `timingPoint: "setup.mulligan.corp"` für Korp-Mulligan.
- `timingPoint: "corp_draw.mandatory_draw"` nach Setup-Abschluss.

Falls `Phase` nicht erweitert werden soll, kann Setup über `timingPoint` allein laufen. Wegen Klarheit in UI, Server und Tests ist eine echte `setup`-Phase vorzuziehen.

### PlayerView-Erweiterung

`PlayerView` sollte `agendaPointsToWin` sichtbar enthalten.

Begründung:

- Der Wert ist kein Hidden Info.
- UI und Chronik sollen `0 / 7` oder testweise `0 / 2` korrekt anzeigen können.
- Die Web-UI soll nicht aus internem State oder Server-Metadaten raten.

Mögliche Erweiterung:

```ts
interface PlayerView {
  agendaPointsToWin: number;
}
```

### PendingChoice-Erweiterung

Bestehende PendingChoice-Struktur soll weiterverwendet werden.

Für Mulligan braucht sie mindestens:

- `id`
- `side`
- `prompt`
- `options`
- `source` oder `kind`, z. B. `setup.mulligan`
- side-sichere Sichtbarkeit in `getPlayerView`

Die Optionen für die aktive Seite können sichtbar heißen:

- `Starthand behalten`
- `Mulligan nehmen`

Für die Gegenseite darf nur ein wartender Setup-Zustand sichtbar sein, ohne Optionsliste und ohne Entscheidungsergebnis.

### GameEndReason-Vertrag

Bestehende Gründe:

- `agenda_points`
- `corp_deck_empty`
- `flatline`
- `unknown`

V1.1.0 soll klären:

- `agenda_points`: Runner oder Korp erreicht `agendaPointsToWin`.
- `corp_deck_empty`: Korp muss von leerem R&D ziehen; Runner gewinnt.
- `flatline`: Runner hat nach Schaden weniger als 0 Karten bzw. keinen legalen Schaden-Ausgleich nach implementierter Schadenslogik; Korp gewinnt.
- `unknown`: nur für Legacy-/Fehlerkompatibilität, nicht für reguläre neue Siege.

Runner-Deckout wird nicht als neue automatische Siegbedingung aktiviert, solange die Regelgrundlage nicht explizit bestätigt ist. V1.1.0 darf jedoch Typen, Tests oder Dokumentation so vorbereiten, dass künftige Runner-Stack-Leere nicht zu Sichtbarkeits- oder Replay-Problemen führt.

### PublicEvents und PrivateEvents

Setup-Events müssen getrennt werden:

Öffentlich sichtbar:

- Spiel erstellt.
- Setup gestartet.
- Mulligan-Entscheidung für Seite angefordert, ohne Optionsdetails der Gegenseite.
- Setup abgeschlossen.
- Erster regulärer Timingpunkt erreicht.

Privat sichtbar für jeweilige Seite:

- Eigene Startkarten.
- Eigene Mulligan-Optionen.
- Eigene Entscheidung.
- Eigene neue Hand nach Mulligan.

Nicht sichtbar:

- Ob die Gegenseite behalten oder gemulligant hat, falls nicht bewusst als öffentliche Information definiert.
- Karten aus gegnerischer Hand.
- Reihenfolge oder Identität verdeckter Karten in Stack/R&D.

Mulligan-Auflösungen sollten als Hidden-Info-Barriere gelten, damit ein Spieler nicht nach Ansicht einer neuen Starthand in einen früheren Zustand zurückspringen kann.

## Engine-Plan

### Setup-Sequenz

`createGame` soll intern expliziter strukturiert werden.

Empfohlene interne Schritte:

1. Config normalisieren.
2. Agenda-Ziel normalisieren.
3. Kartenpool und Decks validieren.
4. Identities instanziieren.
5. Deckkarten instanziieren.
6. Startzonen setzen.
7. Stack/R&D deterministisch mischen.
8. Startressourcen setzen.
9. Initiale Handgröße bestimmen.
10. Runner-Starthand ziehen.
11. Korp-Starthand ziehen.
12. Identity-Setup-/Static-Effekte anwenden.
13. SetupState erzeugen.
14. Erste Mulligan-PendingChoice erzeugen.

Die Reihenfolge der Schritte 8 bis 12 muss anhand bestehender Identity-Effekte geprüft werden. Falls eine Identity die Starthand, Startressourcen oder Setup-Ziehlogik beeinflusst, muss die Regelreihenfolge explizit dokumentiert und getestet werden.

### Rückwärtskompatibilität für Tests

Da viele bestehende Tests wahrscheinlich davon ausgehen, dass `createGame` sofort im ersten Corp-Timingpunkt startet, braucht V1.1.0 eine klare Migrationsstrategie.

Bevorzugte Lösung:

- Produktpfad: `createGame` startet mit explizitem Setup.
- Test-Hilfsfunktion: `createGameAfterSetup` oder `advanceThroughSetup` für Tests, die nicht Setup testen.
- Bestehende Tests werden gezielt auf diese Hilfsfunktion umgestellt, wenn Setup für sie irrelevant ist.

Alternative:

- `CreateGameConfig` bekommt `setupMode?: "explicit" | "completed"`.
- Produktserver verwendet `explicit`.
- Alte Tests verwenden temporär `completed`.

Die Hilfsfunktions-Lösung ist sauberer, weil sie den Produktvertrag nicht mit Test-Abkürzungen vermischt.

### Mulligan-Aktion

Mulligan soll über bestehendes `resolve_choice` laufen.

LegalAction-Eigenschaften:

- Nur die Seite mit passender PendingChoice bekommt die Aktion.
- `stateVersion` wird wie üblich geprüft.
- `choiceId` muss exakt zur aktuellen PendingChoice passen.
- Ausgewählte Option muss legal sein.
- Gegenseite darf die Aktion nicht einreichen.
- Nach Auflösung wird PendingChoice entfernt oder auf die nächste Seite gesetzt.

Effekt `keep`:

- Hand bleibt unverändert.
- SetupState markiert Seite als `keep`.
- Kein neuer Shuffle.
- Kein neuer Draw.

Effekt `mulligan`:

- Aktuelle Starthand geht zurück in das jeweilige Deck.
- Deck wird deterministisch neu gemischt.
- Neue Starthand in gleicher Größe wird gezogen.
- RandomCounter und RandomDrawRecords werden stabil fortgeschrieben.
- SetupState markiert Seite als `mulligan`.
- `mulligansTaken[side]` wird auf 1 gesetzt.

Beide Effekte:

- erzeugen ein private/side-sicheres Event.
- erhöhen `stateVersion`.
- können StateHash und Replay deterministisch reproduzieren.
- führen nach Runner zu Korp-Mulligan, nach Korp zu Setup-Abschluss.

### Randomness und Replay

Jeder Setup-Zufallsverbrauch muss nachvollziehbar sein.

Erwartete RandomDrawRecord-Zwecke:

- `setup.shuffle.runner.start_stack`
- `setup.shuffle.corp.start_rnd`
- `setup.draw.runner.initial_hand`
- `setup.draw.corp.initial_hand`
- `setup.shuffle.runner.mulligan`
- `setup.shuffle.corp.mulligan`
- `setup.draw.runner.mulligan_hand`
- `setup.draw.corp.mulligan_hand`

Falls das bestehende RandomDrawRecord-Format keine Zweckstrings dieser Art vorsieht, soll eine minimal-invasive Erweiterung oder konsistente bestehende Benennung verwendet werden.

Replay-Akzeptanz:

- Gleiches Seed plus gleiche Mulligan-Entscheidungen erzeugt identischen StateHash.
- Unterschiedliche Mulligan-Entscheidung erzeugt anderen, aber gültigen StateHash.
- Replay leakt keine gegnerischen Starthandkarten.

### Setup-Ende

Nach Abschluss beider Mulligan-Entscheidungen:

- `setup.status` wird `complete`.
- `pendingChoice` ist leer.
- `phase` wird `corp_draw_phase` oder das bestehende Äquivalent.
- `timingPoint` wird `corp_draw.mandatory_draw`.
- `activeSide` wird `corp`.
- `getLegalActions("corp")` liefert die mandatory-draw-Action.
- Runner bekommt keine Corp-Startaktion.

### Agenda-Ziel

Produktstandard:

- `agendaPointsToWin = 7`

Erlaubte abweichende Werte:

- Testszenarien.
- Engine-Harnesses.
- explizite lokale Dev-Konfiguration.

Nicht erlaubt:

- Formatabhängige Demo-Sonderwerte in regulären Produktspielen.
- UIs, die nur den aktuellen Agenda-Wert ohne Ziel anzeigen.

### Game-End-Prüfung

`checkWinConditions` soll nach jeder relevanten Aktion:

- Runner-Agenda gegen Ziel prüfen.
- Korp-Agenda gegen Ziel prüfen.
- Vorhandenen Winner nicht überschreiben.
- GameEndReason nur dann `unknown` setzen, wenn ein alter Zustand Winner ohne Grund hat.

Deckout und Flatline bleiben in ihren jeweiligen Aktionspfaden, müssen aber in denselben Ergebnisvertrag mappen.

### Corp-Deckout

Wenn Korp im mandatory draw von leerem R&D ziehen muss:

- Winner wird Runner.
- GameEndReason wird `corp_deck_empty`.
- Phase wird `game_over`.
- Event und UI verwenden eine klare Meldung, ohne verdeckte R&D-Informationen jenseits der Leere zu leaken.

### Flatline

Flatline-Vertrag:

- Winner wird Korp.
- GameEndReason wird `flatline`.
- Event beschreibt den Sieggrund ohne private Karten aus dem Grip zu leaken.
- Bestehende Damage-Tests bleiben maßgeblich.

V1.1.0 soll keine neue Schadensmechanik einführen, sondern den schon vorhandenen Flatline-Endzustand in den konsolidierten Game-End-Vertrag aufnehmen.

### Runner-Deckout-Vorbereitung

V1.1.0 aktiviert keine automatische Runner-Niederlage durch leeren Stack, sofern dies nicht separat regelgeprüft und freigegeben wird.

Vorbereitung bedeutet:

- Leere Runner-Stack-Zustände dürfen StateHash, PlayerView und UI nicht brechen.
- Draw-Versuche aus leerem Stack müssen kontrolliert behandelt werden.
- Eventtexte dürfen keine falsche Siegbedingung behaupten.
- Spätere V1.1.1-/V1.2.x-Mechaniken können darauf aufsetzen.

### Archives-Facedown-Fundament

V1.1.0 soll klare Hilfen für Archive-Zonen schaffen:

- Bewegungen nach Archives sollen bewusst `faceup` oder `facedown` setzen.
- Runner-Views dürfen nur faceup bekannte Korp-Archives-Karten zeigen.
- Korp-Views dürfen eigene Archives voll sehen.
- PublicEvents dürfen facedown-Karten nicht mit Titel oder ID verraten.
- Counts dürfen sichtbar sein, soweit sie regelkonform sind.

Nicht Teil von V1.1.0:

- Vollständiger Archives-Access mit gemischten faceup/facedown Zugriffen.
- Neue Auswahl-UI für Archives-Zugriffsreihenfolgen.

### Identity-Setup

V1.1.0 soll Identitäts-Setup als eigene Kategorie dokumentieren:

- Identity-Karten sind von Anfang an offen.
- Setup-/Static-Modifikatoren dürfen Startwerte beeinflussen, wenn sie als solche modelliert sind.
- Identity-Setup darf keine Hidden-Info-Leaks erzeugen.
- Identity-Usage-State wird deterministisch initialisiert.
- Reihenfolge von Runner/Korp-Identity-Effekten wird explizit getestet.

## Server- und Multiplayer-Plan

### Match-Erstellung

Der Server erstellt neue Spiele im expliziten Setup-Zustand.

Zu prüfen:

- Ob bestehende MatchSettings `agendaPointsToWin` noch Legacy-Werte zulassen.
- Ob `agendaPointsToWinFor` für Produktformate immer 7 liefert.
- Ob Test-/Dev-Overrides eindeutig als solche markiert sind.

### Setup-Choice-Auslieferung

Für Human-vs-Human:

- Runner erhält erste Mulligan-Choice.
- Korp sieht wartenden Setup-Zustand.
- Nach Runner-Auflösung erhält Korp Mulligan-Choice.
- Runner sieht wartenden Setup-Zustand.
- Nach Korp-Auflösung startet der erste Corp-Turn.

Für Human-vs-KI:

- Wenn KI die aktive PendingChoice-Seite ist, muss die KI eine legale `resolve_choice`-Action einreichen.
- Standardverhalten für V1.1.0: KI behält Starthand, sofern keine einfache lokale Heuristik bereits existiert.
- Die KI darf nur ihre eigene PlayerView bzw. legale Aktionen nutzen.

### Reconnect

Reconnect-Payloads müssen korrekt sein:

- Eigene PendingChoice sichtbar, wenn man an der Reihe ist.
- Keine gegnerischen Optionen oder Entscheidungen sichtbar.
- Eigene aktuelle Hand nach Mulligan sichtbar.
- Gegenseite sieht nur setupbezogene Warteinformation.
- Nach Setup-Abschluss normaler Spielzustand.

### WebSocket- und PublicEvent-Sicherheit

Nicht erlaubt:

- Handkarten der Gegenseite in PublicEvents.
- Mulligan-Entscheidung der Gegenseite als öffentliche Option.
- CardInstance-IDs verdeckter Karten in allgemeinen Broadcasts.
- unterschiedliche Payloads, die über Nebeneffekte Entscheidungsergebnisse verraten.

### Result Summary

Match-Ergebnis muss enthalten:

- Winner.
- GameEndReason.
- Agenda-Endstand Runner.
- Agenda-Endstand Korp.
- Agenda-Ziel.
- Optional Dauer/Zugnummer, wenn schon vorhanden.

Visible UI-Bezeichnung für Corp-Seite: `Korp`.

## Web-UI-Plan

### Symbolsprache

Alle neuen Icons sollen Lucide-Icons sein und im bestehenden UI-Stil bleiben:

- kleine Größe.
- klare Linien.
- keine dekorative Streuung.
- konsistente Skalierung.
- neben Wert oder Label, nicht als großes Ornament.

Empfohlene Icon-Kandidaten:

- Runner: `Fingerprint`, alternativ `UserRoundSearch`.
- Korp: `Building2`, alternativ `Landmark`.
- Agenda: `FileText`, `Files`, `ClipboardList` oder `FolderKanban`.
- Tags: `ScanLine`, alternativ `Crosshair`.
- Run starten: `Route`, `Cable`, `Network` oder `Send`.

Zu vermeiden:

- Schild-/Schutz-/Defense-Symbole für Run-Start, Agenda oder RAM/Serveraktivierung.
- Trophäen-Icon als primäre Agenda-Symbolik.
- zu detaillierte Icons, die bei kleiner Darstellung unlesbar werden.

### Farb- und Bedeutungslogik

Agenda:

- Agenda-Blau.
- projekt-/dossierartig.
- nicht aggressiv, nicht defensiv.

Runner:

- hackerartig/anonym/subversiv über Icon-Wahl, nicht über komplexe Illustration.
- kann vorhandene Runner-Akzentfarbe nutzen.

Korp:

- institutionell/kontrolliert/konzernartig.
- kann vorhandene Korp-Akzentfarbe nutzen.

Tags:

- Markierung/Erfassung/Scan.
- klar vom Run-Start-Icon unterscheidbar.

Run starten:

- Bewegung/Verbindung/Route.
- nicht Schild, Abwehr oder Schutz.

### Statusbereiche

Korp-Infobereich:

- Rollenmarker links oder nahe am Seitennamen.
- Anzeige `0 / 7` mit Agenda-Icon.
- Credits und Aktionen bleiben lesbar.
- Text `Korp`, nicht `Corp`.

Runner-Infobereich:

- Rollenmarker links oder nahe am Seitennamen.
- Anzeige `0 / 7` mit Agenda-Icon.
- Tags mit Tag-Icon.
- Credits, Aktionen, Memory bleiben lesbar.

Agenda-Anzeigen:

- zentrale Darstellung immer mit aktuellem Wert und Ziel.
- bevorzugt `Icon + 0 / 7`, darunter oder daneben `Agenda`.
- Bei Testzielwerten aus GameState z. B. `0 / 2`.

Tags:

- `Icon + Zahl`, Label `Tags`.
- kompakt, keine Konkurrenz zur Agenda.

### Run-Start-Button

Der Button zum Starten eines Runs auf einen Außenserver bekommt ein klareres Run-/Route-/Verbindungsicon.

Die Funktion bleibt unverändert:

- gleiche LegalAction.
- gleiche Zielauswahl.
- gleiche Enabled/Disabled-Logik.
- nur visuelle Symbolkorrektur.

Das Symbol für den Außenserver selbst bleibt unverändert, sofern es nicht eindeutig dieselbe problematische Schutzsymbolik auf dem Aktionsbutton ist.

### Setup-/Mulligan-UI

Wenn `pendingChoice.kind/source = setup.mulligan` sichtbar ist:

- aktive Seite sieht eine kompakte Setup-Entscheidung.
- Buttons:
  - `Starthand behalten`
  - `Mulligan nehmen`
- optional kleiner Seitensymbolmarker für eigene Seite.
- keine langen Regeltexte im UI.

Wartende Seite sieht:

- kurze Statusmeldung, z. B. `Setup läuft`.
- wenn Seite bekannt: `Runner entscheidet über Starthand` oder `Korp entscheidet über Starthand`.
- keine gegnerischen Optionen.
- kein Entscheidungsergebnis.

Nach Setup-Abschluss:

- Setup-Panel verschwindet.
- normaler Aktionsbereich erscheint.
- Chronik kann `Setup abgeschlossen` zeigen.

### Chronik

Die Chronik soll durch Icons besser scannbar werden, aber nicht dichter oder unruhiger.

Icon-Einsatz empfohlen für:

- Runner-Aktion: Runner-Icon.
- Korp-Aktion: Korp-Icon.
- Agenda gestohlen/gepunktet: Agenda-Icon.
- Tags erhalten/entfernt: Tag-Icon.
- Game-End: passendes Seiten-/Grundicon.
- Setup-Mulligan: dezentes Rollenicon oder Setup-Status ohne Entscheidungsdetails.

Nicht empfohlen:

- jedes einzelne kleine Ereignis mit Icon versehen.
- Icons doppelt neben bereits eindeutigem Spezialicon.
- private Setup-Entscheidungen der Gegenseite in der Chronik ausformulieren.

### Game-End-UI

Game-End-Anzeigen müssen eindeutig benennen:

- Gewinnerseite: Runner oder Korp.
- Sieggrund:
  - Agenda-Punkte.
  - Korp kann nicht mehr ziehen.
  - Flatline.
- Agenda-Endstand mit Zielwert.

Beispiele sichtbarer Texte:

- `Runner gewinnt durch Agenda-Punkte.`
- `Korp gewinnt durch Flatline.`
- `Runner gewinnt: Korp kann nicht aus R&D ziehen.`

### UI-Schreibweise

Sichtbare Stellen für Umstellung auf `Korp`:

- Statusbereich.
- Chronik.
- Auswahltexte.
- Tooltips.
- Game-End-Meldungen.
- Setup-/Mulligan-Texte.
- Lobby-/Matchtexte, falls betroffen.

Nicht umzustellen:

- TypeScript-Typen `corp`.
- Action-Payloads.
- technische IDs.
- Testnamen nur dann, wenn sie technische Begriffe testen.

## Testplan

### Shared-Type-Tests

Zu prüfen:

- `PlayerView` enthält `agendaPointsToWin`.
- Setup-Phase/TimingPoint-Typen serialisieren korrekt.
- GameEndReason deckt erwartete Gründe ab.
- PendingChoice für Setup ist side-sicher typisierbar.

### Engine-Setup-Tests

Pflichtfälle:

1. Neues Produktspiel startet in Setup-Phase.
2. Identitäten sind offen sichtbar.
3. Startressourcen sind korrekt.
4. Runner und Korp haben korrekte Starthandgröße.
5. Runner bekommt erste Mulligan-Choice.
6. Korp sieht Runner-Mulligan-Optionen nicht.
7. Nach Runner-keep bekommt Korp Mulligan-Choice.
8. Nach Korp-keep beginnt `corp_draw.mandatory_draw`.
9. `stateVersion` steigt je Setup-Entscheidung.
10. `pendingChoice` ist nach Setup-Abschluss leer.

### Engine-Mulligan-Tests

Pflichtfälle:

1. Runner-Mulligan mischt Starthand zurück und zieht neue Hand.
2. Korp-Mulligan mischt HQ zurück und zieht neue HQ.
3. Mulligan verbraucht deterministische RandomRecords.
4. Gleiches Seed plus gleiche Entscheidungen ergibt gleichen StateHash.
5. Gleicher Seed plus andere Entscheidung ergibt gültigen anderen StateHash.
6. Seite kann nicht zweimal mulliganen.
7. Gegenseite kann fremde Mulligan-Choice nicht auflösen.
8. Stale `stateVersion` wird abgelehnt.
9. Falsche `choiceId` wird abgelehnt.
10. Ungültige Option wird abgelehnt.

### Visibility-Tests

Pflichtfälle:

1. Runner-View enthält keine Korp-Handkarten.
2. Korp-View enthält keine Runner-Handkarten.
3. PublicEvents enthalten keine gegnerische Mulligan-Entscheidung.
4. PublicEvents enthalten keine verdeckten CardInstance-IDs.
5. Reconnect während Runner-Mulligan ist side-sicher.
6. Reconnect während Korp-Mulligan ist side-sicher.
7. Replay/PublicLog leakt keine Setup-Hidden-Info.

### Game-End-Tests

Pflichtfälle:

1. Runner gewinnt bei `agendaPointsToWin`.
2. Korp gewinnt bei `agendaPointsToWin`.
3. Zielwert 7 ist Produktstandard.
4. Expliziter Testzielwert wird respektiert, wenn erlaubt.
5. Corp-Deckout setzt Winner Runner und Reason `corp_deck_empty`.
6. Flatline setzt Winner Korp und Reason `flatline`.
7. Bestehender Winner wird nicht durch spätere Checks überschrieben.
8. `unknown` entsteht nicht in regulären neuen Game-End-Pfaden.

### Archives-Visibility-Tests

Pflichtfälle:

1. Korp sieht eigene faceup und facedown Archives-Karten.
2. Runner sieht nur erlaubte faceup Archives-Informationen.
3. PublicEvents verraten keine facedown-Titel.
4. Counts bleiben stabil.
5. Bestehender Zugriff auf Archives wird nicht erweitert, wenn V1.1.2-Logik fehlt.

### Server-Tests

Pflichtfälle:

1. Neues Match sendet Runner private Mulligan-Choice.
2. Gegenseite erhält nur Wartezustand.
3. `resolve_choice` via WebSocket/API führt Setup fort.
4. Reconnect rekonstruiert korrekte PendingChoice.
5. Human-vs-KI löst KI-Mulligan legal auf.
6. Match-Ergebnis enthält Winner, GameEndReason und Agenda-Ziel.
7. Produkt-MatchSettings ergeben Agenda-Ziel 7.

### Web-UI-Tests

Pflichtfälle:

1. Sichtbare UI verwendet `Korp`, nicht `Corp` oder `Korb`.
2. Runner-Status zeigt Runner-Icon.
3. Korp-Status zeigt Korp-Icon.
4. Agenda zeigt Icon und `aktueller Wert / Zielwert`.
5. Tags zeigen eigenes Icon.
6. Run-Start-Button auf Außenserver verwendet kein Schildicon.
7. Setup-Mulligan zeigt nur eigene Optionen.
8. Wartende Seite sieht keine gegnerische Entscheidung.
9. Chronik nutzt Icons nur für geeignete Ereignistypen.
10. Game-End-Meldung zeigt Winner, Grund und Agenda-Endstand.

### E2E-/Playtest-Fälle

Mindestens:

1. Human-vs-KI: Runner behält Starthand, Korp-KI behält, erster Corp-Zug startet.
2. Human-vs-KI: Runner nimmt Mulligan, Korp-KI behält, Spiel startet deterministisch.
3. Human-vs-Human lokal: Runner-Tab sieht eigene Choice, Korp-Tab wartet.
4. Human-vs-Human lokal: Korp-Tab sieht eigene Choice nach Runner-Auflösung.
5. Reconnect in Setup: beide Seiten sehen korrekten Zustand.
6. Spiel bis Agenda-Sieg: UI zeigt `7 / 7` und korrektes Game-End.
7. Spiel bis Corp-Deckout: UI zeigt Runner-Sieggrund korrekt.

## Dokumentationsplan

Vor oder während Umsetzung anzupassen:

- `docs/derived/V1_1_0_SETUP_GAME_END_M2_DETAILED_PLAN.md` nach Review/Freigabe in `approved` überführen.
- V1.1.0-Anforderungen aus diesem Plan in eine kompaktere Requirements-Datei ableiten, falls die Umsetzung danach startet.
- Testmatrix für V1.1.0 erstellen oder bestehende Matrix erweitern.
- `docs/codex/CODEX_STATUS.md` aktualisieren.
- Wissensbasis-Index aktualisieren.
- Nach Umsetzung: Review-/Statusdokument für V1.1.0.

## Umsetzungsreihenfolge

### Phase 1: Vertragsklärung und Testgerüst

1. Shared Types für Setup/PlayerView/GameEndReason prüfen.
2. Bestehende Tests identifizieren, die impliziten Spielstart erwarten.
3. Test-Hilfsfunktion für "Spiel nach Setup" planen.
4. Erste failing Tests für Setup-Mulligan schreiben.
5. Visibility-Tests für PendingChoice schreiben.

### Phase 2: Engine-Setup

1. Setup-Sequenz in `createGame` strukturieren.
2. Explizite Setup-Phase einführen.
3. Erste Mulligan-PendingChoice erzeugen.
4. `resolve_choice` für Mulligan verdrahten.
5. Setup-Abschluss in ersten Corp-Timingpunkt führen.
6. RandomRecords und StateHash stabilisieren.

### Phase 3: Game-End-Konsolidierung

1. Agenda-Zielstandard auf 7 absichern.
2. PlayerView mit Agenda-Ziel versorgen.
3. GameEndReason-Pfade prüfen und vereinheitlichen.
4. Corp-Deckout- und Flatline-Tests aktualisieren.
5. Result summary im Server anpassen.

### Phase 4: Archives-Fundament

1. Bewegungen nach Archives auf explizites `faceup`/`facedown` prüfen.
2. Side-spezifische PlayerViews absichern.
3. PublicEvent-Leaks testen.
4. Dokumentieren, was erst in V1.1.2 vollständig wird.

### Phase 5: Server/Multiplayer

1. Match-Erstellung auf explizites Setup ausrichten.
2. PendingChoice-Broadcasts für Setup prüfen.
3. Reconnect-Fälle absichern.
4. KI-Mulligan-Standardhandlung einbauen.
5. Ergebnisdaten mit Agenda-Ziel und GameEndReason prüfen.

### Phase 6: Web-UI

1. Sichtbare Schreibweise `Korp` vereinheitlichen.
2. Lucide-Icon-Mapping zentral definieren.
3. Statuskacheln für Runner/Korp/Agenda/Tags anpassen.
4. Agenda-Zielwert aus PlayerView anzeigen.
5. Run-Start-Button-Icon ersetzen.
6. Setup-/Mulligan-UI darstellen.
7. Chronik-Icon-Regeln vorsichtig integrieren.
8. Game-End-Meldungen aktualisieren.

### Phase 7: Verifikation

1. Typecheck.
2. Unit-Tests Engine/Shared.
3. Server-Tests.
4. Web-Tests.
5. Build.
6. Browser-/Playtest der zentralen Setup- und Game-End-Flows.
7. Wissenspflege und Abschlussreview.

## Risiken und Gegenmaßnahmen

### Risiko: Bestehende Tests brechen durch explizites Setup

Gegenmaßnahme:

- Test-Hilfsfunktion für abgeschlossenen Setup-Zustand.
- Setup nur dort explizit testen, wo es fachlich relevant ist.

### Risiko: Mulligan leakt Hidden Info

Gegenmaßnahme:

- Strikte PlayerView-Tests.
- PublicEvent-Snapshot-Tests.
- Hidden-Info-Barriere für Mulligan-Auflösungen.

### Risiko: Single-PendingChoice bildet simultanen Mulligan nicht perfekt ab

Gegenmaßnahme:

- Sequenziellen Flow als MVP-Entscheidung dokumentieren.
- Entscheidungsergebnis nicht öffentlich machen.
- Spätere Multi-PendingChoice-Erweiterung offenhalten.

### Risiko: UI-Icon-Arbeit wird zu breit

Gegenmaßnahme:

- Nur zentrale Spielwerte und klare Ereignistypen.
- Keine dekorative Icon-Streuung.
- Keine Mini-Porträts.

### Risiko: `Korp` kollidiert mit technischen `corp`-IDs

Gegenmaßnahme:

- Sichtbare Label-Funktion zentralisieren.
- Tests auf UI-Text, nicht auf interne Typen.
- Keine Umbenennung technischer IDs.

### Risiko: Agenda-Zielwerte werden uneinheitlich

Gegenmaßnahme:

- `agendaPointsToWin` als Quelle der Wahrheit im GameState.
- Wert in PlayerView liefern.
- Produktstandard im Server/Engine-Pfad auf 7 prüfen.

### Risiko: Archives-Facedown wird versehentlich zu V1.1.2-Ausbau

Gegenmaßnahme:

- V1.1.0 beschränkt sich auf Modell, Sichtbarkeit und Tests.
- Access-Logik für vollständige Archives bleibt ausdrücklich V1.1.2.

## Akzeptanzkriterien Gesamt

V1.1.0 ist fachlich akzeptiert, wenn:

- Neue Spiele durch einen expliziten Setup-Abschnitt laufen.
- Runner und Korp je eine private Mulligan-Entscheidung erhalten.
- Mulligan deterministisch, replayfähig und side-safe ist.
- Nach Setup-Abschluss der erste Corp-Timingpunkt korrekt erreicht wird.
- Agenda-Siegziel regulär 7 ist.
- Agenda-Anzeigen in der UI immer aktuellen Wert und Zielwert zeigen.
- Game-End-Gründe für Agenda, Corp-Deckout und Flatline konsistent sind.
- Result Summary, Chronik und Game-End-UI dieselben Gründe verwenden.
- Archives-Facedown-Grundlage keine privaten Korp-Karten leakt.
- Identity-Setup ist dokumentiert, deterministisch und getestet.
- Sichtbare UI konsequent `Korp` verwendet.
- Runner und Korp haben eigene Lucide-Rollenicons.
- Agenda hat ein Projekt-/Dossier-Icon in Agenda-Blau.
- Runner-Tags haben ein eigenes Symbol.
- Run-Start-Button auf Außenservern nutzt kein Schild-/Defense-Icon.
- Chronik nutzt Icons nur dort, wo sie Lesbarkeit verbessern.
- Alle relevanten Unit-, Server-, Web- und Playtest-Fälle bestehen.

## Offene Prüfpunkte vor Freigabe

Diese Punkte müssen vor Umsetzung nicht zwingend als Rückfrage an den Nutzer gehen, sollten aber im technischen Review entschieden werden:

1. Soll Setup als eigene `phase: "setup"` modelliert werden oder nur über `timingPoint`?
2. Wird eine Test-Hilfsfunktion oder ein `setupMode` in `CreateGameConfig` für alte Tests verwendet?
3. Wird Mulligan als Hidden-Info-Barriere in Undo/Rewind exakt gleich behandelt wie andere Hidden-Info-Aktionen?
4. Welche Lucide-Icons werden final gewählt?
5. Welche Chronik-Ereignisse bekommen im ersten Schritt wirklich Icons?
6. Wird `agendaPointsToWin` direkt in `PlayerView` aufgenommen oder serverseitig als separates UI-Metadatum geliefert?
7. Welche bestehenden Legacy-Testformate dürfen agendaPointsToWin ungleich 7 behalten?

## Empfohlene Entscheidungen

- Setup als eigene Phase einführen.
- `agendaPointsToWin` direkt in `PlayerView` aufnehmen.
- Produktspiele immer mit explizitem Setup starten.
- Tests über `advanceThroughSetup` oder `createGameAfterSetup` vereinfachen.
- Mulligan-Auflösung als Hidden-Info-Barriere behandeln.
- Lucide-Vorschlag:
  - Runner: `Fingerprint`
  - Korp: `Building2`
  - Agenda: `FileText`
  - Tags: `ScanLine`
  - Run starten: `Route`
- Chronik-Icons nur für Rollen-, Agenda-, Tag-, Setup- und Game-End-Ereignisse einsetzen.

## Freigabezustand

Dieser Plan ist umgesetzt und lokal verifiziert. Die konkrete Anforderungsableitung, Testmatrix, Implementierungsreview und finale Review liegen in den zugehörigen V1.1.0-Artefakten unter `docs/derived/`.
