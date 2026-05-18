# V1.9.19 Agenda/Overadvance Spec

Status: draft frozen for first WIP
Stand: 2026-05-13

## Regelautorität

Die Rules Engine bleibt alleinige Regelautorität. Kartentexte in Runtime, Katalog und Review sind Anzeigeinformationen. LegalActions müssen actionId, Seite, stateVersion, Timing, Kosten, Ziele und Choices erneut in `applyAction` validieren.

## Kernverträge

- Score-/Steal-Pfade dürfen Agenda-Punkte, Agenda-Difficulty und Zusatzkosten nur aus aktuellem Engine-State berechnen.
- Overadvance zählt nur auf sichtbaren, installierten oder gerade gescorten Agenda-Zuständen, nie aus Client-Payloads.
- Scored-Agenda-Statics und aktive Fähigkeiten müssen Quellen-IDs, Timingfenster und Seitenbindung im Public Payload redigiert führen.
- Forfeit-, Counter- und Agenda-Punkt-Kosten brauchen explizite LegalActions mit staler Ziel-Revalidierung.
- Hidden-Zone-Anteile nutzen vorhandene Reveal-/Search-/Reorder-Barrieren.

## Erste WIP-Definition

Der erste WIP darf Zielkarten als Runtime-Definitionen aufnehmen, aber weder in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` noch in AI-Approval-Sets aufnehmen. Er muss einen No-Scope-Guard gegen V1.9.20 enthalten.
