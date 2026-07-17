---
activityId: act-2026-07-17-temporary-installed-card-instance-marker
status: inbox
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Temporär installierte Karteninstanz eindeutig markieren

## Ziel

Eine temporär installierte Karte ist im Spielfeld eindeutig von weiteren
gleichnamigen Exemplaren unterscheidbar. Der Nutzer muss ohne Wissen über
interne Array-, Installations- oder Aktionsreihenfolgen erkennen können,
welche konkrete Karteninstanz von einem späteren Rückgabe- oder
Lifecycle-Effekt betroffen ist.

## Kontext und Quellen

- Playtest-Fund vom 17.07.2026: Ein Rent-I-Con war bereits installiert. Ein
  zweites Exemplar wurde mit `Sneak Preview` aus dem Stack installiert und
  damit für die Rückkehr in den Grip am Runner-Zugende vorgemerkt. Während
  eines Runs boten beide gleichnamigen Rent-I-Con dieselben Breaker-Aktionen;
  auf dem Spielfeld war nicht erkennbar, welches Exemplar das temporär
  installierte war.
- Das ist spielentscheidend: Nur die konkret zum Brechen verwendete
  Rent-I-Con-Instanz wird am Run-Ende getrasht. Das mit `Sneak Preview`
  installierte Exemplar kehrt nur dann am Zugende in den Grip zurück, wenn
  genau diese Instanz noch installiert ist.
- Aktuell ist die Reihenfolge zwar deterministisch: Installationen werden in
  `state.runner.rig.programs` angehängt
  (`packages/engine/src/game/install/runner-rig-install-finalization.ts`), die
  PlayerView-Projektion übernimmt diese Reihenfolge
  (`packages/engine/src/game/view/player-view-projection.ts`) und die
  Rig-Gruppierung sortiert die Karten nicht neu
  (`apps/web/app/action-board-ui.ts`). Im beschriebenen Ablauf steht daher das
  zuerst installierte Exemplar links und das später installierte
  Sneak-Preview-Exemplar rechts. Diese implizite Reihenfolge ist jedoch kein
  ausreichendes UI-Signal.
- `Sneak Preview` verfolgt bereits die konkrete Karteninstanz über den
  temporären Rückgabevertrag; die Rules Engine muss dafür nicht fachlich
  geändert werden.

## Scope

- Einen kleinen, klaren Lifecycle-Marker für die konkret temporär installierte
  Karteninstanz im Rig anzeigen, zum Beispiel `Temporär · Sneak Preview` oder
  `Rückkehr am Zugende`.
- Den Marker aus einer expliziten, side-sicheren PlayerView-Information
  ableiten, nicht aus Titelgleichheit, Position, Aktionsreihenfolge oder einer
  im Webclient nachgebauten Regelheuristik.
- Den Marker mindestens in der Runner-Eigenansicht auf der betroffenen Karte
  anzeigen; Sichtbarkeit für die Gegenseite nach dem bestehenden öffentlichen
  Effekt- und PlayerView-Vertrag konsistent entscheiden und testen.
- Sicherstellen, dass kartennahe Aktionen weiterhin über die konkrete
  `CardInstanceId` gebunden bleiben und bei zwei gleichnamigen Rent-I-Con das
  jeweils angeklickte Exemplar verwenden.
- Eine Regression für zwei gleichzeitig installierte gleichnamige Programme
  aufnehmen, von denen nur eines per `Sneak Preview` temporär installiert ist.

## Nicht im Scope

- Keine Änderung an der Regelwirkung von `Sneak Preview` oder `Rent-I-Con`.
- Keine Sortierung gleichnamiger Karten nach Titeln oder rohen Instanz-IDs.
- Keine Anzeige technischer `CardInstanceId`-Werte im normalen UI.
- Kein allgemeines Redesign von Rig, Kartenansicht oder Aktionspanel.
- Keine Abschwächung von Hidden-Info-, LegalAction-, Replay- oder
  StateHash-Verträgen.

## Akzeptanzkriterien

- [ ] Bei zwei installierten gleichnamigen Programmen ist die von `Sneak
  Preview` betroffene konkrete Instanz direkt auf dem Spielfeld eindeutig
  markiert.
- [ ] Der Nutzer kann vor dem Auslösen einer Breaker-Aktion erkennen, ob er das
  dauerhaft oder das temporär installierte Rent-I-Con verwendet.
- [ ] Der Marker beschreibt die relevante Folge verständlich, ohne interne
  IDs oder Positionswissen wie „links/rechts“ vorauszusetzen.
- [ ] Nach Rückgabe, Trash oder einem anderen Verlassen des Spiels verschwindet
  der Marker zusammen mit der betroffenen Instanz; ein gleichnamiges anderes
  Exemplar übernimmt ihn nicht.
- [ ] Die Rules Engine bleibt die einzige Autorität für die konkrete temporäre
  Instanz und die Rückgabe am Zugende.
- [ ] PlayerView-, PublicEvent-, Reconnect-, Replay- und WebSocket-Grenzen
  leaken keine verdeckten Karteninformationen.
- [ ] Passende Engine-/PlayerView- und Web-Regressionstests decken den
  Doppel-Rent-I-Con-Fall sowie Cleanup nach Run- und Zugende ab.

## Umsetzungshinweise

- Bevorzugter Folgeagent: `small-adjustments-agent`.
- Vorhandene Instanzbindung nutzen: Breaker-Actions tragen bereits
  `payload.breakerId` und `abilityRef.sourceCardInstanceId`; der Webclient
  bindet kartennahe Aktionen über `card.instanceId`.
- Bevorzugt einen kleinen semantischen Lifecycle-Hinweis an `VisibleCard`
  projizieren und im bestehenden Badge-/Marker-System von `CardView` rendern.
  Keine Webclient-Sonderlogik nur für den Titel `Rent-I-Con` einführen.
- Falls die vorhandene PlayerView-Struktur keinen passenden generischen
  Lifecycle-Hinweis zulässt, die kleinste notwendige Erweiterung wählen und
  deren Side-Sichtbarkeit explizit testen.

## Ergebnisnotiz

Noch offen.
