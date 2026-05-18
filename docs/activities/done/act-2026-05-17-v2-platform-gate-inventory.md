---
activityId: act-2026-05-17-v2-platform-gate-inventory
status: done
kind: concept
area: docs
priority: high
primaryAgent: release-planning-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.x
blockedBy: []
resultArtifacts:
  - docs/releases/v2/platform-gates/platform-gate-inventory-2026-05-17.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - Quellenprüfung gegen NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md, LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md, V1_9_22_FINAL_REVIEW.md, V2_3A_FINAL_REVIEW.md und aktuelle V2.0/V2.6-Vertragsartefakte
  - git diff --check
---

# V2.x-Gate-Inventar nach aktuellem Stand

## Ziel

Die V2.x-Planung soll gegen den aktuellen Projektstand neu einsortiert werden: Welche V2.x-Voraussetzungen sind bereits durch V1.0.8, V1.0.9, V1.9.22 und V2.3a erfüllt, welche bleiben blockierend, und welche kleinen Folgepakete sollen als Nächstes entstehen?

## Kontext und Quellen

- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`, Abschnitt `V2.x Geschlossene Community und öffentliche Multiplayer-Basis`.
- `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`, Abschnitt `Langfristig: öffentlich nutzbarer Multiplayer`.
- `docs/codex/CODEX_STATUS.md` meldet inzwischen V1.9.22 als abgeschlossen; V2.x bleibt separate Gate-Folge.
- `docs/releases/v2/v2-3-public-lobby-alpha/lan-open-lobby-mini-final-review.md` bestätigt den LAN-Open-Lobby-Mini-Slice als abgeschlossen, aber ohne Public-Lobby-/Account-/Moderationsumfang.

## Scope

- Aktuellen Readiness-Stand für V2.0 bis V2.8 tabellarisch erfassen.
- Pro V2.x-Thema markieren: `bereit für Analyse`, `bereit für kleinen Implementierungsslice`, `blockiert`, `später`.
- Harte Gate-Entscheidungen aus der Roadmap aufnehmen: Auth, Datenschutz, Moderation, Betrieb, Rechts-/Assetpfad, Public-Replay/Spectator, KI-/LLM-Grenzen.
- Prüfen, welche bestehenden Artefakte schon tragfähig sind und welche historisch überholt sind.
- Aus der Analyse neue kleine Activities anlegen, wenn konkrete Lücken sichtbar werden.

## Nicht im Scope

- Keine Account-, Chat-, Public-Lobby-, Spectator- oder Replay-Implementierung.
- Keine Änderung an Engine, Kartenfreigaben, RulesBaseline, Replay, StateHash oder KI-Deckpools.
- Keine Freigabe öffentlicher Plattformfunktionen.

## Akzeptanzkriterien

- [x] Es gibt eine kompakte V2.x-Readiness-Tabelle mit Status pro V2.0 bis V2.8.
- [x] Bereits erledigte Vorarbeiten wie V2.3a werden korrekt abgegrenzt.
- [x] Blockierende Entscheidungen sind konkret benannt.
- [x] Mindestens die nächsten drei kleinsten sinnvollen Folgepakete sind bestätigt oder neu angelegt.
- [x] V2.x bleibt explizit hinter Auth-, Datenschutz-, Moderations-, Betriebs- und Rechtsgates.

## Umsetzungshinweise

- Primärer Folgeagent: `release-planning-agent`.
- Dieses Paket darf bewusst weitere Activity-Pakete erzeugen, wenn die Analyse konkrete Umsetzungsschnitte findet.
- Gute Ergebnisform: kurzes neues `docs/derived/`-Artefakt oder aktualisierte Activity-Verweise; kein großes Release-Requirements-Dokument.

## Ergebnisnotiz

Erledigt. `docs/releases/v2/platform-gates/platform-gate-inventory-2026-05-17.md` ordnet V2.0 bis V2.8 nach aktuellem Stand: V2.0 ist nur für den Account-Session-Foundation-Slice bereit; V2.1, V2.2, V2.4, V2.6, V2.7 und V2.8 sind Analyse-/Vertragsslices; V2.3 Public Lobby bleibt trotz erledigtem V2.3a-LAN-Slice blockiert; V2.5 Matchmaking bleibt später.

Die nächsten kleinsten sinnvollen Pakete sind bestätigt: Account-Session-Foundation, Privacy Export/Delete, Cloud-Deck-Boundary, Observability-Redaction, Moderation-RBAC-Tests und Public-Replay-Policy. V2.x bleibt ausdrücklich hinter Auth-, Datenschutz-, Moderations-, Betriebs-, Public-Replay-/Spectator- und Rechts-/Asset-Gates. Verifikation: Quellenprüfung und `git diff --check`.
