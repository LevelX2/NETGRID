# Release-Planung 2026-05-05

Status: aktualisiert_nach_v1_0_3_finale
Stand: 2026-05-05

## Auftrag

Der Planungsbranch `codex/release-planning-2026-05-05` wurde nach dem V1.0.3-Finale gegen `main` abgeglichen. Die brauchbaren Planungsanteile wurden übernommen und korrigiert; die dortige frühere Aussage, V1.0.3 sei nicht belegbar, ist nach dem Merge von `9eea8ca` nach `main` überholt.

## Prüfbasis

Aktueller Integrationsstand:

- `main` enthält V1.0.2 Gegner-Aktionsdarstellung und V1.0.3 Matchstart-UX.
- V1.0.3-Final Review: `docs/derived/V1_0_3_MATCHSTART_UX_FINAL_REVIEW.md`.
- V1.0.4-Kandidaten: `docs/derived/V1_0_4_NEXT_RELEASE_CANDIDATES.md`.
- Übernommene Planungsartefakte: V1.0.4 Private Match Lifecycle, V1.0.5 Action Board UX und langfristige Produktvision.

Verifikation auf `main` nach dem V1.0.3-Finale:

- `corepack pnpm lint`: bestanden.
- `corepack pnpm typecheck`: bestanden.
- `corepack pnpm test`: bestanden.
- `corepack pnpm build`: bestanden.

## V1.0.3-Bewertung

V1.0.3 ist lokal abgeschlossen und auf `main` integriert.

Belegt durch:

- Commit `9eea8ca Implement V1.0.3 matchstart UX`.
- `main` zeigt auf diesen Commit.
- Codepfade für getrennten Matchstart, serverseitige Auslosung, Startbereitschaftslobby, Ready-Flags, Countdown, Lobbychat, lokale Anzeigenamen, gemerkte Sitzungen und Runner-Rig-Anzeige.
- Server-, Web- und Visibility-Tests.
- Final Review unter `docs/derived/V1_0_3_MATCHSTART_UX_FINAL_REVIEW.md`.

Das auf dem Planungsbranch erzeugte `V1_0_3_STATUS_REVIEW.md` wurde bewusst nicht übernommen, weil es vor dem Merge auf `main` entstanden ist und danach sachlich falsch wäre.

## Codebasierte Hauptbefunde

### Match-Lifecycle

V1.0.3 verbessert den lokalen Rückweg aus der Startbereitschaftslobby und merkt letzte Sitzungen. Serverseitig fehlen aber weiterhin explizite terminale Lifecycle-Operationen für:

- pending Lobby abbrechen,
- Joiner verlässt Lobby,
- aktives Spiel aufgeben,
- altes Match entwerten und mit denselben lokalen Einstellungen neu erstellen.

Das ist der Kern von V1.0.4.

### Reconnect und Session Recovery

Reconnect ist tokenbasiert und side-sicher vorhanden. Die UI merkt inzwischen letzte lokale Sitzungen unter `netrunner.recentSessions`, damit ein Reconnect ohne erneute Link-Eingabe möglich ist. V1.0.4 sollte daraus einen klaren kontrollierbaren Recovery-Fluss machen: Fortsetzen, Verwerfen, abgebrochen/nicht mehr verfügbar verstehen und keine Tokens oder Deckdaten leaken.

### Gegnernamen

`displayName` existiert in Sessions und Lobbyteilnehmern. Im aktiven Spiel ist die Gegenseite aber noch primär Seite/Verbindungsstatus, nicht der Anzeigename. V1.0.4 sollte Gegnernamen side-sicher in Payloads und UI ergänzen, ohne Decknamen, Deckhashes, Decklisten oder Tokens mitzunehmen.

### Board, Run und Terminologie

V1.0.2 hat Cues, KI-Pacing, Highlights und Action-Audio eingeführt. V1.0.3 hat Matchstart und Lobby geklärt sowie das gegnerische `Runner-Rig` oberhalb des Run-Bereichs sichtbar gemacht. Offen bleiben:

- sichtbare deutsche Regel-/Run-Begriffe nach Glossar- oder Handbuchabgleich,
- bessere RunTimeline inklusive Movement/Jack-out/Breach/Access,
- Runner-Rig-Struktur nach Programmen, Hardware und Ressourcen,
- zentrale Serverdarstellung für `HQ`, `R&D` und `Archives`,
- visuelle Prüfung der ICE-Ausrichtung,
- Browser-E2E-/Screenshot-Smokes für Zwei-Tab- und Reconnect-Flows.

Das ist der Kern von V1.0.5.

### Hidden Info, Replay und StateHash

Die bestehende Basis bleibt stark: PlayerViews, PublicEvents, Reconnect, Undo, AI-Inputs, Replay und StateHash sind getestet. Neue Lifecycle- und UX-Funktionen müssen diese Verträge erweitern, nicht umgehen.

## Empfohlene Releasefolge

1. **V1.0.4 Private Match Lifecycle und Session Recovery**
   - Pending Lobby abbrechen.
   - Joiner Leave.
   - Aktives Spiel aufgeben.
   - Recreate ohne stale aktive Lobby.
   - Gegnernamen sichtbar und side-sicher.
   - Session-Recovery verständlicher und kontrollierbarer.

2. **V1.0.5 Action Board UX und Board-Klarheit**
   - V1.0.2-KI-Pacing und Cues gegen Regression absichern.
   - Board-/Run-/Rig-Darstellung verbessern.
   - Deutsche UI-Regelbegriffe nach Quelle normalisieren.
   - Audio-/Optionen im Spiel weiter härtbar machen.
   - Browser-E2E-/Visual-Smokes vorbereiten oder aufnehmen.

3. **V1.0.5K kleines Karten-Nachrelease**
   - Nach V1.0.5 bis zu 20 lokal geprüfte Karten aktivieren.
   - Keine große neue Mechanikfamilie erzwingen.
   - Nur Karten mit bestätigtem Text, passender Mechanik-Coverage, Manifest, Unit-/Szenariotests, Decklegalität und Visibility-/Replay-/StateHash-Schutz freigeben.
   - Definition: `docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md`.

4. **Danach**
   - Browser-E2E und Visual QA als eigener Qualitätsrelease.
   - Storage-/Backup-Härtung.
   - Erst danach weitere Regel-/Karten-Gates oder private Internet-Härtung.

## Wichtigste fehlende Tests

- Server-Tests für Cancel, Leave, Forfeit, Recreate und Join nach Cancel.
- Reconnect-Tests für abgebrochene oder aufgegebene Matches.
- Tests für Gegnernamen ohne Deck-/Token-Leaks.
- Web-/Contract-Tests für Session-Recovery und Verwerfen.
- Browser-Zwei-Tab-Smokes für Host, Join, Lobby, Reconnect, Cancel, Forfeit.
- Visual-/Textfit-Smokes für RunTimeline, Runner-Rig und zentrale Server.
- Glossar-/UI-Tests für deutsche Run-Begriffe nach freigegebener Quelle.

## Wichtigste Risiken

1. Aufgabe/Abbruch darf Engine-Replay und StateHash nicht verfälschen.
2. Session-Recovery darf keine Tokens, Decklisten oder verdeckten Kartendaten persistieren oder anzeigen.
3. Gegnernamen dürfen keine öffentlichen Plattform- oder Accountannahmen erzeugen.
4. Board-UX darf keine FullState- oder Engine-Imports in den Browser zurückbringen.
5. Deutsche UI-Begriffe dürfen technische Engine-IDs nicht verändern.

## Ergebnis

Der Planungsbranch liefert verwertbare Releaseplanung, aber nicht als direkter Merge. Integriert werden die korrigierten Planungsartefakte für V1.0.4, V1.0.5 und die langfristige Roadmap. Die alte V1.0.3-Negativbewertung bleibt verworfen.
