# Proteus Cybernetics-/Deck-Hardware-Vertrag

Datum: 2026-05-17

## Status und Scope

Dieses Artefakt beschreibt den Planungsvertrag für den Proteus-Mechanikcluster `cybernetics_deck_hardware` aus `data/rules/proteus-mechanics-coverage-2026-05-17.json`.

Der Vertrag ist planning-only. Er erzeugt keine Runtime-Implementierung, keine Proteus-Kartenpromotion, keine Decklegalität, keine Formatlegalität und keine AI-Unterstützung.

Betroffene Karten aus der lokalen Proteus-Basis:

| Karte | Typ/Untertypen | Vertragsrelevanz |
| --- | --- | --- |
| `onr_proteus_134_cortical-cybermodem` / Cortical Cybermodem | Hardware, Deck, Cybernetics | +2 MU, +2 Handgröße, zwei zweckgebundene Bits, Deck-Einzigkeit |
| `onr_proteus_135_cortical-stimulators` / Cortical Stimulators | Hardware, Cybernetics | laufende Net-/Brain-Damage-Prevention, Cybernetics ohne Deck-Einzigkeit |
| `onr_proteus_138_deck-the` / Deck, The | Hardware, Deck, Base Link | +1 MU, Base-Link-Auswahl, Deck-Einzigkeit |
| `onr_proteus_151_sunburst-cranial-interface` / Sunburst Cranial Interface | Hardware, Deck, Cybernetics, Stealth | +1 MU, +1 Handgröße, ein zweckgebundenes nicht-noisy Icebreaker-Bit, Deck-Einzigkeit |

## Mechanikvertrag

### Deck-Einzigkeit

- Nur eine installierte Runner-Hardware mit Untertyp `Deck` darf gleichzeitig im Spiel sein.
- Beim Installieren eines neuen Decks werden alle älteren installierten Runner-Decks desselben Runners deterministisch in den Heap getrasht.
- Der neue Deck-Install wird erst nach normaler Install-Revalidierung ausgeführt: Side, Zone, StateVersion, Kosten, Kartentyp, LegalAction-Identität und Timingpunkt bleiben `applyAction`-Pflicht.
- Wenn ein älteres Deck getrasht wird, werden seine laufenden Modifier, Counter/Bits und any-card-state sauber entfernt, bevor die neue Ableitung von MU, Handgröße, Link oder zweckgebundenen Ressourcen geprüft wird.
- Nicht-Deck-Cybernetics wie Cortical Stimulators lösen diese Ein-Deck-Regel nicht aus und werden durch ein neues Deck nicht automatisch getrasht.

### MU- und Handgrößenmodifier

- Deck-Hardware kann statische Runner-Modifier tragen:
  - Cortical Cybermodem: `memoryLimitBonus +2`, `runnerMaxHandSizeBonus +2`.
  - Deck, The: `memoryLimitBonus +1`, kein Handgrößenbonus.
  - Sunburst Cranial Interface: `memoryLimitBonus +1`, `runnerMaxHandSizeBonus +1`.
- Die effektive Handgröße wird aus Basis-Handlimit, Core-Damage-Reduktion und installierten Modifiern abgeleitet. Sie darf nicht als dauerhaft mutierter Basiswert gespeichert werden.
- Beim Trash eines Decks wird die abgeleitete Handgröße neu berechnet. Ist die Runner-Hand danach über Limit, greift der bestehende Discard-/Handlimit-Vertrag am nächsten passenden Checkpoint; der Deck-Trash selbst verwirft nicht automatisch verdeckte Handkarten.
- MU-Druck nach Deck-Trash ist ein Engine-Gate: Entweder existiert bereits ein allgemeiner Trash-to-free-MU-Choice-Pfad für solche Fälle, oder der erste Umsetzungsslice muss den Zustand blockieren und eine explizite Runner-Choice öffnen. Still überzogenes `memoryUsed > memoryLimit` ist nicht zulässig.

### Zweckgebundene Bits

- Die Bits auf Cortical Cybermodem und Sunburst Cranial Interface sind installierte Karten-Counter mit eigener Zweckbindung, nicht generische Runner-Credits.
- Cortical Cybermodem initialisiert zwei Bits. Diese Bits dürfen nur Kosten für die Nutzung von Icebreakern während Runs bezahlen.
- Sunburst Cranial Interface initialisiert ein Bit. Dieses Bit darf nur Kosten für die Nutzung von Icebreakern während Runs bezahlen und darf nicht für noisy Icebreaker verwendet werden.
- Zweckbindung wird doppelt geprüft:
  - LegalActions zeigen die Ressource nur bei passendem Run-/Encounter-/Icebreaker-Kontext und passender Kartenrestriktion an.
  - `applyAction` revalidiert Quelle, installierten Zustand, Counterstand, Timing, Icebreaker-Bezug, Noisy-Ausschluss und Kostenhöhe.
- Bit-Ausgaben werden source-bound dokumentiert. PublicEvents dürfen die öffentlich installierte Quelle und den verbrauchten Betrag nennen, aber keine privaten Hand-/Stackinformationen.

### Refresh-Timing

- Die Bits werden bei Installation auf den Maximalwert gesetzt.
- Wenn mindestens ein solches Bit seit dem letzten Runner-Zugstart ausgegeben wurde, wird die Karte am Start des nächsten Runner-Zugs aus der Bank bis zu ihrem Maximalwert aufgefüllt.
- Der Refresh akkumuliert nicht über den Maximalwert hinaus.
- Der Refresh passiert im Runner-Start-of-turn-Fenster vor neuen Runner-Aktionen und nutzt einen deterministischen, replay-stabilen PublicEvent-Eintrag mit Quelle, Countertyp und neuem Count.
- Wenn die Quelle vor dem Refresh getrasht wurde, findet kein Refresh statt.

### Sichtbarkeit, UI und AI

- Installierte Runner-Hardware ist öffentlich. PlayerViews, PublicEvents, Reconnect-Payloads und Replays dürfen Namen, Untertypen, MU-/Handgrößenmodifier und sichtbare Bits anzeigen.
- Verdeckte Runner-Zonen bleiben geschützt: Installationsentscheidungen, Handkarten, Stackreihenfolge und nicht öffentliche Choices dürfen nicht in Korp-View, PublicEvents, AI-Input oder Logs gelangen.
- UI-Auswirkungen für eine spätere Umsetzung:
  - Rig/Hardware-Zeile zeigt Deck-Einzigkeit und ersetzt-altes-Deck-Konsequenz vor dem Installieren.
  - Ressourcenanzeige trennt Runner-Credits, MU, Handlimit und zweckgebundene Icebreaker-Bits.
  - Breaker-/Pump-Aktionen zeigen verwendbare Quellen nur im passenden Run-Kontext.
  - Start-of-turn-Cues zeigen den Refresh öffentlicher installierter Bits ohne private Zusatzdaten.
- AI-Auswirkungen bleiben für diesen Auftrag planning-only:
  - Keine Proteus-AI-Hints und keine `ai_supported`-Promotion.
  - Ein späterer AI-Slice darf solche Karten nur über PlayerView-/LegalAction-Daten bewerten.
  - Zweckgebundene Bits dürfen im AI-Input nur als öffentliche eigene Ressourcen der KI-Seite oder öffentliche gegnerische Board-Ressourcen erscheinen, niemals als Zugriff auf verdeckte Zonen.

## Kleinster erster Umsetzungsslice

Der kleinste sinnvolle Runtime-Slice ist ein nicht promotender Harness-Slice für genau zwei Deck-Hardware-Karten: Cortical Cybermodem und Sunburst Cranial Interface.

Minimalumfang:

1. WIP-Kartendefinitionen bleiben `blocked`/nicht decklegal und werden nur in Tests gezielt geladen.
2. Hardware-Install setzt MU-/Handgrößenmodifier und initialisiert zweckgebundene Bits.
3. Install eines zweiten Decks trasht das ältere Deck deterministisch und entfernt dessen Modifier/Bits.
4. Breaker-Kosten können in einem Test-Harness source-bound aus Deck-Bits bezahlt werden; Sunburst schließt noisy Icebreaker aus.
5. Runner-Start-of-turn refreshes nur ausgegebene Bits bis zum Maximalwert.

Deck, The sollte erst folgen, wenn der Base-Link-Auswahlvertrag im Trace-Fenster für mehrere Base-Link-Quellen sauber geprüft wird. Cortical Stimulators gehört in den Damage-/Prevention-Slice und sollte nicht der erste Deck-Hardware-Slice sein.

## Testskizze

| Bereich | Testidee | Muss prüfen |
| --- | --- | --- |
| Memory | Cortical Cybermodem installieren, danach ein Programm nur dank +2 MU legal installieren | `memoryLimit` steigt, `memoryUsed` bleibt korrekt, Replay/StateHash stabil |
| Memory nach Trash | Sunburst installieren, danach Cortical Cybermodem installieren | altes Deck wird getrasht, alter Bonus entfernt, neuer Bonus gesetzt, kein stilles MU-Überziehen |
| Handgröße | Cybermodem/Sunburst installieren und mit Core-Damage-Handlimit kombinieren | effektive Handgröße wird abgeleitet, Bonus wird beim Trash entfernt, keine privaten Handkarten im PublicPayload |
| Zweckgebundene Bits | Icebreaker während Run mit Deck-Bit bezahlen | Counter sinkt source-bound, Runner-Credits werden nur für Restkosten genutzt, falscher Timingpunkt wird abgelehnt |
| Noisy-Ausschluss | Noisy Icebreaker mit Sunburst-Bit bezahlen wollen | LegalAction bietet Quelle nicht an; `applyAction` lehnt manipulierte Action ab |
| Refresh | Bit ausgeben, Runner-Zug starten | Counter refreshes bis Maximalwert, nicht darüber, PublicEvent nennt nur öffentliche Quelle und Count |
| Kein Refresh ohne Ausgabe | Karte mit vollem Counter in den nächsten Zug führen | kein zusätzlicher Counter, kein unnötiger Event-Spam |
| Trash alter Decks | Deck, The oder Sunburst liegt installiert, Cortical Cybermodem wird installiert | ältere Deck-Hardware geht in Heap, Counter/Modifier werden entfernt, neue Karte bleibt installiert |
| Visibility | Korp-View/Reconnect/PublicEvent nach Install, Bit-Spend, Refresh und Deck-Trash prüfen | öffentliche Hardwaredaten sichtbar, keine Grip-/Stack-/Choice-Leaks |

## Handoff

- Primärer Folgeagent für Umsetzung: `release-implementation-agent`.
- Vor Promotion nötig: eigener Release-/Gate-Beschluss für Proteus, Runtime-Definitions-Guard, Engine-Tests, Visibility-/Replay-/StateHash-Tests, Web-UI-Prüfung und später separater AI-Enablement-Slice.
- Offenes Risiko: MU-Überzug nach Trash eines älteren Decks muss vor einer echten Freigabe entweder über bestehenden Trash-to-free-MU-Choice wiederverwendet oder als expliziter neuer Choice-Vertrag geschnitten werden.
