# V1.9 Originalset Display Text Finalization Policy

Stand: 2026-05-13
Status: active automation policy

## Entscheidung

Fuer die V1.9.10-bis-V1.9.22-Originalset-Completion darf die Automation abgeleitete, lokal bestaetigte Regelkern-Aussagen als finale Anzeige-/Release-Texte verwenden, wenn im festen Automations-Worktree keine versionierte lokale Volltextquelle fuer die jeweilige Karte verfuegbar ist.

Diese Freigabe gilt nur fuer Karten, deren Regelkern bereits aus lokalen, bestaetigten Projektquellen in den V1.9.10-bis-V1.9.xx-Planungsartefakten analysiert wurde.

## Grenzen

- Kartentext bleibt Anzeige- und Kataloginformation.
- Kartentext ist keine Parserautoritaet.
- Die Rules Engine, LegalActions, applyAction-Revalidierung, KI-Entscheidungen, Visibility, Replay und StateHash duerfen nicht aus Anzeige-Text abgeleitet werden.
- `human_playable`, `deck_legal` und `ai_supported` duerfen weiterhin nur gesetzt werden, wenn Engine-, Daten-, KI-, Visibility-, Replay-/StateHash- und Testabdeckung fuer die Karte vorhanden sind.
- `V1.9.xx WIP:`-Praefixe duerfen nicht in finalen Release-/Katalogtexten verbleiben.

## Automationsregel

Fehlende versionierte Volltextquellen im Automations-Worktree sind kein harter P0-Stopgrund mehr, wenn fuer den aktuellen Release lokal bestaetigte Regelkern-Aussagen in den fuehrenden Planungsartefakten vorhanden sind.

In diesem Fall muss die Automation:

1. aus den vorhandenen Regelkern-Aussagen finale, knappe Anzeige-/Release-Texte ohne WIP-Praefix erzeugen,
2. im Implementation Review oder Final Review dokumentieren, dass die Texte abgeleitet und display-only sind,
3. die Engine-/LegalAction-/KI-/Test-Gates separat pruefen,
4. danach den Release bei gruenem Completion-Gate abschliessen und in den Pipeline-Modus wechseln.

Nur wenn weder eine versionierte Volltextquelle noch eine lokal bestaetigte Regelkern-Aussage fuer eine Zielkarte vorliegt, ist das weiterhin ein fachlicher Blocker.
