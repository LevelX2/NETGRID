# V1.9.18 Final Review - Generische Upgrade-, Root-, Grid- und Server-Fähigkeiten

Stand: 2026-05-13 13:25 CEST
Status: final

## Gate-Ergebnis

`V1_9_18_done: true`

`ready_for_V1_9_19: true`

V1.9.18 ist als Release-Slice abgeschlossen. Alle 15 Zielkarten sind im privaten lokalen O:NR-v1-Originalset `human_playable`, `deck_legal` und `ai_supported`. Die sichtbare Webclient-Version steht auf `V1.9.18`.

## Abgeschlossener Scope

- Alle 15 Zielkarten von `Crybaby` bis `Twenty-Four-Hour Surveillance` sind in Runtime, Katalog, Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes und AI-Approval-Manifest release-promotet.
- Generische Upgrade-/Root-Pfade decken Corp-Install, Root-Rez, Runner-Access, Trash-on-access, Archives-Visibility und Payload-Redaction ab.
- Dedicated Response Team und Dieter Esslin decken side-sichere Access-Ambush-Damage-Pfade ab.
- Turbeau Delacroix deckt ein side-sicheres Access-Trace-Fenster und Run-Start-Tax ab.
- Red Herrings deckt einen servergebundenen Agenda-Steal-Tax im legalen Access-Fenster ab.
- City Grids decken Region-Replacement, New-Galveston-R&D-Reveal, Paris-Trace-2-Tag und Tag-Condition-Credit-Pfade ab.
- Crystal Palace Station Grid und Dr. Dreff decken Power-Counter-LegalActions ab.
- Twenty-Four-Hour Surveillance deckt Run-Start-Tax inklusive Runner-Run-/Stealth-Recurring-Credit-Zahlung ab.

## Artefakte

- `data/manifests/card-implementation-manifest-1.9.18.json`
- `data/rules/mechanics-coverage-1.9.18.json`
- `data/scenarios/v1918-generic-upgrade-root-server-release-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1918.json`
- `data/manifests/deck-legal-ai-approval-v1918-manifest.json`
- `data/scenarios/ai-deck-legal-v1918-smokes.json`

## Text- und Regelautorität

Die V1.9.18-Kartentexte sind finale display-only Texte aus lokal bestätigten Regelkern-Aussagen nach `docs/releases/v1/v1-9-originalset-completion/display-text-finalization-policy.md`. Kartentext bleibt keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autorität.

## Verifikation

- JSON-Validation: pass, 272 `data/**/*.json`.
- `v1-9-install-and-check.ps1 -Task engine`: pass, 251 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 33 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task test`: pass.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass; bekannte nicht-blockierende Turbopack-NFT-Warnung bleibt.

## Grenzen

- Keine V1.9.19+-Karten wurden freigegeben.
- Keine generische `trigger_ability`-Freischaltung.
- Keine offiziellen Assets, externen Kartendatenbank-Abhängigkeiten oder V2.x-Produktfeatures.
