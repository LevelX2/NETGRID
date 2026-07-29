# Corp-Gegnerzug- und Kampagnenkontinuität

Datum: 2026-07-30
Paket: ZK10a
Status: **Cutover-Voraussetzung erfüllt**

## Ergebnis

Der bestehende ResidentPlanPortfolio trägt jetzt das minimale
zugübergreifende Gedächtnis für Agenda-, Defense- und Opening-Rush-Linien.
Dieses Gedächtnis ist kein zweiter Scheduler: Es beschreibt nur, welche
Kampagne zuletzt bestand, welche öffentlichen Gegnerzug-Outcomes eingetreten
sind und ob am nächsten eigenen Entscheidungszeitpunkt eine neue Quote
vorliegt.

Damit hängt ZK11 nicht mehr von einer fehlenden Fortsetzung über den
Gegnerzug ab.

## Zustände und Übergänge

| Zustand                     | Bedeutung                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `awaiting_opponent_outcome` | Der Gegnerzug läuft; die Kampagne wartet auf öffentliche Outcomes.                             |
| `continuable`               | Die aktuelle Corp-Domain hat die Kampagne am eigenen Entscheidungszeitpunkt neu zugelassen.    |
| `blocked`                   | Eine öffentliche Kompromittierung oder eine aktuell fehlende Quote verhindert die Fortsetzung. |
| `completed`                 | Das Ziel ist im sichtbaren Corp-Zustand abgeschlossen, etwa eine Agenda im Scorebereich.       |
| `abandoned`                 | Zielkarte oder Zielremote fehlen sichtbar oder wurden öffentlich als zerstört erkannt.         |

Run, Rez, Trace, Access, Trash und eine daraus abgeleitete
Remote-Kompromittierung werden als typisierte Outcomes dem konkreten
Kampagnenmeilenstein zugeordnet. Event-IDs verhindern Doppelverarbeitung bei
Replay oder überlappender EventTail-/PlayerView-Zulieferung.

Am nächsten eigenen Corp-Entscheidungszeitpunkt entscheidet ausschließlich
die neu aufgebaute Plan-Domain, ob die Kampagne wieder `continuable` ist.
Die Persistenz erzwingt keine alte Linie und speichert keine zukünftige
Action-ID.

## Informations- und Autoritätsgrenze

- Kampagnen-Outcomes verwenden nur PublicEvents und den aktuellen sichtbaren
  Corp-Zustand.
- Freie Payload-Prosa und Definitionstexte beeinflussen die Klassifikation
  nicht.
- Die Schicht reicht Status an Scheduler und Debuganzeige, besitzt aber keine
  Aktionsautorität.
- Die private Betreiber-Buganzeige zeigt bestimmungsgemäß vollständige
  Karteninformationen beider Seiten. Diese Anzeige ist nicht seitensicher und
  soll es auch nicht sein.
- PlayerViews, PublicEvents, öffentliche Replays, normale
  WebSocket-/Reconnect-Payloads, Logs und Clientfehler behalten ihre
  bestehenden Sicherheitsgrenzen.

## Bewusst nicht vorgezogen

ZK10a führt keinen allgemeinen Interruptplaner, keinen beliebig tiefen
Outcome-Graphen und keine generische Deadline-/Value-Claim-Maschine ein.
Komplexe Rez-, Trace-, Prevention-, Ambush- und Mehrfachreaktionsfolgen
bleiben ZK12. Das hält die Cutover-Voraussetzung eng.

## Verifikation

- fokussierter AI-Korpus: 179/179;
- Shared-Debugvertrag und Sanitizer: 16/16;
- Web-Debugexport: 1/1;
- vollständige AI-Suite: 529 Dateien, 4.327 Tests;
- vier nur unter paralleler CPU-Konkurrenz abgelaufene Simulationstests:
  isoliert 5/5 grün;
- AI-, Shared- und Web-Typecheck: grün;
- AI-Strukturvertrag: `production=745`, keine Runtime- oder Typzyklen;
- `git diff --check`: grün.
