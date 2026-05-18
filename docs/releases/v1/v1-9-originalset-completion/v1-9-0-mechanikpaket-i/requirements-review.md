# V1.9.0 Requirements Review

Stand: 2026-05-10  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/release-assignment-preflight.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-0-mechanikpaket-i/test-matrix.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/final-review.md`

## Ergebnis

`V1_9_0_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_8_1: true`

V1.9.0 ist als 5-Karten-Kernrelease vor V2.x umsetzungsreif eingegrenzt.  
Die drei Pflichtmechaniken (`L2_Ambush`, `L3_Deterministischer_Wuerfel_Zufall`, `L4_Konkreter_Sonderresolver_noch_offen`) sind in konkrete Umsetzungsverträge zerlegt.

## Geklärte Entscheidungen

- Kernkorb bleibt exakt bei fünf Karten (`005`, `007`, `115`, `223`, `275`).
- Zufallslogik wird als zentraler deterministischer Würfelresolver umgesetzt, nicht als verstreuter Karten-Spezialcode.
- `Banpei` wird als konkreter Sonderresolverfall geführt und nicht als offener Restpunkt belassen.
- Ambush wird als Foundationscope mit eigenem Testnachweis umgesetzt, ohne zusätzliche Kartenfreigabe im 5er-Kern.
- `Cockroach`, `Incubator`, `Grubb` bleiben im V1.9.0-Kernscope deferred und werden explizit als Restüberhang geführt.

## Offene Punkte (nicht blockierend für V1.9.0-Kern)

1. Exakte Nachfolgeentscheidung für den Deferred-Überhang nach V1.9.0 (`Cockroach`, `Incubator`, `Grubb`).
2. Optionales Ambush-Kartenunlock-Gate nach stabiler Foundation.

## Gate

V1.9.0 ist mit dokumentiertem Kernkorb, aufgelöster Abhängigkeitslage und gefrorenen Anforderungen zur Implementierung freigegeben.
