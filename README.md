[English](README.md) | [Deutsch](README.de.md) | [Français](README.fr.md)

# NETGRID

NETGRID is a private, local-first web application for playing, testing, and analysing the classic Netrunner card game.

It combines a deterministic rules engine, private multiplayer, deck and card management, replays, a multilingual browser interface, and a built-in plan-first AI that can play both Runner and Corp.

**Current product status:** V0.9 private pre-release.

NETGRID is actively developed as a local application rather than operated as a public hosted service. APIs, storage formats, replay formats, and local runtime data may still change between versions.

## Highlights

- Rules-enforced gameplay with server-authoritative legal actions.
- Human vs Human, Human vs AI, and AI vs AI.
- AI play as either Runner or Corp.
- Original Set, Classic, and Proteus card pools.
- German, English, and French user interface.
- Private-link multiplayer over loopback, LAN, or a controlled private deployment.
- Deck library, deck editor, card catalogue, standard decks, and deck guides.
- Match lobbies, ready checks, countdowns, chat, reconnect, and undo requests.
- Single matches and side-swap series of 2 to 6 games.
- Optional player clocks and configurable AI pacing.
- Live spectators, match history, statistics, chronicles, and deterministic replays.
- Local card-image management without a runtime dependency on external image services.
- No external language model or cloud AI service required.

## Gameplay

### Rules-enforced matches

The NETGRID rules engine is the sole authority for game rules and execution.

The browser, multiplayer server, human players, and AI may only submit actions that were previously offered by the engine as `LegalActions`. Before applying an action, the engine validates its side, timing, `actionId`, `stateVersion`, costs, targets, and choices again.

This keeps game rules separate from the user interface and from AI decision logic.

### Play modes

NETGRID supports:

- **Human vs Human** through a private join link.
- **Human vs AI**, with the human playing either Runner or Corp.
- **Random side assignment** for Human vs Human and Human vs AI.
- **AI vs AI** for observation, simulation, and regression analysis.

Human vs Human matches include a shared start lobby with deck readiness, ready checks, a configurable countdown, lobby chat, and connection status.

### Match formats and controls

Available match formats include:

- a standard rules match to 7 agenda points;
- a series of 2 to 6 games with alternating sides.

Depending on the selected mode, NETGRID also supports:

- optional player clocks with a starting time and grace period;
- fast, paced, or manually advanced AI turns;
- reconnect after a browser or network interruption;
- request-and-response undo handling;
- forfeiting, leaving, and time-expiry result handling;
- final result summaries and series results.

### Trace rule profiles

A trace rule profile can be selected when a match is created:

- **Modern Open** — open sequential payments; the Runner wins ties.
- **Classic Blind** — hidden commitments; the Runner wins ties.
- **Classic Blind — Corp Wins Ties** — hidden commitments; the Corp wins ties.

Blind commitments are revealed together. Trace payments use the normal legal payment sources and remain part of the deterministic replay.

## Built-in AI

NETGRID includes its own local game-playing AI. It is not an integration with an external language model and does not require an AI API, cloud account, or internet connection.

The AI uses a plan-first architecture:

1. It receives the same side-safe player view and legal actions available to its side.
2. It interprets card abilities, costs, targets, timing, and visible board context.
3. It analyses its own deck composition and supported strategic lines.
4. It maintains plans and longer-running campaigns such as rig development, central pressure, remote contests, scoring projects, economy development, defence, and punishment lines.
5. It compares coherent remaining-turn sequences rather than selecting every action in isolation.
6. It executes only the current step of the selected plan.
7. The engine revalidates and applies the selected legal action.

Separate Runner and Corp schedulers use the same technical planning framework while retaining side-specific priorities and plan modules.

The AI never creates its own legal actions and does not receive hidden opponent information. Any permitted variation between near-equivalent choices uses the seeded engine RNG and remains replayable.

### AI deck selection

AI decks may be:

- selected explicitly;
- taken from approved standard decks;
- selected deterministically from an approved pool using the match seed;
- mirrored from a participant deck where the selected mode permits it.

Custom AI decks are validated against the selected format and must contain AI-supported cards.

### AI-supported card pools

| Selectable card pool | Human play | AI play |
| --- | ---: | ---: |
| Original Set | Yes | Yes |
| Original Set + Classic | Yes | Yes |
| Original Set + Proteus | Yes | Yes |
| Original Set + Classic + Proteus | Yes | Yes |

Proteus has passed the current AI-readiness gates for reviewed card hints, selected playtest decks, deterministic simulations, replay integrity, and hidden-information protection.

Further AI development primarily focuses on playing strength, additional reusable plan lines, and regression coverage rather than introducing a second decision system.

## Cards and decks

### Supported content

NETGRID currently provides technically playable implementations for:

- the Original Set;
- the Classic add-on;
- Proteus.

Classic and Proteus can be enabled independently or together in addition to the Original Set.

Card-specific implementation data is maintained through the central `CardSpec` architecture. It serves as the project source for card metadata, structured effects, engine projections, and AI hints. The rules engine remains responsible for legality and execution.

An internal test card set exists for development and diagnostics but is disabled during normal operation. It is only exposed when `NETGRID_ENABLE_TEST_CARDS=true` is configured explicitly.

### Card catalogue and deck library

The browser card catalogue provides a searchable view of the available card pool and its card data.

NETGRID also includes:

- curated standard decks;
- optional strategy and usage guides for supported standard decks;
- personal Runner and Corp deck libraries;
- deck creation, editing, duplication, and import;
- copying a standard deck into a personal library;
- server-side deck and format validation;
- immutable deck snapshots for match start;
- filtering decks by side, card pool, and match compatibility.

Invalid personal drafts may be saved and edited, but only a successfully validated immutable snapshot can be used to start a match.

Guest decks remain local to the guest environment. Account decks are stored in the account database.

Official card artwork is not distributed with NETGRID. Optional personal card images can be imported and managed locally.

## Multiplayer, accounts, and history

### Private multiplayer

The normal operating mode is local or private-LAN multiplayer.

Human matches can be created through a private join link. The server keeps match sessions, reconnect capabilities, deck selections, match state, and event history in local SQLite storage.

Within a private NETGRID installation, matches may also be listed to other users of that installation as open, active, or finished. This is an installation-local feature and not a global public matchmaking service.

Live spectators can follow supported active matches through side-safe spectator views. Hidden information remains protected.

### Accounts and guests

NETGRID can be used without an account in local guest mode.

An optional invite-only account system adds:

- personal deck storage;
- private match history;
- win, loss, draw, agenda-point, and series statistics;
- statistics by side, opponent type, match mode, and match format;
- personal recent results;
- account-bound display names;
- password changes and administrator-issued reset links;
- account export and deletion.

Accounts are deliberately separate from match capabilities. An account cookie does not authorise game actions, joining a match, or reconnecting to a match.

The current account system does not provide public self-registration, email delivery, email verification, passkeys, two-factor authentication, or self-service password recovery.

### Replays and analysis

NETGRID records deterministic match events, state hashes, and seeded random draws.

Available review surfaces include:

- a chronological match narrative;
- completed-game replay;
- result summaries;
- recent public results within the private installation;
- personal account history;
- multi-game series summaries;
- final-state and replay verification;
- terminal learning and analysis views;
- read-only maintenance analysis for stored matches.

Replay and chronicle presentation is generated from structured game events. It is not stored as a fixed language-specific text transcript.

## Multilingual interface

The normal player interface and the browser-based maintenance interface are available in:

- **German** — default;
- **English**;
- **French**.

The selected language is stored per browser and can be changed at runtime without changing the match URL.

Different clients may display the same match in different languages. Locale selection affects presentation and formatting only. It does not change game state, rules, legality, action identity, state hashes, random results, replays, or AI decisions.

The localisation scope includes the application shell, accounts, match setup, lobbies, deck and card surfaces, the game board, actions, choices, result screens, chronicles, replays, user-facing errors, and maintenance navigation.

Printed card titles, printed card rules text, flavour text, card images, technical identifiers, raw AI traces, and raw engine diagnostics are not translated.

## Local card images

Personal card images are prepared and stored locally. The match runtime reads only normalised local variants and does not fetch artwork from remote services.

Supported preparation sources include:

- PNG, JPEG, and WebP files;
- explicitly enabled and hardened HTTPS imports;
- validated local directory packages;
- validated local ZIP transport packages.

Image packages and individual sources are checked before import. The local maintenance interface can inspect the current image inventory, generate templates, validate imports, build private packages, and import prepared packages.

Private source images, generated packages, caches, and runtime assets are not part of the repository or CI build.

## Maintenance and architecture

### Maintenance area

The protected maintenance area is available under:

```text
/maintenance
```

It provides administrative access to areas such as:

- SQLite storage status;
- backup, restore, and optimisation;
- match analysis;
- AI decision traces;
- card-image inventory and import jobs;
- local maintenance diagnostics.

Maintenance authentication is separate from player accounts and match reconnect capabilities.

The default maintenance boundary is loopback-only. Access from another device requires a controlled HTTPS origin and reverse-proxy configuration.

### Architecture principles

NETGRID follows a small number of strict system boundaries:

- **Engine authority:** the engine alone defines and applies legal game actions.
- **Hidden-information protection:** opponent hidden zones are excluded from normal player views, AI input, public events, network payloads, replays, logs, and client-facing errors.
- **Determinism and replay:** state hashes, action receipts, seeded randomness, and random-draw records make matches reproducible and auditable.
- **Central card specification:** card metadata, structured mechanics, runtime projections, and AI hints are maintained through a central card-specification layer rather than duplicate manual registries.
- **Locale-neutral game semantics:** the engine and backend exchange stable codes and structured presentation data; only the browser turns those structures into German, English, or French user text.
- **Local-first storage:** matches, accounts, personal decks, card images, caches, and operational data remain in storage controlled by the operator.

## Technology

NETGRID is a TypeScript monorepo built with:

- Node.js 24 LTS;
- pnpm workspaces through Corepack;
- TypeScript;
- Next.js and React;
- a local Node.js multiplayer server;
- SQLite;
- Vitest;
- Playwright.

The main project areas include:

- `apps/web` — browser application;
- `apps/server` — multiplayer, account, maintenance, and persistence server;
- `packages/engine` — deterministic rules engine;
- `packages/cards` — central card specifications and projections;
- `packages/ai` — local plan-first AI and simulation;
- `packages/decks` — deck models and validation;
- `packages/catalog` — card catalogue projections;
- `packages/shared` — shared contracts.

## Local start

### Requirements

- Node.js 24;
- Corepack;
- PowerShell for the standard local start path.

### Install dependencies

```powershell
corepack pnpm install
```

### Start NETGRID

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-netgrid.ps1
```

The start script launches the server and web application, determines the local LAN address, and configures the matching URLs, origins, and environment variables.

Standard local endpoints:

- Web application: `http://127.0.0.1:3100`
- Server health endpoint: `http://127.0.0.1:8787/health`
- Maintenance: `http://127.0.0.1:3100/maintenance`

The script may open the corresponding LAN URL instead of the loopback URL.

Direct package development starts are intended for diagnostics and isolated development. The normal local operating path is the project start script so that web URL, server URL, LAN address, and origin allowlist remain consistent.

### Initial maintenance setup

Before using the maintenance area for the first time, set a local maintenance password:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\set-maintenance-password.ps1
```

See the [Maintenance Control Plane runbook](docs/runbooks/maintenance-control-plane.md) for the complete operating contract.

Optional invite-only accounts are described in the [Account Alpha runbook](docs/runbooks/account-alpha-operations.md).

## Configuration and local data

`.env.example` documents the main local configuration variables.

The standard start script sets the values required for normal local operation, including the public host, web URL, server URL, and allowed origins. Local overrides and secrets must not be committed.

Runtime data is stored locally, normally below:

```text
data/runtime/
```

The default multiplayer SQLite database is:

```text
data/runtime/multiplayer/netgrid.sqlite
```

Local storage commands include:

```powershell
corepack pnpm storage:inspect
corepack pnpm storage:backup
corepack pnpm storage:restore -- <backup-directory>
corepack pnpm storage:optimize
```

Local installations can also be exported and imported through the documented local-transfer workflow.

## Development checks

Common repository-wide checks are:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm e2e
```

Important architecture-specific checks include:

```powershell
corepack pnpm check:engine-source-structure
corepack pnpm check:cards-source-structure
corepack pnpm check:ai
corepack pnpm check:i18n
```

Package-specific checks can be used for narrower changes:

```powershell
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/server typecheck
corepack pnpm --filter @netgrid/web test
```

## Documentation

Current architecture and operating references:

- [Current project status](KI-Wissen-NETGRID/02%20Wissen/00%20Uebersichten/Aktueller%20Projektstatus.md)
- [Architecture index](docs/architecture/README.md)
- [Engine architecture](docs/architecture/engine/README.md)
- [AI architecture](docs/architecture/ai/README.md)
- [Localisation architecture](docs/architecture/localization/translatable-ui.md)
- [Maintenance Control Plane](docs/runbooks/maintenance-control-plane.md)
- [Account operation](docs/runbooks/account-alpha-operations.md)
- [Local transfer](docs/runbooks/netgrid-local-transfer.md)
- [Personal card-image import](docs/architecture/card-images/personal-card-image-import.md)

The working tree documents the current state. Historical implementation plans, reviews, benchmarks, and migration evidence are retained through Git history rather than as a second current specification.

## Current boundaries

NETGRID currently does not provide:

- a globally hosted public platform;
- cross-installation public matchmaking;
- rankings or leaderboards;
- tournament administration;
- public moderation tooling;
- public self-registration;
- email delivery or automatic password recovery;
- bundled official card artwork;
- a compatibility guarantee for pre-release runtime data.

Private SQLite databases, personal decks, local card images, caches, logs, secrets, and runtime exports remain local and are not versioned.

## Licence and legal notice

The NETGRID source code is available under the [MIT Licence](LICENSE).

NETGRID is an unofficial private project. Card names, card text, game names, artwork, logos, and related trademarks remain the property of their respective rights holders. This repository does not distribute official card artwork.
