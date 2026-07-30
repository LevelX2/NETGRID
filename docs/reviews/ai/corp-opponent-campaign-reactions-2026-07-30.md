# Corp-Kampagnenreaktionen über Gegnerzüge

Datum: 2026-07-30
Paket: ZK12
Status: **erfüllt**

## Ergebnis

Der in ZK10a eingeführte kleine Kampagnenzustand kann jetzt mehrere
öffentliche Reaktionsfenster gleichzeitig verfolgen. Unterstützt werden Rez,
Trace, Prevention und Ambush. Die Erweiterung ist weiterhin kein Scheduler:
Sie beschreibt ausschließlich Pause, Resume, Deadline und
Claim-Disposition; sie erzeugt oder wählt keine Aktion.

## Zustandsvertrag

| Feld | Werte | Bedeutung |
| --- | --- | --- |
| Reaktion | `idle`, `paused`, `resumable`, `expired`, `terminal` | Aktueller Reaktionszustand der Kampagne |
| Offene Fenster | `rez`, `trace`, `prevention`, `ambush` | Sortierte, deduplizierte öffentliche Fenstertypen |
| Deadline | `none`, `current_run_end`, `next_own_turn` | Zeitpunkt der nächsten notwendigen Auflösung oder Neuquote |
| Claim | `active`, `reserved`, `requote_required`, `released` | Nichtnumerische Besitzdisposition des bereits bekannten Kampagnenwerts |

Öffnet der Gegnerzug mehrere Fenster, bleibt der Claim reserviert. Erst wenn
alle öffentlich als aufgelöst erkennbar sind und die aktuelle Corp-Domain die
Kampagne erneut zulässt, wird sie `resumable` und der Claim wieder `active`.
Ein beim nächsten eigenen Zug noch offenes Fenster wird `expired`; die
Kampagne ist dann blockiert und braucht eine neue Quote. Run-Ende schließt
laufgebundene Fenster deterministisch. Sichtbarer Abschluss oder Zielverlust
setzt den Zustand `terminal` und gibt den Claim frei.

## Autorität und Informationen

- Eingaben sind ausschließlich strukturierte PublicEvents und der aktuelle
  sichtbare Corp-Zustand.
- Freie Payload-Prosa und Kartentexte klassifizieren keine Reaktion.
- Die Persistenz enthält keine aktuelle oder zukünftige Action-ID.
- TurnPlanner, Scheduler und `applyAction` behalten ihre bisherigen
  Autoritätsgrenzen; die Reaktionsschicht kann keine Aktion ausführen.
- Die private Betreiber-Buganzeige zeigt absichtlich alle Karten und Hände
  beider Seiten sowie den vollständigen Reaktionszustand. Für sie gilt keine
  seitensichere Informationsreduktion.

## Verifikation

- überlappende Rez-/Trace-/Prevention-Fenster mit teilweiser Auflösung;
- vollständiges Resume nach allen öffentlichen Outcomes;
- abgelaufene offene Ambush-Deadline mit fail-closed Requote;
- deterministische Event-Deduplizierung bei Replay und Restart;
- Zielverlust, Kompromittierung und terminale Claim-Freigabe;
- 206 fokussierte AI-Tests, vollständige AI-Suite 529/4.335,
  16 Shared-Sanitizer-Tests und ein
  Web-Debugoverlay-Test grün;
- AI-, Shared- und Web-Typecheck sowie `git diff --check` grün.
