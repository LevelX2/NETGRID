# V1.9.13 Final Review - Damage, Prevention, Avoid und Replacement Longtail

Stand: 2026-05-13 02:02 CEST
Status: final
Primaerer Agent: release-implementation-agent

## Scope

V1.9.13 schliesst den Damage-/Prevention-/Avoid-/Replacement-Longtail-Slice fuer genau 17 lokale O:NR-v1-Originalset-Karten ab:

- `onr_v1_038_joan-of-arc`
- `onr_v1_121_armored-fridge`
- `onr_v1_127_full-body-conversion`
- `onr_v1_128_green-knight-surge-buffers`
- `onr_v1_130_lifesaver-nanosurgeons`
- `onr_v1_135_nasuko-cycle`
- `onr_v1_139_r-and-d-interface`
- `onr_v1_143_techtronica-utility-suit`
- `onr_v1_155_code-viral-cache`
- `onr_v1_161_fall-guy`
- `onr_v1_170_nomad-allies`
- `onr_v1_185_trauma-team`
- `onr_v1_186_umbrella-policy`
- `onr_v1_187_wilson-weeflerunner-apprentice`
- `onr_v1_224_bolter-cluster`
- `onr_v1_234_data-darts`
- `onr_v1_258_neural-blade`

Keine V1.9.14+-Karte und kein V2.x-Produktfeature wurde in diesen Release aufgenommen.

## Umsetzung

- Die 17 Zielkarten sind in Runtime, Katalog und AI-Approval als `human_playable`, `deck_legal` und `ai_supported` freigegeben.
- Runner-seitige Prevention-/Avoid-/Replacement-Karten verwenden das vorhandene side-private Imminent-Event-Choice-Fenster mit Pass-Fallback.
- Damage aus Corp-ICE-Subroutinen wird vor Anwendung in ein Prevention-Fenster ueberfuehrt, ohne verdeckte Runner-Handkarten an die Korp zu leaken.
- Release-Smoke und Engine-Test pruefen side-sichere Choice-Sichtbarkeit, Damage-Reduktion und Replay-/StateHash-Stabilitaet.
- Die sichtbare Webclient-Version steht auf `V1.9.13`.

## Textfinalisierung

Im festen Automations-Worktree lag keine versionierte lokale Volltextquelle fuer die 17 Zielkarten vor. Nach `docs/releases/v1/v1-9-originalset-completion/display-text-finalization-policy.md` wurden finale Kartentexte aus lokal bestaetigten Regelkern-Aussagen in den fuehrenden V1.9.10-bis-V1.9.xx-Artefakten abgeleitet.

Diese Texte sind display-only. Sie sind keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Artefakte

- `data/manifests/card-implementation-manifest-1.9.13.json`
- `data/rules/mechanics-coverage-1.9.13.json`
- `data/scenarios/v1913-damage-prevention-replacement-smoke.json`
- `data/ai/ai-card-hints-deck-legal-v1913.json`
- `data/scenarios/ai-deck-legal-v1913-smokes.json`
- `data/manifests/deck-legal-ai-approval-v1913-manifest.json`

## Verifikation

- JSON-Validation: pass, 239 `data/**/*.json`.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 28 Tests.
- `v1-9-install-and-check.ps1 -Task engine`: pass, 216 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 84 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task test`: pass.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.

## Gate-Ergebnis

`V1_9_13_done: true`

`ready_for_V1_9_14: true`

Der Automation-Cursor darf auf V1.9.14 wechseln.
