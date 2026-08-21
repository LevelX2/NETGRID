[English](README.md) | [Deutsch](README.de.md) | [Français](README.fr.md)

# NETGRID

NETGRID est une application web privée, conçue en priorité pour une utilisation locale, permettant de jouer, de tester et d’analyser le jeu de cartes Netrunner classique.

Elle réunit un moteur de règles déterministe, un mode multijoueur privé, la gestion des cartes et des decks, des replays, une interface web multilingue et une IA intégrée de type plan-first capable de jouer aussi bien le Runner que la Corp.

**État actuel du produit :** V0.9, préversion privée.

NETGRID est développé activement comme application locale et n’est pas exploité comme service public hébergé. Les API, formats de stockage, formats de replay et données d’exécution locales peuvent encore évoluer d’une version à l’autre.

## Points forts

- Parties entièrement encadrées par les règles, avec des actions légales autorisées côté serveur.
- Humain contre humain, humain contre IA et IA contre IA.
- IA jouant aussi bien le Runner que la Corp.
- Pools de cartes Original Set, Classic et Proteus.
- Interface utilisateur en allemand, anglais et français.
- Multijoueur privé par lien d’invitation, en loopback, sur le LAN ou via un déploiement privé contrôlé.
- Bibliothèque de decks, éditeur de decks, catalogue de cartes, decks standard et guides de decks.
- Lobbies de match, vérification de disponibilité, compte à rebours, chat, reconnexion et demandes d’annulation.
- Parties simples et séries de 2 à 6 parties avec inversion des camps.
- Horloges de joueur facultatives et rythme de l’IA configurable.
- Spectateurs en direct, historique des parties, statistiques, chroniques et replays déterministes.
- Gestion locale des images de cartes, sans dépendance à un service d’images externe pendant l’exécution.
- Aucun modèle de langage externe ni service d’IA cloud requis.

## Jeu

### Parties encadrées par les règles

Le moteur de règles NETGRID est l’unique autorité pour les règles et leur exécution.

Le navigateur, le serveur multijoueur, les joueurs humains et l’IA ne peuvent soumettre que des actions préalablement proposées par le moteur sous forme de `LegalActions`. Avant d’appliquer une action, le moteur vérifie de nouveau le camp, le timing, l’`actionId`, la `stateVersion`, les coûts, les cibles et les choix.

Les règles du jeu restent ainsi séparées de l’interface utilisateur et de la logique de décision de l’IA.

### Modes de jeu

NETGRID prend en charge :

- **Humain contre humain** au moyen d’un lien privé.
- **Humain contre IA**, l’humain pouvant jouer le Runner ou la Corp.
- **Attribution aléatoire des camps** pour humain contre humain et humain contre IA.
- **IA contre IA** pour l’observation, la simulation et l’analyse de régression.

Les parties humain contre humain utilisent un lobby de départ commun avec validation des decks, vérification de disponibilité, compte à rebours configurable, chat de lobby et état de connexion.

### Formats et commandes de match

Les formats disponibles comprennent :

- une partie standard jusqu’à 7 points d’agenda ;
- une série de 2 à 6 parties avec alternance des camps.

Selon le mode choisi, NETGRID prend également en charge :

- des horloges de joueur facultatives avec temps initial et période de grâce ;
- des tours d’IA rapides, cadencés ou avancés manuellement ;
- la reconnexion après une interruption du navigateur ou du réseau ;
- les demandes d’annulation soumises à acceptation ou refus ;
- l’abandon, le départ et l’expiration du temps comme résultats gérés ;
- les résumés de résultats pour les parties et les séries.

### Profils de règles de trace

Un profil de règles de trace peut être choisi lors de la création du match :

- **Modern Open** — paiements ouverts et successifs ; le Runner remporte les égalités.
- **Classic Blind** — engagements cachés ; le Runner remporte les égalités.
- **Classic Blind — Corp Wins Ties** — engagements cachés ; la Corp remporte les égalités.

Les engagements cachés sont révélés simultanément. Les paiements de trace utilisent les sources de paiement légales ordinaires et restent intégrés au replay déterministe.

## IA intégrée

NETGRID inclut sa propre IA locale de jeu. Il ne s’agit pas d’une intégration à un modèle de langage externe et elle ne nécessite ni API d’IA, ni compte cloud, ni connexion Internet.

L’IA utilise une architecture plan-first :

1. Elle reçoit la même vue side-safe et les mêmes actions légales que celles disponibles pour son camp.
2. Elle interprète les capacités des cartes, les coûts, les cibles, le timing et le contexte visible du plateau.
3. Elle analyse la composition de son propre deck et les lignes stratégiques qu’il prend en charge.
4. Elle maintient des plans et des campagnes de plus longue durée, par exemple le développement du rig, la pression sur les serveurs centraux, la contestation des remotes, les projets de score, le développement économique, la défense et les lignes de punition.
5. Elle compare des séquences cohérentes pour le reste du tour au lieu de sélectionner chaque action isolément.
6. Elle n’exécute que l’étape actuelle du plan retenu.
7. Le moteur revalide puis applique l’action légale sélectionnée.

Des ordonnanceurs distincts pour le Runner et la Corp utilisent le même cadre technique de planification tout en conservant leurs priorités et modules de plan propres à chaque camp.

L’IA ne crée jamais elle-même d’actions légales et ne reçoit aucune information cachée de l’adversaire. Toute variation autorisée entre des choix presque équivalents utilise le générateur aléatoire déterministe du moteur et reste reproductible dans le replay.

### Sélection des decks de l’IA

Les decks de l’IA peuvent être :

- sélectionnés explicitement ;
- issus de decks standard approuvés ;
- sélectionnés de manière déterministe dans un pool approuvé à partir de la graine du match ;
- copiés depuis le deck d’un participant lorsque le mode choisi le permet.

Les decks personnalisés destinés à l’IA sont validés par rapport au format choisi et ne peuvent contenir que des cartes prises en charge par l’IA.

### Pools de cartes pris en charge par l’IA

| Pool de cartes sélectionnable | Jeu humain | Jeu par l’IA |
| --- | ---: | ---: |
| Original Set | Oui | Oui |
| Original Set + Classic | Oui | Oui |
| Original Set + Proteus | Oui | Oui |
| Original Set + Classic + Proteus | Oui | Oui |

Proteus a franchi les contrôles actuels de préparation de l’IA concernant les hints de cartes révisés, les decks de playtest sélectionnés, les simulations déterministes, l’intégrité des replays et la protection des informations cachées.

Le développement ultérieur de l’IA porte principalement sur la force de jeu, des lignes de plan réutilisables supplémentaires et la couverture de régression, et non sur l’introduction d’un second système de décision.

## Cartes et decks

### Contenu pris en charge

NETGRID fournit actuellement des implémentations techniquement jouables pour :

- l’Original Set ;
- l’extension Classic ;
- Proteus.

Classic et Proteus peuvent être activés séparément ou ensemble en complément de l’Original Set.

Les données d’implémentation propres aux cartes sont maintenues dans l’architecture centrale `CardSpec`. Celle-ci constitue la source du projet pour les métadonnées, les effets structurés, les projections du moteur et les hints de l’IA. Le moteur de règles reste responsable de la légalité et de l’exécution.

Un jeu interne de cartes de test existe pour le développement et le diagnostic, mais il est désactivé en fonctionnement normal. Il n’est exposé que si `NETGRID_ENABLE_TEST_CARDS=true` est configuré explicitement.

### Catalogue de cartes et bibliothèque de decks

Le catalogue de cartes du navigateur offre une vue consultable du pool disponible et de ses données.

NETGRID comprend également :

- des decks standard sélectionnés ;
- des guides de stratégie et d’utilisation facultatifs pour les decks standard pris en charge ;
- des bibliothèques personnelles de decks Runner et Corp ;
- la création, la modification, la duplication et l’import de decks ;
- la copie d’un deck standard vers une bibliothèque personnelle ;
- la validation des decks et des formats côté serveur ;
- des snapshots de deck immuables pour le démarrage d’un match ;
- le filtrage par camp, pool de cartes et compatibilité avec le match.

Les brouillons personnels invalides peuvent être enregistrés et modifiés, mais seul un snapshot immuable validé avec succès peut être utilisé pour commencer un match.

Les decks invités restent dans l’environnement local de l’invité. Les decks liés à un compte sont stockés dans la base de données des comptes.

Les illustrations officielles des cartes ne sont pas distribuées avec NETGRID. Des images personnelles peuvent être importées et gérées localement en option.

## Multijoueur, comptes et historique

### Multijoueur privé

Le mode de fonctionnement normal est local ou sur un LAN privé.

Les parties humaines peuvent être créées au moyen d’un lien privé. Le serveur conserve les sessions de match, les capacités de reconnexion, les choix de decks, l’état du match et l’historique des événements dans une base SQLite locale.

Au sein d’une installation NETGRID privée, les matchs peuvent également être présentés aux autres utilisateurs de cette installation comme ouverts, actifs ou terminés. Il s’agit d’une fonction propre à l’installation et non d’un service public mondial de matchmaking.

Des spectateurs en direct peuvent suivre les matchs actifs pris en charge au moyen de vues side-safe. Les informations cachées restent protégées.

### Comptes et invités

NETGRID peut être utilisé sans compte, en mode invité local.

Un système de comptes facultatif sur invitation ajoute :

- le stockage de decks personnels ;
- un historique privé des matchs ;
- des statistiques de victoires, défaites, matchs nuls, points d’agenda et séries ;
- des statistiques par camp, type d’adversaire, mode de match et format de match ;
- les résultats personnels récents ;
- des noms d’affichage liés au compte ;
- le changement de mot de passe et les liens de réinitialisation créés par un administrateur ;
- l’exportation et la suppression du compte.

Les comptes sont volontairement séparés des capacités de match. Un cookie de compte n’autorise ni une action de jeu, ni l’entrée dans un match, ni la reconnexion à un match.

Le système de comptes actuel ne propose ni inscription publique autonome, ni envoi d’e-mails, ni vérification par e-mail, ni passkeys, ni authentification à deux facteurs, ni récupération autonome du mot de passe.

### Replays et analyse

NETGRID enregistre les événements déterministes du match, les hashes d’état et les tirages aléatoires fondés sur une graine.

Les surfaces d’analyse disponibles comprennent :

- une narration chronologique du match ;
- le replay d’une partie terminée ;
- les résumés de résultats ;
- les résultats publics récents au sein de l’installation privée ;
- l’historique personnel du compte ;
- les résumés des séries de plusieurs parties ;
- la vérification de l’état final et du replay ;
- des vues d’apprentissage et d’analyse pour les parties terminées ;
- une analyse en lecture seule des matchs stockés depuis l’espace de maintenance.

La présentation des replays et des chroniques est générée à partir d’événements structurés. Elle n’est pas enregistrée comme transcription figée dans une langue déterminée.

## Interface multilingue

L’interface normale des joueurs et l’interface de maintenance accessible dans le navigateur sont disponibles en :

- **allemand** — langue par défaut ;
- **anglais** ;
- **français**.

La langue sélectionnée est enregistrée par navigateur et peut être modifiée à l’exécution sans changer l’URL du match.

Des clients différents peuvent afficher le même match dans des langues différentes. Le choix de la locale ne modifie que la présentation et le formatage. Il ne change ni l’état du jeu, ni les règles, ni la légalité, ni l’identité des actions, ni les hashes d’état, ni les résultats aléatoires, ni les replays, ni les décisions de l’IA.

La localisation couvre l’enveloppe de l’application, les comptes, le démarrage des matchs, les lobbies, les surfaces de cartes et de decks, le plateau, les actions, les choix, les écrans de résultat, les chroniques, les replays, les erreurs destinées à l’utilisateur et la navigation de maintenance.

Les titres imprimés des cartes, leur texte de règles imprimé, le texte d’ambiance, les images de cartes, les identifiants techniques, les traces brutes de l’IA et les diagnostics bruts du moteur ne sont pas traduits.

## Images de cartes locales

Les images personnelles des cartes sont préparées et stockées localement. Pendant une partie, l’application utilise uniquement des variantes locales normalisées et ne récupère aucune illustration auprès de services distants.

Les sources de préparation prises en charge comprennent :

- les fichiers PNG, JPEG et WebP ;
- les imports HTTPS explicitement activés et renforcés ;
- les paquets de répertoires locaux validés ;
- les paquets ZIP locaux validés pour le transport.

Les paquets d’images et les sources individuelles sont contrôlés avant l’import. L’interface locale de maintenance peut inspecter l’inventaire actuel, générer des modèles, valider les imports, construire des paquets privés et importer des paquets préparés.

Les images sources privées, les paquets générés, les caches et les ressources d’exécution ne font partie ni du dépôt ni du build CI.

## Maintenance et architecture

### Espace de maintenance

L’espace de maintenance protégé est accessible sous :

```text
/maintenance
```

Il donne notamment un accès administratif à :

- l’état du stockage SQLite ;
- la sauvegarde, la restauration et l’optimisation ;
- l’analyse des matchs ;
- les traces de décision de l’IA ;
- l’inventaire des images de cartes et les tâches d’import ;
- les diagnostics locaux de maintenance.

L’authentification de maintenance est séparée des comptes de joueurs et des capacités de reconnexion aux matchs.

Par défaut, l’espace de maintenance est limité au loopback. L’accès depuis un autre appareil nécessite une origine HTTPS contrôlée et une configuration de reverse proxy.

### Principes d’architecture

NETGRID respecte un petit nombre de frontières système strictes :

- **Autorité du moteur :** seul le moteur définit et applique les actions de jeu légales.
- **Protection des informations cachées :** les zones cachées de l’adversaire sont exclues des vues normales des joueurs, des entrées de l’IA, des événements publics, des payloads réseau, des replays, des logs et des erreurs présentées au client.
- **Déterminisme et replay :** les hashes d’état, reçus d’action, tirages fondés sur une graine et enregistrements de tirages aléatoires rendent les matchs reproductibles et auditables.
- **Spécification centrale des cartes :** les métadonnées, mécaniques structurées, projections d’exécution et hints de l’IA sont maintenus dans une couche centrale de spécification, et non dans plusieurs registres manuels.
- **Sémantique de jeu indépendante de la locale :** le moteur et le backend échangent des codes stables et des données de présentation structurées ; seul le navigateur les transforme en texte allemand, anglais ou français.
- **Stockage local-first :** matchs, comptes, decks personnels, images de cartes, caches et données d’exploitation restent dans un stockage contrôlé par l’opérateur.

## Technologies

NETGRID est un monorepo TypeScript construit avec :

- Node.js 24 LTS ;
- des workspaces pnpm via Corepack ;
- TypeScript ;
- Next.js et React ;
- un serveur multijoueur Node.js local ;
- SQLite ;
- Vitest ;
- Playwright.

Les principaux domaines du projet sont :

- `apps/web` — application web ;
- `apps/server` — serveur multijoueur, comptes, maintenance et persistance ;
- `packages/engine` — moteur de règles déterministe ;
- `packages/cards` — spécifications centrales des cartes et projections ;
- `packages/ai` — IA locale plan-first et simulation ;
- `packages/decks` — modèles et validation des decks ;
- `packages/catalog` — projections du catalogue de cartes ;
- `packages/shared` — contrats partagés.

## Démarrage local

### Prérequis

- Node.js 24 ;
- Corepack ;
- PowerShell pour la procédure locale standard.

### Installer les dépendances

```powershell
corepack pnpm install
```

### Démarrer NETGRID

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-netgrid.ps1
```

Le script de démarrage lance le serveur et l’application web, détermine l’adresse LAN locale et configure les URL, origines et variables d’environnement correspondantes.

Points d’accès locaux standard :

- Application web : `http://127.0.0.1:3100`
- Endpoint de santé du serveur : `http://127.0.0.1:8787/health`
- Maintenance : `http://127.0.0.1:3100/maintenance`

Le script peut ouvrir l’URL LAN correspondante plutôt que l’adresse loopback.

Les démarrages directs de paquets sont destinés au diagnostic et au développement isolé. Pour l’utilisation locale normale, le script du projet garantit la cohérence entre l’URL web, l’URL du serveur, l’adresse LAN et la liste des origines autorisées.

### Configuration initiale de la maintenance

Avant la première utilisation de l’espace de maintenance, définir un mot de passe local :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\set-maintenance-password.ps1
```

Le contrat d’exploitation complet est décrit dans le [runbook Maintenance Control Plane](docs/runbooks/maintenance-control-plane.md).

Les comptes facultatifs sur invitation sont décrits dans le [runbook Account Alpha](docs/runbooks/account-alpha-operations.md).

## Configuration et données locales

`.env.example` documente les principales variables de configuration locales.

Le script de démarrage standard définit les valeurs nécessaires au fonctionnement local normal, notamment l’hôte public, l’URL web, l’URL du serveur et les origines autorisées. Les surcharges locales et les secrets ne doivent pas être commités.

Les données d’exécution sont stockées localement, généralement sous :

```text
data/runtime/
```

La base SQLite multijoueur par défaut est :

```text
data/runtime/multiplayer/netgrid.sqlite
```

Commandes locales de stockage :

```powershell
corepack pnpm storage:inspect
corepack pnpm storage:backup
corepack pnpm storage:restore -- <backup-directory>
corepack pnpm storage:optimize
```

Les installations locales peuvent également être exportées et importées au moyen du workflow de transfert local documenté.

## Contrôles de développement

Contrôles généraux du dépôt :

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm e2e
```

Contrôles importants liés à l’architecture :

```powershell
corepack pnpm check:engine-source-structure
corepack pnpm check:cards-source-structure
corepack pnpm check:ai
corepack pnpm check:i18n
```

Des contrôles ciblés par paquet peuvent être utilisés pour des modifications plus limitées :

```powershell
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/server typecheck
corepack pnpm --filter @netgrid/web test
```

## Documentation

Références actuelles d’architecture et d’exploitation :

- [État actuel du projet](KI-Wissen-NETGRID/02%20Wissen/00%20Uebersichten/Aktueller%20Projektstatus.md)
- [Index de l’architecture](docs/architecture/README.md)
- [Architecture du moteur](docs/architecture/engine/README.md)
- [Architecture de l’IA](docs/architecture/ai/README.md)
- [Architecture de localisation](docs/architecture/localization/translatable-ui.md)
- [Maintenance Control Plane](docs/runbooks/maintenance-control-plane.md)
- [Exploitation des comptes](docs/runbooks/account-alpha-operations.md)
- [Transfert local](docs/runbooks/netgrid-local-transfer.md)
- [Import d’images personnelles de cartes](docs/architecture/card-images/personal-card-image-import.md)

L’arborescence de travail décrit l’état actuel. Les anciens plans d’implémentation, revues, benchmarks et preuves de migration restent disponibles dans l’historique Git et ne constituent pas une seconde spécification courante.

## Limites actuelles

NETGRID ne fournit actuellement pas :

- de plateforme publique mondiale hébergée ;
- de matchmaking public entre installations ;
- de classement ou tableau des meilleurs joueurs ;
- d’administration de tournois ;
- d’outils publics de modération ;
- d’inscription publique autonome ;
- d’envoi d’e-mails ou de récupération automatique du mot de passe ;
- d’illustrations officielles de cartes incluses ;
- de garantie de compatibilité pour les données d’exécution de la préversion.

Les bases SQLite privées, decks personnels, images locales, caches, logs, secrets et exports d’exécution restent locaux et ne sont pas versionnés.

## Licence et mentions légales

Le code source de NETGRID est disponible sous [licence MIT](LICENSE).

NETGRID est un projet privé non officiel. Les noms et textes de cartes, noms de jeux, illustrations, logos et marques associées restent la propriété de leurs ayants droit respectifs. Ce dépôt ne distribue aucune illustration officielle de carte.
