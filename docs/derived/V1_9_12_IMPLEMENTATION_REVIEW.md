# V1.9.12 Implementation Review

Stand: 2026-05-13 00:58 CEST
Status: implemented_final

## Umgesetzter Scope

- V1.9.12 ist aus `planned` in `implementing` ueberfuehrt.
- Detailplan, Requirements, Counter/Virus/Recurring-Spec, Testmatrix und Requirements Review sind versioniert.
- Alle elf Zielkarten haben Runtime-Definitionen in `packages/shared/src/index.ts`.
- `packages/catalog/src/index.ts` fuehrt die elf Zielkarten jetzt in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` und `DECK_LEGAL_AI_APPROVAL_V1912_CARD_IDS`.
- `packages/catalog/src/index.test.ts` prueft Manifest, Mechanics-Coverage, AI-Hints, AI-Smoke-Plan und Szenario auf dieselbe 11er-Zielmenge und bestaetigt `human_playable`, `deck_legal` und `ai_supported`.
- Die Engine nutzt vorhandene Counter-, Virus-/Purge- und Recurring-Helfer fuer den ersten WIP-Schnitt:
  - Virus-Programme erhalten beim Installieren Virus-Counter.
  - Recurring-Counter werden auf Programmen und Resources initialisiert.
  - Purge entfernt nur Virus-Counter und laesst Recurring-Counter stehen.
  - I Spy, Deal with Militech und Hunt Club BBS nutzen side-sichere Hidden-Zone-Pfade.
  - Detroit Police Contract nutzt einen typisierten scored-Agenda-Counter-Pfad.
  - Employee Empowerment nutzt einen scored-Agenda-Start-of-turn-Economy-Pfad.
- Die elf sichtbaren Kartentexte sind nach `docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md` finalisierte display-only Texte aus lokal bestaetigten Regelkern-Aussagen; sie sind keine Parser-, Engine-, LegalAction-, KI-, Replay- oder StateHash-Autoritaet.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: pass, 213 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 27 Tests.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 84 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task test`: pass.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
- JSON-Validation der V1.9.12-Artefakte: pass, 233 `data/**/*.json`.
- Finale Pflichtcheck-Wiederholung: pass, siehe `docs/derived/V1_9_12_FINAL_REVIEW.md`.

## Gate-Status

`V1_9_12_done: true`

`V1_9_12_phase: final`

`hard_gate_blocker: none`

`text_finalization_policy: docs/derived/V1_9_ORIGINALSET_DISPLAY_TEXT_FINALIZATION_POLICY.md`

## Completion-Nachtrag 2026-05-14

`The Shell Traders` (`onr_v1_176_the-shell-traders`) wurde nach Playtest-Befund in einer engen V1.9.12-Reparaturspur vervollstaendigt. Die fruehere Recurring-Credit-Ersatzfunktion ist entfernt; die Karte nutzt jetzt Set Aside aus der Runner-Grip, oeffentliche Shell-Counter, verpflichtendes Start-of-turn-Counter-Removal, eine 1-Credit-Removal-Faehigkeit und kostenlose Auto-Installation beim letzten Shell-Counter.

Der Nachtrag ersetzt nicht das bestehende Final Review. Fuehrendes Zusatzartefakt ist `docs/derived/V1_9_12_SHELL_TRADERS_COMPLETION_REVIEW.md`.
