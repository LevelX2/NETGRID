# V1.2.1 Implementation Review - Replacement Effects

Stand: 2026-05-08
Status: implemented

## Ergebnis

V1.2.1 ist als getrennte Replacement-Pipeline umgesetzt. Replacement Effects laufen vor dem V1.2.0-Prevention/Avoid-Fenster, ersetzen ein Originalevent durch ein neues Replacementevent und teilen EventLog, PlayerView, KI-Input, Multiplayer/Reconnect und Undo nur side-sichere Informationen mit.

## Umgesetzter Scope

- Damage-Auflösung prüft zuerst Replacement-Kandidaten, danach erst Event Modification.
- Replacement-Kandidaten laufen über ein eigenes side-privates PendingChoice-Fenster.
- EventLog dokumentiert Originalevent, Entscheidung und Replacementevent redigiert.
- Apply ersetzt test-only Damage durch ein test-only Tag-Event; das Original-Damage-Event wird nicht ausgeführt.
- Pass lässt das Originalevent in die V1.2.0-Prevention-Pipeline weiterlaufen.
- Einmal-pro-Fenster-Regel ist über Window-ID, Kandidatenstatus und State-Cleanup abgesichert.
- Kandidatenordnung ist deterministisch über Priorität, Side und Kandidaten-ID.
- Konflikte gleicher Priorität werden sichtbar und redigiert blockiert.
- KI nutzt LegalActions/PlayerView und bekommt keine FullState- oder verdeckten Gegnerdaten.
- Multiplayer-Reconnect, Idempotency und stale StateVersion sind abgedeckt.

## Geänderte Hauptmodule

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`

## Architekturentscheidungen

- Replacement nutzt eine eigene `replacementWindow`-Struktur statt das V1.2.0-Event-Modification-Fenster zu überladen.
- Originalevent und Replacementevent bleiben kanonische Engine-Events, werden aber in PublicEvents nur über redigierte Metadaten sichtbar.
- Die V1.2.1-Pipeline erweitert Prevention/Avoid nicht; sie entscheidet nur, ob das Originalevent überhaupt weiterläuft.
- Der Pilot bleibt bewusst test-only Damage Replacement. Es wurden keine Runtime-Karten oder KI-Decks freigegeben.
- Konflikte werden konservativ geblockt, bis ein späteres Gate eine explizite Auswahl-/Prioritätsregel für echte Kartenfälle einführt.

## Bekannte Grenzen

- Kein Access-, Trash-, Steal-, Install-, Kosten- oder Zonen-Replacement.
- Keine Special Zones, Ownership, Control, Set Aside oder Remove from Game.
- Keine neuen Runtime-Karten, keine Kartenpool-Erweiterung und keine KI-Deckfreigabe.
- Keine Prevention/Avoid-Ausweitung über den V1.2.0-Pilot hinaus.
