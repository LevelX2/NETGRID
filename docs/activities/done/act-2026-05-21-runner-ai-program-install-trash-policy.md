---
activityId: act-2026-05-21-runner-ai-program-install-trash-policy
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-runner-program-install-free-mu
resultArtifacts:
  - packages/ai/src/index.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "runner program install"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
  - git diff --check
---

# Runner-KI: Programminstallation mit Programm-Trash bewerten

## Ziel

Die Runner-KI soll nach Umsetzung der regelhaften Programminstallation entscheiden können, ob sie beim Installieren eines Programms bestehende installierte Programme opfert, ohne dabei wichtige Rig-Rollen unnötig zu zerstören.

## Kontext und Quellen

- Folgepaket zu `docs/activities/inbox/act-2026-05-21-runner-program-install-free-mu.md`.
- Der Engine-Fix macht einen neuen legalen Entscheidungsraum auf: Ein Programm kann auch bei MU-Mangel installiert werden, wenn installierte Programme vorher getrasht werden.
- Bisherige Runner-KI berücksichtigt MU-Druck und Rig-Aufbau, aber nicht systematisch die neue Installationsfolge `Programm installieren -> installierte Programme optional/falls nötig trashen -> neues Programm installieren`.

## Scope

- Runner-KI muss `pendingChoice`/`LegalActions` für den Programminstallations-Trash-Flow bedienen können.
- Bei MU-Mangel soll die KI nur Programme opfern, wenn das neue Programm strategisch wertvoller ist als die zu trashende Menge.
- Basispolicy:
  - keine benötigten einzigen Breaker-Rollen leichtfertig trashen,
  - redundante oder aktuell wertarme Programme eher opfern,
  - Programme mit laufenden Countern/Recurring/Hosting/Schlüsselrolle konservativ behandeln,
  - nicht genug freimachende Auswahl vermeiden,
  - bei unklarem Wert lieber Installation abbrechen oder nicht wählen.
- Bei ausreichender MU soll die KI normalerweise ohne freiwilligen Trash installieren, außer es gibt einen klaren Vorteil für das Aufräumen.
- DecisionDebug soll side-sicher benennen, ob MU-Druck, Rollenredundanz oder Installationswert die Entscheidung geprägt hat.

## Nicht im Scope

- Keine FullState-Simulation, kein Zugriff auf verdeckte Korp-Informationen und kein Belief-State-Ausbau.
- Keine neue Kartenpromotion oder AI-Freigabe für Karten, die nicht schon AI-supported sind.
- Keine Engine-Legalitätsberechnung in der KI; die KI wählt nur aus `LegalActions` und `pendingChoice`.
- Kein umfassendes Rig-Optimierungs-Redesign.

## Akzeptanzkriterien

- [ ] KI kann eine Programminstallation bei MU-Mangel abschließen, wenn ein klar redundantes Programm geopfert werden kann.
- [ ] KI bricht ab oder wählt nicht, wenn sie dafür den einzigen passenden sichtbaren Breaker gegen bekannte Bedrohung opfern müsste.
- [ ] KI installiert bei ausreichender MU ohne unnötigen freiwilligen Trash.
- [ ] KI kann die Auswahl aus `pendingChoice.options` treffen und sendet keine nicht legalen Zielkarten.
- [ ] Tests decken mindestens Redundanz-Opfer, einziger-Breaker-Schutz, ausreichende-MU-ohne-Trash und unzureichende-Auswahl-Vermeidung ab.
- [ ] DecisionDebug bleibt side-sicher und enthält keine verdeckten Korp-Karten oder FullState-Daten.

## Umsetzungshinweise

- Bestehende Runner-Planwerte für `build_rig`, sichtbare ICE-Bedrohung, Breaker-Rollen, MU und Economy wiederverwenden.
- Der erste KI-Schnitt darf konservativ sein: lieber weniger Opferentscheidungen als unsinnige Rig-Selbstzerstörung.
- Tests sollten mit sichtbaren Boardlagen arbeiten, nicht mit verdeckter Korp-Information.

## Ergebnisnotiz

Erledigt. Die Runner-KI behandelt `runner_program_trash_before_install` jetzt als eigene `select_cards`-Policy. Sie berechnet den sichtbaren MU-Druck aus `PlayerView`, wählt nur legal angebotene installierte Programme, schützt sichtbare einzige Breaker-Rollen, vermeidet freiwilligen Trash bei ausreichender MU und bricht konservativ mit leerer Auswahl ab, wenn nicht genug ungeschützte MU freigemacht werden kann. Decision-Evidence nennt side-sicher Choice-Quelle, MU-Bedarf, Kandidatenzahl und geschützte Breaker-Anzahl.

Fokustests decken Redundanz-Opfer, einziger-Breaker-Schutz, ausreichende MU ohne Trash und unzureichende Auswahl ab. Typecheck und fokussierter Vitest sind grün. Der vollständige `packages/ai/src/index.test.ts`-Lauf hat weiterhin die bereits bekannten drei Fremdfehler gemeldet: `answers V1.9.11 Corp R&D reorder choices with all required side-safe options`, `uses installed Runner economy payouts before the basic credit action` und `separates Broker pool loading from visible pool payout`.
