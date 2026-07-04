# Agenda-Point-Cost-Correction-Prozess

Status: geplant
Datum: 2026-07-04
Arbeitsbranch: `codex/agenda-point-cost-correction`

## Ausgangspunkt

Im aktiven Spiel `match_69c3e1a5fb4f9273` wurde `ACME Savings and Loan` gerezzt, nachdem die Corp `Tycho Extension` gescort hatte. Die aktuelle Engine bezahlte den Agenda-Punkt-Kostenanteil, indem sie die gescorerte Agenda-Karte aus der Score Area entfernte. Dadurch wurden faktisch alle 4 Punkte von `Tycho Extension` abgegeben, obwohl `ACME Savings and Loan` nur 1 Agenda-Punkt kostet.

Die lokale Regelquelle `docs/source/Netrunner Errata 1.70.md` stützt die fachliche Lesart: Bei Kosten wie "costs 1 agenda point" wird 1 Agenda-Punkt ausgegeben. Das ist keine automatische Forfeit-Anweisung für die ganze Agenda-Karte. Explizite Forfeit-Effekte bleiben davon getrennt.

## Ziel

Agenda-Punkt-Kosten werden exakt als Punktkosten modelliert:

- Eine gescorerte Agenda bleibt in der Score Area, wenn nur ein Agenda-Punkt von ihr ausgegeben wird.
- Der verfügbare Punktwert dieser Agenda sinkt um den bezahlten Betrag, aber nie unter 0.
- Bonus-Agenda-Punkte der Corp werden zuerst verbraucht, bevor Punkte von gescorerten Agendas abgezogen werden.
- `ACME Savings and Loan` mit gescorter `Tycho Extension` laesst `Tycho Extension` in der Score Area und reduziert den Corp-Punktestand von 4 auf 3.
- Nur echte Forfeit-Effekte entfernen Karten aus der Score Area oder legen sie in `special.removed_from_game`.

## Nicht-Ziele

- Keine UI-Neugestaltung.
- Keine KI-Gewichtungsänderung ausser notwendiger Erwartungsanpassungen in Tests.
- Keine Migration alter lokaler SQLite-Spiele oder historischer Replays.
- Keine Änderung an offiziellen Assets, Card Frames, Logos oder externen Kartendatenquellen.

## Invarianten

- Die Rules Engine bleibt die einzige Regelautorität.
- `applyAction` validiert Kosten und Zielkarten erneut.
- Öffentliche Events dürfen keine verdeckten Kartendaten leaken.
- Replay und StateHash bleiben deterministisch.
- Punktkosten-Payloads dürfen nicht suggerieren, dass eine Agenda-Karte forfeited oder aus dem Spiel entfernt wurde, wenn nur Punkte bezahlt wurden.

## Paketfolge

### APCC-00: Prozessartefakt

Dieses Artefakt anlegen, die Paketfolge festhalten und separat committen.

Abnahmekriterien:

- Prozessziel, Nicht-Ziele, Invarianten und Paketfolge sind dokumentiert.
- `git diff --check` läuft sauber.
- Commit: `docs(engine): plan agenda point cost correction`.

### APCC-01: Punkt-Ledger fuer gescorerte Agendas

Ein deterministisches Modell fuer ausgegebene Agenda-Punkte einfuehren. Gescorerte Agendas behalten ihre Karte in der Score Area, koennen aber einen reduzierten verbleibenden Agenda-Punktwert haben.

Abnahmekriterien:

- Der verbleibende Punktwert einer gescorerten Agenda beruecksichtigt bereits ausgegebene Punkte.
- Runner- und Corp-Gesamtpunktberechnung nutzen denselben verbleibenden Punktwert.
- Der neue Zustand ist im gemeinsamen Card-Instance-Typ ausdrueckbar.
- State-Validierung und bestehende Punkttests bleiben konsistent.

### APCC-02: Corp-Kostenpfade korrigieren

Corp-seitige Agenda-Punkt-Kostenpfade von Karten-Forfeit auf Punktverbrauch umstellen.

Abnahmekriterien:

- `ACME Savings and Loan` bezahlt Agenda-Punkt-Kosten ohne Score-Area-Entfernung.
- Self-Rez-Kosten wie `Glacier` verwenden dieselbe Punktverbrauchslogik.
- Corp-Folgepfade wie Damage-Prevention/Meat-Damage-Kosten verwenden ebenfalls Punktverbrauch, falls sie Agenda-Punkt-Kosten haben.
- Public Events verwenden punktbezogene Felder statt Forfeit-/Removed-From-Game-Signale.

### APCC-03: Runner-Kostenpfade korrigieren

Runner-seitige Agenda-Punkt-Kostenpfade von Karten-Forfeit auf Punktverbrauch umstellen.

Abnahmekriterien:

- Runner-Installkosten wie `Corporate Ally` und `Arasaka Portable Prototype` verbrauchen Agenda-Punkte ohne Agenda-Karten zu entfernen.
- `Databroker` bezahlt seinen Agenda-Punkt-Kostenanteil ueber Punktverbrauch; die Ressource selbst wird weiterhin nach ihrer Faehigkeit getrasht.
- LegalActions und ApplyAction bleiben deterministisch und validieren die gewaehlten Punktquellen erneut.

### APCC-04: Regressionstests und fachliche Dokumentation

Tests an die korrigierte Regelinterpretation anpassen und gezielte Regressionen fuer das erkannte ACME/Tycho-Szenario ergaenzen.

Abnahmekriterien:

- Ein Test deckt ab, dass `ACME Savings and Loan` bei gescorter `Tycho Extension` genau 1 Punkt bezahlt und `Tycho Extension` in der Score Area bleibt.
- Bestehende Tests fuer `Corporate Ally`, `Arasaka Portable Prototype`, `Databroker`, `ACME Savings and Loan` und verwandte Agenda-Punkt-Kostenpfade erwarten Punktverbrauch statt Kartenentfernung.
- Die relevante Engine-Testauswahl laeuft erfolgreich.

### APCC-05: Abschluss und Integration

Alle Paketcommits pruefen und den Arbeitsbranch lokal nach `main` integrieren.

Abnahmekriterien:

- Worktree-Status ist vor der Integration sauber.
- Relevante Tests und `git diff --check` sind erfolgreich.
- Der Branch ist lokal nach `main` gemergt.
- Der temporäre Worktree ist entfernt oder als entfernt dokumentiert.
