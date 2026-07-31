---
activityId: act-2026-07-31-ai-remote-defense-layer-continuation
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt: 2026-07-31
branch: codex/act-2026-07-31-twenty-four-hour-surveillance
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/reviews/ai/match-4d7bd0eba9138d83-complete-ai-analysis-2026-07-31.md
  - packages/ai/src/runtime/plan-first-live-runtime.ts
  - packages/ai/src/runtime/plan-first-live-runtime.test.ts
  - data/scenarios/ai-decision-checkpoints/cp-a36a-01-turn-completion-d11.json
checks:
  - focused plan-first live runtime 170/170
  - match a36a9664 Corp plan checkpoints 8/8
  - AI typecheck
  - AI hint metadata and source structure gates
  - card function abstraction gate
  - AI shards 544/544 files and 4450/4450 tests
  - format changed
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

- [x] Ein noch unzureichend geschützter Score-Remote kann über die erste
      ICE-Schicht hinaus eine weitere konkrete Defense-Staging-Route erhalten.
- [x] Die Route entsteht nur bei nachweisbarem Zusatznutzen und vollständiger
      Engine-Kostenquote unter Wahrung der Score-/Rez-Reserve.
- [x] Bereits hinreichender oder durch zusätzliche unrezbare Schichten nicht
      sinnvoll verbesserbarer Schutz erzeugt keine pauschale weitere
      ICE-Installation.
- [x] `corp.defend_servers` beziehungsweise die bestehende gebundene
      Score-Schutzroute bleibt alleiniger Owner; Action-ID, Planinstanz, Step
      und Executor sind in Tests gesichert.
- [x] Fokussierte Tests, AI-Strukturgates, Typecheck und AI-Shards sind grün.

## Ergebnisnotiz

Der pauschale Abbruch nach der ersten Remote-ICE-Schicht ist entfernt. Der
vorhandene `score_protection_staging_install`-Backstop kann nun weitere
qualitativ schutzwirksame ICE-LegalActions auf demselben Score-Remote an den
Defense-Plan delegieren, wenn die exakte Schutzprojektion wegen sichtbarer,
aber noch nicht vollständig modellierbarer Runner-Antworten offen bleibt.

Die Fortsetzung ist nicht an eine Karten-ID, einen Titel oder eine feste
Schichtzahl gebunden. Sie verlangt eine vollständige Installations- und
Post-Install-Rez-Quote. Zusätzlich werden alle bereits offenen Rez-Kosten,
Installationskosten und die Score-Reserve gemeinsam betrachtet. Nur ein
Finanzierungsdefizit, das höchstens der normalen Basic-Credit-Kapazität des
nächsten Corp-Zugs entspricht, bleibt als vorbereitende oder Bluff-Schicht
zulässig. Ein wachsender unbezahlter ICE-Stapel verliert dadurch automatisch
die Route.

Der Regressionstest sichert die gebundene Action-ID, den Parent-Score-Bedarf,
`corp.defend_servers` und `develop_score_protection`. Der Gegenfall mit zu
großem offenem Rez-Portfolio fällt auf Economy zurück. Ein bestehender
Checkpoint wurde nach vollständiger Zustandsprüfung auf die nun bessere,
planbesessene Snowbank-Installation geschärft.
