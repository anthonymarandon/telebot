# Telebot - Contexte Projet

## Vue d'ensemble

**Telebot** est un bot Telegram qui permet de contrôler Claude Code à distance via tmux.
Il offre une interface mobile pour interagir avec Claude depuis n'importe où.

## Architecture

```
~/.telebot/              # Installation utilisateur
├── bot.js               # Bot Telegram (Node.js)
├── telebot              # CLI interactif (Bash)
├── config.env           # Configuration (token, user ID)
├── CLAUDE.md            # Instructions pour Claude (prompt système)
├── bot.log              # Logs du bot
└── bot.pid              # PID du processus

Dépôt source:
├── bot.js               # Source du bot
├── telebot              # Source du CLI
├── install.sh           # Script d'installation
├── package.json         # Dépendances Node.js
└── .claude/             # Contexte Claude Code
    ├── CLAUDE.md        # Ce fichier (contexte projet)
    ├── settings.json    # Permissions
    ├── commands/        # Commandes Claude (/command)
    │   └── expert.md    # Workflow expert en 6 phases
    ├── skills/          # Skills invocables (/command)
    │   └── commit/SKILL.md
    ├── guides/          # Documentation de référence
    │   ├── add-command.md
    │   ├── add-menu.md
    │   └── shell-conventions.md
    └── ui/              # Maquettes interface
        └── *.md
```

## Technologies

- **TypeScript** : Bot Telegram (compilé vers JavaScript)
- **Node.js** : Runtime avec `node-telegram-bot-api`
- **Bash** : CLI interactif avec TUI (Text User Interface)
- **tmux** : Gestion des sessions Claude Code
- **Telegram Bot API** : Communication mobile

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/index.ts` | Point d'entrée du bot |
| `src/types.ts` | Interfaces et types TypeScript |
| `src/config.ts` | Gestion de config.env |
| `src/tmux.ts` | Opérations tmux (create, send, read) |
| `src/parser.ts` | Détection d'état + parsing des réponses Claude |
| `src/utils.ts` | Utilitaires (stripAnsi, splitMessage) |
| `src/commands.ts` | Handlers des commandes Telegram |
| `dist/` | Fichiers JavaScript compilés |
| `bot.js` | Point d'entrée (charge dist/index.js) |
| `telebot` | CLI avec menu interactif |
| `install.sh` | Installation automatique via curl |
| `config.env` | Token Telegram + User ID (généré à l'installation) |

## Conventions de code

### TypeScript (src/)

- Mode strict activé
- Types explicites pour les fonctions publiques
- Interfaces dans `types.ts`
- Compilation vers ES2020 + CommonJS
- Build avec `npm run build`

### Bash (telebot, install.sh)

- Compatibilité **Bash 3.2** (macOS) et Bash 4+ (Linux)
- Utiliser `tput` pour les couleurs avec fallback
- Fonctions UI : `logo()`, `hr()`, `section()`, `spinner()`, `menu()`
- Toujours restaurer le curseur (`tput cnorm`) après l'avoir caché
- Utiliser `< /dev/tty` pour les inputs dans les scripts pipés

## Fonctionnalités actuelles

### Bot Telegram
- `/start` - Démarrer et s'authentifier
- `/restart` - Redémarrer la session Claude
- `/yolo` - Mode sans permissions (dangereux)
- `/screen` - Voir les 100 dernières lignes du terminal (texte brut)
- `/stop` - Arrêter la session
- `/help` - Aide

### CLI Telebot
- Menu interactif avec navigation flèches
- Démarrer/Arrêter le bot
- Voir les logs (temps réel possible)
- Éditer config et instructions Claude
- Mise à jour automatique depuis GitHub
- Désinstallation propre

## Règles de développement

### À faire
- Tester sur macOS ET Linux avant de commit
- Garder la rétrocompatibilité Bash 3.2
- Documenter les nouvelles fonctionnalités
- Utiliser les skills pour les opérations courantes

### À éviter
- Casser la compatibilité avec les installations existantes
- Ajouter des dépendances Node.js non essentielles
- Modifier `config.env` de l'utilisateur sans demander
- Hardcoder des chemins (utiliser `$HOME`, `$TELEBOT_DIR`)

## Workflow de développement

1. Modifier les fichiers TypeScript dans `src/`
2. Compiler avec `npm run build`
3. Tester localement avec `/deploy` (copie vers ~/.telebot/)
4. Utiliser `/commit` pour commiter
5. Pousser sur GitHub
6. Les utilisateurs peuvent faire `telebot update`

## Versioning

- Version dans `package.json` (source de vérité pour les mises à jour)
- Format: `MAJOR.MINOR.PATCH`
- **Avant le commit final** (push vers le dépôt distant) :
  1. Demander l'accord de l'utilisateur pour modifier la version
  2. Incrémenter selon le type de changement :
     - **PATCH** (1.2.0 → 1.2.1) : bugfixes, changements mineurs
     - **MINOR** (1.2.1 → 1.3.0) : nouvelles fonctionnalités, changements importants
     - **MAJOR** : réservé aux breaking changes (rare)

## Sécurité

- Le token Telegram ne doit JAMAIS être commité
- L'User ID protège contre les accès non autorisés
- Le code de setup à 8 chiffres valide le propriétaire
- Mode YOLO : prévenir pour les commandes dangereuses

## Commandes Claude

| Commande | Description |
|----------|-------------|
| `/expert` | Workflow expert en 6 phases (Analyse, Explore, Plan, Execute, Verify, Deliver) |

## Skills invocables

| Skill | Description |
|-------|-------------|
| `/commit` | Commit + changelog + version (option: release avec tag/push) |

## Guides de référence

Dans `.claude/guides/` :

| Guide | Description |
|-------|-------------|
| `add-command.md` | Comment ajouter une commande Telegram |
| `add-menu.md` | Comment ajouter une option au menu CLI |
| `shell-conventions.md` | Conventions Bash pour le projet |

## Documentation UI

Maquettes dans `.claude/ui/` :

| Fichier | Description |
|---------|-------------|
| `theme.md` | Logo, couleurs, icônes, encadrés |
| `animations.md` | Spinner, progress bar, effets |
| `cli-menu.md` | Menu principal et navigation |
| `install.md` | Écrans d'installation |
| `update.md` | Écrans de mise à jour |
| `uninstall.md` | Écrans de désinstallation |
| `telegram.md` | Messages du bot Telegram |
| `reference.md` | Référence complète (tout en un) |

### Principes de design

- **Cohérence** : Toujours utiliser le logo avec la tête de robot, largeur 41 chars
- **Lisibilité** : Texte aéré, couleurs pour guider, emojis contextuels
- **Feedback** : Spinner pendant les opérations, messages explicites
- **Accessibilité** : Fallback sans couleurs, navigation clavier uniquement
