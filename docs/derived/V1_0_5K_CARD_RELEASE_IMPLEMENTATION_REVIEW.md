# V1.0.5K Card Release Implementation Review

Stand: 2026-05-05
Status: done

## Ergebnis

V1.0.5K aktiviert 12 lokal geprüfte O:NR-v1-Karten. Die Freigabe bleibt bewusst unter der 20er-Grenze, weil Dogcatcher, Flak, Reflector, Shield, Corporate War und Political Overthrow zusätzliche Ziel-, Prevention-, Kategorie- oder scored-agenda-Ability-Logik brauchen.

## Finale Kartenliste

| Karte | Seite | Freigabegrund |
|---|---|---|
| Codeslinger | Runner | Sentry-Subroutine-Breaker ohne neue Mechanikfamilie |
| Raffles | Runner | Code-Gate-Breaker mit vorhandener Pump-/Break-Logik |
| Raptor | Runner | Sentry-Breaker mit vorhandener Pump-/Break-Logik |
| Tinweasel | Runner | Code-Gate-Breaker ohne neue Mechanikfamilie |
| Tycho Mem Chip | Runner | Hardware mit engem MU-Bonus |
| Zetatech Mem Chip | Runner | Hardware mit engem MU-Bonus |
| Hostile Takeover | Corp | Agenda mit engem On-Score-Credit-Resolver |
| Cortical Scanner | Corp | Reines End-the-run-Code-Gate |
| Crystal Wall | Corp | Reine End-the-run-Wall |
| Data Wall | Corp | Reine End-the-run-Wall, korrigiert auf Rez 1 / Stärke 1 |
| Data Wall 2.0 | Corp | Reine End-the-run-Wall, korrigiert auf Rez 2 / Stärke 1 |
| Endless Corridor | Corp | Reines End-the-run-Code-Gate, korrigiert auf Rez 4 / Stärke 4 |

## Zurückgestellt

| Karte | Grund |
|---|---|
| Dogcatcher | Zielprüfung auf konkrete ICE-Namen/Subtypen wäre neue Speziallogik. |
| Flak | AP-Subroutine-Tagging ist noch keine freigegebene Mechanikfamilie. |
| Reflector | Stun-/Hellbolt-/Knockout-Kategorien brauchen Subroutine-Kategorie-Tagging. |
| Shield | Damage-Prevention und Turn-Reset bleiben gesperrt. |
| Corporate War | Bedingter On-Score-Resolver ist größer als Hostile Takeover. |
| Political Overthrow | Aktive scored-agenda Ability ist eine neue Aktionsquelle. |

## Umsetzung

- `packages/shared/src/index.ts`: neue Karten-Definitionen, MU-Bonus-Feld, Data-Wall-/Endless-Corridor-Korrekturen.
- `packages/engine/src/index.ts`: Memory-Chip-Bonus und enger Hostile-Takeover-On-Score-Resolver.
- `packages/catalog/src/index.ts`: Runtime-Release-Gate für private lokale O:NR-Daten. Nur die 12 V1.0.5K-Karten werden `playable` und `deck_legal`; frühere private Testkarten bleiben im Runtime-Deckbau gesperrt.
- `data/manifests/card-implementation-manifest-1.0.5k.json`: versioniertes Kartenmanifest.
- `data/scenarios/v105k-card-release-smoke.json`: Szenarioabdeckung für Kartenfreigabe, Deckvalidierung, Matchstart, Visibility, Replay und StateHash.

## Testabdeckung

- Engine-Tests decken Kartenwerte, Smoke-Decks, MU-Limit, passende und unpassende Breaker-Ziele, Hostile-Takeover-Scoring, Visibility und Replay/StateHash ab.
- Katalogtests decken das V1.0.5K-Runtime-Gate und die Sperre alter O:NR-Testkarten ab.
- Decktests decken V1.0.5K-Deckvalidierung und Blockierung nicht freigegebener O:NR-Karten ab.
- Servertests decken privaten Matchstart aus V1.0.5K-Deck-Snapshots ohne Decklisten-/Hidden-Info-Leak ab.

## Abschlusschecks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.

Gate-Ergebnis: `V1_0_5K_card_release_done: true`.

## Grenzen

V1.0.5K erweitert keine UI-Regelautorität und führt keine offiziellen Artworks, Card Frames, Card Backs oder externe Kartendatenbank-Abhängigkeiten ein. Die lokalen privaten O:NR-Text- und Bildartefakte unter `data/local/` und `data/local-assets/` bleiben unverändert ignoriert und nicht versioniert.
