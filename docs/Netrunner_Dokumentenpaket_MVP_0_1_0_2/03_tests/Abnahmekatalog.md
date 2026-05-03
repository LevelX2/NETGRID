# Netrunner-Webapplikation – Abnahmekatalog MVP 0.1 und MVP 0.2

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Dokumenttyp:** operative Abnahmegrundlage ergänzend zum detaillierten Testkonzept

## 1. Zweck

Dieser Abnahmekatalog übersetzt Konzept, Spezifikationen und Testkonzept in prüfbare Pass/Fail-Kriterien. Er dient als kompakte Entscheidungsgrundlage, ob MVP 0.1 oder MVP 0.2 als fertig gilt.

Das detaillierte Testkonzept beschreibt, wie getestet wird. Dieser Katalog beschreibt, was für die Abnahme nachweisbar bestanden sein muss.

## 2. Abnahmeprinzipien

1. Ein MVP ist nicht abnahmefähig, wenn ein P0-Hidden-Info-Leak bekannt ist.
2. Eine UI-Demo ersetzt keine Engine-, Replay- und Visibility-Tests.
3. Jede erfolgreiche Action muss über die Engine laufen.
4. LegalActions sind die einzige Quelle für UI- und KI-Aktionen.
5. Multiplayer ist erst abnahmefähig, wenn Race Conditions, Reconnect und Undo geprüft sind.
6. Bekannte Einschränkungen sind zulässig, wenn sie dokumentiert, getestet und nicht abnahmekritisch sind.

## 3. Abnahmerollen

| Rolle | Verantwortung |
|---|---|
| Entwicklung | Implementierung, technische Nachweise, Bugfixes. |
| Test/QA | Testausführung, Befundklassifikation, Regression. |
| Product/Projekt | Scope-Abgleich, Go/No-Go-Entscheidung. |
| Betrieb/DevOps | Startbarkeit, Konfiguration, Backup, privater Betrieb. |

Eine Person kann mehrere Rollen übernehmen. Die Rollen beschreiben Aufgaben, nicht zwingend Teamstellen.

## 4. Eintrittskriterien MVP 0.1

MVP 0.1 darf zur Abnahme antreten, wenn:

- Engine-Paket separat testbar ist,
- Demo-Decks definiert sind,
- CardImplementation-Manifest für alle Demo-Karten existiert,
- `createGame`, `getLegalActions`, `applyAction`, `getPlayerView`, `hashState` implementiert sind,
- grundlegende UI spielbar ist,
- Corp-KI nur LegalActions verwendet,
- Testfixtures für mindestens Runner-Sieg, Corp-Sieg, Run/Access und Visibility vorhanden sind.

## 5. Austrittskriterien MVP 0.1

MVP 0.1 gilt als bestanden, wenn alle folgenden Kriterien erfüllt sind.

| ID | Kriterium | Pass/Fail-Bedingung |
|---|---|---|
| A-0.1-01 | Spielstart | Neue Partie mit festen Demo-Decks startet deterministisch. |
| A-0.1-02 | Engine-Autorität | UI und KI können keine Aktion außerhalb von LegalActions erfolgreich erzwingen. |
| A-0.1-03 | Grundaktionen | Credits nehmen, Karten ziehen, installieren, Events/Operations spielen und Zug beenden funktionieren. |
| A-0.1-04 | Corp-Pflichtdraw | Corp zieht im Draw-Schritt korrekt. |
| A-0.1-05 | Simple Economy | Runner-Event und Corp-Operation geben korrekt Credits und bewegen Karten in Heap/Archives. |
| A-0.1-06 | Installationen | Runner-Programme, Corp-ICE, Agenda und Asset können regelkonform installiert werden. |
| A-0.1-07 | Memory | Runner-Programme beachten MU-Grenze oder erzeugen korrekten Pflichtzustand. |
| A-0.1-08 | Run-Start | Runner kann Run auf erlaubten Server starten. |
| A-0.1-09 | ICE-Rez | Corp kann ICE im passenden Fenster rezzen, wenn Credits reichen. |
| A-0.1-10 | Encounter | Gerezztes ICE wird encountered; Stärke und Subroutinen werden berücksichtigt. |
| A-0.1-11 | Breaker | Fracter, Decoder und Killer funktionieren nur gegen passenden ICE-Subtype. |
| A-0.1-12 | Subroutinen | End-the-run, Corp +1 Credit und Runner verliert Credits werden korrekt aufgelöst. |
| A-0.1-13 | Breach/Access | HQ, R&D, Archives und Remote haben dokumentiertes MVP-Access-Verhalten. |
| A-0.1-14 | Agenda-Steal | Runner kann accessed Simple Agenda stehlen. |
| A-0.1-15 | Agenda-Score | Corp kann ausreichend avancierte Simple Agenda scoren. |
| A-0.1-16 | Siegbedingungen | Runner- und Corp-Sieg sind deterministisch erreichbar. |
| A-0.1-17 | Corp-KI | KI wählt nur aus legalen Corp-Actions und sieht keine Runner-Privatdaten. |
| A-0.1-18 | EventLog | Jede Transition erzeugt Event mit StateVersion und StateHash. |
| A-0.1-19 | Replay | Mindestens eine vollständige Beispielpartie reproduziert finalen StateHash. |
| A-0.1-20 | Visibility | RunnerView und CorpView enthalten keine verbotenen Hidden Infos. |
| A-0.1-21 | Invarianten | `validateGameState` besteht nach jeder Transition. |
| A-0.1-22 | Dokumentierte Abweichungen | Alle MVP-Regelvereinfachungen sind im Abweichungsregister dokumentiert. |

## 6. Eintrittskriterien MVP 0.2

MVP 0.2 darf zur Abnahme antreten, wenn:

- MVP-0.1-Austrittskriterien bestanden oder dokumentiert nicht blockierend sind,
- Match-, Session-, Token- und Storage-Modell implementiert sind,
- REST-Endpunkte für Create, Join, Reconnect/Bootstrap existieren,
- WebSocket `join_match` und `submit_action` existieren,
- PlayerViews für beide Seiten serverseitig getrennt gesendet werden,
- Idempotency und Match-Lock implementiert sind,
- Reconnect- und Undo-Grundlogik vorhanden ist,
- Multiplayer-Visibility-Tests eingerichtet sind.

## 7. Austrittskriterien MVP 0.2

| ID | Kriterium | Pass/Fail-Bedingung |
|---|---|---|
| A-0.2-01 | Match-Erstellung | Host erstellt privates Match und erhält Host-Session sowie Invite-Link. |
| A-0.2-02 | Join-Link | Joiner übernimmt genau die freie Seite. |
| A-0.2-03 | Token-Sicherheit | Ungültige/falsche Tokens werden generisch abgelehnt und leaken keine Details. |
| A-0.2-04 | WebSocket Join | Beide Seiten verbinden und erhalten korrekte Seite. |
| A-0.2-05 | Initiale Views | Beide Seiten erhalten nur eigene PlayerView. |
| A-0.2-06 | Action Submit | Gültige Action wird über WebSocket verarbeitet und persistiert. |
| A-0.2-07 | Serverautorität | Client kann GameState nicht setzen oder Regeln umgehen. |
| A-0.2-08 | Stale State | Alte Action wird abgelehnt und Client resynchronisiert. |
| A-0.2-09 | Idempotency | Doppelte Action erzeugt nur eine Transition. |
| A-0.2-10 | Concurrency | Gleichzeitige Actions erzeugen keinen inkonsistenten State. |
| A-0.2-11 | Seitenspezifische Updates | Nach Transition haben beide Clients gleiche StateVersion und unterschiedliche gefilterte Views. |
| A-0.2-12 | ChoiceRequests | Nur berechtigte Seite sieht private Choice-Optionen. |
| A-0.2-13 | Reconnect Action Phase | Spieler reconnectet und erhält korrekte View und LegalActions. |
| A-0.2-14 | Reconnect Run/Encounter | Reconnect während Rez- oder Breaker-Choice stellt PendingChoice korrekt wieder her. |
| A-0.2-15 | Reconnect Access | Reconnect während Access liefert keine zusätzlichen verdeckten Informationen. |
| A-0.2-16 | Disconnect Status | Gegner sieht Disconnect/Reconnect-Status ohne private Details. |
| A-0.2-17 | Undo vor Hidden Info | Undo mit Zustimmung funktioniert vor Informationsgewinn. |
| A-0.2-18 | Undo nach Hidden Info | Undo nach Hidden-Info-Barrier wird blockiert. |
| A-0.2-19 | Persistenz | Match überlebt Serverneustart oder wird sauber pausiert/wiederhergestellt. |
| A-0.2-20 | Replay | Multiplayer-EventLog reproduziert finalen StateHash. |
| A-0.2-21 | Visibility WebSocket | Alle Message-Typen bestehen Hidden-Info-Oracle. |
| A-0.2-22 | Visibility REST | Bootstrap/Reconnect/Replay enthalten keine falschen privaten Daten. |
| A-0.2-23 | Fehlerhygiene | Errors enthalten keine privaten CardIds, Kartentitel oder Tokens. |
| A-0.2-24 | UI-Spielbarkeit | Zwei Browserfenster oder zwei Geräte können eine vollständige Beispielpartie spielen. |
| A-0.2-25 | Privater Betrieb | Lokaler/LAN/private Serverstart ist dokumentiert und reproduzierbar. |

## 8. Kritische Blocker

Folgende Befunde blockieren Abnahme immer:

| Klasse | Beispiele |
|---|---|
| Hidden-Info-Leak | Runner sieht HQ/R&D/unrezzed Titel; Corp sieht Runner-Grip. |
| Regelumgehung | Manipulierte Action verändert State trotz Illegalität. |
| Doppelte Transition | Doppelklick gibt zwei Credits oder scored doppelt. |
| Race Condition | Zwei gleichzeitige Actions committen auf demselben State. |
| Reconnect-Leak | Bootstrap ist detailreicher als normaler StateUpdate. |
| Undo-Leak | Undo verrät konkrete verdeckte Karte oder erlaubt Rücknahme nach Informationsgewinn. |
| Nicht reproduzierbarer Replay | Finaler StateHash kann nicht reproduziert werden. |
| Token-Leak | Klartexttoken in Logs, Events oder Clientpayloads. |

## 9. Abnahmenachweise

Zur Abnahme werden folgende Nachweise gesammelt:

- Testlauf-Protokoll der automatisierten Tests,
- Liste der Test-Seeds und Szenarien,
- Replay-Datei oder EventLog der Beispielpartie,
- finaler StateHash der Beispielpartie,
- Screenshots oder kurze Notizen der manuellen Demo,
- Liste offener Defects mit Klassifikation,
- Bestätigung, dass keine P0/P1-Blocker offen sind,
- Verweis auf dokumentierte Abweichungen und bekannte Limitierungen.

## 10. Go/No-Go-Regel

### MVP 0.1 Go

Go, wenn:

- alle A-0.1-Kriterien bestanden sind,
- keine P0-Defects offen sind,
- P1-Defects entweder behoben oder ausdrücklich nicht abnahmekritisch sind,
- Demo-Partie reproduzierbar ist,
- Dokumentation und Abweichungsregister aktuell sind.

### MVP 0.2 Go

Go, wenn:

- alle A-0.2-Kriterien bestanden sind,
- alle Multiplayer-Visibility-Tests bestehen,
- Concurrency-, Idempotency-, Reconnect-, Undo- und Replay-Tests bestehen,
- private Beispielpartie vollständig spielbar ist,
- kein P0/P1-Blocker offen ist,
- privater Betrieb dokumentiert ist.

No-Go, sobald ein kritischer Blocker aus Abschnitt 8 offen ist.
