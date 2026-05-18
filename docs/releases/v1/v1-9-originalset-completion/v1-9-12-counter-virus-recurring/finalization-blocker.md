# V1.9.12 Finalization Blocker

Stand: 2026-05-13 00:27 CEST
Status: resolved_by_policy_and_release

## Blocker

V1.9.12 wurde im letzten Automationslauf noch nicht final auf `human_playable`, `deck_legal` oder `ai_supported` promotet, obwohl Engine, Katalog-WIP-Guard und Checks gruen sind.

Grund:

- Die elf V1.9.12-Zielkarten hatten in `packages/shared/src/index.ts` sichtbare `V1.9.12 WIP:`-Regeltexte.
- Im Automations-Worktree ist keine versionierte lokale Volltextquelle fuer diese elf Karten vorhanden; die fuehrenden Planungsartefakte enthalten abgeleitete Regelkern-Aussagen aus lokal bestaetigten Texten, aber keine finalen versionierten Anzeige-/Release-Texte.
- Eine Final-Promotion mit WIP-Texten wuerde den Completion-Gate-Vertrag verletzen, weil Katalog und Web dann finale Spielbarkeit anzeigen, waehrend die Kartenoberflaeche selbst noch WIP markiert.

## Bereits gruen

- Engine-WIP fuer alle elf Zielkarten.
- Katalog-WIP-Zielmenge und No-Promotion-Guard.
- Manifest, Mechanics-Coverage, AI-Hints, AI-Smoke-Plan und AI-Approval-Manifest als WIP-Artefakte.
- JSON-Validation, `engine`, `catalog`, `ai`, `server`, `web`, `typecheck`, `test`, `lint` und `build`.

## Entscheidung vom 2026-05-13

Der Nutzer hat bestaetigt, dass dieser Punkt durch die Automation geloest werden soll und kein Stopgrund ist. Fuehrend ist jetzt `docs/releases/v1/v1-9-originalset-completion/display-text-finalization-policy.md`.

Die Automation darf fuer die elf V1.9.12-Zielkarten aus den lokal bestaetigten Regelkern-Aussagen finale, knappe display-only Anzeige-/Release-Texte ableiten. Fehlende versionierte lokale Volltextquellen sind damit kein harter P0-Gate-Blocker mehr.

## Abschlussbefund vom 2026-05-13

Der Punkt ist fuer V1.9.12 geloest. Die elf Zielkarten haben finale display-only Texte ohne WIP-Praefix, die Katalog-/AI-/Manifest-Artefakte sind finalisiert, die Webclient-Version steht auf `V1.9.12`, und `docs/releases/v1/v1-9-originalset-completion/v1-9-12-counter-virus-recurring/final-review.md` bestaetigt das Completion-Gate.

## Naechster Umsetzungsschritt

- erledigt: `V1.9.12 WIP:`-Texte entfernen oder finalisieren.
- Im Review dokumentieren, dass die finalen Texte aus lokal bestaetigten Regelkern-Aussagen abgeleitet und display-only sind.
- `card-implementation-manifest-1.9.12.json`, `mechanics-coverage-1.9.12.json`, `ai-card-hints-deck-legal-v1912.json`, `ai-deck-legal-v1912-smokes.json` und `deck-legal-ai-approval-v1912-manifest.json` auf finale Gatewerte setzen.
- V1.9.12 in `packages/catalog/src/index.ts` aus WIP in Runtime-Release-IDs promoten.
- Webclient-Version auf `V1.9.12` anheben.
- Final Review schreiben, volle Checkgruppe wiederholen, Cursor danach auf V1.9.13 setzen.
