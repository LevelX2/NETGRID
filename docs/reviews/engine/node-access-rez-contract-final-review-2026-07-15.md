# Node-Zugriffseffekte – Rez-Vertrag Final Review

Stand: 2026-07-15  
Ergebnis: für lokale Main-Integration freigegeben

## Ergebnis

NETGRID bildet die historische Node-Zugriffsregel jetzt generisch ab:
Installierte Corp-Karten mit einem semantischen `accessEffects`-Effekt müssen
standardmäßig gerezzt sein. Nicht installierte Zugriffe aus HQ, R&D oder
Archives bleiben davon getrennt. Abweichungen benötigen eine positive
Deklaration am Access-Deskriptor.

Damit wirken `Vacant Soulkiller`, `Experimental AI`, `Corprunner's Shattered
Remains`, installierte `Setup!`-/`TRAP!`-Kopien sowie installierte
`Doppelganger Antibody`-/`Pattel Antibody`-Kopien nicht mehr unrezzed.
`Virus Test Site` bleibt die belegte Ausnahme: unrezzed installiert verursacht
sie genau 1 Net Damage; rezzed verursacht sie 2 Net Damage je Advancement-
Counter oder 1 ohne Counter.

## Geprüfte Grundgesamtheit

Der Audit hat die aktiven Kartendaten aus Originalset V1, Classic und Proteus
mit allen semantischen Corp-Asset-Implementierungen abgeglichen:

| Set | Aktive Corp-Assets | Assets mit Zugriffseffekt | Implementiert |
|---|---:|---:|---:|
| Originalset V1 | 41 | 6 | 6 |
| Classic | 4 | 0 | 0 erforderlich |
| Proteus | 11 | 4 | 4 |
| Gesamt | 56 | 10 | 10 |

Die zehn Zugriffskarten zerfallen in drei Vertragsklassen:

- sieben installierbare Standardfälle mit Rez-Anforderung;
- `Virus Test Site` als ausdrückliche installierte Unrezzed-Ausnahme;
- `Bel-Digmo Antibody` und `Stereogram Antibody` als ausschließlich nicht
  installierte R&D-/Archives-Fälle.

Die vollständige Kartenmatrix und Quellenklassifikation stehen in
`docs/reviews/engine/node-access-rez-audit-2026-07-15.md`.

## Implementierter Vertrag

`CardAccessEffectImplementation` besitzt jetzt die optionale
`installedSourceActivation` mit drei expliziten Zuständen:

- `requires_rezzed` – Default, wenn kein Wert angegeben ist;
- `unrezzed_only` – nur für eine belegte Sonderauflösung;
- `any_rez_state` – ausdrückliche, derzeit von keiner aktiven Node benötigte
  Erweiterungsoption.

Der zentrale Access-Resolver prüft diese Aktivierung:

1. beim erstmaligen Zugriff vor Payload- oder Effektaufbau;
2. erneut beim Auflösen einer optionalen Korp-Payment-Choice.

Ein unrezzed Standard-Node öffnet deshalb weder Damage-/Trash-Auflösung noch
eine nachgelagerte Payment-Choice und erzeugt auch keinen falschen
Ambush-Payload. Der Vertrag ist funktionsbasiert; es gibt keinen neuen
Karten-ID-Zweig im Resolver.

## Kartenwirkung nach dem Fix

| Karte oder Familie | Unrezzed installiert | Rezzed installiert | Nicht installiert |
|---|---|---|---|
| Shattered Remains, Experimental AI, Vacant Soulkiller | keine Access-Wirkung | advancementskalierende Wirkung | kein entsprechender Source-Pfad |
| Setup!, TRAP! | keine Access-Wirkung | gedruckte Access-Wirkung | HQ/R&D wirken; Archives ignoriert |
| Doppelganger/Pattel Antibody | keine Payment-Choice | Payment-Choice und gedruckte Wirkung | HQ/R&D wirken; Archives ignoriert |
| Virus Test Site | genau 1 Net Damage | 2 je Counter, sonst 1 | HQ/R&D genau 1; Archives ignoriert |
| Bel-Digmo Antibody | kein installierter Accesspfad | kein installierter Accesspfad | R&D-Wirkung bleibt |
| Stereogram Antibody | kein installierter Accesspfad | kein installierter Accesspfad | Archives-Wirkung bleibt |

Der generische Default gilt zugleich für semantische Upgrade-Access-Effekte.
Der vorhandene `Chimera`-Smoke wurde deshalb auf den regelkonformen Rez-Schritt
vor dem Zugriff umgestellt; es entstand keine separate Upgrade-Neuinterpretation.

## Regressionen

Neu beziehungsweise gehärtet sind:

- Contracttest für das vollständige aktive Zehn-Karten-Inventar;
- Default-Rez-Klassifikation aller sieben installierbaren Standard-Nodes;
- Strukturvertrag für die drei getrennten `Virus Test Site`-Auflösungen;
- installierte Doppelganger-/Pattel-Paymentpfade rezzed versus unrezzed;
- `Vacant Soulkiller` und `Experimental AI` ohne Wirkung nach abgelehntem Rez;
- rezzed Shattered-/Experimental-/Vacant-Wirkung mit bestehender
  Damage-/Trash-Evidence;
- `Virus Test Site` unrezzed konstant 1, rezzed advancementskalierend sowie
  R&D-Reveal und Archives-Skip;
- Payment-Revalidation, falls eine installierte Quelle zwischen Choice-Öffnung
  und Auflösung nicht mehr gerezzt ist;
- bestehende Hidden-Info-, PublicPayload-, Replay- und StateHash-Prüfungen.

## Verifikation

- Fokussierte P2-Suite: 4 Testdateien, 118 Tests – grün.
- P3-Matrix und angrenzende Smokes: 4 Testdateien, 176 Tests – grün.
- Vollständige `@netgrid/engine`-Suite: 186 Testdateien, 1.687 Tests – grün.
- `corepack pnpm --filter @netgrid/engine typecheck` – grün.
- `git diff --check` – grün.
- Proteus- und Classic-CardImplementation-Vollständigkeitsgates innerhalb der
  Engine-Suite – grün.

## Sicherheits- und Architekturprüfung

- Keine PlayerAction- oder LegalAction-Grenze wurde aufgeweicht.
- Der Rez-Zustand wird an der generischen Effektanwendung und bei
  fortsetzbaren Choices erneut geprüft.
- Unrezzed Standard-Nodes erzeugen keine Ambush-Payloads und damit keine
  zusätzlichen Hidden-Info-Signale.
- Bestehende Reveal-Regeln für R&D und Skip-Regeln für Archives bleiben
  kartennah erhalten.
- Replay und StateHash bleiben für die betroffenen End-to-End-Pfade grün.

## Restpunkte

Keine offene Regel- oder Implementierungslücke innerhalb des geprüften
Node-/Asset-Scopes. Neue Access-Assets müssen vom Inventar-Contracttest erfasst
und einer der drei Vertragsklassen ausdrücklich zugeordnet werden.

## Führende Artefakte

- Prozess:
  `docs/architecture/card-rules/node-access-rez-contract-process-2026-07-15.md`
- Auditmatrix:
  `docs/reviews/engine/node-access-rez-audit-2026-07-15.md`
- Final Review: dieses Dokument

