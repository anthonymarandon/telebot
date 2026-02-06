# Changelog

Toutes les modifications notables de Telebot sont documentées ici.

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
