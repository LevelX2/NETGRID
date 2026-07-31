---
activityId: act-2026-07-31-ai-remote-defense-layer-continuation
status: in_progress
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt:
branch: codex/act-2026-07-31-twenty-four-hour-surveillance
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/match-4d7bd0eba9138d83-complete-ai-analysis-2026-07-31.md
checks: []
---

# Korp-KI setzt eine unvollständige Remote-Verteidigung fort

## Ziel

Der bestehende Plan `corp.defend_servers` soll einen vorbereiteten Score-Remote
bei weiterhin offenem, konkret belegtem Schutzbedarf auch über die erste
ICE-Schicht hinaus sinnvoll ausbauen können. Eine weitere Schicht ist nur dann
eine Defense-Route, wenn das konkrete installierbare ICE die aktuelle
Verteidigung nachweisbar verbessert und die vollständige Engine-Kostenquote
sowie vorhandene Score- und Rez-Reserven eingehalten werden.

## Kontext

- Im vollständig analysierten Spiel `match_4d7bd0eba9138d83` endeten sämtliche
  Remotes mit genau einer ICE-Schicht, während HQ und R&D stark ausgebaut
  wurden.
- `corpScoreProtectionStagingInstallSignal` verwirft einen bestehenden Remote
  derzeit pauschal, sobald dort bereits mindestens ein ICE installiert ist.
- Dieser boolesche Ein-Schicht-Abbruch verhindert auch dann eine Fortsetzung,
  wenn der Score-Plan noch keinen belastbar geschützten Remote besitzt und ein
  konkretes weiteres ICE den offenen Schutzbedarf erfüllen könnte.

## Scope

- Den bestehenden Defense-/Score-Schutz-Owner und seine Planinstanz erhalten.
- Die Schutz-Staging-Route von der pauschalen Ein-Schicht-Grenze auf eine
  qualitative, konkrete Fortsetzungsprüfung umstellen.
- Nur LegalActions mit vollständiger Engine-Installations- und Rez-Kostenquote
  bewerten.
- Sichtbare Runner-Reichweite, vorhandene ICE-Wirkung, Rezbarkeit und
  Score-/Rez-Reserve in die Verbesserungsaussage einbeziehen.
- Regressionen für eine sinnvolle zweite beziehungsweise weitere Schicht und
  für den Abbruch ohne echten Zusatznutzen ergänzen.

## Nicht im Scope

- Keine feste Sollzahl von zwei oder drei ICE-Schichten.
- Kein hartes Verbot, ein momentan nicht rezbares ICE zu installieren; Bluff,
  Handentlastung und spätere Rezbarkeit bleiben planintern abwägbare Faktoren.
- Keine endlose vierte/fünfte Schicht, solange bereits installierte ICE nicht
  finanziert oder deren Wirkung nicht verbessert werden kann.
- Keine Karten-ID-/Titelheuristik und kein neuer Resolver, Fallback oder
  paralleler Plan-Owner.

## Akzeptanzkriterien

- [ ] Ein noch unzureichend geschützter Score-Remote kann über die erste
      ICE-Schicht hinaus eine weitere konkrete Defense-Staging-Route erhalten.
- [ ] Die Route entsteht nur bei nachweisbarem Zusatznutzen und vollständiger
      Engine-Kostenquote unter Wahrung der Score-/Rez-Reserve.
- [ ] Bereits hinreichender oder durch zusätzliche unrezbare Schichten nicht
      sinnvoll verbesserbarer Schutz erzeugt keine pauschale weitere
      ICE-Installation.
- [ ] `corp.defend_servers` beziehungsweise die bestehende gebundene
      Score-Schutzroute bleibt alleiniger Owner; Action-ID, Planinstanz, Step
      und Executor sind in Tests gesichert.
- [ ] Fokussierte Tests, AI-Strukturgates, Typecheck und AI-Shards sind grün.

## Ergebnisnotiz

Noch offen.
