# V1.9.22 Source Scan Review

Stand: 2026-05-13 19:09 CEST
Status: Blocker-Revalidierung, keine Runtime- oder Release-Promotion

## Zweck

Dieser Review dokumentiert die erneute lokale Quellensuche für den aktuellen V1.9.22-Cursor. Ziel war, einen vollständigen Resolververtrag für mindestens eine Event-, Programm- oder Corp-Longtailkarte zu finden, damit ein echter Engine-/LegalAction-Schnitt ohne erfundene Kartenwirkung möglich wird.

## Geprüfte Quellen

- `docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md`
- `docs/derived/V1_0_5K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_9_10_TO_V1_9_XX_CARD_FUNCTION_MATRIX.md`
- `docs/derived/V1_9_22_RUNNER_PROGRAM_READINESS_REVIEW.md`
- `docs/derived/V1_9_22_RUNNER_EVENT_READINESS_REVIEW.md`
- `docs/derived/V1_9_22_CORP_LONGTAIL_READINESS_REVIEW.md`
- `packages/shared/src/index.ts`
- vorhandene V1.9.22-WIP-Artefakte unter `data/`

## Suchfokus

Die Suche wurde auf Karten und IDs aus den noch blockierten V1.9.22-Clustern fokussiert:

- Runner-Events: Anonymous Tip, Core Command: Jettison Ice, Forged Activation Orders, If You Want It Done Right..., Open-Ended Mileage Program, Security Code WORM Chip, Valu-Pak Software Bundle.
- Corp-Longtail: Corporate War, Political Overthrow, Haunting Inquisition, Edgerunner, Inc., Temps, Planning Consultants.
- Repräsentative IDs: `onr_v1_080_core-command-jettison-ice`, `onr_v1_086_forged-activation-orders`, `onr_v1_093_if-you-want-it-done-right`, `onr_v1_196_corporate-war`, `onr_v1_210_political-overthrow`, `onr_v1_247_haunting-inquisition`, `onr_v1_289_edgerunner-inc-temps`, `onr_v1_298_planning-consultants`.

## Befund

Die Suche bestätigt die bisherige Gate-Lage:

- Lokale Quellen liefern für einzelne Karten nur Effektoberflächen oder historische Kernnotizen.
- `packages/shared/src/index.ts` enthält für die blockierten Runner-Events zwar WIP-Runtime-Definitionen mit `cost: 0`, aber die Texte bleiben ausdrücklich display-only und `LegalAction`-gated.
- Für Runner-Events fehlen weiterhin vollständige `play_event`-Verträge mit Timing, Zielmenge, Choice-Flow, Zonebewegungen, Redaction, Replay/StateHash und AI-Fallback.
- Für Corp-Agendas fehlen weiterhin Advancement Requirement, Agenda Points und konkrete On-score-/Scored-Ability-Zahlen.
- Für Corp-ICE fehlen weiterhin Rez-Kosten, Stärke, Subtypen, Subroutinen und konkrete Encounter-Wirkungen.
- Für Corp-Operations fehlen weiterhin Play-Kosten, Zielauswahl, Timingbedingung, Zonebewegungen und Effektbeträge.

## Entscheidung

Keine neue V1.9.22-Karte darf aus diesem Scan heraus als `human_playable`, `deck_legal` oder `ai_supported` promotet werden. Der aktive Blocker `V1922_NO_COMPLETE_LOCAL_RESOLVER_CONTRACT_2026-05-13` bleibt gültig.

## Removal Condition

Der nächste echte Umsetzungsschnitt ist erst zulässig, wenn eine lokale, versionierte Quelle oder ein führendes Planungsartefakt für mindestens eine Zielkarte einen vollständigen Resolververtrag liefert:

- Kosten und Zusatzkosten,
- Timingfenster und Side,
- Ziel- und Choice-Validierung,
- Zonebewegungen oder Statusänderungen,
- PublicEvent-/PlayerView-Redaction,
- Replay-/StateHash-Erwartung,
- AI-Fallback-Verhalten.

## Gate-Auswirkung

V1.9.22 bleibt `implementing`. Dieser Review ist ein WIP-Schutzartefakt gegen wiederholte Quellensuche und gegen Promotion aus Teilnotizen.
