---
activityId: act-2026-05-27-proteus-pro012-hidden-resource-prevention-sabotage-suite
status: done
created: 2026-05-27
completed: 2026-05-27
releaseTarget: Proteus PRO012
tags:
  - proteus
  - PRO012
  - cardimplementation
  - hidden-runner-resources
  - implementation
---

# Proteus PRO012: Hidden Resource Prevention/Sabotage Suite

## Ergebnis

PRO012 ist umgesetzt. Acht verdeckte Runner-Resources sind konkrete CardImplementation-Dateien, registriert und im Manifest engine-/human-playable:

- `onr_proteus_129_back-door-to-netwatch` Back Door to Netwatch
- `onr_proteus_132_bolt-hole` Bolt-Hole
- `onr_proteus_136_credit-subversion` Credit Subversion
- `onr_proteus_137_death-from-above` Death from Above
- `onr_proteus_140_expendable-family-member` Expendable Family Member
- `onr_proteus_141_get-ready-to-rumble` Get Ready to Rumble
- `onr_proteus_145_mercenary-subcontract` Mercenary Subcontract
- `onr_proteus_154_wired-switchboard` Wired Switchboard

## Runtime-Bausteine

- Hidden-Resource-Damage-Prevention mit Tap-/Reveal-Kosten für Meat Damage.
- Hidden-Resource-Tag-Prevention mit Credit- plus Tap-/Reveal-Kosten.
- Trace-Post-Bid-Link-Fähigkeiten mit Tap-/Reveal-Kosten.
- Trace-Erfolg-Cancel-Fenster nach erfolgreicher Trace-Berechnung und vor Anwendung des Trace-Erfolgseffekts.
- Post-Meat-Damage-Reaktionsfenster mit deterministischem Korp-HQ-Random-Discard.
- Successful-Run-vor-Access-Followups für HQ-Creditverlust und Remote-Fort-Trash.
- Current-Access-Trash für aktuell accessete Karten mit Hidden-Resource-Reveal.

## Gate

- Proteus-Harness: 154 total, 113 implemented, 41 missing, 0 Drift.
- Keine PRO012-Karte wurde `deck_legal`, `format_legal` oder `ai_supported`.
- Hidden-Resource-Payloads bleiben bis zur erlaubten Offenlegung redigiert; Reveal-/Tap-/Kostenpfade werden über LegalActions angeboten und in `applyAction` revalidiert.
