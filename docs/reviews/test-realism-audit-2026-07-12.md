# Realismus-Audit der NETGRID-Tests außerhalb der KI

Stand: 12. Juli 2026  
Status: abgeschlossen und verifiziert
Gegenstand: alle Testdateien außerhalb von `packages/ai`

## Ergebnisübersicht vor Änderungen

| Gruppe | physische Testdateien | statisch registrierte Prüfungen | regulär ausgeführt | Einordnung |
| --- | ---: | ---: | ---: | --- |
| Engine | 181 | 2.059 | 2.059 | überwiegend starke Regel- und Replay-Evidenz, ergänzt um gezielte interne Unit-Fixtures |
| Web | 40 | 509 | 502 | viele sinnvolle reine Darstellungsableitungen; eine Testdatei mit sieben Prüfungen wurde nicht entdeckt |
| Server | 11 | 264 | 264 | breite Service-, HTTP-, WebSocket-, Speicher- und Sitzungsintegration |
| Catalog | 3 | 16 | 16 | Daten- und Registry-Verträge, für den Prüfgegenstand angemessen |
| Decks | 1 | 18 | 18 | Parser-/Validierungsvertrag, für den Prüfgegenstand angemessen |
| Shared | 1 | 10 | 10 | Schema- und Payload-Verträge, für den Prüfgegenstand angemessen |
| Root-Verträge | 2 | 5 | 5 | Artefakt-, Sichtbarkeits- und Architekturverträge |
| Browser-E2E | 1 | 8 | 8 | reale Browser-, Multiplayer-, Reconnect-, Viewport- und Leak-Pfade |
| **Gesamt** | **240** | **2.889** | **2.882** | sieben Prüfungen waren grün wirkungslos, weil sie nicht gesammelt wurden |

Die Zahlen sind statische Registrierungen. Parameterisierte Fälle innerhalb von `it.each` können zur Laufzeit mehr Einzelresultate erzeugen. Browser-E2E ist separat vom normalen Vitest-Lauf gezählt.

## Ergebnisübersicht nach der Härtung

| Gruppe | physische Testdateien | statisch registrierte Prüfungen | dynamisch im Abschlusslauf | Ergebnis |
| --- | ---: | ---: | ---: | --- |
| Engine | 182 | 2.060 | 1.632 | drei Seed-Varianten durchlaufen einen gemeinsamen echten LegalActions-/ApplyAction-/Choice-/View-/Replay-Pfad |
| Web | 40 | 512 | 541 | alle Dateien gesammelt; Kartenbild-`GET` selbst für 200, 304 und sichere 404 geprüft |
| Server | 11 | 264 | 153 | bestehende Service-, HTTP-, WebSocket-, Speicher- und Sitzungspfade grün |
| Catalog | 3 | 16 | 16 | Daten- und Registry-Verträge grün |
| Decks | 1 | 18 | 18 | Parser-/Validierungsvertrag grün |
| Shared | 1 | 10 | 10 | Schema- und Payload-Verträge grün |
| Root-Verträge | 3 | 8 | 8 | Leak-Scanner erkennen absichtlich kontaminierte Proben |
| Browser-E2E | 1 | 8 | 8 | alle realen Browserflüsse grün |
| **Gesamt** | **242** | **2.896** | **2.386** | jede physische Testdatei besitzt nun ein reguläres Gate |

Statische Vitest-Analyse und dynamischer Lauf zählen parametrisierte und zur Laufzeit erzeugte Fälle unterschiedlich; deshalb werden beide Werte bewusst getrennt ausgewiesen und nicht gegeneinander saldiert.

## Bewertungsmaßstab

Ein Test gilt nur dann als realistischer Nachweis für seine Aussage, wenn eine plausible Fehlfunktion im behaupteten Prüfgegenstand ihn rot machen würde. Das verlangt nicht überall eine Vollintegration:

- Ein reiner Formatter darf mit kleinen Tabellenwerten geprüft werden, solange der Test nur den Formatter beansprucht.
- Eine Regelwirkung braucht einen legalen Ausgangszustand, eine aus `LegalActions` stammende Aktion, `applyAction` und eine Prüfung des fachlichen Ergebnisses.
- Replay-, Sichtbarkeits- und Zufallsaussagen brauchen den echten Replay-/PlayerView-/Seed-Pfad.
- HTTP-, WebSocket- oder Next-Routen brauchen mindestens einen Test des exportierten Handlers beziehungsweise des echten Service- oder Transportpfads; Hilfsfunktionen allein belegen die Route nicht.
- Browser- und Leaksicherheitsprüfer brauchen einen Wirksamkeitsnachweis mit absichtlich fehlerhafter Eingabe. Ein Prüfer, der nie beim Fehler beobachtet wurde, kann unbemerkt wirkungslos sein.
- Architektur- und Datenverträge dürfen absichtlich quelltext- oder artefaktbezogen sein. Sie sind dann kein Laufzeitnachweis und werden auch nicht als solcher gewertet.

## Gruppenprüfung

### Engine

Die Engine-Suite ist für den beanspruchten Prüfgegenstand insgesamt realistisch. Die zentralen Pfade `createGame`, `getLegalActions`, `applyAction`, `getPlayerView` und `replayEvents` werden breit gemeinsam benutzt. `apply-action.test.ts` prüft unter anderem fremde, veraltete, unbekannte und inzwischen illegale Aktionen sowie unveränderten Zustand bei Host- oder Invariantenfehlern. `replay.test.ts` prüft reale Aktionsfolgen, Eventreihenfolge, StateHash und die Ablehnung versteckter Payloads. Sichtbarkeitstests erzeugen echte öffentliche und private Views.

Direkte Zustandspräparation kommt häufig vor. Sie ist bei einem großen Kartenpool als Arrange-Schritt vertretbar, wenn der Test anschließend den öffentlichen LegalActions-/ApplyAction-Pfad durchläuft. Sie ist kein realistischer Regelbeleg, wenn nur ein interner Helfer auf dem präparierten Objekt aufgerufen wird. Solche Tests werden im Audit deshalb als Unit-Evidenz eingestuft, nicht als Integrationsbeleg.

Quelltextlesende Engine-Tests sichern überwiegend Schichtgrenzen, Kartenregistrierung und verbotene Importe. Für diese Architekturbehauptung ist die Methode passend. Der vorhandene Package-Boundary-Selbsttest zeigt zusätzlich, dass der Prüfer auf eine absichtlich verbotene Abhängigkeit reagiert.

Bewertung: **hoch** für Regelautorität, LegalActions-Revalidierung, Replay, StateHash und Hidden Information; **mittel** für einzelne Karten-Helfer, deren Fixture bewusst nur die lokale Berechnung isoliert.

### Server

Die Server-Suite ist wesentlich realistischer als eine reine Mock-Suite. `multiplayer.test.ts` benutzt den echten `MultiplayerService` und verbindet ihn mit legalen Engine-Aktionen, Sitzungen, Reconnect, Replay, Speicher und WebSocket-/REST-Verhalten. `maintenance-http-auth.test.ts` startet einen echten lokalen HTTP-Server und ruft Endpunkte mit `fetch` auf; Cookie-, Origin-, CSRF-, Reauth- und Proxy-Fälle erreichen damit den tatsächlichen Handlerpfad.

Schmale Redaction-Tests bleiben als lokale Sicherheitsverträge sinnvoll, weil die betreffenden Transportpfade zusätzlich integriert geprüft sind. Einzelne Tests greifen absichtlich auf die erste legale Aktion zu; wo die Behauptung nur Token- oder Sitzungsisolation betrifft, ist die konkrete Spielentscheidung kein Teil des Prüfgegenstands.

Bewertung: **hoch** für Multiplayer-/Sitzungs-/Transportverhalten; **mittel bis hoch** für lokale Redaction-Helfer, abgesichert durch ergänzende Integrationspfade.

### Web

Die meisten Web-Tests prüfen reine View-Model-, Label-, Icon-, Layout- oder Auswahlableitungen in Node. Das ist für diese deterministischen Funktionen angemessen, belegt aber keine DOM-Interaktion. Die Browser-E2E-Suite trägt den realen Interaktionsnachweis.

Zwei konkrete Lücken wurden gefunden:

1. `apps/web/features/actions/WindowEventIcon.test.ts` lag außerhalb der vom Web-Paket wirksam erfassten Include-Pfade. Alle sieben registrierten Prüfungen bestanden nur bei explizitem Root-Aufruf, nicht im regulären `@netgrid/web test` und damit nicht im Root-Testlauf.
2. `apps/web/app/api/card-images/[cardId]/route.test.ts` prüfte ausschließlich `cacheControlForCardImage` und `clientHasFreshImage`. Ein Defekt im exportierten `GET`-Handler, beim Dateizugriff, den Antwortheadern oder der sicheren 404-Antwort hätte den Test nicht berührt.

Bewertung: **mittel** für reine UI-Ableitungen, wenn exakt so benannt; **hoch** für die durch Browser-E2E abgedeckten Kernflüsse; **unzureichend** für die zwei genannten Lücken vor der Härtung.

### Catalog, Decks und Shared

Diese Suiten behaupten hauptsächlich Datenvollständigkeit, Registry-Auflösung, Parser-/Validatorverhalten und Schema-Verträge. Kleine synthetische Eingaben sind hier realistisch, weil die Produktionslogik selbst eine reine Transformation ist. Exakte aktuelle Mengen in Artefakttests sind Snapshot-Verträge und kein Nachweis strategischer oder spielmechanischer Qualität.

Bewertung: **hoch** für die jeweils lokalen Daten- und Schemaverträge; ausdrücklich keine Engine- oder UI-Evidenz.

### Root-Verträge

`phase1-artifacts.test.ts` prüft erwartete Dateien, Registrierungen und aktuelle Datenmengen. `visibility-contract.test.ts` prüft die öffentliche Sichtbarkeitsform. Diese Tests sind bewusst schmale Repository- beziehungsweise Schema-Gates. Ihre Aussage bleibt realistisch, solange sie nicht als Laufzeitbeleg dargestellt wird.

Bewertung: **hoch** als Artefakt-/Vertragsgate, **nicht anwendbar** als Laufzeitnachweis.

### Browser-E2E

Die acht Playwright-Prüfungen öffnen die reale Webanwendung und decken Human-vs-AI, Human-vs-Human, Lobby/Lifecycle, Reconnect/Forfeit, Tablet und schmale Viewports, Hidden-Information-Scans, Laufzeitisolation und Deckvalidierung ab. Damit existiert ein sinnvoller Gegenpol zu den Node-basierten Web-Unit-Tests.

Die Leak-Scanner wurden in den E2E-Flüssen nur mit erwartbar sauberen Oberflächen und Payloads benutzt. Ohne absichtlich kontaminierte Probe war nicht belegt, dass die Regex- und Hidden-Title-Prüfer einen echten Leak tatsächlich erkennen.

Bewertung: **hoch** für die ausgeführten Browserflüsse; **mittel** für Leak-Erkennung vor einem negativen Wirksamkeitsnachweis.

## Priorisierte Findings und Umsetzung

| Priorität | Finding | Warum ein Problem unentdeckt bliebe | Maßnahme |
| --- | --- | --- | --- |
| P0 | Web-Testdatei nicht gesammelt | Änderungen an der Window-Event-Icon-Zuordnung konnten trotz grünem Root-Testlauf ungeprüft bleiben | **geschlossen:** Web-Include korrigiert; Discovery-Gate vergleicht alle physischen Pakettests mit der echten Vitest-Liste |
| P1 | Card-Image-Route nur über Helfer geprüft | Exportierter `GET`-Handler konnte bei Datei-, Header-, 304- oder Fehlerpfaden brechen | **geschlossen:** echte Handler-Aufrufe für 200, 304 und sichere 404-Antwort ergänzt |
| P1 | Leak-Scanner ohne Fehlerprobe | aus Versehen leere oder abgeschwächte Forbidden-Listen könnten weiterhin grün sein | **geschlossen:** absichtlich kontaminierte DOM-/Storage-/WebSocket-Proben werden nachweislich abgelehnt |
| P2 | Evidenzarten nicht explizit getrennt | schmale Architektur-, Fixture- oder Ableitungstests könnten als volle Laufzeitabdeckung missverstanden werden | **geschlossen:** Testmatrix und dauerhafter Auditprozess dokumentiert |

## Nicht als Fehler gewertete Muster

- Direkte Fixture-Präparation ist zulässig, wenn die Wirkung anschließend über LegalActions und `applyAction` beobachtet wird.
- Exakte IDs, Karten oder Phasen sind zulässig, wenn gerade dieser Karten- oder Phasenvertrag geprüft wird.
- Quelltextsuche ist zulässig, wenn ein Architektur- oder Importverbot der Prüfgegenstand ist.
- Mocks sind zulässig, wenn ein schmaler Adaptervertrag geprüft wird und der echte Grenzpfad an anderer Stelle integriert abgedeckt ist.
- Ein Test muss nicht zufällige Produktionszustände erzeugen. Er muss aber genug konkurrierende oder fehlerhafte Eingaben besitzen, dass die behauptete Auswahl oder Ablehnung unterscheidbar ist.

## Abschlussverifikation

- Nicht-KI-Pakete: 238 Testdateien und 2.370 dynamische Vitest-Fälle grün.
- Root-Verträge: 3 Dateien und 8 Fälle grün.
- Browser-E2E: 8 von 8 Fällen grün gegen isolierte lokale Server und temporäre SQLite-Laufzeit.
- Vitest-Discovery: jede physische Paket-Testdatei gesammelt.
- TypeScript: alle Workspace-Typechecks grün.
- Architektur: Package-Boundaries für 1.706 Dateien sowie vier Selbsttest-Verstöße grün.
- Hygiene: `git diff --check` grün.

Die verbleibende Grenze ist bewusst: Node-basierte Web-Ableitungstests sind kein vollständiger visueller DOM-Nachweis, und acht Browserflüsse decken nicht jede mögliche Kartenkombination ab. Für die behaupteten Prüfgegenstände besteht nach der Härtung jedoch kein kritisches Scheintest-Finding mehr.
