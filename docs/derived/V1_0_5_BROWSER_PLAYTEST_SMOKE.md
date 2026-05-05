# V1.0.5 Browser-/Playtest-Smoke

Stand: 2026-05-05
Status: repeatable_smoke

## Zweck

Dieser Smoke prüft V1.0.5 Action Board UX und Board-Klarheit in realen Browserflüssen. Er ist bewusst auf Darstellung, Cues, KI-Pacing, RunTimeline, Runner-Rig, zentrale Server, Reconnect und Viewport-Lesbarkeit begrenzt.

Der Smoke erweitert keine Karten, keine Engine-Regeln, keine offiziellen Assets und keine Plattformfunktionen.

## Voraussetzung

- Server und Web laufen lokal.
- Zwei Browser-Tabs oder zwei getrennte Browserprofile sind verfügbar.
- DevTools Application/Storage ist für Stichproben verfügbar.
- Audio darf lokal aktiviert werden, bleibt aber opt-in.
- Schmaler Viewport kann per DevTools oder schmalem Browserfenster geprüft werden.

## Smoke A: Human-vs-KI und KI-Pacing

1. Starte ein Human-vs-KI-Match.
2. Prüfe: KI-Takt steht sichtbar auf `Getaktet` oder einer gleichwertigen deutschen Beschriftung, nicht auf rohem `paced`.
3. Lasse die Corp-KI einen Schritt machen.
4. Prüfe: Es erscheint ein kompakter Gegner-/KI-Cue, der die Boardmitte nicht dauerhaft verdeckt.
5. Aktiviere Audio im kompakten Audio-Menü.
6. Lasse nur einen neuen KI-/Gegnercue abspielen.
7. Prüfe: Audio spielt nur nach Opt-in; keine alte Cue-Serie wird nachträglich abgespielt.
8. Prüfe: Sobald der Runner gefragt ist, sind `Mögliche Aktionen` und lokale Entscheidungsbereiche hervorgehoben.

## Smoke B: Human-vs-Human verdeckte Installation

1. Tab A erstellt ein Human-vs-Human-Match.
2. Tab B tritt bei und startet mit Tab A ein aktives Spiel.
3. Corp installiert eine verdeckte Karte in einem Remote oder ICE-/Root-Lane.
4. Runner-Tab prüft den Cue.
5. Erwartung:
   - Cue nennt keinen Kartentitel.
   - Cue enthält keine Definition-ID.
   - Keine Bild-URL oder unterscheidbare verdeckte Kartengrafik ist sichtbar.
   - Highlight zeigt nur abstrakten Server-/Lane-Fokus.
   - Chronicle bleibt ebenfalls redacted.

## Smoke C: Runner-Run, RunTimeline und Zugriff

1. Runner startet einen Run auf einen zentralen Server.
2. Prüfe die Timeline.
3. Erwartung:
   - Zielserver ist verständlich sichtbar.
   - Runphasen verwenden deutsche Labels wie `Annäherung`, `Begegnung`, `Bewegung`, `Zugriff`, `Abschluss`.
   - Keine normalen Hauptlabels `Approach`, `Encounter`, `Access`, `Breach`.
4. Falls ein ICE begegnet wird, prüfe Encounter-Fokus:
   - sichtbares/gerezztes ICE darf Titel und Text zeigen,
   - verdecktes ICE bleibt anonym.
5. Falls ein Jack-out-Fenster entsteht:
   - Timeline zeigt `Bewegung`,
   - die Aktion ist verständlich als `Run abbrechen (Jack-out)` oder gleichwertig benannt.
6. Beim Zugriff:
   - nur die aktuell zugegriffene Karte wird sichtbar,
   - keine künftigen Breach-/Queue-Karten werden angekündigt.

## Smoke D: Corp-Sicht auf Runner-Rig

1. Runner installiert mindestens eine sichtbare Runner-Karte, idealerweise Programm, Hardware oder Ressource.
2. Corp-Tab prüft das gegnerische Runner-Rig.
3. Erwartung:
   - Runner-Rig ist sichtbar.
   - Karten sind nach `Programme`, `Hardware`, `Ressourcen` und optional `Sonstiges` gruppiert.
   - Keine Runner-Grip- oder Stack-Titel erscheinen.
   - Leere Gruppen leaken keine Information.

## Smoke E: Zentrale Server und Archive

1. Prüfe in beiden Tabs HQ, F&E/R&D und Archive.
2. Erwartung:
   - HQ, F&E/R&D und Archive sind als zentrale Server unterscheidbar.
   - Counts sind plausibel und side-sicher.
   - Runner-Sicht sieht keine verdeckten HQ-/R&D-Titel.
   - Corp-Sicht sieht keine Runner-Grip-/Stack-Titel.
   - Archive zeigt nur das, was die PlayerView für diese Seite sicher erlaubt.

## Smoke F: Reconnect/Reload ohne alte Cues und Sounds

1. Erzeuge ein paar Events mit Cues.
2. Aktiviere Audio, falls noch nicht aktiv.
3. Lade einen Tab neu oder nutze Fortsetzen/Wieder verbinden.
4. Erwartung:
   - Chronicle zeigt die Historie.
   - Alte Events erzeugen keine neuen Overlay-Cues.
   - Alte Events erzeugen keine Soundfolge.
   - Neue Gegneraktionen nach Reconnect erzeugen wieder normale Cues.

## Smoke G: Schmaler Viewport

1. Stelle den Browser auf einen schmalen Viewport.
2. Prüfe Topbar, Action-Spalte, RunTimeline, Runner-Rig, ServerGrid, Chronicle und Cue-Overlay.
3. Erwartung:
   - Texte laufen nicht aus Buttons oder Panels.
   - `Mögliche Aktionen` und `Zurücknehmen` bleiben bedienbar.
   - Cues sind kompakt und dismissbar.
   - RunTimeline und zentrale Server überlappen nicht unlesbar.
   - Runner-Rig verdrängt nicht dauerhaft den Run-Fokus.

## Pflicht-Stichproben

- Browsercode importiert keine Engine-Regelmodule in die aktive Spielseite.
- `localStorage.netrunner.recentSessions` enthält weiterhin keine Tokens, Decklisten, Deckhashes oder Hidden Info.
- SidePayloads, WebSocket-Payloads und Reconnect-Payloads enthalten keine neuen versteckten Kartendaten.
- Audio-Einstellung bleibt lokal.
- V1.0.4-Lifecycle-Aktionen Cancel, Leave, Forfeit, Recreate und Fortsetzen bleiben erreichbar und side-sicher.

## Ergebnisnotiz für Final Review

Nach Umsetzung soll der Final Review pro Smoke A bis G festhalten:

- `pass`, `partial` oder `fail`,
- getesteter Browser/Viewport,
- auffällige UI-Restpunkte,
- Hidden-Info-/Token-/Payload-Auffälligkeiten,
- ob automatisierte Tests dieselbe Stelle bereits abdecken.
