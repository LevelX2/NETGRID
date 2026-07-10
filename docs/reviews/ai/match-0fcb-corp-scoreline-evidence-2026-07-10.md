# Match 0fcb: Corp-Scoreline-Evidence

## Matchbasis

- Match: `match_0fcb17642297a8a2`
- Modus: `human_runner_vs_corp_ai`
- KI: Corp, Schwierigkeitsgrad `hard`
- Ergebnis: Runner gewinnt 8:2 nach Agenda-Punkten
- Datenbasis: 285 Events/State-Snapshots und 108 KI-Entscheidungstraces
- Runtime-Ausfaelle: keine Fallbacks oder Timeouts in den untersuchten Traces

## Befunde und Ursachen

### 1. Unsichere Scoreline wurde erzwungen

`force_scoreline_clock` konnte den normalen Sicherheitsbefund ueberstimmen.
Dadurch begann die Corp mehrzuegige Agenda-Linien, obwohl der Runner den
Zielserver sichtbar oder nachweislich erreichen konnte.

Korrektur: Das Scoreline-Assessment bleibt auch im Zeitdruck die
Sicherheitsautoritaet. Ein belegtes unsicheres Fenster kann nicht mehr durch
den Clock-Grund freigeschaltet werden.

### 2. Runner-Oekonomie wurde zu statisch prognostiziert

Die Projektion betrachtete den aktuellen Creditpool staerker als sichtbare,
wiederholbare Standard- und Kartenaktionen. Fehlende aktuelle
Breaker-Abdeckung wurde bei Mehrzugplaenen dadurch zu lange als Sicherheit
interpretiert.

Korrektur: Der Expositionshorizont rechnet sichtbare Runner-Aktionsoekonomie
ein. Temporär fehlende Abdeckung ist bei verzögerten Scorelines ein
Unsicherheitsfaktor und kein dauerhafter Schutzbeweis.

### 3. Erfolgreiche Remote-Zugriffe gingen als Beweis verloren

Nach einem erfolgreichen Zugriff konnte eine spaetere statische Kalkulation
dasselbe unveraenderte Remote wieder als sicher einstufen.

Korrektur: Ein oeffentlich beobachteter erfolgreicher Zugriff gilt als
empirischer Reachability-Beweis, bis ICE-Pfad oder relevante Root-Protektion
sichtbar veraendert wurden.

### 4. Agenda, Advancement-Speicher und Schutz wurden vermischt

Supportkarten wie Vapor Ops konnten wie ein Agenda-Ziel behandelt werden;
konkrete Schutzkarten wie Red Herrings waren nicht sauber an den aktiven
Scoreplan gebunden.

Korrektur: Scoreziel, Advancement-Support und Remote-Schutz besitzen getrennte
Rollen. Nur echte Agendas erzeugen einen Score-Window-Installationsplan;
passende ICE-, Rez- und sichtbare Root-Schutzaktionen sind konkrete Schritte
des Scoreplans.

### 5. BBS-Plan und Aktionsauswahl widersprachen sich

Ein endlicher Economyplan konnte als aktiv erscheinen, ohne die zugehoerige
Aktion zu steuern. Umgekehrt konnte er eine akutere Scoreline stoeren.

Korrektur: Ein aktiver und ausführbarer Finite-Economy-Plan kontrolliert seine
gemappte Aktion. Eine aktive Scoreline blockiert eine neue BBS-Installation
mit explizitem Grund; eine bereits installierte BBS darf weiter abgearbeitet
werden.

### 6. Trace-Feld `turn` enthielt eine StateVersion

Die Speicherung setzte `turn` direkt auf `event.stateVersionBefore`. Damit
hatten Entscheidungen desselben Zuges verschiedene angebliche Zugnummern.

Korrektur: Multiplayer-Payload und Trace-Speicherung nutzen dieselbe
Chronicle-Zugkontextberechnung. Auch eine nachgelagerte Abwurfaufloesung bleibt
dem gerade beendeten Zug zugeordnet.

## Posthume Neubewertung historischer Zustände

Die Matchzustände wurden mit dem geänderten Runtime-Code erneut bewertet:

| StateVersion | Historischer Problemkontext | Neue Auswahl |
| ---: | --- | --- |
| 71 | Project-Zurich-/Vapor-Linie ohne sichere Konvertierung | `gain_credit`, keine unsichere Scoreline |
| 141 | Project-Venice-Scoreline braucht Schutz | Red Herrings nach Remote 1 |
| 165 | Scoreline noch nicht finanzierbar | `gain_credit` innerhalb des Scoreplans |
| 175 | Scoreline braucht einen weiteren ICE-Layer | Data Wall nach Remote 1 |
| 221 | Kein akuter Scoreline-Konflikt | BBS Whispering Campaign im Finite-Economy-Plan |
| 259 | Corporate-Retreat-Linie braucht Schutz | Filter nach Remote 1, nicht als Agenda behandelt |

Diese Ergebnisse entstehen aus Planstatus, sichtbarer Erreichbarkeit und
LegalAction-Mapping. Es gibt keine Frontend-Korrektur und keinen pauschalen
Nachschlag auf angezeigte Scores.
