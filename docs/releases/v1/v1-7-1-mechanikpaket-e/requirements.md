# V1.7.1 Requirements - Mechanikpaket E

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.7.1 setzt einen freigabefähigen Kern von Mechanikpaket E um: Hidden-Zone-Search als legal-action-basierter Stack-Workflow, Run/Access-Replacement auf HQ-Linien und deterministische HQ-Multiaccess-Erweiterung über installierte Runner-Hardware.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V171-MUST-001 | V1.7.1 startet erst nach grünem V1.7.0-Final-Gate. |
| V171-MUST-002 | Die Release-Zuordnung wird als `freigabefähig` vs `deferred` je Karte dokumentiert. |
| V171-MUST-003 | Der V1.7.1-Kernkorb enthält exakt 5 neue Runtime-Karten: `onr_v1_114_temple-microcode-outlet`, `onr_v1_106_private-ldl-access`, `onr_v1_118_weather-to-finance-pipe`, `onr_v1_084_edited-shipping-manifests`, `onr_v1_129_hq-interface`. |
| V171-MUST-004 | `onr_v1_114_temple-microcode-outlet` nutzt einen side-sicheren Hidden-Zone-Search-Choice (`search stack`, danach shuffle) ohne Hidden-Info-Leak in PublicEvents/Reconnect/Undo. |
| V171-MUST-005 | `onr_v1_106_private-ldl-access` startet einen HQ-Run, ersetzt bei Erfolg den Access deterministisch durch R&D-Access. |
| V171-MUST-006 | `onr_v1_118_weather-to-finance-pipe` ersetzt erfolgreichen HQ-Access deterministisch durch Credit-Loss beim Corp (`-4`) ohne zusätzlichen Access. |
| V171-MUST-007 | `onr_v1_084_edited-shipping-manifests` ersetzt erfolgreichen HQ-Access deterministisch durch Corp-Credit-Loss (`-1`), Runner-Tag (`+1`) und Corp-Draw (`+1`). |
| V171-MUST-008 | `onr_v1_129_hq-interface` erweitert HQ-Access deterministisch um `+1` pro installierter Instanz. |
| V171-MUST-009 | Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei. |
| V171-MUST-010 | Keine Karte außerhalb des 5er-Kernkorbs wird implizit `human_playable`/`deck_legal`; `ai_supported` wird nicht automatisch erweitert. |
| V171-MUST-011 | Keine Public-Plattform-, Account-, Matchmaking-, Ranking- oder Turnierfunktion wird eingeführt. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V171-SHOULD-001 | Run-Access-Replacementpfade sollen in Event-Payloads als Hidden-Info-Barrier klar markiert sein. |
| V171-SHOULD-002 | HQ-Multiaccess-Bonus soll server-spezifisch bleiben und keine RD-/Archives-Zugriffe verändern. |
| V171-SHOULD-003 | Der 48-Karten-Planungskorb bleibt vollständig dokumentiert; nicht freigabefähige Karten sind explizit deferred. |

## Gate

`ready_for_implementation_after_V1_7_0: true`

V1.7.1 ist als Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.
