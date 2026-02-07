# Changelog

Toutes les modifications notables de Telebot sont documentées ici.

---

## [1.2.0] - 2026-02-07

### Ajouté
- Détection du mode Plan de Claude Code (entrée/sortie) avec notifications Telegram formatées
- Détection des questions interactives AskUserQuestion avec affichage des options sur Telegram
- Navigation automatique des menus TUI via tmux (`tmuxSendKey`, `tmuxSelectOption`)
- Support des réponses par numéro et texte libre pour AskUserQuestion
- Types `AskUserQuestionInfo`, `AskOption` et champs `lastAskQuestion`, `inPlanMode` dans AppState

---

## [1.1.1] - 2026-02-06

### Corrigé
- Bump version patch

---

## [1.1.0] - 2026-02-06

### Ajouté
- Whitelist de permissions Claude Code : pré-approuve les commandes sûres (git, npm, node, etc.) pour les sessions bot
- Commandes dangereuses (rm, sudo, kill) restent bloquées par défaut
- Menu CLI "Gérer les permissions Claude" : voir, restaurer, éditer, supprimer la whitelist
- Déploiement automatique à l'installation, proposition de mise à jour lors de `telebot update`
- Fichier `settings.json.default` comme référence des permissions par défaut

---

## [1.0.4] - 2026-02-06

### Corrigé
- Réponses Claude invisibles sur Telegram (VPS Linux) : UTF-8 forcé dans tmux (`tmux -u` + `LANG=C.UTF-8`)
- Boucle de monitoring fragile : ajout try-catch global pour éviter les crashs silencieux
- Log diagnostic quand du contenu stable est détecté sans réponse extraite (aide au debug)
- Parser incompatible avec Claude Code v2.1+ : marqueur de réponse `●` au lieu de `⏺`

---

## [1.0.3] - 2026-02-06

### Corrigé
- Bot se tuait lui-même au démarrage (`killBotProcesses` envoyait SIGTERM à son propre PID)
- Crash silencieux si tmux absent : message d'erreur envoyé sur Telegram au lieu d'un crash muet
- Erreurs de polling Telegram non gérées : ajout d'un handler `polling_error`
- CLI affichait "Bot démarré" même si le processus crashait immédiatement : vérification post-démarrage

---

## [1.0.2] - 2026-02-06

### Corrigé
- Suppression du doublon de notification de permission Telegram
- Reset du flag permission uniquement quand le dialogue disparaît de tmux
- Filtrage des lignes vides en fin de capture tmux pour la détection

---

## [1.0.1] - 2026-02-06

### Corrigé
- Détection des permissions fiable (vérification continue, indépendante de la stabilité)
- Hash stable basé sur le contexte de la commande (insensible aux animations tmux)
- Affichage de la commande demandée dans le message Telegram de permission
- Ajout de `platform.js` manquant dans `install.sh` et `telebot update`
- Attente dynamique du démarrage de Claude (remplace le timeout fixe de 3s)

---

## [1.0.0] - 2026-02-06

### Bot Telegram
- Contrôle de Claude Code à distance via Telegram + tmux
- Commandes : `/start`, `/restart`, `/yolo` (sans permissions), `/stop`, `/help`
- Filtrage intelligent des réponses (seul le message final est envoyé)
- Format optimisé mobile (messages courts, emojis, pas de tableaux)
- Authentification par code à 8 chiffres
- Protection instance unique (évite les conflits Telegram)

### CLI interactif (telebot)
- Menu navigable avec flèches et raccourcis clavier
- Démarrer / Arrêter le bot
- Logs en temps réel
- Édition config et instructions Claude
- Documentation interactive intégrée
- Mise à jour automatique depuis GitHub
- Désinstallation propre

### Skills et personnalisation
- Skills personnalisés dans `~/.telebot/.claude/skills/`
- Instructions Claude personnalisables (`~/.telebot/CLAUDE.md`)
- Skill `/commit` intégré (changelog + versioning)

### Installation
- Installation one-liner via `curl | bash`
- Compatibilité macOS et Linux
- Windows : nécessite WSL ou une VM Linux (pas de support natif)
- Compatibilité Bash 3.2+ (macOS) et Bash 4+ (Linux)

### Architecture
- Bot en TypeScript compilé (Node.js)
- CLI en Bash avec modules (`lib/`)
- Code modulaire : `src/` (bot), `lib/` (CLI)
