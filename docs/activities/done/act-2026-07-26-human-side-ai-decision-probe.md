---
activityId: act-2026-07-26-human-side-ai-decision-probe
status: done
kind: concept
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-26
startedAt: 2026-07-26
completedAt: 2026-07-26
branch: codex/activities-ai-preview-20260726
releaseTarget:
blockedBy:
  - act-2026-07-26-ai-preview-session-redaction-hardening
resultArtifacts:
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
  - apps/web/lib/client-api.ts
  - apps/web/lib/client-api-ai-preview.test.ts
  - apps/web/app/human-ai-decision-probe.ts
  - apps/web/app/human-ai-decision-probe.test.ts
  - apps/web/app/page.tsx
  - apps/web/features/debug/AiDecisionDebugOverlay.tsx
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md
checks:
  - "Server-Zieltests: 5 bestanden, 141 übersprungen"
  - "Web-Zieltests: 20 bestanden"
  - "Web-Gesamttests: 695 bestanden"
  - "Server-Gesamttests: 207 von 208 bestanden; bekannte, auf unverändertem main reproduzierte Baseline-Abweichung im AI-vs-AI-Langlauftest (109 statt >120 Aktionen)"
  - "Server-Typecheck: bestanden"
  - "Web-Typecheck: bestanden"
  - "format:changed: bestanden"
  - "git diff --check: bestanden"
---

# Eigenseitiger KI-Vorschlag für den aktuellen menschlichen Zustand

## Ziel

Ein menschlicher Spieler kann in einem privaten Human-vs-KI-Match auf Wunsch
anzeigen lassen, welche aktuelle `LegalAction` die produktive NETGRID-KI bei
einer frischen Übernahme seiner Seite wählen würde. Die read-only Empfehlung
soll schwaches KI-Verhalten leichter sichtbar, reproduzierbar und meldbar
machen, ohne eine Aktion auszuführen oder Hidden Info zu verwenden.

## Kontext und Quellen

- Nutzeridee vom 2026-07-26: Im aktuellen Zustand anzeigen, was die KI spielen
  würde, wenn sie den Part des Menschen übernähme; auffällige Vorschläge sollen
  leichter erkannt und gemeldet werden können.
- `packages/ai/src/runtime/ai-decision-input.ts`: `buildAiDecisionInput` baut
  den produktiven Input bereits aus side-sicherer `PlayerView`,
  `LegalActions`, erlaubten `PublicEvents` und dem eigenen Decksnapshot.
- `packages/ai/src/index.ts`: `chooseAiAction` ist der produktive
  Plan-first-Entscheidungsweg für Runner und Korp.
- `apps/server/src/multiplayer.ts`: `previewAi` führt bereits eine
  nicht-ausführende Vorschau mit
  `persistTacticalPlanMemory: false`, Versionsprüfung und sanitisiertem
  `DecisionDebug` aus, ist derzeit aber an die aktive KI-Seite gebunden.
- `apps/web/features/debug/AiDecisionDebugOverlay.tsx`: Das vorhandene
  KI-Bewertungsfenster kann gewählte Aktion, Alternativen, Planbezüge und einen
  JSON-Export darstellen.
- `docs/architecture/ai/coaching-boundary-spec-2026-05-17.md`: Live-Hilfe ist
  nur requester-relativ, `LegalActions`-gebunden, read-only und ohne Hidden
  Info zulässig; die Spezifikation ist noch keine allgemeine
  Produktfreigabe.
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`: Allgemeines
  AI Coaching ist als späterer Gate-Scope geführt. Dieses Paket bleibt daher
  zunächst ein lokales privates QA-Werkzeug ohne Releasezuordnung.

## Scope

- Vor Umsetzung den lokalen QA-Zuschnitt gegen den aktuellen Releaseplan
  freigeben; keine stillschweigende allgemeine Coaching-Funktion einführen.
- Einen requester-relativen Preview-Aufruf für die authentifizierte
  menschliche Seite bereitstellen:
  - nur wenn genau diese Seite im aktuellen Timingpunkt entscheiden darf;
  - nur aus ihren aktuellen `LegalActions`;
  - mit frischer Prüfung von `stateVersion` und `matchVersion`;
  - mit ihrem eigenen validierten Decksnapshot;
  - mit einem eigenen, sichtbar benannten Advisor-Profil.
- Die produktive `chooseAiAction`-Runtime wiederverwenden. Es entsteht kein
  zweiter Coach-Selector und keine abweichende Bewertungslogik.
- Den Chooser ausdrücklich ohne persistente Plan-, Strategic-Intent- oder
  Choice-Memory-Schreibwirkung ausführen.
- Die UI als bewusste On-demand-Aktion anbieten, zum Beispiel
  `Was würde die KI tun?`, nicht als automatisch ständig aktualisierte
  Zugsteuerung.
- Das Ergebnis mindestens als Aktionstext und betroffene Karten-/Serverfläche
  hervorheben. Diagnosewerte und Top-Alternativen können in einem
  einklappbaren Detailbereich das bestehende KI-Bewertungsfenster
  wiederverwenden.
- Den Vorschlag bei jeder Zustands- oder Matchversionsänderung sofort
  verwerfen und klar als `KI-Vorschlag ab aktuellem Zustand` kennzeichnen.
- Einen kompakten, redigierten Meldeexport anbieten:
  - Match-ID, Match- und State-Version;
  - Seite, Advisor-Profil und KI-Version;
  - gewählte Action-ID/-Art und ausgewählte Choices;
  - `reasonCode`, Fallback-/Timeoutstatus;
  - sanitizierte Entscheidungs- und Alternativenzusammenfassung;
  - kein Roh-`PlayerView`, `AIInput`, private Hand, Deckliste, Token oder
    gegnerische Hidden Info.

## Nicht im Scope

- Kein automatisches Ausführen, Bestätigen oder Vorselektieren des Vorschlags.
- Keine neue `LegalAction`, keine freie LLM-Aktion und keine
  Kartentextinterpretation außerhalb der Engine.
- Keine Änderung an Engine, `applyAction`, Eventlog, Replay, StateHash oder
  Zufallszustand.
- Kein Human-vs-Human-, Public-, Spectator-, Replay-, Ranked- oder
  Turnier-Coaching.
- Keine Behauptung, die Vorschau entspreche exakt einer KI, die die gesamte
  bisherige Partie selbst gespielt und residente Pläne aufgebaut hätte.
- Keine dauerhafte Shadow-KI, die im Hintergrund jeden menschlichen Schritt
  mit eigenem Planmemory verfolgt.
- Keine allgemeine LLM-Coach-, Regelhilfe- oder Post-game-Analyse.

## Akzeptanzkriterien

- [x] Der Vorschlag kann nur von der authentifizierten menschlichen Seite und
      nur in ihrem aktuellen Entscheidungsfenster angefordert werden.
- [x] Der KI-Input entspricht der eigenen `PlayerView`, den eigenen
      `LegalActions`, erlaubten `PublicEvents` und dem eigenen Decksnapshot.
- [x] Die angezeigte direkte Aktion existiert unverändert in den aktuellen
      `LegalActions`; unbekannte oder inzwischen stale Actions werden nicht
      angezeigt.
- [x] Zwei Aufrufe auf demselben Zustand und mit demselben Advisor-Profil
      liefern dasselbe Ergebnis, sofern die KI keinen ausdrücklich
      Engine-randomisierten Auswahlbefehl anfordert.
- [x] Engine-randomisierte Auswahlpfade ziehen in der Vorschau keinen Zufall
      und verändern keinen `RandomCounter`; die UI zeigt stattdessen eine
      ehrliche, typisierte Nichtauflösbarkeit oder nur die übergeordnete
      KI-Absicht.
- [x] Der Aufruf verändert weder Match-/State-Version, Eventlog, StateHash,
      Zufallsnachweise noch produktives KI-Memory.
- [x] Der Vorschlag verschwindet nach jeder Zustandsänderung und wird nie als
      Regelautorität oder garantiert beste Aktion bezeichnet.
- [x] Der Meldeexport ist reproduzierbar, kompakt und enthält keine verbotenen
      Hidden-Info-, Token-, Decklisten-, Rohinput- oder FullState-Daten.
- [x] Runner- und Korp-Fälle, Choice-Fenster, stale Versionen, unzulässige
      Fremdseitenaufrufe, Random-Auswahl und Hidden-Info-Sentinels sind
      getestet.
- [x] Relevante AI-, Server- und Web-Checks sowie `git diff --check` sind grün.

## Umsetzungshinweise

- Der technische Kern ist bereits vorhanden; voraussichtliche Hauptarbeit
  liegt in Autorisierung/Projektion, Human-Side-Zielwahl, UI-Zuschnitt und
  Regressionstests.
- Für den menschlichen Advisor eine eigene `profileId` verwenden, die nicht
  mit dem produktiven Gegner-Controller kollidiert. Wegen
  `persistTacticalPlanMemory: false` ist das Ergebnis eine frische Übernahme,
  keine fortgeschriebene Shadow-KI.
- Das gleiche Difficulty-Profil wie im Match kann als erster Default dienen,
  muss aber im Ergebnis sichtbar sein. Eine freie Difficulty-Auswahl ist ein
  mögliches späteres Paket.
- Das Sicherheits-Hotfix
  `act-2026-07-26-ai-preview-session-redaction-hardening` ist zwingende
  Vorbedingung.
- Nach einem erfolgreichen lokalen QA-Slice kann Release Planning entscheiden,
  ob daraus später ein allgemeiner Lern-/Coaching-Modus entstehen soll.

## Ergebnisnotiz

Scope-Gate vor Umsetzung: freigegeben ausschließlich als privates lokales
QA-Werkzeug innerhalb des bereits vorhandenen, opt-in aktivierten
KI-Bewertungsfensters. Keine allgemeine Coach-UI, keine Releasezuordnung und
keine Freigabe des in V3.7 geführten Produkt-Coachings. Der Slice verwendet
die produktive KI nur als read-only Diagnoseprobe für die eigene aktuelle
`LegalAction`-Menge.

Umgesetzt ist der bewusste Aufruf `Was würde die KI tun?` für die
authentifizierte menschliche Seite eines privaten Human-vs-KI-Matches. Der
Server erzeugt dafür einen requester-relativen `AiDecisionInput` aus der
eigenen Projektion und dem eigenen Decksnapshot, verwendet den produktiven
Chooser unter einem sichtbaren `human-advisor`-Profil und setzt
`persistTacticalPlanMemory: false`. Der Vorschlag wird ausschließlich
angezeigt, wenn seine Action-ID weiterhin in den aktuellen `LegalActions`
existiert; bei jeder State- oder Matchversionsänderung verschwinden Vorschlag
und Hervorhebung.

Die UI bezeichnet das Ergebnis ausdrücklich als read-only Vorschlag einer
frischen Übernahme, hebt nur die betroffene eigene Karte oder Serverfläche
hervor und führt keine Aktion aus. Der kopierbare Meldeexport übernimmt
ausschließlich positiv gelistete Identitäts-, Versions-, Action-, Choice- und
Advisor-Felder sowie sanitizierte sichtbare Diagnosewerte.

Die relevanten Zieltests, beide Typechecks, alle 695 Webtests, Formatprüfung
und `git diff --check` sind grün. Im vollständigen Serverlauf bestehen 207 von
208 Tests. Ein bereits auf dem unveränderten lokalen `main` identisch
reproduzierbarer AI-vs-AI-Langlauftest erwartet mehr als 120 Aktionen, während
das deterministische Match nach 109 Aktionen endet; diese bekannte
Baseline-Abweichung wurde durch das Paket nicht verursacht.
