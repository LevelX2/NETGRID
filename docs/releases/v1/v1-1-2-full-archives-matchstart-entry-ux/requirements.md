# V1.1.2 Requirements - Full Archives Access und Matchstart Entry UX

Stand: 2026-05-07
Status: eingefroren

## Ziel

V1.1.2 verbindet zwei getrennte Tracks:

- Track A ist der primäre Regel-/Visibility-Release `Full Archives Access`.
- Track B ist ein unabhängiger Web-UI-Komfortslice `Matchstart Entry UX`.

Track A erweitert das mit V1.1.0 vorbereitete Archives-facedown-Fundament zu vollständigem, deterministischem und side-sicherem Runner-Access auf Korp-Archives. Track B macht den ersten Spielstart attraktiver und klarer, ohne Engine, Serververtrag, Spielregeln, Replay, StateHash, Kartenpool oder Plattformfunktionen zu verändern.

Wenn Track A in der Umsetzung zusätzliche Risiken oder Blocker zeigt, hat Track A Vorrang. Track B darf dann in ein späteres reines UX-Zwischenrelease verschoben werden.

## Quellenbasis

- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/plan.md`
- `docs/releases/roadmaps/long-term-product-vision-and-roadmap.md`
- `docs/releases/v1/v1-1-0-setup-game-end-m2/plan.md`
- `docs/releases/v1/v1-1-0-setup-game-end-m2/requirements.md`
- `docs/releases/v1/v1-1-0-setup-game-end-m2/final-review.md`
- `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/requirements.md`
- `docs/releases/v1/v1-1-1-discard-handlimit-core-damage/test-matrix.md`
- `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`, gezielt für Archives-Zugriff und Access/Breach-Grundregeln

## Track A Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V112A-MUST-001 | Runner kann nach erfolgreichem Run auf Archives alle Karten in Korp-Archives über die bestehende Access-/Breach-Pipeline accessen. |
| V112A-MUST-002 | Die Archives-Access-Queue ist deterministisch und verwendet die authoritative Reihenfolge von `corp.archives` ohne Sortierung nach faceup/facedown. |
| V112A-MUST-003 | Faceup Archives-Karten bleiben für Runner vor dem Access mit Titel und DefinitionId sichtbar. |
| V112A-MUST-004 | Facedown Archives-Karten bleiben für Runner vor dem Access ohne Titel, DefinitionId, Bildpfad, Regeltext oder unterscheidbare DOM-/Payload-Metadaten. |
| V112A-MUST-005 | Die Korp sieht eigene faceup und facedown Archives-Karten weiterhin vollständig in PlayerView, Reconnect und eigener UI. |
| V112A-MUST-006 | Beim Breach-Start auf Archives werden alle zu diesem Zeitpunkt facedown Karten in `corp.archives` faceup gedreht; `AccessQueueEntry.hiddenInfo` oder ein gleichwertiger Vertrag berücksichtigt diesen Reveal. |
| V112A-MUST-007 | Karten, die erst nach dem Archives-Breach-Start facedown in Archives gelangen, bleiben für den Rest dieses Breaches facedown und werden nur beim tatsächlichen Access angesehen. |
| V112A-MUST-008 | Access-Events und side-gefilterte PublicEvents enthalten für den Runner erlaubte Archives-Reveal-/Access-Informationen, leaken aber keine weiterhin facedown Archives-Karten. |
| V112A-MUST-009 | PublicEvents, WebSocket-Payloads, Reconnect-Payloads, Fehler, Logs, Undo-Vorschauen, Debug-/Diagnoseflächen und KI-Inputs leaken keine facedown Archives-Karten vor deren Access. |
| V112A-MUST-010 | `BreachState.accessedSummaries` darf nur bereits accessed Karten zusammenfassen und bei Hidden-Info-Fällen keine künftigen Titel/DefinitionIds tragen. |
| V112A-MUST-011 | Agenda-Steal aus Archives funktioniert über denselben LegalAction-/PlayerAction-Pfad wie andere Access-Zonen. |
| V112A-MUST-012 | Der Runner darf Karten in Archives beim Access nicht mit Basic Trash oder mid-access Trash-Kosten trashen; dafür wird keine `trash_accessed_card`-LegalAction angeboten. |
| V112A-MUST-013 | Decline/Weiter accessen/Access abschließen und automatische Fortsetzung über Archives-Karten ohne Runner-Entscheidung funktionieren mit gemischten faceup/facedown Archives-Queues. |
| V112A-MUST-014 | Der Archives-Breach-Start-Reveal bisher facedown Karten ist eine Hidden-Info-Barriere und blockiert Undo über dieses Ereignis hinweg. |
| V112A-MUST-015 | Access auf ausschließlich bereits faceup bekannte Archives-Karten setzt keine unnötige neue Hidden-Info-Barriere, sofern keine sonstige verdeckte Information entsteht. |
| V112A-MUST-016 | Replay reproduziert Archives-Access, Reveals, Queue-Fortschritt, Steal/Trash/Decline und finalen StateHash deterministisch. |
| V112A-MUST-017 | Reconnect während Archives-Breach stellt Run-/Breach-Fortschritt side-sicher wieder her. |
| V112A-MUST-018 | Server-Submit, Idempotency und stale StateVersion behandeln Archives-Access wie andere Access-Aktionen und erzeugen keine Doppel-Accesses. |
| V112A-MUST-019 | KI erhält keine neuen FullState- oder verdeckten Archives-Informationen und entscheidet weiterhin nur aus PlayerView, LegalActions und side-gefilterten Events. |
| V112A-MUST-020 | Web UI zeigt Archives-Server, bekannte faceup Karten, facedown Count, laufenden Archives-Breach, Access-Reveal und Fortschritt verständlich auf Desktop, Tablet und schmalem Viewport. |
| V112A-MUST-021 | HQ-/F&E-Access-Redaction aus V1.0.9/V1.1.0 regressiert nicht durch neue Archives-Redaction. |
| V112A-MUST-022 | No-Scope-Regression bestätigt: keine Prevention, Avoid, Interrupt, Replacement Effects, Runner-Deckout-Siegbedingung, neue Karten, offizielle Assets oder öffentliche Plattformfunktion. |

## Track B Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V112B-MUST-001 | Der Spiel-Reiter zeigt `Match erstellen` nicht mehr als lange gleichrangige Formularliste, sondern als klare NETGRID-Startkonsole. |
| V112B-MUST-002 | Spielart wird als Kachelauswahl dargestellt: `Privates Duell`, `Gegen KI`, `Simulation`. |
| V112B-MUST-003 | Die Spielart-Kacheln setzen nur den bestehenden UI-State und nutzen weiter `deriveMatchStart`; sie ändern keinen Serververtrag. |
| V112B-MUST-004 | Spielziel wird als Format-Kacheln dargestellt: `Regelmatch` und `Matchserie`. |
| V112B-MUST-005 | `Einzelspiel · Deckziel` bleibt entfernt und darf nicht in UI oder normalen Produktpfaden zurückkehren. |
| V112B-MUST-006 | Der Human-vs-Human-Default zeigt im Standardfluss nur Name, eigene Runner-/Korp-Decks, Format, Startzusammenfassung und Primäraktion. |
| V112B-MUST-007 | Seitenzuteilung, Countdown, Seed, Testkonstellation und KI-Sonderoptionen liegen in einem sichtbaren Bereich `Erweiterte Optionen`. |
| V112B-MUST-008 | Alle bisherigen Startpfade bleiben erreichbar: Human-vs-Human, Human-vs-KI Runner/Korp/Auslosen, KI-vs-KI, Testkonstellation, KI-Deckpolitik `selected`/`fixed`/`seeded_random`. |
| V112B-MUST-009 | Beitreten nutzt primär ein `Join-Link`-Feld, das gültige Links in `matchId` und `joinToken` zerlegt. |
| V112B-MUST-010 | Manuelle Match-ID-/Token-Eingabe bleibt eingeklappt erreichbar und funktionsfähig. |
| V112B-MUST-011 | Join-Link-, Match-ID- und Token-Eingaben werden nicht in Recent Sessions, Startzusammenfassung, Notices, Logs oder permanente UI-Diagnostik kopiert. |
| V112B-MUST-012 | Die Startzusammenfassung zeigt Spielart, Seiten-/Auslosungsstatus, Format und relevante Startannahmen side-safe an. |
| V112B-MUST-013 | Die Startzusammenfassung zeigt keine gegnerischen Decklisten, Decknamen, Deckhashes, verdeckten Kartendaten oder Tokens. |
| V112B-MUST-014 | Neue Kacheln und Controls sind tastatur- und screenreader-bedienbar und verwenden stabile `data-testid`s für E2E. |
| V112B-MUST-015 | Startscreen-Layout bleibt in hellem und dunklem Theme auf Desktop, Tablet und schmalem Viewport ohne Überlappung, Textüberlauf oder horizontales Scrollen bedienbar. |
| V112B-MUST-016 | NETGRID-Optik wird dezent verbessert, ohne Hero-Landingpage, offizielle Assets, Cardbacks, Cardframes oder externe Artwork-Abhängigkeit. |

## Gemeinsame Nicht-Ziele

- Keine neuen Karten oder breite Kartenfreigabe.
- Keine neue Regelautorität in UI, Server, Browser oder KI.
- Keine offiziellen Artworks, Logos, Card Frames, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine Accounts, Public Lobby, Matchmaking, Rankings, Turnierfunktionen oder öffentlicher Chat.
- Keine Prevention, Avoid, Interrupt, Replacement Effects oder Ownership-/Control-Wechsel.
- Kein neuer Runner-Deckout-Sieg.

## Priorisierung

1. Track A Full Archives Access ist releasekritisch und roadmapped.
2. Track B Matchstart Entry UX ist erwünscht, aber verschiebbar.
3. Visibility, Replay/StateHash und E2E-Gates haben Vorrang vor optischer Politur.

## Gate-Anforderung

V1.1.2 darf implementiert werden, wenn diese Dateien vorhanden sind:

- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/requirements.md`
- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/full-archives-access-spec.md`
- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/matchstart-entry-ux-spec.md`
- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/test-matrix.md`
- `docs/releases/v1/v1-1-2-full-archives-matchstart-entry-ux/requirements-review.md`

Das Requirements Review muss `ready_for_implementation: true` melden.
