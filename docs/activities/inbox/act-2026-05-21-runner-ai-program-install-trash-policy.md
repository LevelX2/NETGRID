---
activityId: act-2026-05-21-runner-ai-program-install-trash-policy
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-runner-program-install-free-mu
resultArtifacts: []
checks: []
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

Noch offen.
